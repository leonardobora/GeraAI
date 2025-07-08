interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface SpotifyUser {
  id: string;
  email: string;
  display_name: string;
  images: Array<{ url: string }>;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
}

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
  };
}

export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || "";
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
    
    // Set redirect URI based on current domain
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    this.redirectUri = `https://${domain}/api/spotify/callback`;
    
    console.log('Spotify Redirect URI configurado:', this.redirectUri);

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Spotify client ID e secret são obrigatórios");
    }
  }

  getAuthUrl(): string {
    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes.join(' '),
      redirect_uri: this.redirectUri,
      state: Math.random().toString(36).substring(7),
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao trocar código por tokens: ${response.status}`);
    }

    return await response.json();
  }

  async refreshToken(refreshToken: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro ao renovar token Spotify:`, response.status, errorData);
      
      if (response.status === 400) {
        throw new Error('Refresh token inválido ou expirado. Reconecte sua conta Spotify.');
      } else if (response.status === 401) {
        throw new Error('Credenciais Spotify inválidas. Verifique a configuração do aplicativo.');
      } else {
        throw new Error(`Erro ao renovar token: ${response.status}`);
      }
    }

    return await response.json();
  }

  async getUserProfile(accessToken: string): Promise<SpotifyUser> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Spotify API Error ${response.status}: ${errorData}`);
      
      if (response.status === 403) {
        // Check if error indicates user not registered in app
        if (errorData.includes('not registered') || errorData.includes('Check settings')) {
          throw new Error('Usuário não autorizado no aplicativo Spotify. Verifique se você tem acesso ao app no dashboard do desenvolvedor.');
        } else {
          throw new Error('Token de acesso expirado ou inválido. Reconecte sua conta Spotify.');
        }
      } else if (response.status === 401) {
        throw new Error('Token não autorizado. Reconecte sua conta Spotify.');
      } else {
        throw new Error(`Erro ao buscar perfil do usuário: ${response.status} - ${errorData}`);
      }
    }

    return await response.json();
  }

  async createPlaylist(accessToken: string, name: string, description: string): Promise<SpotifyPlaylist> {
    const user = await this.getUserProfile(accessToken);
    
    const response = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        description: description,
        public: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar playlist: ${response.status}`);
    }

    return await response.json();
  }

  async addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]): Promise<void> {
    // Spotify API limits to 100 tracks per request
    const batchSize = 100;
    
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao adicionar faixas à playlist: ${response.status}`);
      }
    }
  }

  async searchTracks(recommendations: string[], accessToken: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    console.log(`Iniciando busca de ${recommendations.length} tracks no Spotify`);
    
    for (const recommendation of recommendations) {
      try {
        console.log(`Buscando: ${recommendation}`);
        
        // Try multiple search strategies for better results
        const searchQueries = [
          recommendation, // Original query
          recommendation.replace(' - ', ' '), // Remove dash
          recommendation.split(' - ')[0], // Just artist name
          recommendation.split(' - ')[1] || recommendation, // Just song name
        ].filter(q => q && q.trim()); // Remove empty queries
        
        let found = false;
        
        for (const query of searchQueries) {
          if (found) break;
          
          try {
            const response = await fetch(
              `https://api.spotify.com/v1/search?${new URLSearchParams({
                q: query,
                type: 'track',
                limit: '3', // Get more results to find better matches
              })}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );

            if (response.ok) {
              const data: SpotifySearchResult = await response.json();
              console.log(`Busca "${query}":`, data.tracks.items.length, 'resultados');
              
              if (data.tracks.items.length > 0) {
                tracks.push(data.tracks.items[0]);
                console.log(`Track encontrado: ${data.tracks.items[0].name} - ${data.tracks.items[0].artists[0].name}`);
                found = true;
              }
            } else if (response.status === 429) {
              console.log(`Rate limit atingido, aguardando 1 segundo...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            } else if (response.status === 401) {
              throw new Error('Token Spotify expirado');
            } else {
              console.error(`Erro HTTP ${response.status} ao buscar: ${query}`);
            }
          } catch (error) {
            console.error(`Erro ao buscar "${query}":`, error);
            if (error instanceof Error && error.message.includes('Token')) {
              throw error;
            }
          }
        }
        
        if (!found) {
          console.log(`Nenhum resultado para qualquer variação de: ${recommendation}`);
        }
        
      } catch (error) {
        console.error(`Erro ao buscar track: ${recommendation}`, error);
      }
    }

    console.log(`Total de tracks encontrados: ${tracks.length} de ${recommendations.length}`);
    
    // Check if we have enough tracks for a reasonable playlist
    if (tracks.length === 0) {
      throw new Error('Não foi possível encontrar nenhuma música no Spotify. Tente um prompt diferente.');
    }
    
    if (tracks.length < Math.ceil(recommendations.length * 0.3)) {
      console.warn(`Apenas ${tracks.length} de ${recommendations.length} tracks encontrados. Playlist pode ser pequena.`);
    }
    
    return tracks;
  }

  async getTrack(trackId: string, accessToken: string): Promise<SpotifyTrack> {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar faixa: ${response.status}`);
    }

    return await response.json();
  }
}
