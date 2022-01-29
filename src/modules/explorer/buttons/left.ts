import { Explorer } from "..";
import { Context } from "../../../types";

export function left({ ack }: Context, { path, page }: Explorer) {
  ack();
  return {
    path,
    page: page - 1
  };
}