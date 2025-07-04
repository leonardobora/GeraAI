import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-spotify-dark flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-spotify-card border-spotify-card">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <i className="fab fa-spotify text-spotify-green text-6xl mr-3"></i>
              <div>
                <h1 className="text-2xl font-bold text-white">Gerador de Playlists IA</h1>
                <p className="text-spotify-text">Powered by Spotify</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-2">
                  ✨ Crie playlists com IA
                </h3>
                <p className="text-spotify-text text-sm">
                  Descreva sua playlist ideal em português e nossa IA criará uma seleção personalizada
                </p>
              </div>

              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🎵 Integração com Spotify
                </h3>
                <p className="text-spotify-text text-sm">
                  Suas playlists são criadas automaticamente na sua conta Spotify
                </p>
              </div>

              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🇧🇷 Interface em Português
                </h3>
                <p className="text-spotify-text text-sm">
                  Completamente desenvolvido para brasileiros, com suporte a MPB, sertanejo e muito mais
                </p>
              </div>
            </div>

            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
            >
              Começar Agora
            </Button>

            <p className="text-xs text-spotify-text mt-4">
              Ao continuar, você concorda com nossos termos de uso e política de privacidade
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
