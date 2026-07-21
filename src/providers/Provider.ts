import type { GiveawayData } from "../types.js";

/**
 * Storage abstraction for giveaways. Ship your own implementation (JSON file,
 * SQLite, Postgres, Redis, ...) to persist giveaways and unlock a complete,
 * queryable history — {@link MemoryProvider} is only meant for quick starts
 * and tests, it loses everything on restart.
 */
export interface GiveawaysProvider {
  /** Called once by the manager before it starts using the provider. */
  init?(): Promise<void> | void;
  getAll(): Promise<GiveawayData[]> | GiveawayData[];
  create(giveaway: GiveawayData): Promise<void> | void;
  update(messageId: string, data: GiveawayData): Promise<void> | void;
  delete(messageId: string): Promise<void> | void;
}
