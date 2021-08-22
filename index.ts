import { api, ws } from "./client";

import events from "./events";
import {} from "./pm2";

ws.on("packet", ({ t, d }) => events[t] && events[t](d, api, ws.userId));
ws.connect("wss://gateway.discord.gg");