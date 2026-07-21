import type { EmbedBuilder } from "discord.js";
import type { Giveaway } from "../giveaway/index.js";

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
