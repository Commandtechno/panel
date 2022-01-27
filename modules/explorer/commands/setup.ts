import { Context } from "../types";

export function setup({ config }: Context) {
  console.log(config.channel);
}