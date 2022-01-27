import type { Config } from "./types";

import { resolve } from "path";
import loadConfig from "./util/config";

const config = loadConfig<Config>(resolve(__dirname, "config.json"));
export default config;