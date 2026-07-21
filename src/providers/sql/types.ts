export type SqlDialect = "sqlite" | "mysql" | "mariadb" | "postgres";

interface BaseSqlProviderOptions {
  /** Table used to store giveaways. Defaults to "giveaways". */
  table?: string;
}

export interface SqliteProviderOptions extends BaseSqlProviderOptions {
  dialect: "sqlite";
  /** Path to the database file, e.g. "./data/giveaways.sqlite". Use ":memory:" for an ephemeral database. */
  filename: string;
}

export interface MysqlProviderOptions extends BaseSqlProviderOptions {
  /** MariaDB is wire-compatible with MySQL and uses the same driver (mysql2). */
  dialect: "mysql" | "mariadb";
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
}

export interface PostgresProviderOptions extends BaseSqlProviderOptions {
  dialect: "postgres";
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export type SqlProviderOptions =
  SqliteProviderOptions | MysqlProviderOptions | PostgresProviderOptions;
