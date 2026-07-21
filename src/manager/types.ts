import type { GiveawayEmbeds } from "../embeds/index.js";
import type { Giveaway } from "../giveaway/index.js";
import type { GiveawaysProvider } from "../providers/index.js";

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
