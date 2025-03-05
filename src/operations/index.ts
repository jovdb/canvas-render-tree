import { bevel } from "./bevel";
import { blend } from "./blend";
import { drawImage } from "./draw-image";
import { drawText } from "./draw-text";
import { fillColor } from "./fill-color";
import { layer } from "./layer";
import { mask } from "./mask";
import { opacity } from "./opacity";
import { shadow } from "./shadow";
import { blur } from "./blur";
import { saturation } from "./saturation";
import { convolve } from "./convolve";
import { transform } from "./transform";
import { invert } from "./invert";
import { repaint } from "./repaint";
// import { meshWarp } from "./copilot-warp";
import { displacement } from "./displacement";
import { bSplinePoints } from "./bspline-points";
import { uvMap } from "./uv-map";
import { cyl } from "./cyl";
import { perspective } from "./perspective";
import { bSplineGrid } from "./bspline-grid";

export const operations = {
  drawImage,
  drawText,
  fillColor,
  layer,
  opacity,
  blend,
  mask,
  bevel,
  shadow,
  blur,
  transform,
  saturation,
  convolve,
  invert,
  repaint,
  bSplinePoints,
  bSplineGrid,
  displacement,
  uvMap,
  cyl,
  perspective,
};

export type RenderItemName = keyof typeof operations;
