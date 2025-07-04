import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface SpotifyStatus {
  connected: boolean;
  userId: string | null;
  email: string | null;
}

export function useSpotify() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading: isLoadingStatus } = useQuery<SpotifyStatus>({
    queryKey: ["/api/spotify/status"],
    retry: false,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/spotify/auth");
      const data = await response.json();
      // Redirect to Spotify auth
      window.location.href = data.authUrl;
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
        description: "Erro ao conectar com Spotify",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/spotify/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spotify/status"] });
      toast({
        title: "Sucesso",
        description: "Spotify desconectado com sucesso",
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
        description: "Erro ao desconectar Spotify",
        variant: "destructive",
      });
    },
  });

  return {
    status,
    isLoadingStatus,
    isConnected: status?.connected ?? false,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}
