import type { GatewayMessageCreateDispatchData } from "discord-api-types";

export function message(message: GatewayMessageCreateDispatchData) {
  console.log(message.content);
}