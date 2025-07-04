import {
  users,
  playlists,
  tracks,
  type User,
  type UpsertUser,
  type Playlist,
  type InsertPlaylist,
  type Track,
  type InsertTrack,
  type PlaylistWithTracks,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSpotifyTokens(userId: string, accessToken: string, refreshToken: string, spotifyUserId: string): Promise<void>;
  
  // Playlist operations
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  getPlaylistsByUserId(userId: string): Promise<Playlist[]>;
  getPlaylistById(id: number): Promise<PlaylistWithTracks | undefined>;
  updatePlaylistSpotifyId(id: number, spotifyPlaylistId: string): Promise<void>;
  deletePlaylist(id: number): Promise<void>;
  
  // Track operations
  createTracks(tracks: InsertTrack[]): Promise<Track[]>;
  getTracksByPlaylistId(playlistId: number): Promise<Track[]>;
  updateTrackSuccess(trackId: number, success: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSpotifyTokens(userId: string, accessToken: string, refreshToken: string, spotifyUserId: string): Promise<void> {
    await db
      .update(users)
      .set({
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        spotifyUserId: spotifyUserId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Playlist operations
  async createPlaylist(playlistData: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db
      .insert(playlists)
      .values(playlistData)
      .returning();
    return playlist;
  }

  async getPlaylistsByUserId(userId: string): Promise<Playlist[]> {
    return await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.createdAt));
  }

  async getPlaylistById(id: number): Promise<PlaylistWithTracks | undefined> {
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, id));
    
    if (!playlist) return undefined;

    const playlistTracks = await db
      .select()
      .from(tracks)
      .where(eq(tracks.playlistId, id))
      .orderBy(tracks.posicao);

    return {
      ...playlist,
      tracks: playlistTracks,
    };
  }

  async updatePlaylistSpotifyId(id: number, spotifyPlaylistId: string): Promise<void> {
    await db
      .update(playlists)
      .set({ spotifyPlaylistId })
      .where(eq(playlists.id, id));
  }

  async deletePlaylist(id: number): Promise<void> {
    // Delete tracks first
    await db.delete(tracks).where(eq(tracks.playlistId, id));
    // Delete playlist
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  // Track operations
  async createTracks(tracksData: InsertTrack[]): Promise<Track[]> {
    if (tracksData.length === 0) return [];
    
    return await db
      .insert(tracks)
      .values(tracksData)
      .returning();
  }

  async getTracksByPlaylistId(playlistId: number): Promise<Track[]> {
    return await db
      .select()
      .from(tracks)
      .where(eq(tracks.playlistId, playlistId))
      .orderBy(tracks.posicao);
  }

  async updateTrackSuccess(trackId: number, success: boolean): Promise<void> {
    await db
      .update(tracks)
      .set({ adicionadaComSucesso: success })
      .where(eq(tracks.id, trackId));
  }
}

export const storage = new DatabaseStorage();
