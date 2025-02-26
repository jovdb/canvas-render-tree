import { IRenderItem } from "./canvas";
import { RenderItemName } from "./operations";
import { drawBevel } from "./operations/bevel";
import { drawBlend } from "./operations/blend";
import { drawBlur } from "./operations/blur";
import { drawBSpline } from "./operations/bspline-warp";
import { drawConvolve } from "./operations/convolve";
import { drawDisplacement } from "./operations/displacement";
import { drawDrawImage } from "./operations/draw-image";
import { drawDrawText } from "./operations/draw-text";
import { drawFillColor } from "./operations/fill-color";
import { drawInvert } from "./operations/invert";
import { drawLayer } from "./operations/layer";
import { drawOpacity } from "./operations/opacity";
import { drawSaturation } from "./operations/saturation";
import { drawShadow } from "./operations/shadow";
import { drawTransform } from "./operations/transform";
import { drawUvMap } from "./operations/uv-map";

export const renderers: Partial<Record<RenderItemName, IRenderItem<unknown>>> =
  {
    fillColor: drawFillColor,
    opacity: drawOpacity,
    blend: drawBlend,
    saturation: drawSaturation,
    drawImage: drawDrawImage,
    drawText: drawDrawText,
    layer: drawLayer,
    shadow: drawShadow,
    bevel: drawBevel,
    mask: undefined,
    repaint: undefined,
    blur: drawBlur,
    transform: drawTransform,
    invert: drawInvert,
    convolve: drawConvolve,
    displacement: drawDisplacement,
    bSplineWrap: drawBSpline,
    uvMap: drawUvMap,
  };
