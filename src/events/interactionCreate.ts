import {
  GatewayInteractionCreateDispatchData,
  InteractionResponseType,
  MessageFlags
} from "discord-api-types";
import { InteractionType } from "discord-api-types";
import { RequestTypes } from "detritus-client-rest";

import { buttons, commands, explorer } from "../modules";
import { Context } from "../types";
import { api } from "../client";

export default async function (interaction: GatewayInteractionCreateDispatchData) {
  function ack() {
    api.createInteractionResponse(
      interaction.id,
      interaction.token,
      InteractionResponseType.DeferredMessageUpdate
    );
  }

  function edit(data: string | RequestTypes.CreateInteractionResponseInnerPayload) {
    api.createInteractionResponse(
      interaction.id,
      interaction.token,
      InteractionResponseType.UpdateMessage,
      data
    );
  }

  function reply(data: string | RequestTypes.CreateInteractionResponseInnerPayload = {}) {
    api.createInteractionResponse(
      interaction.id,
      interaction.token,
      InteractionResponseType.ChannelMessageWithSource,
      data
    );
  }

  function epheremal(data: string | RequestTypes.CreateInteractionResponseInnerPayload) {
    api.createInteractionResponse(
      interaction.id,
      interaction.token,
      InteractionResponseType.ChannelMessageWithSource,
      typeof data === "string" ? { content: data } : { flags: MessageFlags.Ephemeral, ...data }
    );
  }

  const ctx: Context = {
    ack,
    edit,
    reply,
    epheremal
  };

  switch (interaction.type) {
    case InteractionType.ApplicationCommand:
      let command = commands[interaction.data.name];
      command(interaction, ctx);
      break;

    case InteractionType.MessageComponent:
      const button = buttons[interaction.data.custom_id];
      if (button) button(interaction, ctx);
      else {
        switch (interaction.channel_id) {
          case explorer.config.channel:
            explorer.button(interaction, ctx);
        }
      }
      break;
  }
}