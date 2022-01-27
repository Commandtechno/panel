export interface Config {
  channel: string;
}

export interface Explorer {
  path: string;
  page: number;
}

export interface BaseContext {
  ack();
  reply(content: string);
  epheremal(content: string);
}

export interface Context extends BaseContext, Explorer {
  config: Config;
}