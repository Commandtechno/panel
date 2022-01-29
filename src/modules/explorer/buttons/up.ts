import { Explorer } from "..";
import { Context } from "../../../types";
import { dirname } from "path";

export function up({ ack }: Context, { path }: Explorer) {
  ack();
  return {
    path: dirname(path),
    page: 0
  };
}