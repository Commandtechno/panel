import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

import { config, parse } from "..";
import { resolve } from "path";
import { api } from "../../../client";
import { createReadStream } from "fs";

export async function file(
  interaction: APIMessageComponentInteraction,
  args: string[],
  { ack }: Context
) {
  const explorer = parse(interaction.message.content);
  const fileName = args.join("_");
  const filePath = resolve(explorer.path, fileName);
  const fileData = createReadStream(filePath);

  ack();
  api.createMessage(config.files.channel, { file: { key: fileName, value: fileData } });
}