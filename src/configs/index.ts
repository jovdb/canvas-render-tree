import { BevelConfig } from "./bevel";
import { BlendConfig } from "./blend";
import { DrawImageConfig } from "./draw-image";
import { FillColorConfig } from "./fill-color";
import { ShadowConfig } from "./shadow";

export const configs = {
  fillColor: FillColorConfig,
  blend: BlendConfig,
  bevel: BevelConfig,
  drawImage: DrawImageConfig,
  shadow: ShadowConfig,
} as const;

export type ConfigsName = keyof typeof configs;
