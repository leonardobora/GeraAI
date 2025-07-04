export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  images: Array<{ url: string }>;
  tracks: {
    total: number;
  };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getSpotifyPlaylistUrl = (playlistId: string): string => {
  return `https://open.spotify.com/playlist/${playlistId}`;
};

export const getSpotifyTrackUrl = (trackId: string): string => {
  return `https://open.spotify.com/track/${trackId}`;
};

export const getSpotifyUserUrl = (userId: string): string => {
  return `https://open.spotify.com/user/${userId}`;
};
