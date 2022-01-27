import { GatewayDispatchEvents } from "discord-api-types";
import { ws } from "./client";

import ready from "./events/ready";
import messageCreate from "./events/messageCreate";
import interactionCreate from "./events/interactionCreate";

ws.on("packet", ({ t, d }) => {
  switch (t) {
    case GatewayDispatchEvents.Ready:
      ready(d);
      break;

    case GatewayDispatchEvents.MessageCreate:
      messageCreate(d);
      break;

    case GatewayDispatchEvents.InteractionCreate:
      interactionCreate(d);
      break;
  }
});

ws.connect("wss://gateway.discord.gg");