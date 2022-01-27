import type { APIChatInputApplicationCommandInteraction } from "discord-api-types";
import type { Context } from "../../../types";
import * as subcommands from "./subcommands";

export function explore(interaction: APIChatInputApplicationCommandInteraction, ctx: Context) {
  // @ts-ignorei want ot sleep
  const subcommandName = interaction.data.options[0].name;
  const subcommand = subcommands[subcommandName];
  subcommand.run(interaction, ctx);
}