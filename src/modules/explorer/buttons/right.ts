import { Explorer } from "..";
import { Context } from "../../../types";

export function right({ ack }: Context, { path, page }: Explorer) {
  ack();
  return {
    path,
    page: page + 1
  };
}