import { RequestTypes } from "detritus-client-rest";

export interface Config {
  token: string;

  users: string[];
  guilds: string[];
}

export interface Context {
  ack();
  edit(content: string | RequestTypes.CreateInteractionResponseInnerPayload);
  reply(content: string | RequestTypes.CreateInteractionResponseInnerPayload);
  epheremal(content: string | RequestTypes.CreateInteractionResponseInnerPayload);
}