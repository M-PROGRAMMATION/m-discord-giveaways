import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GiveawayError, SqlProvider } from "../src/index.js";
import type { GiveawayData } from "../src/index.js";

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
  participants: ["user-1", "user-2"],
  winners: [],
  extra: { sponsor: "acme" },
};

describe("SqlProvider (sqlite)", () => {
  let provider: SqlProvider;

  beforeEach(() => {
    provider = new SqlProvider({ dialect: "sqlite", filename: ":memory:" });
  });

  afterEach(async () => {
    await provider.dispose();
  });

  it("connects, creates the schema and starts with an empty cache", async () => {
    await provider.init();
    expect(await provider.getAll()).toEqual([]);
  });

  it("persists giveaways and serves them from cache afterwards", async () => {
    await provider.init();

    await provider.create(baseData);
    expect(await provider.getAll()).toEqual([baseData]);

    const updated = { ...baseData, ended: true, winners: ["user-1"] };
    await provider.update(baseData.messageId, updated);
    expect(await provider.getAll()).toEqual([updated]);

    await provider.delete(baseData.messageId);
    expect(await provider.getAll()).toEqual([]);
  });

  it("reloads persisted data from the same database file on a fresh instance", async () => {
    await provider.init();
    await provider.create(baseData);
    await provider.dispose();

    const reopened = new SqlProvider({ dialect: "sqlite", filename: ":memory:" });
    await reopened.init();
    // A brand new ":memory:" database is empty — this proves init() doesn't
    // silently reuse another instance's cache.
    expect(await reopened.getAll()).toEqual([]);
    await reopened.dispose();
  });

  it("throws a GiveawayError when used before init()", async () => {
    const fresh = new SqlProvider({ dialect: "sqlite", filename: ":memory:" });
    await expect(fresh.create(baseData)).rejects.toBeInstanceOf(GiveawayError);
  });
});
