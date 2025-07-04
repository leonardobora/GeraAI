interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface SpotifyUser {
  id: string;
  email: string;
  display_name: string;
  images: Array<{ url: string }>;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyTrack {
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
}

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
  };
}

export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || "";
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
    
    // Set redirect URI based on current domain
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    this.redirectUri = `https://${domain}/api/spotify/callback`;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Spotify client ID e secret são obrigatórios");
    }
  }

  getAuthUrl(): string {
    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes.join(' '),
      redirect_uri: this.redirectUri,
      state: Math.random().toString(36).substring(7),
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao trocar código por tokens: ${response.status}`);
    }

    return await response.json();
  }

  async refreshToken(refreshToken: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao renovar token: ${response.status}`);
    }

    return await response.json();
  }

  async getUserProfile(accessToken: string): Promise<SpotifyUser> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar perfil do usuário: ${response.status}`);
    }

    return await response.json();
  }

  async createPlaylist(accessToken: string, name: string, description: string): Promise<SpotifyPlaylist> {
    const user = await this.getUserProfile(accessToken);
    
    const response = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        description: description,
        public: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar playlist: ${response.status}`);
    }

    return await response.json();
  }

  async addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]): Promise<void> {
    // Spotify API limits to 100 tracks per request
    const batchSize = 100;
    
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao adicionar faixas à playlist: ${response.status}`);
      }
    }
  }

  async searchTracks(recommendations: string[], accessToken: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    
    for (const recommendation of recommendations) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?${new URLSearchParams({
            q: recommendation,
            type: 'track',
            limit: '1',
          })}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data: SpotifySearchResult = await response.json();
          if (data.tracks.items.length > 0) {
            tracks.push(data.tracks.items[0]);
          }
        }
      } catch (error) {
        console.error(`Erro ao buscar track: ${recommendation}`, error);
      }
    }

    return tracks;
  }

  async getTrack(trackId: string, accessToken: string): Promise<SpotifyTrack> {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar faixa: ${response.status}`);
    }

    return await response.json();
  }
}
