import { Client, RequestTypes } from "detritus-client-rest";

import { GatewayMessageCreateDispatchData } from "discord-api-types";
import config from "./config.json";
import { resolve } from "path";
import spawn from "cross-spawn";

let $;
let cwd = process.cwd();

function code(str: string, lang: string) {
  return "```" + lang + "\n" + str.replace(/```/g, "`\u200b``") + "```";
}

function format(emoji: string, data: string): RequestTypes.ExecuteWebhook {
  return {
    avatarUrl: config.console_webhook.avatar,
    username: cwd,
    content: emoji + "\n" + code(data, "c")
  };
}

export default function (message: GatewayMessageCreateDispatchData, api: Client) {
  if (message.content.toLocaleLowerCase().startsWith("cd ")) {
    cwd = resolve(cwd, message.content.slice("cd ".length));
    api.executeWebhook(config.console_webhook.id, config.console_webhook.token, format("✅", cwd));
    return;
  }

  if (!$) {
    $ = spawn(message.content, { cwd });
    $.on("close", () => ($ = null));
    $.on("error", () => ($ = null));

    $.stdout.on("data", (data) => {
      data = data.toString().trim();
      if (data)
        api.executeWebhook(
          config.console_webhook.id,
          config.console_webhook.token,
          format("✅", data)
        );
    });

    $.stderr.on("data", (data) => {
      data = data.toString().trim();
      if (data)
        api.executeWebhook(
          config.console_webhook.id,
          config.console_webhook.token,
          format("⛔", data)
        );
    });
  }
}