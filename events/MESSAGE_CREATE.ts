import { Client } from "detritus-client-rest";
import { GatewayMessageCreateDispatchData } from "discord-api-types";
import commands from "../util/commands";
import explorer from "../channels/explorer";
import console from "../channels/console";
import files from "../channels/files";
import config from "../config.json";

export default function (message: GatewayMessageCreateDispatchData, api: Client) {
  if (message.author.bot) return;
  if (message.content.startsWith(config.prefix)) {
    const args = message.content.slice(config.prefix.length).split(/\s/);
    const command = args.shift();
    const $ = commands[command];
    if ($) return $(message, api, args);
  }

  if (message.channel_id === config.explorer) explorer(message, api);
  if (message.channel_id === config.console) console(message, api);
  if (message.channel_id === config.files) files(message, api);
}