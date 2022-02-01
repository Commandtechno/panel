import type { GatewayMessageCreateDispatchData } from "discord-api-types";
import { console, explorer } from "../modules";
import config from "../config.json";

export default function (message: GatewayMessageCreateDispatchData) {
  if (!config.users.includes(message.author.id) || !config.guilds.includes(message.guild_id))
    return;

  switch (message.channel_id) {
    case explorer.config.channel:
      explorer.message(message);
      break;

    case console.config.channel:
      console.message(message);
      break;
  }
}