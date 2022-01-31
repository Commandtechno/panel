import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

import { parse, render } from "..";
import { dirname } from "path";

export async function up(
  interaction: APIMessageComponentInteraction,
  args: string[],
  { edit }: Context
) {
  const explorer = parse(interaction.message.content);
  explorer.path = dirname(explorer.path);
  explorer.page = 0;

  edit(await render(explorer));
}