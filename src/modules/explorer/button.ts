import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../types";

import { createReadStream } from "fs";
import { resolve } from "path";
import { lstat } from "fs/promises";

import { config, parse, render } from ".";
import { api } from "../../client";

export async function button(interaction: APIMessageComponentInteraction, { ack, edit }: Context) {
  const explorer = parse(interaction.message.content);
  const path = resolve(explorer.path, interaction.data.custom_id);
  if ((await lstat(path)).isDirectory()) {
    explorer.path = path;
    edit(await render(explorer));
  } else {
    ack();
    api.createMessage(config.files.channel, {
      file: { key: interaction.data.custom_id, value: createReadStream(path) }
    });
  }
}