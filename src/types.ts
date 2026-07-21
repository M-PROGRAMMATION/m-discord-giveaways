import type { EmbedBuilder } from "discord.js";
import type { Giveaway } from "./Giveaway.js";
import type { GiveawaysProvider } from "./providers/Provider.js";

/**
 * Raw, storage-friendly shape of a giveaway. This is what providers persist,
 * and what backs the future "complete history" feature.
 */
export interface GiveawayData {
  messageId: string;
  channelId: string;
  guildId: string;
  prize: string;
  winnerCount: number;
  hostedBy: string | null;
  startAt: number;
  endAt: number;
  ended: boolean;
  participants: string[];
  winners: string[];
  /** Free-form bag for consumers to attach extra metadata without a schema migration. */
  extra: Record<string, unknown>;
}

export type GiveawayEmbedFunction = (giveaway: Giveaway) => EmbedBuilder;

/**
 * Every embed the module sends can be fully replaced. Omit an entry to fall
 * back to the built-in default for that state.
 */
export interface GiveawayEmbeds {
  start?: GiveawayEmbedFunction;
  end?: GiveawayEmbedFunction;
  reroll?: GiveawayEmbedFunction;
}

export interface GiveawaysManagerOptions {
  /** Storage backend for giveaways. Defaults to an in-memory provider (not persistent). */
  provider?: GiveawaysProvider;
  /** Emoji used as the entry reaction. Defaults to "🎉". */
  reaction?: string;
  /** How often (ms) to check for giveaways that need to end. Defaults to 15000. */
  checkInterval?: number;
  /** Embed overrides, see {@link GiveawayEmbeds}. */
  embeds?: GiveawayEmbeds;
}

export interface StartGiveawayOptions {
  channelId: string;
  prize: string;
  winnerCount: number;
  /** Duration in milliseconds from now. Ignored if `endAt` is provided. */
  duration?: number;
  /** Absolute end timestamp (ms). Takes precedence over `duration`. */
  endAt?: number;
  hostedBy?: string;
  extra?: Record<string, unknown>;
}

export interface RerollGiveawayOptions {
  winnerCount?: number;
}

export type GiveawaysManagerEvents = {
  giveawayStart: [giveaway: Giveaway];
  giveawayEnd: [giveaway: Giveaway, winners: string[]];
  giveawayReroll: [giveaway: Giveaway, winners: string[]];
  giveawayDelete: [giveaway: Giveaway];
};
