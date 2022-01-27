import type { GatewayInteractionCreateDispatchData } from "discord-api-types";
import * as subcommands from "./subcommands";

export const description = "Explorer module commands";
export function run(interaction: GatewayInteractionCreateDispatchData) {
  // @ts-ignorei want ot sleep
  const subcommandName = interaction.data.options[0].name;
  const subcommand = subcommands[subcommandName];
  subcommand.run(interaction);
}