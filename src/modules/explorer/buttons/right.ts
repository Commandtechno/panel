import type { Context } from "../types";

export function right({ ack, path, page }: Context) {
  ack();
  return {
    path,
    page: page + 1
  };
}