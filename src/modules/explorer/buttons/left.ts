import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

import { parse, render } from "..";

export async function left(
  interaction: APIMessageComponentInteraction,
  args: string[],
  { edit }: Context
) {
  const explorer = parse(interaction.message.content);
  explorer.page--;

  edit(await render(explorer));
}