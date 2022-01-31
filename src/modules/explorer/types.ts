export interface Config {
  channel: string;
  files: {
    channel: string;
  };
  emojis: {
    download: string;
    left: string;
    right: string;
    trash: string;
    up: string;
  };
}

export interface Explorer {
  path: string;
  page: number;
}