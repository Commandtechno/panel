import { basename, dirname } from "path";
import { lstatSync, readFileSync, unlinkSync } from "fs";

import { Client } from "detritus-client-rest";
import { GatewayInteractionCreateDispatchData } from "discord-api-types";
import archiver from "archiver";
import config from "../config.json";
import pretty from "pretty-bytes";
import render from "../util/files";
import { sync as rimraf } from "rimraf";

export default async function (
  button: GatewayInteractionCreateDispatchData,
  api: Client,
  me: string
) {
  if (button.type !== 3) return;

  let [path, _page] = button.message.content.split("\n");
  let page = +_page || 0;
  path = path.replace(/^`\d+` /, "");

  switch (button.data.custom_id) {
    case config.emojis.up:
      path = dirname(path);
      page = 0;
      break;
    case config.emojis.download:
      let replied = false;
      async function reply(content) {
        if (replied) return;
        replied = true;

        await api.deleteWebhookTokenMessage(me, button.token, "@original");
        api.executeWebhook(me, button.token, {
          content,
          flags: 64
        });
      }

      await api.createInteractionResponse(button.id, button.token, { type: 5 });
      const archive = archiver("zip");

      let buffers = [];
      let size = 0;

      archive.on("data", data => {
        size += Buffer.byteLength(data);
        if (size > 8e6) {
          reply("Zip above 8mb");
          archive.destroy();
        } else buffers.push(data);
      });

      archive.on("error", () => reply("There was an error zipping that directory"));
      archive.on("end", async () => {
        const file = Buffer.concat(buffers);
        await api.createMessage(config.files, {
          file: {
            filename: basename(path) + ".zip",
            value: file
          }
        });
        reply("Uploaded **" + pretty(Buffer.byteLength(file)) + "** to <#" + config.files + ">");
      });

      archive.directory(path, false);
      archive.finalize();

      return;
    case config.emojis.left:
      page = Math.max(0, page - 1);
      break;
    case config.emojis.right:
      page = page + 1;
      break;
    case config.emojis.trash:
      await api.createInteractionResponse(button.id, button.token, { type: 5 });
      try {
        if (button.channel_id === config.explorer) {
          rimraf(path);
          await api.deleteWebhookTokenMessage(me, button.token, "@original");
          api.executeWebhook(me, button.token, {
            content: "Deleted folder **" + path + "**",
            flags: 64
          });

          path = dirname(path);
        } else {
          unlinkSync(path);
          await api.deleteWebhookTokenMessage(me, button.token, "@original");
          api.executeWebhook(me, button.token, {
            content: "Deleted file **" + path + "**",
            flags: 64
          });

          const [{ id }] = await api.fetchMessages(config.explorer);
          return api.editMessage(config.explorer, id, render(path, page));
        }
      } catch {
        return api.createInteractionResponse(button.id, button.token, {
          type: 4,
          data: { content: "Error deleting **" + path + "**", flags: 64 }
        });
      }
    default:
      path = (/^(\w+:)?[\/\\]$/.test(path) ? path : path + "/") + button.data.custom_id;
      if (lstatSync(path).isDirectory()) page = 0;
      else {
        await api.createInteractionResponse(button.id, button.token, { type: 5 });
        const file = readFileSync(path);
        const size = Buffer.byteLength(file);

        if (size > 8e6) {
          await api.deleteWebhookTokenMessage(me, button.token, "@original");
          api.executeWebhook(me, button.token, {
            content: "File over **" + pretty(8e6) + "** (`" + pretty(size) + "`)",
            flags: 64
          });
        } else {
          await api.createMessage(config.files, {
            content: path,
            file: {
              filename: button.data.custom_id,
              value: file
            },
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 4,
                    customId: config.emojis.trash,
                    emoji: { name: "", id: config.emojis.trash }
                  }
                ]
              }
            ]
          });

          await api.deleteWebhookTokenMessage(me, button.token, "@original");
          api.executeWebhook(me, button.token, {
            content: "Uploaded **" + pretty(size) + "** to <#" + config.files + ">",
            flags: 64
          });
        }

        return;
      }
  }

  await api.createInteractionResponse(button.id, button.token, { type: 6 });
  await api.editMessage(config.explorer, button.message.id, render(path, page));
}