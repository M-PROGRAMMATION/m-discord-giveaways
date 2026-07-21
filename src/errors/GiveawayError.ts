export type GiveawayErrorCode =
  | "GIVEAWAY_NOT_FOUND"
  | "GIVEAWAY_ALREADY_ENDED"
  | "CHANNEL_NOT_FOUND"
  | "MESSAGE_NOT_FOUND"
  | "INVALID_OPTIONS";

export class GiveawayError extends Error {
  public readonly code: GiveawayErrorCode;

  public constructor(code: GiveawayErrorCode, message: string) {
    super(message);
    this.name = "GiveawayError";
    this.code = code;
  }
}
