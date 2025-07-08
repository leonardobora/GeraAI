import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { usePlaylist } from "@/hooks/usePlaylist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SharePlaylistModal from "@/components/SharePlaylistModal";

export default function MinhasPlaylists() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { playlists, isLoadingPlaylists, deletePlaylist, isDeleting } = usePlaylist();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleDeletePlaylist = (playlistId: number) => {
    if (confirm("Tem certeza que deseja deletar esta playlist?")) {
      deletePlaylist(playlistId);
    }
  };

  const openSpotifyPlaylist = (spotifyPlaylistId: string) => {
    window.open(`https://open.spotify.com/playlist/${spotifyPlaylistId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-spotify-dark">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-spotify-card border-t-spotify-green rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spotify-dark">
      <Header />
      
      <main className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Minhas Playlists</h1>
            <Button 
              onClick={() => setLocation('/')}
              className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
            >
              <i className="fas fa-plus mr-2"></i>
              Nova Playlist
            </Button>
          </div>

          {isLoadingPlaylists ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-spotify-card rounded-xl p-4 animate-pulse flex items-center justify-between border border-spotify-card">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 bg-spotify-surface rounded-lg" />
                    <div>
                      <Skeleton className="h-4 bg-spotify-surface rounded mb-2 w-48" />
                      <Skeleton className="h-3 bg-spotify-surface rounded w-32" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="w-20 h-8 bg-spotify-surface rounded" />
                    <Skeleton className="w-8 h-8 bg-spotify-surface rounded" />
                    <Skeleton className="w-8 h-8 bg-spotify-surface rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="space-y-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-gradient-to-r from-spotify-card to-spotify-surface rounded-xl p-4 hover:from-spotify-surface hover:to-spotify-card transition-all duration-300 border border-spotify-card/50 hover:border-spotify-green/30"
                >
                  <div className="flex items-center justify-between">
                    {/* Left Side: Icon + Info */}
                    <div className="flex items-center space-x-4">
                      {/* Playlist Icon */}
                      <div className="w-12 h-12 bg-spotify-green/20 rounded-lg flex items-center justify-center text-2xl border border-spotify-green/30">
                        {playlist.nome.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]/g)?.[0] || '🎵'}
                      </div>
                      
                      {/* Playlist Info */}
                      <div>
                        <h3 className="font-bold text-white text-lg mb-1" title={playlist.nome}>
                          {playlist.nome}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-spotify-text">
                          <span>{playlist.totalFaixas} faixas</span>
                          <span>•</span>
                          <span>{playlist.duracaoTotal || "0min"}</span>
                          <span>•</span>
                          <span>Criada em {new Date(playlist.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Action Buttons */}
                    <div className="flex items-center space-x-3">
                      {playlist.spotifyPlaylistId && (
                        <Button
                          onClick={() => openSpotifyPlaylist(playlist.spotifyPlaylistId)}
                          className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-medium px-6 py-2 transition-all duration-200"
                        >
                          <i className="fab fa-spotify mr-2"></i>
                          Abrir
                        </Button>
                      )}
                      
                      <SharePlaylistModal 
                        playlistId={playlist.id} 
                        playlistName={playlist.nome}
                      >
                        <button
                          className="bg-spotify-surface hover:bg-spotify-green text-white border border-spotify-card hover:border-spotify-green h-10 w-10 rounded-lg transition-all duration-200 flex items-center justify-center"
                          title="Compartilhar"
                        >
                          <i className="fas fa-share-alt"></i>
                        </button>
                      </SharePlaylistModal>
                      
                      <button
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        disabled={isDeleting}
                        className="bg-spotify-error hover:bg-red-600 text-white border border-red-500 hover:border-red-400 h-10 w-10 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                        title="Deletar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <i className="fas fa-music text-spotify-text text-6xl mb-6"></i>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Nenhuma playlist encontrada
                </h3>
                <p className="text-spotify-text mb-8">
                  Que tal criar sua primeira playlist com IA? É rápido e fácil!
                </p>
                <Button 
                  onClick={() => setLocation('/')}
                  className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Criar Primeira Playlist
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
