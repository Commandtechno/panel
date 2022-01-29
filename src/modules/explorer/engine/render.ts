import type { Explorer } from "../types";
import extensions from "./extensions";

import { dirname, extname, resolve } from "path";
import { lstat, readdir, readFile } from "fs/promises";
import { config } from "..";
import isText from "utf-8-validate";
import { createReadStream } from "fs";

export interface File {
  isDirectory: boolean;
  emoji: string;
}

const cache = new Map<string, File>();

export async function render({ path, page }: Explorer) {
  const components = [
    [config.emojis.trash, false, 4],
    [config.emojis.download, false, 3]
  ];

  let fileNames;
  try {
    fileNames = await readdir(path);
  } catch {
    path = dirname(path);
    return render({ path, page });
  }

  if (path !== dirname(path)) components.push([config.emojis.up]);
  const files = fileNames
    .map(async fileName => {
      const filePath = resolve(path, fileName);
      let file: Partial<File> = {};
      if (cache.has(filePath)) file = cache.get(filePath);
      else {
        try {
          const stat = await lstat(filePath);
          file.isDirectory = stat.isDirectory();
        } catch {
          return ["🔒", filePath];
        }

        if (file.isDirectory) file.emoji = "📁";
        else file.emoji = extensions[extname(fileName)] ?? "📄";
      }

      return [file.emoji, filePath];
    })
    .sort(([a], [b]) => {
      a = order[a];
      b = order[b];

      if (a === b) return 0;
      if (a > b) return 1;
      return -1;
    });

  if (length > 20) {
    files = files.slice(page * 20, page * 20 + 20);
    $.push([config.emojis.left, page === 0], [config.emojis.right, files.length < 20]);
  }

  const components = chunk(files, 5).map(row => ({
    type: 1,
    components: row.map(([emoji, file]) => ({
      disabled: emoji === "🔒",
      type: 2,
      style: 2,
      customId: file,
      label: file.slice(0, 32),
      emoji: { name: emoji }
    }))
  }));

  if ($.length)
    components.unshift({
      type: 1,
      components: $.map(([e, disabled, style]) => ({
        disabled,
        type: 2,
        style: style ?? 1,
        customId: e,
        emoji: { name: "", id: e }
      }))
    });

  let content = "`" + length + "` " + path;
  if (page !== 0) content += "\n" + page;

  return { content, components };
}