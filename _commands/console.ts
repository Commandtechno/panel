import {
  APIMessage,
  APIWebhook,
  GatewayMessageCreateDispatchData,
  RESTGetAPIChannelWebhooksResult,
  RESTPostAPIChannelWebhookResult
} from "discord-api-types";

import { Client } from "detritus-client-rest";
import config from "../config.json";
import { writeFileSync } from "fs";

export default async function (message: GatewayMessageCreateDispatchData, api: Client) {
  config.console = message.channel_id;

  let webhook: RESTPostAPIChannelWebhookResult | APIWebhook;
  const current: RESTGetAPIChannelWebhooksResult = await api.fetchChannelWebhooks(
    message.channel_id
  );

  if (current.length) webhook = current[0];
  else
    webhook = await api.createWebhook(config.console, {
      name: "Console",
      avatar: config.console_webhook.avatar
    });

  config.console_webhook.id = webhook.id;
  config.console_webhook.token = webhook.token;

  await api.createMessage(
    message.channel_id,
    `Set <#${message.channel_id}> (\`${message.channel_id}\`) as the console channel`
  );

  await sleep(5000);
  update();

  const messages: APIMessage[] = await api.fetchMessages(message.channel_id, { limit: 100 });
  api.bulkDeleteMessages(
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