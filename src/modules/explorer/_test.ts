import {
  InteractionResponseType,
  InteractionType,
  ComponentType,
  MessageFlags
} from "discord-api-types";

import type { GatewayInteractionCreateDispatchData } from "discord-api-types";
import type { Context } from "./types";
import { api } from "../../client";

import { download, left, right, trash, up } from "./buttons";
import { config } from "./config";
import { parse } from "./engine";

export default function (interaction: GatewayInteractionCreateDispatchData) {
  if (
    interaction.type !== InteractionType.MessageComponent ||
    interaction.data.component_type !== ComponentType.Button
  )
    return;

  function ack() {
    api.createInteractionResponse(
      interaction.id,
      interaction.token,
      InteractionResponseType.DeferredMessageUpdate
    );
  }

  function reply(content: string) {
    api.createInteractionResponse(
      interaction.id,
      interaction.token,
      InteractionResponseType.ChannelMessageWithSource,
      content
    );
  }

  function epheremal(content: string) {
    api.createInteractionResponse(
      interaction.id,
      interaction.token,
      InteractionResponseType.ChannelMessageWithSource,
      { content, flags: MessageFlags.Ephemeral }
    );
  }

  const ctx: Context = {
    ack,
    reply,
    epheremal,

    config,
    ...parse(interaction.message.content)
  };

  switch (interaction.data.custom_id) {
    case "trash":
      trash(ctx);
      break;

    case "download":
      download(ctx);
      break;

    case "up":
      up(ctx);
      break;

    case "left":
      left(ctx);
      break;

    case "right":
      right(ctx);
      break;
  }
}