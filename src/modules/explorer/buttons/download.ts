import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

export function download(
  interaction: APIMessageComponentInteraction,
  args: string[],
  { epheremal }: Context
) {
  epheremal("this will download");
}