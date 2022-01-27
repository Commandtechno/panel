import { token } from "./config.json";

import { Client } from "detritus-client-rest";
import { Gateway } from "detritus-client-socket";

const api = new Client(token);
const ws = new Gateway.Socket(token, { intents: 0 });

export { ws, api };