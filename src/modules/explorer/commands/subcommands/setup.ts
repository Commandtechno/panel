import type { APIChatInputApplicationCommandInteraction } from "discord-api-types";
import type { Context } from "../../../../types";
import { config } from "../../config";

export function setup(interaction: APIChatInputApplicationCommandInteraction, {}: Context) {
  console.log(config.channel);
}