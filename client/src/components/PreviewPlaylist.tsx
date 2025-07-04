import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Track {
  id: number;
  nome: string;
  artista: string;
  album: string;
  duracao: number;
  previewUrl: string;
  imageUrl: string;
  posicao: number;
  adicionadaComSucesso: boolean;
}

interface Playlist {
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
  spotifyUrl: string;
  message: string;
}

interface PreviewPlaylistProps {
  playlist: Playlist;
}

export default function PreviewPlaylist({ playlist }: PreviewPlaylistProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openSpotifyPlaylist = () => {
    window.open(playlist.spotifyUrl, '_blank');
  };

  const sharePlaylist = () => {
    if (navigator.share) {
      navigator.share({
        title: playlist.playlist.nome,
        text: `Confira esta playlist criada com IA: ${playlist.playlist.nome}`,
        url: playlist.spotifyUrl,
      });
    } else {
      navigator.clipboard.writeText(playlist.spotifyUrl);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <section className="bg-spotify-surface py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-spotify-green">
            Playlist Criada com Sucesso!
          </h2>
          <p className="text-spotify-text">
            Sua playlist foi criada e adicionada ao seu Spotify
          </p>
        </div>

        <Card className="bg-spotify-card border-spotify-card mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Playlist Cover */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 bg-gradient-to-br from-spotify-green to-spotify-green-light rounded-xl flex items-center justify-center mx-auto">
                  <i className="fas fa-music text-spotify-dark text-6xl"></i>
                </div>
              </div>
              
              {/* Playlist Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-white">
                  {playlist.playlist.nome}
                </h3>
                <p className="text-spotify-text mb-4">
                  {playlist.playlist.descricao}
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-spotify-text">
                    <span className="text-white">Faixas:</span> {playlist.playlist.totalFaixas} músicas
                  </p>
                  <p className="text-spotify-text">
                    <span className="text-white">Duração:</span> {playlist.playlist.duracaoTotal}
                  </p>
                  <p className="text-spotify-text">
                    <span className="text-white">Prompt:</span> "{playlist.playlist.promptOriginal}"
                  </p>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={openSpotifyPlaylist}
                    className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
                  >
                    <i className="fab fa-spotify mr-2"></i>
                    Abrir no Spotify
                  </Button>
                  
                  <Button
                    onClick={sharePlaylist}
                    className="bg-spotify-surface hover:bg-spotify-card text-white font-semibold border border-spotify-card"
                  >
                    <i className="fas fa-share mr-2"></i>
                    Compartilhar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Track List */}
        <Card className="bg-spotify-card border-spotify-card">
          <CardContent className="p-6">
            <h4 className="text-xl font-bold mb-6 text-white">
              Faixas da Playlist
            </h4>
            
            <div className="space-y-2">
              {playlist.playlist.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-spotify-surface transition-colors group"
                >
                  <div className="w-8 text-center text-spotify-text group-hover:text-white">
                    <span className="group-hover:hidden">{index + 1}</span>
                    <i className="fas fa-play hidden group-hover:block cursor-pointer"></i>
                  </div>
                  
                  <div className="w-12 h-12 flex-shrink-0">
                    {track.imageUrl ? (
                      <img
                        src={track.imageUrl}
                        alt={`Capa de ${track.album}`}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-spotify-surface rounded flex items-center justify-center">
                        <i className="fas fa-music text-spotify-text"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-white" title={track.nome}>
                      {track.nome}
                    </p>
                    <p className="text-sm text-spotify-text truncate" title={track.artista}>
                      {track.artista}
                    </p>
                  </div>
                  
                  <div className="text-sm text-spotify-text hidden md:block">
                    {track.album}
                  </div>
                  
                  <div className="text-sm text-spotify-text">
                    {formatDuration(track.duracao)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {track.adicionadaComSucesso ? (
                      <i className="fas fa-check text-spotify-green" title="Adicionada com sucesso"></i>
                    ) : (
                      <i className="fas fa-exclamation-triangle text-spotify-warning" title="Erro ao adicionar"></i>
                    )}
                    
                    <button className="text-spotify-text hover:text-white">
                      <i className="fas fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
