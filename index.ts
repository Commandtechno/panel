import { api, ws } from "./client";

import events from "./util/events";
import "./util/pm2";

ws.on("packet", ({ t, d }) => events[t] && events[t](d, api, ws.userId));
ws.connect("wss://gateway.discord.gg");