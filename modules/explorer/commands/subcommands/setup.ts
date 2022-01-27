import { Context } from "../../types";

export const description = "Setup an explorer channel";
export function run({ config }: Context) {
  console.log(config.channel);
}