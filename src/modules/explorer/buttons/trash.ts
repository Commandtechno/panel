import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

export function trash(
  interaction: APIMessageComponentInteraction,
  args: string[],
  { epheremal }: Context
) {
  epheremal("will delete alter");
}