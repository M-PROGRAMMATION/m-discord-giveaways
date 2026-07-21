# @m-programmation/discord-giveaways

[![npm version](https://img.shields.io/npm/v/@m-programmation/discord-giveaways.svg)](https://www.npmjs.com/package/@m-programmation/discord-giveaways)
[![npm downloads](https://img.shields.io/npm/dm/@m-programmation/discord-giveaways.svg)](https://www.npmjs.com/package/@m-programmation/discord-giveaways)
[![license](https://img.shields.io/npm/l/@m-programmation/discord-giveaways.svg)](LICENSE)

<p align="center">
  <img src="/assets/banner.png" width="600" alt="MARK — Développe tes idées !" />
</p>


A [discord.js](https://discord.js.org) module for running advanced giveaways: fully customizable embeds, reaction-based entries, automatic ending, and a pluggable storage architecture so you can keep a complete history of every giveaway.

> 🚧 The module is currently at its base version (`0.x`): the core (create/end/reroll a giveaway, customizable embeds, storage providers) is functional, but the API may still evolve before 1.0. Feedback and issues are welcome!

## Features

- ✅ Create, end and reroll giveaways
- ✅ `start` / `end` / `reroll` embeds are **fully customizable**
- ✅ Automatic ending when a giveaway expires
- ✅ Reaction-based entries, configurable emoji
- ✅ 100% TypeScript, typed events
- ✅ Built-in SQL storage (`SqlProvider`): SQLite, MySQL, MariaDB, Postgres — connected, verified and cached automatically on startup
- ✅ Pluggable storage (`GiveawaysProvider`) so you can plug in any other database and keep a complete history
- 🔜 Advanced history/queries, ready-to-use commands

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

| Method                        | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `init()`                      | Loads giveaways from the provider, starts the auto-end loop   |
| `start(options)`              | Creates and posts a new giveaway                              |
| `end(messageId)`              | Ends a giveaway and draws the winners                         |
| `reroll(messageId, options?)` | Draws one or more new winners                                 |
| `delete(messageId)`           | Removes a giveaway from the provider and the cache            |
| `get(messageId)`              | Retrieves a giveaway by its message ID                        |
| `getAll()`                    | All known giveaways (active and ended)                        |
| `stop()`                      | Stops the auto-end loop and releases the provider's resources |

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

By default, `GiveawaysManager` uses a `MemoryProvider` (in-memory, not persistent — handy for testing, but everything is lost on restart).

### Built-in SQL provider (SQLite, MySQL, MariaDB, Postgres)

`SqlProvider` covers all four out of the box. Pick a dialect and pass it to the manager — on `giveaways.init()` it opens the connection, runs a clean connectivity check (a `SELECT 1`, wrapped in a clear `GiveawayError` if it fails), creates the `giveaways` table if it doesn't exist yet, and warms up an in-memory cache so reads never hit the database again:

```ts
import { GiveawaysManager, SqlProvider } from "@m-programmation/discord-giveaways";

// SQLite (local file)
const provider = new SqlProvider({ dialect: "sqlite", filename: "./data/giveaways.sqlite" });

// MySQL / MariaDB
// const provider = new SqlProvider({
//   dialect: "mysql", // or "mariadb"
//   host: "localhost",
//   port: 3306,
//   user: "bot",
//   password: "secret",
//   database: "giveaways",
// });

// Postgres
// const provider = new SqlProvider({
//   dialect: "postgres",
//   host: "localhost",
//   port: 5432,
//   user: "bot",
//   password: "secret",
//   database: "giveaways",
// });

const giveaways = new GiveawaysManager(client, { provider });

client.once("ready", async () => {
  await giveaways.init(); // connects, checks the connection, migrates, warms the cache
});
```

`SqlProvider` is built on [Knex](https://knexjs.org) and only requires the driver matching your dialect as a peer dependency: `better-sqlite3` for SQLite, `mysql2` for MySQL/MariaDB, `pg` for Postgres.

```bash
npm install better-sqlite3   # sqlite
npm install mysql2           # mysql / mariadb
npm install pg               # postgres
```

Call `await giveaways.stop()` on shutdown to close the underlying connection cleanly.

### Custom providers

To plug in anything else (a different ORM, Redis, a REST backend, ...), implement the `GiveawaysProvider` interface and pass it to the manager:

```ts
import type { GiveawaysProvider } from "@m-programmation/discord-giveaways";

const provider: GiveawaysProvider = {/* init?, getAll, create, update, delete, dispose? */};

const giveaways = new GiveawaysManager(client, { provider });
```

`giveaways.getAll()` returns every giveaway known to the manager (active and ended) — the foundation to build a full history view on top of.

## Contributing / reporting a bug

Source code, issues and discussions live on [GitHub](https://github.com/M-PROGRAMMATION/m-discord-giveaways).

## License

[Apache-2.0](LICENSE)
