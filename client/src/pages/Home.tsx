import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import GeradorPlaylist from "@/components/GeradorPlaylist";
import PreviewPlaylist from "@/components/PreviewPlaylist";
import { useSpotify } from "@/hooks/useSpotify";
import { usePlaylist } from "@/hooks/usePlaylist";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { status } = useSpotify();
  const { lastGeneratedPlaylist } = usePlaylist();

  useEffect(() => {
    // Handle Spotify connection callback
    const params = new URLSearchParams(location.split('?')[1] || '');
    const spotifyStatus = params.get('spotify');
    
    if (spotifyStatus === 'connected') {
      toast({
        title: "Sucesso!",
        description: "Conta Spotify conectada com sucesso",
      });
    } else if (spotifyStatus === 'error') {
      toast({
        title: "Erro",
        description: "Erro ao conectar com Spotify",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  return (
    <div className="min-h-screen bg-spotify-dark">
      <Header />
      
      <main>
        {/* Hero Section - Generator */}
        <section className="bg-gradient-to-br from-spotify-surface to-spotify-dark py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-spotify-green to-spotify-green-light bg-clip-text text-transparent">
                Crie Playlists Incríveis com IA
              </h1>
              <p className="text-xl text-spotify-text max-w-2xl mx-auto">
                Descreva sua playlist ideal em português e nossa IA criará uma seleção personalizada direto no seu Spotify
              </p>
            </div>

            <GeradorPlaylist />
          </div>
        </section>

        {/* Generated Playlist Preview */}
        {lastGeneratedPlaylist && (
          <PreviewPlaylist playlist={lastGeneratedPlaylist} />
        )}

        {/* Spotify Connection Status */}
        {!status?.connected && (
          <section className="bg-spotify-surface py-8 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-spotify-warning/10 border border-spotify-warning/20 rounded-xl p-6">
                <div className="flex items-center justify-center mb-4">
                  <i className="fas fa-exclamation-triangle text-spotify-warning text-2xl mr-3"></i>
                  <h3 className="text-lg font-semibold text-spotify-warning">
                    Spotify Não Conectado
                  </h3>
                </div>
                <p className="text-spotify-text mb-4">
                  Para criar playlists automaticamente, você precisa conectar sua conta Spotify.
                </p>
                <button
                  onClick={() => window.location.href = '/config-spotify'}
                  className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  <i className="fab fa-spotify mr-2"></i>
                  Conectar Spotify
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-spotify-surface border-t border-spotify-card py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <i className="fab fa-spotify text-spotify-green text-xl"></i>
                <span className="font-bold">Gerador de Playlists IA</span>
              </div>
              <p className="text-sm text-spotify-text">
                Crie playlists personalizadas com inteligência artificial integrada ao Spotify.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links Úteis</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">Suporte</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Tecnologia</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">Spotify Web API</a></li>
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">Perplexity AI</a></li>
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">React + TypeScript</a></li>
                <li><a href="#" className="text-spotify-text hover:text-white transition-colors">Node.js + Express</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-spotify-card pt-6 mt-6 text-center">
            <p className="text-sm text-spotify-text">
              © 2024 Gerador de Playlists IA. Feito com 💚 no Brasil.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
