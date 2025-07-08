import {
  users,
  playlists,
  tracks,
  sharedPlaylists,
  type User,
  type UpsertUser,
  type Playlist,
  type InsertPlaylist,
  type Track,
  type InsertTrack,
  type PlaylistWithTracks,
  type SharedPlaylist,
  type InsertSharedPlaylist,
  usageTracking, // Import the usageTracking table
  type UsageTracking, // Import UsageTracking type
  type InsertUsageTracking, // Import InsertUsageTracking type
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm"; // Import sql for raw queries or complex operations if needed, and `and`

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSpotifyTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    spotifyUserId: string,
  ): Promise<void>;
  updateUserAISettings(
    userId: string,
    aiProvider: string,
    apiKeys: Record<string, string>,
  ): Promise<void>;

  // Subscription and Usage
  getUserSubscriptionInfo(
    id: string,
  ): Promise<
    | {
        subscriptionPlan: string | null;
        trialEndDate: Date | null;
        subscriptionStatus: string | null;
      }
    | undefined
  >;
  getOrCreateUserUsage(
    userId: string,
    monthYear: string,
  ): Promise<UsageTracking>;
  incrementPlaylistCount(userId: string, monthYear: string): Promise<void>;

  // Playlist operations
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  getPlaylistsByUserId(userId: string): Promise<Playlist[]>;
  getPlaylistById(id: number): Promise<PlaylistWithTracks | undefined>;
  updatePlaylistSpotifyId(id: number, spotifyPlaylistId: string): Promise<void>;
  updatePlaylistMetadata(
    id: number,
    totalFaixas: number,
    duracaoTotal: string,
  ): Promise<void>;
  deletePlaylist(id: number): Promise<void>;

  // Sharing operations
  createSharedPlaylist(
    shareData: InsertSharedPlaylist,
  ): Promise<SharedPlaylist>;
  getSharedPlaylist(
    shareToken: string,
  ): Promise<(SharedPlaylist & { playlist: PlaylistWithTracks }) | undefined>;
  deleteSharedPlaylist(playlistId: number): Promise<void>;

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

  async updateUserSpotifyTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    spotifyUserId: string,
  ): Promise<void> {
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

  // Subscription and Usage operations
  async getUserSubscriptionInfo(
    id: string,
  ): Promise<
    | {
        subscriptionPlan: string | null;
        trialEndDate: Date | null;
        subscriptionStatus: string | null;
      }
    | undefined
  > {
    const [user] = await db
      .select({
        subscriptionPlan: users.subscriptionPlan,
        trialEndDate: users.trialEndDate,
        subscriptionStatus: users.subscriptionStatus,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) return undefined;
    // Ensure correct types, especially for trialEndDate which can be null
    return {
      subscriptionPlan: user.subscriptionPlan ?? "free",
      trialEndDate: user.trialEndDate ? new Date(user.trialEndDate) : null,
      subscriptionStatus: user.subscriptionStatus ?? "free",
    };
  }

  async getOrCreateUserUsage(
    userId: string,
    monthYear: string,
  ): Promise<UsageTracking> {
    const [existingUsage] = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.monthYear, monthYear),
        ),
      );

    if (existingUsage) {
      return existingUsage;
    }

    const [newUsage] = await db
      .insert(usageTracking)
      .values({
        userId,
        monthYear,
        playlistsCreated: 0,
        apiCallsMade: 0,
      })
      .returning();
    return newUsage;
  }

  async incrementPlaylistCount(
    userId: string,
    monthYear: string,
  ): Promise<void> {
    // First, ensure the usage record for the month exists.
    await this.getOrCreateUserUsage(userId, monthYear);

    // Then, increment the count.
    // Note: For concurrent safety, a direct increment on the DB is better if the ORM supports it easily.
    // sql`UPDATE usage_tracking SET playlists_created = playlists_created + 1 WHERE user_id = ${userId} AND month_year = ${monthYear}`
    // However, for simplicity with Drizzle's typical patterns here:
    const currentUsage = await this.getOrCreateUserUsage(userId, monthYear);
    await db
      .update(usageTracking)
      .set({ playlistsCreated: (currentUsage.playlistsCreated ?? 0) + 1 })
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.monthYear, monthYear),
        ),
      );
  }

  // Playlist operations
  async createPlaylist(playlistData: InsertPlaylist): Promise<Playlist> {
    // Before creating a playlist, we might want to increment usage count here or in the service layer
    // For now, let's assume the middleware or service calling this will handle usage increment
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

  async updatePlaylistSpotifyId(
    id: number,
    spotifyPlaylistId: string,
  ): Promise<void> {
    await db
      .update(playlists)
      .set({ spotifyPlaylistId })
      .where(eq(playlists.id, id));
  }

  async updatePlaylistMetadata(
    id: number,
    totalFaixas: number,
    duracaoTotal: string,
  ): Promise<void> {
    await db
      .update(playlists)
      .set({ totalFaixas, duracaoTotal })
      .where(eq(playlists.id, id));
  }

  async updateUserAISettings(
    userId: string,
    aiProvider: string,
    apiKeys: Record<string, string>,
  ): Promise<void> {
    const updateData: any = { aiProvider };

    if (apiKeys.perplexityApiKey)
      updateData.perplexityApiKey = apiKeys.perplexityApiKey;
    if (apiKeys.openaiApiKey) updateData.openaiApiKey = apiKeys.openaiApiKey;
    if (apiKeys.geminiApiKey) updateData.geminiApiKey = apiKeys.geminiApiKey;

    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  async createSharedPlaylist(
    shareData: InsertSharedPlaylist,
  ): Promise<SharedPlaylist> {
    const [sharedPlaylist] = await db
      .insert(sharedPlaylists)
      .values(shareData)
      .returning();
    return sharedPlaylist;
  }

  async getSharedPlaylist(
    shareToken: string,
  ): Promise<(SharedPlaylist & { playlist: PlaylistWithTracks }) | undefined> {
    const [shared] = await db
      .select()
      .from(sharedPlaylists)
      .where(eq(sharedPlaylists.shareToken, shareToken));

    if (!shared) return undefined;

    const playlist = await this.getPlaylistById(shared.playlistId);
    if (!playlist) return undefined;

    return {
      ...shared,
      playlist,
    };
  }

  async deleteSharedPlaylist(playlistId: number): Promise<void> {
    await db
      .delete(sharedPlaylists)
      .where(eq(sharedPlaylists.playlistId, playlistId));
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

    return await db.insert(tracks).values(tracksData).returning();
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
