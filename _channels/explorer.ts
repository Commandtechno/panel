import { Client } from "detritus-client-rest";
import { APIMessage, GatewayMessageCreateDispatchData } from "discord-api-types";
import { createWriteStream, mkdirSync, writeFileSync } from "fs";
import { get } from "https";
import render from "../util/files";

export default async function (message: GatewayMessageCreateDispatchData, api: Client) {
  const [{ id, content }]: APIMessage[] = await api.fetchMessages(message.channel_id, {
    before: message.id,
    limit: 1
  });

  let [path, _page] = content.split("\n");
  let page = +_page || 0;
  path = path.replace(/^`\d+` /, "");

  const [attachment] = message.attachments;
  if (attachment)
    await new Promise(resolve => {
      get(attachment.url, res => {
        res.pipe(createWriteStream(path + "/" + attachment.filename));
        res.on("end", resolve);
      });
    });
  else if (message.content) {
    const lines = message.content
      .replace(/^```\w*/, "")
      .replace(/```$/, "")
      .trim()
      .split("\n");

    const name = lines.shift();
    if (name.includes(".")) {
      const content = lines.join("\n").trim();
      writeFileSync(path + "/" + name, content);
    } else mkdirSync(path + "/" + name);
  }

  api.deleteMessage(message.channel_id, message.id);
  api.editMessage(message.channel_id, id, render(path, page));
}