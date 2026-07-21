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
