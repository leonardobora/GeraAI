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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-spotify-card border-spotify-card">
                  <CardContent className="p-4">
                    <Skeleton className="w-full h-40 mb-4 bg-spotify-surface" />
                    <Skeleton className="h-4 w-3/4 mb-2 bg-spotify-surface" />
                    <Skeleton className="h-3 w-1/2 bg-spotify-surface" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <Card key={playlist.id} className="bg-spotify-card border-spotify-card hover:bg-spotify-surface transition-colors group">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <div className="w-full h-40 bg-gradient-to-br from-spotify-green to-spotify-green-light rounded-lg flex items-center justify-center">
                        <i className="fas fa-music text-spotify-dark text-3xl"></i>
                      </div>
                      {playlist.spotifyPlaylistId && (
                        <button
                          onClick={() => openSpotifyPlaylist(playlist.spotifyPlaylistId)}
                          className="absolute bottom-2 right-2 bg-spotify-green hover:bg-spotify-green-light text-spotify-dark w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="fab fa-spotify"></i>
                        </button>
                      )}
                    </div>
                    
                    <h3 className="font-bold mb-2 text-white text-outlined-thin truncate" title={playlist.nome}>
                      {playlist.nome}
                    </h3>
                    
                    <p className="text-sm text-white text-outlined-thin mb-2">
                      {playlist.totalFaixas} faixas • {playlist.duracaoTotal || "0min"}
                    </p>
                    
                    <p className="text-xs text-white text-outlined-thin mb-4">
                      Criada em {new Date(playlist.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    
                    <div className="flex gap-2">
                      {playlist.spotifyPlaylistId && (
                        <Button
                          onClick={() => openSpotifyPlaylist(playlist.spotifyPlaylistId)}
                          size="sm"
                          className="flex-1 bg-spotify-green hover:bg-spotify-green-light text-spotify-dark"
                        >
                          <i className="fab fa-spotify mr-1"></i>
                          Abrir
                        </Button>
                      )}
                      
                      <SharePlaylistModal 
                        playlistId={playlist.id} 
                        playlistName={playlist.nome}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-spotify-card text-spotify-text hover:text-white"
                        >
                          <i className="fas fa-share-alt"></i>
                        </Button>
                      </SharePlaylistModal>
                      
                      <Button
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        size="sm"
                        variant="destructive"
                        disabled={isDeleting}
                        className="bg-spotify-error hover:bg-red-600"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
