import { EmbedBuilder } from "discord.js";
import type { Giveaway } from "../giveaway/index.js";
import type { GiveawayEmbeds } from "./types.js";

const startEmbed: GiveawayEmbeds["start"] = (giveaway: Giveaway) =>
  new EmbedBuilder()
    .setTitle(`🎉 ${giveaway.prize}`)
    .setDescription(
      [
        `Réagissez avec 🎉 pour participer !`,
        `Se termine <t:${Math.floor(giveaway.endAt / 1000)}:R>`,
        `Gagnant(s) : **${giveaway.winnerCount}**`,
        giveaway.hostedBy ? `Organisé par <@${giveaway.hostedBy}>` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .setColor(0x5865f2)
    .setTimestamp(giveaway.endAt);

const endEmbed: GiveawayEmbeds["end"] = (giveaway: Giveaway) =>
  new EmbedBuilder()
    .setTitle(`🎉 ${giveaway.prize}`)
    .setDescription(
      giveaway.winners.length > 0
        ? `Félicitations ${giveaway.winners.map((id) => `<@${id}>`).join(", ")} !`
        : "Personne n'a participé, aucun gagnant n'a été désigné.",
    )
    .setColor(0x2b2d31)
    .setTimestamp();

const rerollEmbed: GiveawayEmbeds["reroll"] = (giveaway: Giveaway) =>
  new EmbedBuilder()
    .setTitle(`🎉 ${giveaway.prize}`)
    .setDescription(
      giveaway.winners.length > 0
        ? `Nouveau(x) gagnant(s) : ${giveaway.winners.map((id) => `<@${id}>`).join(", ")} !`
        : "Personne n'a participé, aucun gagnant n'a pu être tiré au sort.",
    )
    .setColor(0x2b2d31)
    .setTimestamp();

export const defaultEmbeds: Required<GiveawayEmbeds> = {
  start: startEmbed,
  end: endEmbed,
  reroll: rerollEmbed,
};
