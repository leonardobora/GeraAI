import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-spotify-surface shadow-lg sticky top-0 z-50 border-b border-spotify-card">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <i className="fab fa-spotify text-spotify-green text-2xl"></i>
              <span className="text-xl font-bold text-white">Gerador de Playlists IA</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`font-medium transition-colors ${
              isActive('/') 
                ? 'text-spotify-green' 
                : 'text-spotify-text hover:text-spotify-green-light'
            }`}>
              Início
            </Link>
            
            <Link href="/playlists" className={`font-medium transition-colors ${
              isActive('/playlists') 
                ? 'text-spotify-green' 
                : 'text-spotify-text hover:text-spotify-green-light'
            }`}>
              Minhas Playlists
            </Link>
            
            <Link href="/config-spotify" className={`font-medium transition-colors ${
              isActive('/config-spotify') 
                ? 'text-spotify-green' 
                : 'text-spotify-text hover:text-spotify-green-light'
            }`}>
              Configurações
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 bg-spotify-card hover:bg-spotify-surface px-3 py-2 rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-spotify-green text-spotify-dark">
                        {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white">
                      {user?.firstName || user?.email?.split('@')[0] || 'Usuário'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-spotify-surface border-spotify-card">
                  <DropdownMenuItem className="text-spotify-text hover:text-white hover:bg-spotify-card">
                    <i className="fas fa-user mr-2"></i>
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-spotify-text hover:text-white hover:bg-spotify-card"
                    onClick={() => window.location.href = '/config-spotify'}
                  >
                    <i className="fab fa-spotify mr-2"></i>
                    Configurar Spotify
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-spotify-card" />
                  <DropdownMenuItem 
                    className="text-spotify-text hover:text-white hover:bg-spotify-card"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-spotify-text hover:text-white"
            >
              <i className="fas fa-bars text-xl"></i>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
