import { APIMessage, GatewayMessageCreateDispatchData } from "discord-api-types";

import { Client } from "detritus-client-rest";
import config from "../config.json";
import { writeFileSync } from "fs";

export default async function (message: GatewayMessageCreateDispatchData, api: Client) {
  config.files = message.channel_id;

  await api.createMessage(
    message.channel_id,
    `Set <#${message.channel_id}> (\`${message.channel_id}\`) as the files channel`
  );

  await sleep(5000);
  update();

  const messages: APIMessage[] = await api.fetchMessages(message.channel_id, { limit: 100 });
  await api.bulkDeleteMessages(
    message.channel_id,
    messages.map((m) => m.id)
  );
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