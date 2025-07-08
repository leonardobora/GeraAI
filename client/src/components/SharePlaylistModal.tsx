import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SharePlaylistModalProps {
  playlistId: number;
  playlistName: string;
  children: React.ReactNode;
}

export default function SharePlaylistModal({ playlistId, playlistName, children }: SharePlaylistModalProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(`/api/playlists/${playlistId}/share`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao compartilhar');
      }

      setShareUrl(data.shareUrl);
      setSpotifyUrl(data.spotifyUrl || "");
      
      toast({
        title: "Playlist compartilhada!",
        description: data.message,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível compartilhar a playlist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para sua área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Confira esta playlist incrível: "${playlistName}" ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaTwitter = () => {
    const message = `Confira esta playlist incrível: "${playlistName}" ${shareUrl} #SpotifyPlaylist #IA`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-spotify-surface border-spotify-card">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <i className="fas fa-share-alt text-spotify-green"></i>
            Compartilhar Playlist
          </DialogTitle>
          <DialogDescription className="text-spotify-text">
            Compartilhe "{playlistName}" com seus amigos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Spotify Direct Link */}
          {spotifyUrl && (
            <div className="space-y-2">
              <label className="text-white font-medium">Abrir no Spotify</label>
              <Button
                onClick={() => window.open(spotifyUrl, '_blank')}
                className="w-full bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
              >
                <i className="fab fa-spotify mr-2"></i>
                Abrir Playlist no Spotify
              </Button>
            </div>
          )}

          {!shareUrl ? (
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full bg-spotify-card hover:bg-spotify-card/80 text-white border border-spotify-green"
            >
              {isSharing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Gerando link...
                </>
              ) : (
                <>
                  <i className="fas fa-link mr-2"></i>
                  Gerar Link de Compartilhamento
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Link de compartilhamento:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-spotify-card border-spotify-card text-white flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="border-spotify-card text-spotify-text hover:text-white"
                  >
                    <i className="fas fa-copy"></i>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Compartilhar via:
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={shareViaWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <i className="fab fa-whatsapp mr-2"></i>
                    WhatsApp
                  </Button>
                  <Button
                    onClick={shareViaTwitter}
                    className="bg-blue-500 hover:bg-blue-600 text-white flex-1"
                  >
                    <i className="fab fa-twitter mr-2"></i>
                    Twitter
                  </Button>
                </div>
              </div>

              <div className="text-xs text-spotify-text bg-spotify-card p-3 rounded-lg">
                <i className="fas fa-info-circle mr-1"></i>
                Qualquer pessoa com este link poderá ver sua playlist, mesmo sem ter uma conta.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}