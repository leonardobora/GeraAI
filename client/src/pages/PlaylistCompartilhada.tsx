import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Track {
  id: number;
  nome: string;
  artista: string;
  album: string;
  duracao: number;
  previewUrl: string;
  imageUrl: string;
  spotifyTrackId: string;
  posicao: number;
  adicionadaComSucesso: boolean;
}

interface PlaylistCompartilhada {
  playlist: {
    id: number;
    nome: string;
    descricao: string;
    promptOriginal: string;
    spotifyPlaylistId: string;
    totalFaixas: number;
    duracaoTotal: string;
    tracks: Track[];
  };
  sharedAt: string;
  isPublic: boolean;
}

export default function PlaylistCompartilhada() {
  const [, params] = useRoute("/shared/:token");
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<PlaylistCompartilhada | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const openSpotifyTrack = (spotifyTrackId: string) => {
    const spotifyUrl = `https://open.spotify.com/track/${spotifyTrackId}`;
    window.open(spotifyUrl, '_blank');
  };

  const openSpotifyPlaylist = (spotifyPlaylistId: string) => {
    window.open(`https://open.spotify.com/playlist/${spotifyPlaylistId}`, '_blank');
  };

  useEffect(() => {
    if (!params?.token) return;

    const fetchSharedPlaylist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/shared/${params.token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Playlist compartilhada não encontrada");
          } else if (response.status === 410) {
            setError("Link de compartilhamento expirado");
          } else {
            setError("Erro ao carregar playlist");
          }
          return;
        }

        const data = await response.json();
        setPlaylist(data);
      } catch (error) {
        console.error("Erro ao buscar playlist compartilhada:", error);
        setError("Erro ao carregar playlist");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedPlaylist();
  }, [params?.token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-spotify-dark">
        <Header />
        <div className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-spotify-card border-spotify-surface">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <Skeleton className="h-8 bg-spotify-surface rounded w-3/4" />
                  <Skeleton className="h-4 bg-spotify-surface rounded w-full" />
                  <Skeleton className="h-4 bg-spotify-surface rounded w-2/3" />
                  
                  <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 bg-spotify-surface rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 bg-spotify-surface rounded mb-1 w-1/2" />
                          <Skeleton className="h-3 bg-spotify-surface rounded w-1/3" />
                        </div>
                        <Skeleton className="w-16 h-6 bg-spotify-surface rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-spotify-dark">
        <Header />
        <div className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-spotify-card border-spotify-surface">
              <CardContent className="p-8 text-center">
                <div className="text-spotify-error text-6xl mb-4">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Ops!</h1>
                <p className="text-spotify-text mb-6">{error}</p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
                >
                  Voltar ao Início
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="min-h-screen bg-spotify-dark">
      <Header />
      
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-spotify-card border-spotify-surface overflow-hidden">
            <CardContent className="p-0">
              {/* Header da Playlist */}
              <div className="p-8 bg-gradient-to-r from-spotify-green/20 to-spotify-green/10 border-b border-spotify-surface">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-spotify-green text-sm font-medium mb-2">
                      <i className="fas fa-share-alt"></i>
                      <span>Playlist Compartilhada</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">{playlist.playlist.nome}</h1>
                    <p className="text-spotify-text mb-4">{playlist.playlist.descricao}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-spotify-text">
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-music"></i>
                        <span>{playlist.playlist.totalFaixas} músicas</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-clock"></i>
                        <span>{playlist.playlist.duracaoTotal}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-calendar"></i>
                        <span>Compartilhado em {new Date(playlist.sharedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {playlist.playlist.spotifyPlaylistId && (
                    <Button
                      onClick={() => openSpotifyPlaylist(playlist.playlist.spotifyPlaylistId)}
                      className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold px-6 py-3"
                    >
                      <i className="fab fa-spotify mr-2"></i>
                      Abrir no Spotify
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de Músicas */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <i className="fas fa-list mr-2 text-spotify-green"></i>
                  Músicas da Playlist
                </h2>

                {playlist.playlist.tracks && playlist.playlist.tracks.length > 0 ? (
                  <div className="space-y-3">
                    {playlist.playlist.tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-4 bg-spotify-surface/50 rounded-lg hover:bg-spotify-surface transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-spotify-green/20 rounded-lg flex items-center justify-center text-spotify-green font-bold">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{track.nome}</div>
                            <div className="text-spotify-text text-sm">{track.artista}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="text-spotify-text text-sm font-medium">
                            {formatDuration(track.duracao)}
                          </span>
                          
                          {track.previewUrl && (
                            <button
                              onClick={() => window.open(track.previewUrl, '_blank')}
                              className="text-spotify-green hover:text-spotify-green-light transition-colors p-2"
                              title="Preview da música"
                            >
                              <i className="fas fa-play"></i>
                            </button>
                          )}
                          
                          <button
                            onClick={() => openSpotifyTrack(track.spotifyTrackId)}
                            className="text-spotify-green hover:text-spotify-green-light transition-colors p-2"
                            title="Abrir no Spotify"
                          >
                            <i className="fab fa-spotify"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-spotify-text">
                    <i className="fas fa-music text-4xl mb-4"></i>
                    <div className="text-lg">Nenhuma música encontrada nesta playlist</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-spotify-surface/30 border-t border-spotify-surface text-center">
                <p className="text-spotify-text text-sm">
                  Criado com <i className="fas fa-heart text-red-500 mx-1"></i> usando 
                  <span className="text-spotify-green font-semibold ml-1">Gera AÍ: Playlists com IA</span>
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="mt-4 bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
                >
                  Criar Minha Playlist
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}