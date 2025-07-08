import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface GeneratePlaylistData {
  prompt: string;
  tamanho: "curta" | "media" | "longa";
  nivelDescoberta: "seguro" | "aventureiro";
  conteudoExplicito: boolean;
}

interface Playlist {
  id: number;
  nome: string;
  descricao: string;
  promptOriginal: string;
  spotifyPlaylistId: string;
  totalFaixas: number;
  duracaoTotal: string;
  tamanho: string;
  nivelDescoberta: string;
  conteudoExplicito: boolean;
  createdAt: string;
  tracks?: Track[];
}

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

export function usePlaylist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GeneratePlaylistData) => {
      const response = await apiRequest("POST", "/api/playlists/generate", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Sucesso!",
        description: "Playlist criada com sucesso no seu Spotify",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      let message = "Erro ao gerar playlist";
      
      if (error.message.includes("Configure sua conta Spotify")) {
        message = "Configure sua conta Spotify primeiro";
      } else if (error.message.includes("Não foi possível gerar faixas")) {
        message = "Não foi possível gerar faixas para este prompt";
      } else if (error.message.includes("Não foi possível encontrar nenhuma música")) {
        message = "Não foi possível encontrar músicas no Spotify. Tente um prompt diferente.";
      } else if (error.message.includes("Token expirado")) {
        message = "Sua sessão Spotify expirou. Reconecte sua conta.";
      } else if (error.message.includes("Limite de requisições")) {
        message = "Muitas requisições. Aguarde alguns minutos e tente novamente.";
      } else if (error.message.includes("Spotify temporariamente indisponível")) {
        message = "Spotify temporariamente indisponível. Tente novamente em alguns minutos.";
      } else if (error.message.includes("Serviço de IA temporariamente indisponível")) {
        message = "Serviço de IA temporariamente indisponível. Tente novamente.";
      } else if (error.message.includes("500")) {
        message = "Erro interno do servidor. Tente novamente.";
      }
      
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (playlistId: number) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Sucesso",
        description: "Playlist deletada com sucesso",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Erro ao deletar playlist",
        variant: "destructive",
      });
    },
  });

  const getPlaylist = (playlistId: number) => {
    return useQuery<Playlist>({
      queryKey: ["/api/playlists", playlistId],
      retry: false,
    });
  };

  return {
    playlists,
    isLoadingPlaylists,
    generatePlaylist: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    deletePlaylist: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    getPlaylist,
    lastGeneratedPlaylist: generateMutation.data,
  };
}
