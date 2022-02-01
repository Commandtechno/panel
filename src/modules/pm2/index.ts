import { APIChannel, APIMessage, ButtonStyle, ComponentType } from "discord-api-types";
import type { RequestTypes } from "detritus-client-rest";
import { ChannelType } from "discord-api-types";
import prettyBytes from "pretty-bytes";

import { config } from "./config";
import { api } from "../../client";
import pm2 from "./pm2";

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
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            customId: "___pm2_restart",
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            emoji: { id: config.emojis.restart }
          },
          {
            customId: "___pm2_stop",
            type: ComponentType.Button,
            style: ButtonStyle.Danger,
            emoji: { id: config.emojis.stop }
          }
        ]
      }
    ]
  };
}

const channels = new Map<string, string>();
const messages = new Map<string, string>();

let guildId: string;
async function createChannel(name: string) {
  const newChannel: APIChannel = await api.createGuildChannel(guildId, {
    name,
    topic: name,

    type: ChannelType.GuildText,
    parentId: config.logs.category
  });

  channels.set(name, newChannel.id);
  return newChannel.id;
}

async function createMessage(process: pm2.ProcessDescription) {
  const newMessage: APIMessage = await api.createMessage(
    config.status.channel,
    formatProcess(process)
  );

  messages.set(process.name, newMessage.id);
  return newMessage.id;
}

async function getProcess(name: string) {
  return new Promise<pm2.ProcessDescription>((resolve, reject) =>
    pm2.describe(name, (err, processes) => {
      if (err) return reject(err);
      const [process] = processes;
      resolve(process);
    })
  );
}

async function getAllProcesses() {
  return new Promise<pm2.ProcessDescription[]>((resolve, reject) =>
    pm2.list((err, processes) => {
      if (err) return reject(err);
      resolve(processes);
    })
  );
}

async function updateStatus(process: pm2.ProcessDescription) {
  if (!channels.has(process.name)) await createChannel(process.name);
  const message = messages.get(process.name) ?? (await createMessage(process));
  await api.editMessage(config.status.channel, message, formatProcess(process));
}

async function updateAllStatuses() {
  const processes = await getAllProcesses();
  for (const process of processes) {
    await updateStatus(process);
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
}

export default async function () {
  const rawCategory: APIChannel = await api.fetchChannel(config.logs.category);
  guildId = rawCategory.guild_id;

  const rawChannels: APIChannel[] = await api.fetchGuildChannels(guildId);
  for (const channel of rawChannels)
    if (
      channel.type == ChannelType.GuildText &&
      channel.parent_id === rawCategory.id &&
      channel.id !== config.status.channel
    )
      channels.set(channel.name, channel.id);

  const rawMessages: APIMessage[] = await api.fetchMessages(config.status.channel);
  for (const message of rawMessages)
    for (const embed of message.embeds) messages.set(embed.title, message.id);

  await updateAllStatuses();
  setInterval(updateAllStatuses, config.status.interval);

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
      (async () => {
        const process = await getProcess(event.process.name);
        updateStatus(process);
      })();

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
}