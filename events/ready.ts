import type { GatewayReadyDispatchData } from "discord-api-types";

export default async function (ready: GatewayReadyDispatchData) {
  console.log("Ready!");
}