import { FillColorConfig } from "./fill-color";

export const configs = {
  fillColor: FillColorConfig,
} as const;

export type ConfigsName = keyof typeof configs;
