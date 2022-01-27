import type { Context } from "../../types";

export interface Config {
  channel: string;
}

export interface Explorer {
  path: string;
  page: number;
}

export interface ButtonContext extends Context, Explorer {}