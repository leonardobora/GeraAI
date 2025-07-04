import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useSpotify } from "@/hooks/useSpotify";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConfigSpotify() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { status, isLoadingStatus, isConnected, connect, disconnect, isConnecting, isDisconnecting } = useSpotify();
  const [hasSpotifyError, setHasSpotifyError] = useState(false);
  const [errorType, setErrorType] = useState<string>("");

  const handleConnect = () => {
    setHasSpotifyError(false);
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

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

    // Check for Spotify status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyStatus = urlParams.get('spotify');
    
    if (spotifyStatus && ['error', 'auth-error', 'token-error'].includes(spotifyStatus)) {
      setHasSpotifyError(true);
      setErrorType(spotifyStatus);
      
      let title = "Erro na conexão com Spotify";
      let description = "Houve um problema ao conectar com o Spotify.";
      
      if (spotifyStatus === 'auth-error') {
        title = "Erro de autorização";
        description = "O Spotify rejeitou a conexão. Verifique se você possui uma conta Premium ou se não há restrições na sua conta.";
      } else if (spotifyStatus === 'token-error') {
        title = "Token expirado";
        description = "O token de acesso expirou. Clique em reconectar para gerar um novo token.";
      } else {
        const errorMessage = urlParams.get('message');
        if (errorMessage) {
          description = `Erro: ${decodeURIComponent(errorMessage)}`;
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
      
      // Remove the error parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (spotifyStatus === 'connected') {
      toast({
        title: "Spotify conectado!",
        description: "Sua conta Spotify foi conectada com sucesso.",
      });
      // Remove the success parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAuthenticated, isLoading, toast]);

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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Configuração do Spotify</h1>
            <p className="text-spotify-text">
              Conecte sua conta Spotify para criar playlists automaticamente
            </p>
          </div>

          {hasSpotifyError && (
            <Alert className="mb-6 border-spotify-error/20 bg-spotify-error/10">
              <i className="fas fa-exclamation-triangle text-spotify-error"></i>
              <AlertDescription className="text-spotify-text">
                {errorType === 'auth-error' ? (
                  <>
                    <strong className="text-spotify-error">Erro de Autorização:</strong><br />
                    O Spotify rejeitou a conexão. Possíveis causas:
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Conta Spotify restrita ou suspensa</li>
                      <li>• Permissões de aplicativo não concedidas</li>
                      <li>• Região não suportada pelo aplicativo</li>
                    </ul>
                    <strong className="text-white">Solução:</strong> Verifique sua conta Spotify e tente conectar novamente.
                  </>
                ) : errorType === 'token-error' ? (
                  <>
                    <strong className="text-spotify-error">Token Expirado:</strong><br />
                    Sua sessão com o Spotify expirou e precisa ser renovada.
                    <br /><br />
                    <strong className="text-white">Solução:</strong> Clique em "Desconectar Spotify" e depois "Conectar com Spotify" para renovar.
                  </>
                ) : (
                  <>
                    <strong className="text-spotify-error">Erro na conexão com Spotify:</strong><br />
                    Houve um problema ao conectar com sua conta Spotify. Isso pode acontecer por:
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>• Token de acesso expirado</li>
                      <li>• Permissões insuficientes na conta Spotify</li>
                      <li>• Problema temporário no Spotify</li>
                    </ul>
                    <strong className="text-white">Solução:</strong> Clique em "Conectar com Spotify" novamente para tentar reconectar.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Card className="bg-spotify-card border-spotify-card">
            <CardContent className="p-8">
              {isLoadingStatus ? (
                <div className="space-y-6">
                  <Skeleton className="h-20 w-full bg-spotify-surface" />
                  <Skeleton className="h-32 w-full bg-spotify-surface" />
                  <div className="flex gap-4">
                    <Skeleton className="h-12 flex-1 bg-spotify-surface" />
                    <Skeleton className="h-12 flex-1 bg-spotify-surface" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Connection Status */}
                  <div className={`flex items-center justify-between mb-6 p-4 rounded-xl ${
                    isConnected ? 'bg-spotify-green/10 border border-spotify-green/20' : 'bg-spotify-error/10 border border-spotify-error/20'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isConnected ? 'bg-spotify-green' : 'bg-spotify-error'
                      }`}></div>
                      <div>
                        <p className={`font-medium ${
                          isConnected ? 'text-spotify-green' : 'text-spotify-error'
                        }`}>
                          {isConnected ? 'Spotify Conectado' : 'Spotify Desconectado'}
                        </p>
                        {isConnected && status?.email && (
                          <p className="text-sm text-spotify-text">
                            Conta: {status.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {isConnected && (
                      <button className="text-spotify-text hover:text-white">
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                    )}
                  </div>

                  {/* Permissions */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      {isConnected ? 'Permissões Concedidas' : 'Permissões Necessárias'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <i className={`fas fa-${isConnected ? 'check text-spotify-green' : 'times text-spotify-error'}`}></i>
                        <span className="text-sm text-spotify-text">Criar playlists públicas</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <i className={`fas fa-${isConnected ? 'check text-spotify-green' : 'times text-spotify-error'}`}></i>
                        <span className="text-sm text-spotify-text">Criar playlists privadas</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <i className={`fas fa-${isConnected ? 'check text-spotify-green' : 'times text-spotify-error'}`}></i>
                        <span className="text-sm text-spotify-text">Ler informações da conta</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <i className={`fas fa-${isConnected ? 'check text-spotify-green' : 'times text-spotify-error'}`}></i>
                        <span className="text-sm text-spotify-text">Acessar playlists existentes</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {isConnected ? (
                      <>
                        <Button
                          onClick={handleDisconnect}
                          disabled={isDisconnecting}
                          className="flex-1 bg-spotify-error hover:bg-red-600 text-white font-semibold"
                        >
                          {isDisconnecting ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Desconectando...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-unlink mr-2"></i>
                              Desconectar Spotify
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleConnect}
                          disabled={isConnecting}
                          className="flex-1 bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
                        >
                          {isConnecting ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-spotify-dark border-t-transparent rounded-full mr-2"></div>
                              Renovando...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-sync mr-2"></i>
                              Renovar Conexão
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold"
                      >
                        {isConnecting ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-spotify-dark border-t-transparent rounded-full mr-2"></div>
                            Conectando...
                          </>
                        ) : (
                          <>
                            <i className="fab fa-spotify mr-2"></i>
                            Conectar com Spotify
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Help Text */}
                  <div className="mt-6 p-4 bg-spotify-surface rounded-xl">
                    <h4 className="font-semibold text-white mb-2">
                      <i className="fas fa-info-circle text-spotify-green mr-2"></i>
                      Como funciona?
                    </h4>
                    <p className="text-sm text-spotify-text">
                      Ao conectar sua conta Spotify, você permite que nossa aplicação crie playlists 
                      automaticamente baseadas nas suas descrições. Suas informações ficam seguras e 
                      você pode desconectar a qualquer momento.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
