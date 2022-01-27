export interface Config {
  token: string;

  users: string[];
  guilds: string[];
}

export interface Context {
  ack();
  reply(content: string);
  epheremal(content: string);
}