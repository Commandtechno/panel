import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";
import { ___cancel } from "..";

export async function ___console_cancel(
  interaction: APIMessageComponentInteraction,
  { ack }: Context
) {
  await ack();
  ___cancel();
}