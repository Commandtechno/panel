import { existsSync, readFileSync, writeFileSync } from "fs";

export default function <T>(path: string) {
  if (!existsSync(path)) writeFileSync(path, JSON.stringify({}));
  const config: T = JSON.parse(readFileSync(path, "utf-8"));

  return {
    ...config,
    save() {
      writeFileSync(path, JSON.stringify(config));
    }
  };
}