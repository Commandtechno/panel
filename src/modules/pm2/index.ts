import { APIChannel, APIMessage, ChannelType } from "discord-api-types";
import type { RequestTypes } from "detritus-client-rest";
import pm2, { ProcessDescription } from "pm2";
import prettyBytes from "pretty-bytes";

import { config } from "./config";
import { api } from "../../client";

function formatLog(emoji: string, title: string, data: string) {
  if (data.length > 1960) data = data.slice(0, 1960) + "...";
  // @ts-ignore ???
  return `${emoji} **${title}**\n\`\`\`ansi\n${data.replaceAll("```", "`\u200b``")}\n\`\`\``;
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatProcess(process: pm2.ProcessDescription): RequestTypes.CreateMessage {
  let color: number;
  let emoji: string;
  switch (process.pm2_env.status) {
    case "online":
      color = 0x78b159;
      emoji = "🟢";
      break;

    case "launching":
    case "stopping":
      color = 0xfdcb58;
      emoji = "🟡";
      break;

    case "stopped":
    case "errored":
      color = 0xdd2e44;
      emoji = "🔴";
      break;

    default:
      emoji = "❓";
      break;
  }

  const uptimeSeconds = Math.round(process.pm2_env.pm_uptime / 1000);
  return {
    content: `${emoji} ${formatStatus(process.pm2_env.status)}`,
    embeds: [
      {
        color,
        title: process.name,
        description: [
          `\`ID\` ${process.pid}`,
          `\`Path\` ${process.pm2_env.pm_cwd}`,
          `\`CPU\` ${process.monit.cpu.toFixed(1)}%`,
          `\`Memory\` ${prettyBytes(process.monit.memory)}`,
          `\`Uptime\` <t:${uptimeSeconds}:f> (<t:${uptimeSeconds}:R>)`
        ].join("\n")
      }
    ]
  };
}

export default async function () {
  const channels = new Map<string, string>();
  const rawCategory: APIChannel = await api.fetchChannel(config.logs.category);
  const rawChannels: APIChannel[] = await api.fetchGuildChannels(rawCategory.guild_id);
  for (const channel of rawChannels)
    if (
      channel.type == ChannelType.GuildText &&
      channel.parent_id === rawCategory.id &&
      channel.id !== config.status.channel
    )
      channels.set(channel.name, channel.id);

  async function createChannel(name: string) {
    const newChannel: APIChannel = await api.createGuildChannel(rawCategory.guild_id, {
      name,
      topic: name,

      type: ChannelType.GuildText,
      parentId: rawCategory.id
    });

    channels.set(name, newChannel.id);
    return newChannel.id;
  }

  pm2.connect(() => {});
  pm2.launchBus((err, bus) => {
    if (err) {
      console.error(err);
      return;
    }

    bus.on("log:out", async event => {
      const name = event.process.name;
      const channel = channels.get(name) ?? (await createChannel(name));
      api.createMessage(channel, { content: formatLog("✅", "Output", event.data) });
    });

    bus.on("log:err", async event => {
      const name = event.process.name;
      const channel = channels.get(name) ?? (await createChannel(name));
      api.createMessage(channel, { content: formatLog("⛔", "Error", event.data) });
    });

    bus.on("process:event", async event => {
      updateStatus();

      const name = event.process.name;
      const channel = channels.get(name) ?? (await createChannel(name));
      switch (event.event) {
        case "online":
          api.createMessage(channel, { content: `🟢 **${name}** is online` });
          break;

        case "restart":
          api.createMessage(channel, { content: `🟡 **${name}** is restarting...` });
          break;

        case "stop":
          api.createMessage(channel, { content: `🔴 **${name}** has stopped` });
          break;

        default:
          console.log("Unknown event", event.event);
      }
    });
  });

  const messages = new Map<string, string>();
  const rawMessages: APIMessage[] = await api.fetchMessages(config.status.channel);
  for (const message of rawMessages)
    for (const embed of message.embeds) messages.set(embed.title, message.id);

  async function createMessage(process: ProcessDescription) {
    const newMessage: APIMessage = await api.createMessage(
      config.status.channel,
      formatProcess(process)
    );

    messages.set(process.name, newMessage.id);
    return newMessage.id;
  }

  async function updateStatus() {
    const processes: pm2.ProcessDescription[] = await new Promise((resolve, reject) =>
      pm2.list((err, res) => {
        if (err) reject(err);
        else resolve(res);
      })
    );

    for (const process of processes) {
      const message = messages.get(process.name) ?? (await createMessage(process));
      await api.editMessage(config.status.channel, message, formatProcess(process));
    }
  }

  updateStatus();
  setInterval(updateStatus, config.status.interval);
}