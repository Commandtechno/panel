import {
  APIMessage,
  ButtonStyle,
  ComponentType,
  GatewayMessageCreateDispatchData
} from "discord-api-types";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { RequestTypes } from "detritus-client-rest";
import { AsyncQueue } from "@sapphire/async-queue";
import { resolve } from "path";
import { spawn } from "child_process";
import { api } from "../../client";

let cwd = process.cwd();
let cmd: ChildProcessWithoutNullStreams;
let out: string;
let err: string;
let outMsg: APIMessage;
let errMsg: APIMessage;
const outQueue = new AsyncQueue();
const errQueue = new AsyncQueue();

const components: RequestTypes.CreateMessage["components"] = [
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

export function format(emoji: string, data: string) {
  return `${emoji} \`${cwd}\`\n\`\`\`ansi\n${data}\n\`\`\``;
}

export function message(message: GatewayMessageCreateDispatchData) {
  if (cmd) {
    api.createMessage(message.channel_id, "Command is already running");
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

    await outQueue.wait();
    if (outMsg)
      outMsg = await api.editMessage(message.channel_id, outMsg.id, {
        content: format("📥", out),
        components
      });
    else
      outMsg = await api.createMessage(message.channel_id, {
        content: format("📥", data),
        components
      });

    outQueue.shift();
  });

  cmd.stderr.on("data", async data => {
    err += data.toString();

    await errQueue.wait();
    if (errMsg)
      errMsg = await api.editMessage(message.channel_id, errMsg.id, {
        content: format("📤", err),
        components
      });
    else
      errMsg = await api.createMessage(message.channel_id, {
        content: format("📤", err),
        components
      });

    errQueue.shift();
  });

  cmd.on("error", async error => {
    err += error.message;

    await errQueue.wait();
    if (errMsg)
      errMsg = await api.editMessage(message.channel_id, errMsg.id, {
        content: format("📤", err),
        components
      });
    else
      errMsg = await api.createMessage(message.channel_id, {
        content: format("📤", err),
        components
      });

    errQueue.shift();
  });

  cmd.on("close", async () => {
    await outQueue.wait();
    if (outMsg)
      outMsg = await api.editMessage(message.channel_id, outMsg.id, {
        content: format("✅", out),
        components: []
      });

    outQueue.shift();

    await errQueue.wait();
    if (errMsg)
      errMsg = await api.editMessage(message.channel_id, errMsg.id, {
        content: format("❌", err),
        components: []
      });

    errQueue.shift();

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
    cmd.stdout.destroy();
    cmd.stderr.destroy();
  }
}