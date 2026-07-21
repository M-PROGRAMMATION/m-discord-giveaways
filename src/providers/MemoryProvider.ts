import type { GiveawayData } from "../giveaway/index.js";
import type { GiveawaysProvider } from "./Provider.js";

/**
 * Default in-memory provider. Zero setup, but giveaways (and their history)
 * are lost on process restart. Swap it for a persistent {@link GiveawaysProvider}
 * before relying on this in production.
 */
export class MemoryProvider implements GiveawaysProvider {
  private readonly store = new Map<string, GiveawayData>();

  public getAll(): GiveawayData[] {
    return Array.from(this.store.values());
  }

  public create(giveaway: GiveawayData): void {
    this.store.set(giveaway.messageId, giveaway);
  }

  public update(messageId: string, data: GiveawayData): void {
    this.store.set(messageId, data);
  }

  public delete(messageId: string): void {
    this.store.delete(messageId);
  }
}
