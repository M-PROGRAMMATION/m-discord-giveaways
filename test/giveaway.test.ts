import type { Client } from "discord.js";
import { describe, expect, it } from "vitest";
import { Giveaway, GiveawayError, GiveawaysManager, MemoryProvider } from "../src/index.js";
import type { GiveawayData } from "../src/types.js";

const baseData: GiveawayData = {
  messageId: "1",
  channelId: "channel-1",
  guildId: "guild-1",
  prize: "Discord Nitro",
  winnerCount: 1,
  hostedBy: "host-1",
  startAt: Date.now(),
  endAt: Date.now() + 60_000,
  ended: false,
  participants: [],
  winners: [],
  extra: {},
};

const fakeClient = { channels: { fetch: async () => null } } as unknown as Client;

describe("MemoryProvider", () => {
  it("stores, updates and deletes giveaways", async () => {
    const provider = new MemoryProvider();

    provider.create(baseData);
    expect(await provider.getAll()).toEqual([baseData]);

    const updated = { ...baseData, ended: true };
    provider.update(baseData.messageId, updated);
    expect(await provider.getAll()).toEqual([updated]);

    provider.delete(baseData.messageId);
    expect(await provider.getAll()).toEqual([]);
  });
});

describe("Giveaway", () => {
  it("reports isExpired based on endAt", () => {
    const active = new Giveaway({ ...baseData, endAt: Date.now() + 60_000 });
    const expired = new Giveaway({ ...baseData, endAt: Date.now() - 1 });

    expect(active.isExpired).toBe(false);
    expect(expired.isExpired).toBe(true);
  });
});

describe("GiveawaysManager", () => {
  it("rejects a winnerCount below 1", async () => {
    const manager = new GiveawaysManager(fakeClient);

    await expect(
      manager.start({ channelId: "channel-1", prize: "Nitro", winnerCount: 0, duration: 60_000 }),
    ).rejects.toBeInstanceOf(GiveawayError);
  });

  it("rejects an end date in the past", async () => {
    const manager = new GiveawaysManager(fakeClient);

    await expect(
      manager.start({
        channelId: "channel-1",
        prize: "Nitro",
        winnerCount: 1,
        endAt: Date.now() - 1,
      }),
    ).rejects.toBeInstanceOf(GiveawayError);
  });

  it("starts empty and exposes a full history via getAll()", () => {
    const manager = new GiveawaysManager(fakeClient);
    expect(manager.getAll()).toEqual([]);
  });
});
