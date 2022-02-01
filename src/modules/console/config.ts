import type { Config } from "./types";

import { resolve } from "path";
import loadConfig from "../../util/config";

export const config = loadConfig<Config>(resolve(__dirname, "config.json"));