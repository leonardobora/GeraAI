import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { SpotifyService } from "./services/SpotifyService";
import { AIService } from "./services/AIService";
import { PlaylistService } from "./services/PlaylistService";
import { insertPlaylistSchema } from "@shared/schema";
import { z } from "zod";

const generatePlaylistSchema = z.object({
  prompt: z.string().min(1, "Prompt é obrigatório"),
  tamanho: z.enum(["curta", "media", "longa"]),
  nivelDescoberta: z.enum(["seguro", "aventureiro"]),
  conteudoExplicito: z.boolean().default(false),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ message: "Falha ao buscar usuário" });
    }
  });

  // Spotify OAuth routes
  app.get('/api/spotify/auth', isAuthenticated, async (req: any, res) => {
    try {
      const spotifyService = new SpotifyService();
      const authUrl = spotifyService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Erro ao gerar URL de autenticação Spotify:", error);
      res.status(500).json({ message: "Erro ao conectar com Spotify" });
    }
  });

  app.get('/api/spotify/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Código de autorização inválido" });
      }

      const spotifyService = new SpotifyService();
      const tokens = await spotifyService.exchangeCodeForTokens(code);
      
      // Get user ID from session (assuming user is logged in)
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Get Spotify user profile
      const spotifyUser = await spotifyService.getUserProfile(tokens.access_token);
      
      // Save tokens to database
      await storage.updateUserSpotifyTokens(
        userId,
        tokens.access_token,
        tokens.refresh_token,
        spotifyUser.id
      );

      res.redirect('/config-spotify?spotify=connected');
    } catch (error) {
      console.error("Erro no callback do Spotify:", error);
      
      // Check if the error is related to token or permissions
      if (error instanceof Error) {
        if (error.message.includes('não autorizado no aplicativo') || error.message.includes('dashboard do desenvolvedor')) {
          res.redirect('/config-spotify?spotify=registration-error');
        } else if (error.message.includes('403') || error.message.includes('401')) {
          res.redirect('/config-spotify?spotify=auth-error');
        } else if (error.message.includes('Token')) {
          res.redirect('/config-spotify?spotify=token-error');
        } else {
          res.redirect('/config-spotify?spotify=error&message=' + encodeURIComponent(error.message));
        }
      } else {
        res.redirect('/config-spotify?spotify=error');
      }
    }
  });

  app.get('/api/spotify/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const isConnected = !!(user?.spotifyAccessToken && user?.spotifyRefreshToken);
      
      res.json({
        connected: isConnected,
        userId: user?.spotifyUserId || null,
        email: user?.email || null,
      });
    } catch (error) {
      console.error("Erro ao verificar status Spotify:", error);
      res.status(500).json({ message: "Erro ao verificar conexão Spotify" });
    }
  });

  app.delete('/api/spotify/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.updateUserSpotifyTokens(userId, "", "", "");
      res.json({ message: "Spotify desconectado com sucesso" });
    } catch (error) {
      console.error("Erro ao desconectar Spotify:", error);
      res.status(500).json({ message: "Erro ao desconectar Spotify" });
    }
  });

  // Playlist generation route
  app.post('/api/playlists/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.spotifyAccessToken) {
        return res.status(400).json({ message: "Configure sua conta Spotify primeiro" });
      }

      const body = generatePlaylistSchema.parse(req.body);
      
      const playlistService = new PlaylistService();
      const aiService = new AIService();
      const spotifyService = new SpotifyService();

      // Generate playlist with AI
      const playlistData = await playlistService.generatePlaylist(
        body.prompt,
        body.tamanho,
        body.nivelDescoberta,
        body.conteudoExplicito,
        userId
      );

      // Get music recommendations from AI with rate limiting and user settings
      const recommendations = await aiService.generateMusicRecommendations(
        body.prompt,
        body.tamanho,
        body.nivelDescoberta,
        body.conteudoExplicito
      );

      // Search for tracks on Spotify
      console.log('Iniciando busca de tracks no Spotify com', recommendations.length, 'recomendações');
      const tracks = await spotifyService.searchTracks(
        recommendations,
        user.spotifyAccessToken
      );

      console.log(`Busca concluída: ${tracks.length} tracks encontrados de ${recommendations.length} recomendações`);
      
      if (tracks.length === 0) {
        console.error('Nenhuma track foi encontrada no Spotify');
        return res.status(400).json({ message: "Não foi possível gerar faixas para este prompt" });
      }

      // Create playlist on Spotify
      const spotifyPlaylist = await spotifyService.createPlaylist(
        user.spotifyAccessToken,
        playlistData.nome,
        playlistData.descricao || ""
      );

      // Add tracks to Spotify playlist
      const trackUris = tracks.map(track => track.uri);
      await spotifyService.addTracksToPlaylist(
        user.spotifyAccessToken,
        spotifyPlaylist.id,
        trackUris
      );

      // Update playlist with Spotify ID
      await storage.updatePlaylistSpotifyId(playlistData.id, spotifyPlaylist.id);

      // Save tracks to database
      const trackData = tracks.map((track, index) => ({
        playlistId: playlistData.id,
        spotifyTrackId: track.id,
        nome: track.name,
        artista: track.artists[0]?.name || "Artista Desconhecido",
        album: track.album?.name || "",
        duracao: Math.floor(track.duration_ms / 1000),
        previewUrl: track.preview_url,
        posicao: index + 1,
        imageUrl: track.album?.images?.[0]?.url || null,
        adicionadaComSucesso: true,
      }));

      await storage.createTracks(trackData);

      // Update playlist duration and track count
      await playlistService.updatePlaylistDuration(playlistData.id, trackData);

      // Get complete playlist with tracks
      const completePlaylist = await storage.getPlaylistById(playlistData.id);
      
      res.json({
        playlist: completePlaylist,
        spotifyUrl: spotifyPlaylist.external_urls.spotify,
        message: "Playlist criada com sucesso!",
      });

    } catch (error) {
      console.error("Erro ao gerar playlist:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
      }

      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get user playlists
  app.get('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playlists = await storage.getPlaylistsByUserId(userId);
      res.json(playlists);
    } catch (error) {
      console.error("Erro ao buscar playlists:", error);
      res.status(500).json({ message: "Erro ao buscar playlists" });
    }
  });

  // Get specific playlist
  app.get('/api/playlists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      
      if (isNaN(playlistId) || playlistId <= 0) {
        return res.status(400).json({ message: "ID de playlist inválido" });
      }
      
      const playlist = await storage.getPlaylistById(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      // Check if user owns this playlist
      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(playlist);
    } catch (error) {
      console.error("Erro ao buscar playlist:", error);
      res.status(500).json({ message: "Erro ao buscar playlist" });
    }
  });

  // Delete playlist
  app.delete('/api/playlists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const playlist = await storage.getPlaylistById(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      // Check if user owns this playlist
      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Delete shared playlist if exists
      await storage.deleteSharedPlaylist(playlistId);
      await storage.deletePlaylist(playlistId);
      res.json({ message: "Playlist deletada com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar playlist:", error);
      res.status(500).json({ message: "Erro ao deletar playlist" });
    }
  });

  // Share playlist
  app.post('/api/playlists/:id/share', isAuthenticated, async (req: any, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const playlist = await storage.getPlaylistById(playlistId);
      if (!playlist || playlist.userId !== userId) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      // Generate unique share token
      const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const sharedPlaylist = await storage.createSharedPlaylist({
        playlistId,
        shareToken,
        isPublic: true,
      });

      const shareUrl = `${req.protocol}://${req.get('host')}/shared/${shareToken}`;
      
      res.json({
        shareToken,
        shareUrl,
        message: "Playlist compartilhada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao compartilhar playlist:", error);
      res.status(500).json({ message: "Erro ao compartilhar playlist" });
    }
  });

  // Get shared playlist (public access)
  app.get('/api/shared/:token', async (req, res) => {
    try {
      const shareToken = req.params.token;
      const sharedPlaylist = await storage.getSharedPlaylist(shareToken);
      
      if (!sharedPlaylist) {
        return res.status(404).json({ message: "Playlist compartilhada não encontrada" });
      }

      res.json(sharedPlaylist);
    } catch (error) {
      console.error("Erro ao buscar playlist compartilhada:", error);
      res.status(500).json({ message: "Erro ao buscar playlist compartilhada" });
    }
  });

  // Update user AI settings
  app.put('/api/user/ai-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiProvider, apiKeys } = req.body;

      const validProviders = ['perplexity', 'openai', 'gemini'];
      if (!validProviders.includes(aiProvider)) {
        return res.status(400).json({ message: "Provedor de IA inválido" });
      }

      await storage.updateUserAISettings(userId, aiProvider, apiKeys || {});
      
      res.json({ message: "Configurações de IA atualizadas com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Get rate limit status (simplified for now)
  app.get('/api/user/rate-limit', isAuthenticated, async (req: any, res) => {
    try {
      res.json({
        remainingRequests: 10, // Fixed for now
        maxRequests: 10, // Per hour
        resetTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      });
    } catch (error) {
      console.error("Erro ao verificar rate limit:", error);
      res.status(500).json({ message: "Erro ao verificar limite de requisições" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
