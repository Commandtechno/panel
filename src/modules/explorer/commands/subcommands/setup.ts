import type { APIChatInputApplicationCommandInteraction } from "discord-api-types";
import type { Context } from "../../../../types";
import { render } from "../..";

export async function setup(
  interaction: APIChatInputApplicationCommandInteraction,
  { reply }: Context
) {
  reply(await render({ path: process.cwd(), page: 0 }));
}