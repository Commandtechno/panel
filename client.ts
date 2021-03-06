import { Client } from "detritus-client-rest";
import { Gateway } from "detritus-client-socket";
import config from "./config.json";

const api = new Client(config.token);
const ws = new Gateway.Socket(config.token, { intents: 512 });

export { ws, api };