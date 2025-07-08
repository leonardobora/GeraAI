import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  spotifyAccessToken: text("spotify_access_token"),
  spotifyRefreshToken: text("spotify_refresh_token"),
  spotifyUserId: varchar("spotify_user_id"),

  // AI Provider Settings
  aiProvider: varchar("ai_provider").default("perplexity"), // perplexity, openai, gemini
  perplexityApiKey: text("perplexity_api_key"),
  openaiApiKey: text("openai_api_key"),
  geminiApiKey: text("gemini_api_key"),

  // Rate Limiting
  lastApiCall: timestamp("last_api_call"),
  apiCallCount: integer("api_call_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Subscription fields
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default(
    "free",
  ),
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).default(
    "free",
  ),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndDate: timestamp("trial_end_date"),
});

// Usage Tracking Table
export const usageTracking = pgTable("usage_tracking", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  monthYear: varchar("month_year", { length: 7 }), // "YYYY-MM"
  playlistsCreated: integer("playlists_created").default(0),
  apiCallsMade: integer("api_calls_made").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Playlists table
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  promptOriginal: text("prompt_original").notNull(),
  spotifyPlaylistId: varchar("spotify_playlist_id"),
  totalFaixas: integer("total_faixas").default(0),
  duracaoTotal: varchar("duracao_total"),
  tamanho: varchar("tamanho").notNull(), // "curta", "media", "longa"
  nivelDescoberta: varchar("nivel_descoberta").notNull(), // "seguro", "aventureiro"
  conteudoExplicito: boolean("conteudo_explicito").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tracks table
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id")
    .references(() => playlists.id)
    .notNull(),
  spotifyTrackId: varchar("spotify_track_id").notNull(),
  nome: text("nome").notNull(),
  artista: text("artista").notNull(),
  album: text("album"),
  duracao: integer("duracao"), // em segundos
  previewUrl: text("preview_url"),
  posicao: integer("posicao").notNull(),
  imageUrl: text("image_url"),
  adicionadaComSucesso: boolean("adicionada_com_sucesso").default(true),
});

// Shared playlists table for public sharing
export const sharedPlaylists = pgTable("shared_playlists", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id")
    .references(() => playlists.id)
    .notNull(),
  shareToken: varchar("share_token").notNull().unique(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertPlaylistSchema = createInsertSchema(playlists);
export const insertTrackSchema = createInsertSchema(tracks);
export const insertSharedPlaylistSchema = createInsertSchema(sharedPlaylists);
export const insertUsageTrackingSchema = createInsertSchema(usageTracking);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;
export type Playlist = typeof playlists.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type InsertSharedPlaylist = typeof sharedPlaylists.$inferInsert;
export type SharedPlaylist = typeof sharedPlaylists.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;

export type PlaylistWithTracks = Playlist & {
  tracks: Track[];
};
