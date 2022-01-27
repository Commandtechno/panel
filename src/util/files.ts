import * as fs from "fs";
import * as util from "path";

import config from "../config.json";
import emojis from "../files.json";
import text from "utf-8-validate";

function range(n: number) {
  return Array.apply(null, Array(n)).map((_, i) => i);
}

function chunk(a: any[], n: number): any[] {
  return range(Math.ceil(a.length / n)).map((_, i) => a.slice(i * n, i * n + n));
}

const order = Object.fromEntries(config.order.map((e, i) => [e, i]));

export default function (path: string, page?: number) {
  const $ = [
    [config.emojis.trash, false, 4],
    [config.emojis.download, false, 3]
  ];

  let files;
  try {
    files = fs.readdirSync(path);
  } catch {
    path = util.dirname(path);
    files = fs.readdirSync(path);
  }

  if (!/^(\w+:)?[\/\\]$/.test(path)) $.push([config.emojis.up]);
  const { length } = files;

  files = files
    .map(file => {
      let emoji;
      let dir;

      try {
        dir = fs.lstatSync(path + "/" + file).isDirectory();
      } catch {
        return ["🔒", file];
      }

      if (dir) emoji = "📁";
      else {
        emoji = emojis[util.extname(file)];
        if (!emoji) {
          try {
            const buffer = fs.readFileSync(path + "/" + file);
            if (text(buffer)) emoji = "📄";
            else emoji = "❓";
          } catch {
            emoji = "🔒";
          }
        }
      }

      return [emoji, file];
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