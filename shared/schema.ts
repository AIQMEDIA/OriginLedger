import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Blockchain block schema
export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  index: integer("index").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  data: json("data").notNull(),
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull(),
});

// Participants schema
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  role: text("role").notNull(), // manufacturer, shipper, retailer, etc.
  email: text("email"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Assets schema
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: text("asset_id").notNull().unique(), // PRD-2024-001
  name: text("name").notNull(),
  category: text("category"),
  currentStatus: text("current_status").notNull().default("manufactured"), // manufactured, shipped, delivered, etc.
  currentLocation: text("current_location"),
  batch: text("batch"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supply chain events schema  
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").references(() => blocks.id),
  participantId: varchar("participant_id").references(() => participants.id),
  assetId: varchar("asset_id").references(() => assets.id),
  action: text("action").notNull(), // manufactured, shipped, received, etc.
  location: text("location"),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  timestamp: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  timestamp: true,
});

// Types
export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Additional types for blockchain operations
export type BlockchainData = {
  user: string;
  role: string;
  action: string;
  asset_id: string;
  meta: Record<string, any>;
};

export type ParticipantStats = {
  manufacturers: number;
  shippers: number;
  retailers: number;
  total: number;
};

export type DashboardStats = {
  totalAssets: number;
  totalEvents: number;
  activeParticipants: number;
  chainIntegrity: number;
};
