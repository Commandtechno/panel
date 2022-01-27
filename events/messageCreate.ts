import type { GatewayMessageCreateDispatchData } from "discord-api-types";
import { explorer } from "../modules";

export default function (message: GatewayMessageCreateDispatchData) {
  switch (message.channel_id) {
    case explorer.config.channel:
      explorer.message(message);
      break;
  }
}