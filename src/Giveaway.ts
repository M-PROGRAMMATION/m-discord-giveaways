import type { GiveawayData } from "./types.js";

export class Giveaway {
  public constructor(private data: GiveawayData) {}

  public get messageId(): string {
    return this.data.messageId;
  }

  public get channelId(): string {
    return this.data.channelId;
  }

  public get guildId(): string {
    return this.data.guildId;
  }

  public get prize(): string {
    return this.data.prize;
  }

  public get winnerCount(): number {
    return this.data.winnerCount;
  }

  public get hostedBy(): string | null {
    return this.data.hostedBy;
  }

  public get startAt(): number {
    return this.data.startAt;
  }

  public get endAt(): number {
    return this.data.endAt;
  }

  public get ended(): boolean {
    return this.data.ended;
  }

  public get participants(): readonly string[] {
    return this.data.participants;
  }

  public get winners(): readonly string[] {
    return this.data.winners;
  }

  public get extra(): Record<string, unknown> {
    return this.data.extra;
  }

  public get isExpired(): boolean {
    return !this.data.ended && Date.now() >= this.data.endAt;
  }

  public get remainingTime(): number {
    return Math.max(0, this.data.endAt - Date.now());
  }

  /** Returns the raw, storage-friendly data backing this giveaway. */
  public toJSON(): GiveawayData {
    return { ...this.data };
  }

  /** @internal used by the manager to keep the wrapped data in sync with the provider. */
  public _patch(data: Partial<GiveawayData>): void {
    this.data = { ...this.data, ...data };
  }
}
