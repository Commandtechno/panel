import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";
import pm2 from "../pm2";

export async function ___pm2_stop(
  interaction: APIMessageComponentInteraction,
  { epheremal }: Context
) {
  const [{ title }] = interaction.message.embeds;
  pm2.stop(title, (err, process) => {
    if (err) epheremal(err.message);
    else epheremal(`Stopped **${process.name}**`);
  });
}