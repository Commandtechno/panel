import type { Context } from "../types";

export function left({ ack, path, page }: Context) {
  ack();
  return {
    path,
    page: page - 1
  };
}