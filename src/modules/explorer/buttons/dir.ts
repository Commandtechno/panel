import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

import { parse, render } from "..";
import { resolve } from "path";

export async function dir(
  interaction: APIMessageComponentInteraction,
  args: string[],
  { edit }: Context
) {
  const explorer = parse(interaction.message.content);
  explorer.path = resolve(explorer.path, args.join("_"));

  edit(await render(explorer));
}