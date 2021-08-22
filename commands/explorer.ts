import { APIMessage, GatewayMessageCreateDispatchData } from "discord-api-types";

import { Client } from "detritus-client-rest";
import config from "../config.json";
import { execSync } from "child_process";
import render from "../files";
import { writeFileSync } from "fs";

export default async function (message: GatewayMessageCreateDispatchData, api: Client) {
  config.explorer = message.channel_id;

  await api.createMessage(
    message.channel_id,
    `Set <#${message.channel_id}> (\`${message.channel_id}\`) as the explorer channel`
  );

  await sleep(5000);
  update();

  const messages: APIMessage[] = await api.fetchMessages(message.channel_id, { limit: 100 });
  await api.bulkDeleteMessages(
    message.channel_id,
    messages.map((m) => m.id)
  );

  let drives = [""];

  try {
    drives = execSync("wmic logicaldisk get name")
      .toString()
      .trim()
      .split("\n")
      .slice(1)
      .map((d) => d.trim());
  } catch {}

  for await (const drive of drives) api.createMessage(message.channel_id, render(drive + "/", 0));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function update() {
  writeFileSync("config.json", JSON.stringify(config, null, 2));
  try {
    writeFileSync("../config.json", JSON.stringify(config, null, 2));
  } catch {}
}