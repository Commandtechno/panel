export interface Config {
  logs: {
    category: string;
  };
  status: {
    channel: string;
    interval: number;
  };
  emojis: {
    stop: string;
    restart: string;
  };
}