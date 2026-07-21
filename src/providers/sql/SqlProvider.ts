import type { Knex } from "knex";
import { GiveawayError } from "../../errors/index.js";
import type { GiveawayData } from "../../giveaway/index.js";
import type { GiveawaysProvider } from "../Provider.js";
import type { SqlProviderOptions } from "./types.js";

const DEFAULT_TABLE = "giveaways";

interface GiveawayRow {
  messageId: string;
  channelId: string;
  guildId: string;
  prize: string;
  winnerCount: number;
  hostedBy: string | null;
  startAt: number | string;
  endAt: number | string;
  ended: boolean | number;
  participants: string;
  winners: string;
  extra: string;
}

/**
 * SQL-backed provider (SQLite, MySQL, MariaDB, Postgres) built on Knex.
 *
 * `init()` connects, runs a clean connection check, creates the table if it
 * doesn't exist yet, and warms up an in-memory cache. Every write goes to the
 * database first and then updates the cache, so reads (`getAll`, and the
 * manager's own cache) never have to hit the database again.
 *
 * Requires the matching driver as a peer dependency: `better-sqlite3` for
 * `sqlite`, `mysql2` for `mysql`/`mariadb`, `pg` for `postgres`.
 */
export class SqlProvider implements GiveawaysProvider {
  private readonly table: string;
  private readonly cache = new Map<string, GiveawayData>();
  private knex: Knex | null = null;

  public constructor(private readonly options: SqlProviderOptions) {
    this.table = options.table ?? DEFAULT_TABLE;
  }

  public async init(): Promise<void> {
    const { default: createKnex } = await import("knex");
    this.knex = createKnex(this.buildConfig());

    await this.testConnection();
    await this.ensureSchema();
    await this.warmCache();
  }

  public async dispose(): Promise<void> {
    await this.knex?.destroy();
    this.knex = null;
    this.cache.clear();
  }

  public getAll(): GiveawayData[] {
    return Array.from(this.cache.values());
  }

  public async create(giveaway: GiveawayData): Promise<void> {
    await this.connection()(this.table).insert(this.serialize(giveaway));
    this.cache.set(giveaway.messageId, giveaway);
  }

  public async update(messageId: string, data: GiveawayData): Promise<void> {
    await this.connection()(this.table).where({ messageId }).update(this.serialize(data));
    this.cache.set(messageId, data);
  }

  public async delete(messageId: string): Promise<void> {
    await this.connection()(this.table).where({ messageId }).delete();
    this.cache.delete(messageId);
  }

  private connection(): Knex {
    if (!this.knex) {
      throw new GiveawayError(
        "DATABASE_NOT_READY",
        "SqlProvider.init() must complete successfully before the provider can be used.",
      );
    }
    return this.knex;
  }

  private async testConnection(): Promise<void> {
    try {
      await this.connection().raw("select 1");
    } catch (error) {
      throw new GiveawayError(
        "DATABASE_CONNECTION_FAILED",
        `Could not connect to the ${this.options.dialect} database: ${(error as Error).message}`,
      );
    }
  }

  private async ensureSchema(): Promise<void> {
    const knex = this.connection();

    try {
      const exists = await knex.schema.hasTable(this.table);
      if (exists) {
        return;
      }

      await knex.schema.createTable(this.table, (t) => {
        t.string("messageId").primary();
        t.string("channelId").notNullable();
        t.string("guildId").notNullable();
        t.string("prize").notNullable();
        t.integer("winnerCount").notNullable();
        t.string("hostedBy").nullable();
        t.bigInteger("startAt").notNullable();
        t.bigInteger("endAt").notNullable();
        t.boolean("ended").notNullable().defaultTo(false);
        t.text("participants").notNullable();
        t.text("winners").notNullable();
        t.text("extra").notNullable();
      });
    } catch (error) {
      throw new GiveawayError(
        "DATABASE_SETUP_FAILED",
        `Could not create the "${this.table}" table: ${(error as Error).message}`,
      );
    }
  }

  private async warmCache(): Promise<void> {
    const rows = await this.connection()<GiveawayRow>(this.table).select("*");
    this.cache.clear();
    for (const row of rows) {
      const data = this.deserialize(row);
      this.cache.set(data.messageId, data);
    }
  }

  private buildConfig(): Knex.Config {
    switch (this.options.dialect) {
      case "sqlite":
        return {
          client: "better-sqlite3",
          connection: { filename: this.options.filename },
          useNullAsDefault: true,
        };
      case "mysql":
      case "mariadb":
        return {
          client: "mysql2",
          connection: {
            host: this.options.host,
            port: this.options.port ?? 3306,
            user: this.options.user,
            password: this.options.password,
            database: this.options.database,
          },
        };
      case "postgres":
        return {
          client: "pg",
          connection: {
            host: this.options.host,
            port: this.options.port ?? 5432,
            user: this.options.user,
            password: this.options.password,
            database: this.options.database,
            ssl: this.options.ssl,
          },
        };
    }
  }

  private serialize(data: GiveawayData): Omit<GiveawayRow, "startAt" | "endAt"> & {
    startAt: number;
    endAt: number;
  } {
    return {
      messageId: data.messageId,
      channelId: data.channelId,
      guildId: data.guildId,
      prize: data.prize,
      winnerCount: data.winnerCount,
      hostedBy: data.hostedBy,
      startAt: data.startAt,
      endAt: data.endAt,
      ended: data.ended,
      participants: JSON.stringify(data.participants),
      winners: JSON.stringify(data.winners),
      extra: JSON.stringify(data.extra),
    };
  }

  private deserialize(row: GiveawayRow): GiveawayData {
    return {
      messageId: row.messageId,
      channelId: row.channelId,
      guildId: row.guildId,
      prize: row.prize,
      winnerCount: Number(row.winnerCount),
      hostedBy: row.hostedBy,
      startAt: Number(row.startAt),
      endAt: Number(row.endAt),
      ended: Boolean(row.ended),
      participants: JSON.parse(row.participants) as string[],
      winners: JSON.parse(row.winners) as string[],
      extra: JSON.parse(row.extra) as Record<string, unknown>,
    };
  }
}
