import type {
  APIChatInputApplicationCommandInteraction,
  GatewayInteractionCreateDispatchData
} from "discord-api-types";
import { InteractionType, ApplicationCommandOptionType } from "discord-api-types";
import { buttons, commands } from "../modules";

export default async function (interaction: GatewayInteractionCreateDispatchData) {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand:
      let command = commands[interaction.data.name];
      for (const option of (interaction as APIChatInputApplicationCommandInteraction).data
        .options) {
        if (option.type === ApplicationCommandOptionType.Subcommand) command = command[option.name];
      }

      command(interaction);
      break;

    case InteractionType.MessageComponent:
      const button = buttons[interaction.data.custom_id];
      button(interaction);
      break;
  }
}