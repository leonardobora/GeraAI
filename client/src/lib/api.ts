import { apiRequest } from "./queryClient";

export interface GeneratePlaylistRequest {
  prompt: string;
  tamanho: "curta" | "media" | "longa";
  nivelDescoberta: "seguro" | "aventureiro";
  conteudoExplicito: boolean;
}

export interface GeneratePlaylistResponse {
  playlist: {
    id: number;
    nome: string;
    descricao: string;
    promptOriginal: string;
    spotifyPlaylistId: string;
    totalFaixas: number;
    duracaoTotal: string;
    tracks: Array<{
      id: number;
      nome: string;
      artista: string;
      album: string;
      duracao: number;
      previewUrl: string;
      imageUrl: string;
      posicao: number;
      adicionadaComSucesso: boolean;
    }>;
  };
  spotifyUrl: string;
  message: string;
}

export interface SpotifyStatus {
  connected: boolean;
  userId: string | null;
  email: string | null;
}

export const api = {
  // Playlist endpoints
  generatePlaylist: async (data: GeneratePlaylistRequest): Promise<GeneratePlaylistResponse> => {
    const response = await apiRequest("POST", "/api/playlists/generate", data);
    return await response.json();
  },

  getPlaylists: async () => {
    const response = await apiRequest("GET", "/api/playlists");
    return await response.json();
  },

  getPlaylist: async (id: number) => {
    const response = await apiRequest("GET", `/api/playlists/${id}`);
    return await response.json();
  },

  deletePlaylist: async (id: number) => {
    const response = await apiRequest("DELETE", `/api/playlists/${id}`);
    return await response.json();
  },

  // Spotify endpoints
  getSpotifyAuthUrl: async () => {
    const response = await apiRequest("GET", "/api/spotify/auth");
    return await response.json();
  },

  getSpotifyStatus: async (): Promise<SpotifyStatus> => {
    const response = await apiRequest("GET", "/api/spotify/status");
    return await response.json();
  },

  disconnectSpotify: async () => {
    const response = await apiRequest("DELETE", "/api/spotify/disconnect");
    return await response.json();
  },

  // Auth endpoints
  getCurrentUser: async () => {
    const response = await apiRequest("GET", "/api/auth/user");
    return await response.json();
  },
};
