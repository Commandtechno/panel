import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

import { parse, render } from "..";

export async function ___explorer_left(
  interaction: APIMessageComponentInteraction,
  { edit }: Context
) {
  const explorer = parse(interaction.message.content);
  explorer.page--;

  edit(await render(explorer));
}