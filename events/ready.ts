import { GatewayReadyDispatchData } from "discord-api-types";

export default function (ready: GatewayReadyDispatchData) {
  console.log("Ready!");
}