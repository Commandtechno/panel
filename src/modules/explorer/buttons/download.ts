import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";

export function ___explorer_download(
  interaction: APIMessageComponentInteraction,
  { epheremal }: Context
) {
  epheremal("this will download");
}