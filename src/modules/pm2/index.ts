import { resolve } from "path";
import Config from "../../util/config";

interface ConfigType {
  status: {
    channel: string;
    interval: number;
  };
  logs: {
    category: string;
  };
}

const config = Config<ConfigType>(resolve(__dirname, "config.json"));

export default function () {}