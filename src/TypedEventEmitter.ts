import { EventEmitter } from "node:events";

/** Thin wrapper giving {@link EventEmitter} type-safe `on`/`once`/`emit` for a fixed event map. */
export class TypedEventEmitter<Events extends Record<string, unknown[]>> extends EventEmitter {
  public override on<K extends keyof Events & string>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  public override once<K extends keyof Events & string>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this {
    return super.once(event, listener as (...args: unknown[]) => void);
  }

  public override emit<K extends keyof Events & string>(event: K, ...args: Events[K]): boolean {
    return super.emit(event, ...args);
  }
}
