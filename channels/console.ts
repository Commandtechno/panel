import { Client, RequestTypes } from "detritus-client-rest";

import { GatewayMessageCreateDispatchData } from "discord-api-types";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { resolve } from "path";
import config from "../config.json";

let $: ChildProcessWithoutNullStreams;
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
  if (message.content.toLowerCase().startsWith("cd ")) {
    cwd = resolve(cwd, message.content.slice("cd ".length));
    api.executeWebhook(config.console_webhook.id, config.console_webhook.token, format("✅", cwd));
    return;
  }

  if ($) {
    if (message.content.toLowerCase() === "cancel") $.kill();
    else $.stdin.write(message.content);
  } else {
    const args = message.content.split(/ +/);
    const cmd = args.shift();
    $ = spawn(cmd, args, { cwd });

    $.on("close", code => {
      $ = null;
      if (code !== 0)
        api.executeWebhook(
          config.console_webhook.id,
          config.console_webhook.token,
          format("🛑", "Closed with code: " + code)
        );
    });

    $.on("error", err => {
      $ = null;
      api.executeWebhook(
        config.console_webhook.id,
        config.console_webhook.token,
        format("❌", err.message)
      );
    });

    $.stdout.on("data", data => {
      data = data.toString().trim();
      if (data)
        api.executeWebhook(
          config.console_webhook.id,
          config.console_webhook.token,
          format("✅", data)
        );
    });

    $.stderr.on("data", data => {
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