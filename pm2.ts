import { APIMessage } from "discord-api-types";
import { api } from "./client";
import config from "./config.json";
import ms from "ms";
import pm2 from "pm2";
import pretty from "pretty-bytes";

function table(props: object) {
  return Object.entries(props)
    .sort(([{ length: a }], [{ length: b }]) => a - b)
    .map(([key, value]) => "`" + key + "` " + value)
    .join("\n");
}

function timestamp(timestamp: number, type: string = "T") {
  return "<t:" + Math.floor(timestamp / 1000) + ":" + type + ">";
}

function code(str: string) {
  return "```c\n" + str.replace(/```/g, "`\u200b``") + "```";
}

pm2.connect(() => {});
pm2.launchBus((err, bus) => {
  bus.on("log:out", (data) => {
    const channel = config.logs[data.process.name];
    if (!channel) return;

    const description = code(data.data);
    api.createMessage(channel, {
      embed: {
        description,
        color: 3092790,
        title: "✅ Output",
        timestamp: new Date(data.at).toISOString()
      }
    });
  });

  bus.on("log:err", (data) => {
    const channel = config.logs[data.process.name];
    if (!channel) return;

    const description = code(data.data);
    api.createMessage(channel, {
      embed: {
        description,
        color: 3092790,
        title: "⚠️ Error",
        timestamp: new Date(data.at).toISOString()
      }
    });
  });

  bus.on("process:event", (data) => {
    const channel = config.logs[data.process.name];
    if (!channel) return;

    if (data.event === "online")
      api.createMessage(channel, "🟢 " + timestamp(data.at) + " Process **" + data.process.name + "** starting");
    else if (data.event === "stop")
      api.createMessage(
        channel,
        "🔴 " +
          timestamp(data.at) +
          " Process **" +
          data.process.name +
          "** " +
          (data.manually ? "was stopped" : "exited") +
          " with exit code **" +
          data.process.exit_code +
          "**"
      );
  });
});

const statuses = {
  online: { color: parseInt("78B159", 16), emoji: "🟢" },
  stopping: { color: parseInt("E1E8ED", 16), emoji: "🕓" },
  stopped: { color: parseInt("DD2E44", 16), emoji: "🔴" },
  launching: { color: parseInt("E1E8ED", 16), emoji: "🕓" },
  errored: { color: parseInt("FFCC4D", 16), emoji: "⚠" }
};

function list() {
  return new Promise((resolve, reject) => {
    pm2.list((err, res) => {
      if (err) return reject(err);

      resolve({
        embeds: res.map(({ pid, name, pm2_env: info, monit: { memory, cpu } }) => {
          const status = statuses[info.status];
          const { color, emoji } = status ?? { color: 3092790, emoji: "❓" };

          const title = emoji + " " + name;
          const description = table({
            pid,
            cpu: cpu.toFixed(1) + "%",
            memory: pretty(memory),
            uptime: ms(Date.now() - info.pm_uptime),
            status: info.status,
            path: info.pm_cwd
          });

          return { color, title, description };
        })
      });
    });
  });
}

let message;
api.fetchMessages(config.status, { limit: 1 }).then(async ([m]: APIMessage[]) => {
  if (m) message = m.id;
  else {
    const data = await list();
    const { id } = await api.createMessage(config.status, data);

    message = id;
  }
});

const timeout = ms(config.timeout) as number;
setInterval(() => list().then((data) => api.editMessage(config.status, message, data)), timeout);