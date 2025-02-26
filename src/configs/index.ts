import { BevelConfig } from "./bevel";
import { BlendConfig } from "./blend";
import { DisplacementConfig } from "./displacement";
import { DrawImageConfig } from "./draw-image";
import { DrawTextConfig } from "./draw-text";
import { FillColorConfig } from "./fill-color";
import { ShadowConfig } from "./shadow";
import { TransformConfig } from "./transform";

export const configs = {
  fillColor: FillColorConfig,
  blend: BlendConfig,
  bevel: BevelConfig,
  drawImage: DrawImageConfig,
  drawText: DrawTextConfig,
  shadow: ShadowConfig,
  displacement: DisplacementConfig,
  transform: TransformConfig,
} as const;

export type ConfigsName = keyof typeof configs;
