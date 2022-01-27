import type { Context } from "../types";
import { dirname } from "path";

export function up({ ack, path }: Context) {
  ack();
  return {
    path: dirname(path),
    page: 0
  };
}