import { Client } from "detritus-client-rest";
import { APIMessage, GatewayMessageCreateDispatchData } from "discord-api-types";
import { renameSync } from "fs";
import { dirname } from "path";
import config from "../config.json";
import render from "../util/files";

export default async function (message: GatewayMessageCreateDispatchData, api: Client) {
  const [{ id, content }]: APIMessage[] = await api.fetchMessages(message.channel_id, {
    before: message.id,
    limit: 1
  });

  let [path, _page] = content.split("\n");
  let page = +_page || 0;
  path = path.replace(/^`\d+` /, "");

  const newPath = dirname(path) + "/" + message.content;

  renameSync(content, newPath);
  const [{ id: explorerId }] = await api.fetchMessages(config.explorer);

  api.editMessage(message.channel_id, id, newPath);
  api.editMessage(config.explorer, explorerId, render(path, page));
}