import {
  APIMessage,
  ButtonStyle,
  ComponentType,
  GatewayMessageCreateDispatchData
} from "discord-api-types";
import type { ChildProcessWithoutNullStreams } from "child_process";
import type { RequestTypes } from "detritus-client-rest";
import { AsyncQueue } from "@sapphire/async-queue";
import { resolve } from "path";
import { spawn } from "child_process";
import { api } from "../../client";
import { config } from ".";

let cwd = process.cwd();
let cmd: ChildProcessWithoutNullStreams;
let out: string;
let err: string;
let outMsg: APIMessage;
let errMsg: APIMessage;
const outQueue = new AsyncQueue();
const errQueue = new AsyncQueue();

const cancelComponents: RequestTypes.CreateMessage["components"] = [
  {
    type: ComponentType.ActionRow,
    components: [
      {
        customId: "___console_cancel",
        type: ComponentType.Button,
        style: ButtonStyle.Danger,
        label: "Cancel"
      }
    ]
  }
];

function format(emoji: string, data: string) {
  if (data.length > 1960) data = data.slice(0, 1960) + "...";
  return `${emoji} \`${cwd}\`\n\`\`\`ansi\n${data.replaceAll("```", "`\u200b``")}\n\`\`\``;
}

async function updateOut(finished = false) {
  await outQueue.wait();

  const content = format(finished ? "✅" : "📥", out);
  const components = finished ? [] : cancelComponents;

  if (outMsg) outMsg = await api.editMessage(outMsg.channel_id, outMsg.id, { content, components });
  else if (!finished) outMsg = await api.createMessage(config.channel, { content, components });

  outQueue.shift();
}

async function updateErr(finished = false) {
  await errQueue.wait();

  const content = format(finished ? "⛔" : "📤", err);
  const components = finished ? [] : cancelComponents;

  if (errMsg) errMsg = await api.editMessage(errMsg.channel_id, errMsg.id, { content, components });
  else if (!finished) errMsg = await api.createMessage(config.channel, { content, components });

  errQueue.shift();
}

export function message(message: GatewayMessageCreateDispatchData) {
  if (cmd) {
    cmd.stdin.write(message.content);
    cmd.stdin.write("\n");
    return;
  }

  const args = message.content.split(/ +/);
  const command = args.shift();

  if (command.toLowerCase() === "cd") {
    cwd = resolve(cwd, ...args);
    api.createMessage(message.channel_id, format("📂", `Switched directory to ${cwd}`));
    return;
  }

  cmd = spawn(command, args, { cwd, shell: true });
  out = "";
  err = "";

  cmd.stdout.on("data", async data => {
    out += data.toString();
    updateOut();
  });

  cmd.stderr.on("data", async data => {
    err += data.toString();
    updateErr();
  });

  cmd.on("error", async error => {
    err += error.message;
    updateErr();
  });

  cmd.on("close", async () => {
    await updateOut(true);
    await updateErr(true);

    if (!outMsg && !errMsg) await api.createReaction(message.channel_id, message.id, "✅");

    cmd = null;
    out = null;
    err = null;
    outMsg = null;
    errMsg = null;
  });

  cmd.on("message", console.log);
}

export function ___cancel() {
  if (cmd) {
    cmd.kill();
    cmd.stdin.destroy();
    cmd.stdout.destroy();
    cmd.stderr.destroy();
  }
}