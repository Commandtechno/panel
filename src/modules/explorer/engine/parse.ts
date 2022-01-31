import type { Explorer } from "../types";

const PATH_PREFIX = "`Path` ";
const PAGE_PREFIX = "`Page` ";
const DIVIDER = "\n";

export function parse(content: string): Explorer {
  const [path, page] = content.split(DIVIDER);
  return {
    path: path.slice(PATH_PREFIX.length),
    page: page ? parseInt(page.slice(PAGE_PREFIX.length)) : 0
  };
}