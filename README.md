# @m-programmation/discord-giveaways

[![npm version](https://img.shields.io/npm/v/@m-programmation/discord-giveaways.svg)](https://www.npmjs.com/package/@m-programmation/discord-giveaways)
[![npm downloads](https://img.shields.io/npm/dm/@m-programmation/discord-giveaways.svg)](https://www.npmjs.com/package/@m-programmation/discord-giveaways)
[![license](https://img.shields.io/npm/l/@m-programmation/discord-giveaways.svg)](LICENSE)

A [discord.js](https://discord.js.org) module for running advanced giveaways: fully customizable embeds, reaction-based entries, automatic ending, and a pluggable storage architecture so you can keep a complete history of every giveaway.

> 🚧 The module is currently at its base version (`0.x`): the core (create/end/reroll a giveaway, customizable embeds, storage providers) is functional, but the API may still evolve before 1.0. Feedback and issues are welcome!

## Features

- ✅ Create, end and reroll giveaways
- ✅ `start` / `end` / `reroll` embeds are **fully customizable**
- ✅ Automatic ending when a giveaway expires
- ✅ Reaction-based entries, configurable emoji
- ✅ 100% TypeScript, typed events
- ✅ Pluggable storage (`GiveawaysProvider`) so you can plug in your own database and keep a complete history
- 🔜 Advanced history/queries, official providers, ready-to-use commands

## Installation

```bash
npm install @m-programmation/discord-giveaways discord.js
```

`discord.js` (`^14.14.0`) is a peer dependency: install it yourself and provide your own `Client`.

## Quick start

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { GiveawaysManager } from "@m-programmation/discord-giveaways";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions],
});

const giveaways = new GiveawaysManager(client);

client.once("ready", async () => {
  // Loads existing giveaways and starts the automatic end-checking loop
  await giveaways.init();
});

// Start a giveaway
await giveaways.start({
  channelId: "123456789012345678",
  prize: "Discord Nitro",
  winnerCount: 1,
  duration: 60 * 60 * 1000, // 1 hour
  hostedBy: "987654321098765432",
});

// Listen to events
giveaways.on("giveawayEnd", (giveaway, winners) => {
  console.log(`Giveaway "${giveaway.prize}" ended, winners:`, winners);
});
```

## API

### `GiveawaysManager`

| Method                        | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `init()`                      | Loads giveaways from the provider, starts the auto-end loop |
| `start(options)`              | Creates and posts a new giveaway                            |
| `end(messageId)`              | Ends a giveaway and draws the winners                       |
| `reroll(messageId, options?)` | Draws one or more new winners                               |
| `delete(messageId)`           | Removes a giveaway from the provider and the cache          |
| `get(messageId)`              | Retrieves a giveaway by its message ID                      |
| `getAll()`                    | All known giveaways (active and ended)                      |
| `stop()`                      | Stops the automatic end-checking loop                       |

### Events

`giveawayStart`, `giveawayEnd`, `giveawayReroll`, `giveawayDelete` — all typed, with the `Giveaway` (and the winners, where relevant) as arguments.

## Customizing embeds

Each embed (`start`, `end`, `reroll`) can be replaced individually:

```ts
import { EmbedBuilder } from "discord.js";
import { GiveawaysManager } from "@m-programmation/discord-giveaways";

const giveaways = new GiveawaysManager(client, {
  embeds: {
    start: (giveaway) => new EmbedBuilder().setTitle(`🎁 ${giveaway.prize}`).setColor("Random"),
  },
});
```

## Persistence & history

By default, `GiveawaysManager` uses a `MemoryProvider` (in-memory, not persistent — handy for testing, but everything is lost on restart). To keep a complete history, implement the `GiveawaysProvider` interface (JSON, SQLite, Postgres, Redis, ...) and pass it to the manager:

```ts
import type { GiveawaysProvider } from "@m-programmation/discord-giveaways";

const provider: GiveawaysProvider = {/* getAll, create, update, delete */};

const giveaways = new GiveawaysManager(client, { provider });
```

`giveaways.getAll()` returns every giveaway known to the manager (active and ended) — the foundation to build a full history view on top of.

## Contributing / reporting a bug

Source code, issues and discussions live on [GitHub](https://github.com/M-PROGRAMMATION/m-discord-giveaways).

## License

[Apache-2.0](LICENSE)
