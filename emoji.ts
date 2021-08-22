import { readFileSync, readdirSync, writeFileSync } from "fs";

import { APIGuild } from "discord-api-types";
import { Client } from "detritus-client-rest";
import config from "./config.json";

const api = new Client(config.token);

(async () => {
  const [guild]: [APIGuild] = await api.fetchMeGuilds({ limit: 1 });
  const files = readdirSync("emojis");
  console.log("Uploading " + files.length + " emojis to guild " + guild.name);

  const emojis = {};
  for await (const file of files) {
    const name = file.replace(".png", "");
    const { id } = await api.createGuildEmoji(guild.id, {
      name,
      image: readFileSync("emojis/" + file)
    });

    emojis[name] = id;
    console.log("Uploaded emoji " + name);
  }

  Object.assign(config, { emojis });
  update();

  console.log("Completed!");
})();

function update() {
  writeFileSync("config.json", JSON.stringify(config, null, 2));
  try {
    writeFileSync("../config.json", JSON.stringify(config, null, 2));
  } catch {}
}