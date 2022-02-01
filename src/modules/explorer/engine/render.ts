// rewriting old bot yeah

import type { Explorer } from "../types";
import extensions from "./extensions";

import { ButtonStyle, ComponentType } from "discord-api-types";
import { dirname, extname, resolve } from "path";
import { lstat, readdir } from "fs/promises";
import { RequestTypes } from "detritus-client-rest";
import { config } from "..";

const cache = new Map<string, File>();

// https://stackoverflow.com/a/64777515
const chunk = <T>(arr: T[], size: number): T[][] =>
  [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));

export interface File {
  name: string;
  emoji: string;
  isDirectory: boolean;
}

export async function render({
  path,
  page
}: Explorer): Promise<RequestTypes.CreateInteractionResponseInnerPayload> {
  let content = "`Path` " + path;
  let fileNames: string[];

  try {
    fileNames = await readdir(path);
  } catch {
    path = dirname(path);
    return render({ path, page });
  }

  const start = page * 20;
  const end = start + 20;
  const controls: RequestTypes.CreateInteractionResponseInnerPayload["components"] = [
    {
      customId: "___explorer_trash",
      type: ComponentType.Button,
      style: ButtonStyle.Danger,
      emoji: { id: config.emojis.trash }
    },
    {
      customId: "___explorer_download",
      type: ComponentType.Button,
      style: ButtonStyle.Success,
      emoji: { id: config.emojis.download }
    }
  ];

  if (path !== dirname(path))
    controls.push({
      customId: "___explorer_up",
      type: ComponentType.Button,
      style: ButtonStyle.Primary,
      emoji: { id: config.emojis.up }
    });

  if (fileNames.length > 20) {
    content += "\n`Page` " + page;
    controls.push(
      {
        customId: "___explorer_left",
        disabled: page === 0,
        type: ComponentType.Button,
        style: ButtonStyle.Primary,
        emoji: { id: config.emojis.left }
      },
      {
        customId: "___explorer_right",
        disabled: end > fileNames.length,
        type: ComponentType.Button,
        style: ButtonStyle.Primary,
        emoji: { id: config.emojis.right }
      }
    );
  }

  const files = await Promise.all(
    fileNames.map(async fileName => {
      if (cache.has(fileName)) return cache.get(fileName);

      const filePath = resolve(path, fileName);
      let file: Partial<File> = { name: fileName };

      try {
        const stat = await lstat(filePath);
        file.isDirectory = stat.isDirectory();
      } catch {
        file.emoji = "🔒";
      }

      if (file.isDirectory) file.emoji = "📁";
      else file.emoji = extensions[extname(fileName)] ?? "📄";

      cache.set(fileName, file as File);
      return file as File;
    })
  );

  const components: RequestTypes.CreateInteractionResponseInnerPayload["components"] = [
    {
      type: ComponentType.ActionRow,
      components: controls
    },
    ...chunk(
      files
        .sort((a, b) => {
          if (!a.isDirectory && b.isDirectory) return 1;
          if (a.isDirectory && !b.isDirectory) return -1;
          return a.name.localeCompare(b.name);
        })
        .slice(start, end),
      5
    ).map(row => ({
      type: ComponentType.ActionRow,
      components: row.map(file => ({
        label: file.name,
        customId: file.name,
        disabled: file.emoji === "🔒",
        type: ComponentType.Button,
        style: ButtonStyle.Secondary,
        emoji: { name: file.emoji }
      }))
    }))
  ];

  return { content, components };
}