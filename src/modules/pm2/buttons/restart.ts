import { APIMessageComponentInteraction } from "discord-api-types";
import { Context } from "../../../types";
import pm2 from "../pm2";

export async function ___pm2_restart(
  interaction: APIMessageComponentInteraction,
  { epheremal }: Context
) {
  const [{ title }] = interaction.message.embeds;
  pm2.restart(title, (err, processes) => {
    if (err) epheremal(err.message);
    else {
      // its literally an array
      const [process] = processes as pm2.Proc[];
      epheremal(`Restarted **${process.name}**`);
    }
  });
}