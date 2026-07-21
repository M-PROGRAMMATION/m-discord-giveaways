import { ChannelType, type Client, type TextChannel } from "discord.js";
import { defaultEmbeds } from "./defaultEmbeds.js";
import { GiveawayError } from "./errors/GiveawayError.js";
import { Giveaway } from "./Giveaway.js";
import { MemoryProvider } from "./providers/MemoryProvider.js";
import type { GiveawaysProvider } from "./providers/Provider.js";
import { TypedEventEmitter } from "./TypedEventEmitter.js";
import type {
  GiveawayData,
  GiveawayEmbedFunction,
  GiveawayEmbeds,
  GiveawaysManagerEvents,
  GiveawaysManagerOptions,
  RerollGiveawayOptions,
  StartGiveawayOptions,
} from "./types.js";

const DEFAULT_REACTION = "🎉";
const DEFAULT_CHECK_INTERVAL = 15_000;

/**
 * Entry point of the module. Wraps a discord.js client, owns the giveaway
 * cache, and is the extension point for custom embeds and a custom
 * {@link GiveawaysProvider} (needed for real persistence and history).
 */
export class GiveawaysManager extends TypedEventEmitter<GiveawaysManagerEvents> {
  public readonly client: Client;
  public readonly provider: GiveawaysProvider;
  public readonly reaction: string;
  public readonly embeds: Required<GiveawayEmbeds>;

  private readonly checkIntervalMs: number;
  private readonly cache = new Map<string, Giveaway>();
  private timer: NodeJS.Timeout | null = null;

  public constructor(client: Client, options: GiveawaysManagerOptions = {}) {
    super();
    this.client = client;
    this.provider = options.provider ?? new MemoryProvider();
    this.reaction = options.reaction ?? DEFAULT_REACTION;
    this.checkIntervalMs = options.checkInterval ?? DEFAULT_CHECK_INTERVAL;
    this.embeds = { ...defaultEmbeds, ...options.embeds };
  }

  /** Loads existing giveaways from the provider and starts the auto-end loop. Call this once on ready. */
  public async init(): Promise<void> {
    await this.provider.init?.();
    const stored = await this.provider.getAll();

    this.cache.clear();
    for (const data of stored) {
      this.cache.set(data.messageId, new Giveaway(data));
    }

    this.timer ??= setInterval(() => {
      void this.checkExpired();
    }, this.checkIntervalMs);
  }

  /** Stops the auto-end loop so the process can exit cleanly. */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** All giveaways known to this manager, active and ended — the base for a full history view. */
  public getAll(): Giveaway[] {
    return Array.from(this.cache.values());
  }

  public get(messageId: string): Giveaway | undefined {
    return this.cache.get(messageId);
  }

  public async start(options: StartGiveawayOptions): Promise<Giveaway> {
    if (options.winnerCount < 1) {
      throw new GiveawayError("INVALID_OPTIONS", "winnerCount must be at least 1.");
    }

    const endAt = options.endAt ?? Date.now() + (options.duration ?? 0);
    if (endAt <= Date.now()) {
      throw new GiveawayError("INVALID_OPTIONS", "The giveaway must end in the future.");
    }

    const channel = await this.fetchTextChannel(options.channelId);

    const data: GiveawayData = {
      messageId: "",
      channelId: channel.id,
      guildId: channel.guildId,
      prize: options.prize,
      winnerCount: options.winnerCount,
      hostedBy: options.hostedBy ?? null,
      startAt: Date.now(),
      endAt,
      ended: false,
      participants: [],
      winners: [],
      extra: options.extra ?? {},
    };

    const giveaway = new Giveaway(data);
    const message = await channel.send({ embeds: [this.embeds.start(giveaway)] });
    await message.react(this.reaction);

    giveaway._patch({ messageId: message.id });
    data.messageId = message.id;

    await this.provider.create(data);
    this.cache.set(message.id, giveaway);
    this.emit("giveawayStart", giveaway);

    return giveaway;
  }

  public async end(messageId: string): Promise<Giveaway> {
    const giveaway = this.requireGiveaway(messageId);
    if (giveaway.ended) {
      throw new GiveawayError("GIVEAWAY_ALREADY_ENDED", `Giveaway ${messageId} already ended.`);
    }

    const winners = await this.drawWinners(giveaway, giveaway.winnerCount);
    giveaway._patch({ ended: true, winners });
    await this.provider.update(messageId, giveaway.toJSON());

    await this.updateMessageEmbed(giveaway, this.embeds.end);
    this.emit("giveawayEnd", giveaway, winners);

    return giveaway;
  }

  public async reroll(messageId: string, options: RerollGiveawayOptions = {}): Promise<Giveaway> {
    const giveaway = this.requireGiveaway(messageId);
    if (!giveaway.ended) {
      throw new GiveawayError(
        "INVALID_OPTIONS",
        "Cannot reroll a giveaway that has not ended yet.",
      );
    }

    const winners = await this.drawWinners(giveaway, options.winnerCount ?? giveaway.winnerCount);
    giveaway._patch({ winners });
    await this.provider.update(messageId, giveaway.toJSON());

    await this.updateMessageEmbed(giveaway, this.embeds.reroll);
    this.emit("giveawayReroll", giveaway, winners);

    return giveaway;
  }

  public async delete(messageId: string): Promise<void> {
    const giveaway = this.requireGiveaway(messageId);
    await this.provider.delete(messageId);
    this.cache.delete(messageId);
    this.emit("giveawayDelete", giveaway);
  }

  private requireGiveaway(messageId: string): Giveaway {
    const giveaway = this.cache.get(messageId);
    if (!giveaway) {
      throw new GiveawayError("GIVEAWAY_NOT_FOUND", `No giveaway found for message ${messageId}.`);
    }
    return giveaway;
  }

  private async checkExpired(): Promise<void> {
    const expired = this.getAll().filter((giveaway) => giveaway.isExpired);
    for (const giveaway of expired) {
      try {
        await this.end(giveaway.messageId);
      } catch {
        // A single failure (e.g. deleted channel) should not stop the loop for the others.
      }
    }
  }

  private async fetchTextChannel(channelId: string): Promise<TextChannel> {
    const channel = await this.client.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new GiveawayError(
        "CHANNEL_NOT_FOUND",
        `Channel ${channelId} is not a valid text channel.`,
      );
    }
    return channel;
  }

  private async drawWinners(giveaway: Giveaway, winnerCount: number): Promise<string[]> {
    const pool = await this.fetchParticipants(giveaway);
    const winners: string[] = [];

    while (winners.length < winnerCount && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      winners.push(...pool.splice(index, 1));
    }

    return winners;
  }

  private async fetchParticipants(giveaway: Giveaway): Promise<string[]> {
    const channel = await this.fetchTextChannel(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!message) {
      throw new GiveawayError(
        "MESSAGE_NOT_FOUND",
        `Message ${giveaway.messageId} could not be fetched.`,
      );
    }

    const reaction = message.reactions.cache.find((r) => r.emoji.name === this.reaction);
    if (!reaction) {
      return [];
    }

    const users = await reaction.users.fetch();
    return users.filter((user) => !user.bot).map((user) => user.id);
  }

  private async updateMessageEmbed(
    giveaway: Giveaway,
    embedFn: GiveawayEmbedFunction,
  ): Promise<void> {
    const channel = await this.fetchTextChannel(giveaway.channelId).catch(() => null);
    const message = await channel?.messages.fetch(giveaway.messageId).catch(() => null);
    await message?.edit({ embeds: [embedFn(giveaway)] });
  }
}
