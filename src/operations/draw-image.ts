import { IRenderItem, ItemDrawFn, ItemLoadFn } from "../canvas";
import { addRenderer } from "../renderers";
import { loadImageAsync } from "../resources";

export interface IDrawImageConfig {
  imageUrl: string;
  sourceRect?: readonly [x: number, y: number, w: number, h: number];
  targetRect?: readonly [x: number, y: number, w: number, h: number];
}

/** Draw an image on the canvas */
export const drawImage = (config: IDrawImageConfig): IRenderItem => ({
  name: "drawImage",
  config,
});

const imageCache = new Map<
  string,
  Promise<HTMLImageElement> | HTMLImageElement
>();

export const draw: ItemDrawFn<IDrawImageConfig> = (ctx, drawPrev, config) => {
  const { imageUrl, sourceRect, targetRect } = config;

  drawPrev?.(ctx);

  const image = imageCache.get(imageUrl);
  if (image instanceof HTMLImageElement) {
    ctx.drawImage(
      image,
      sourceRect ? sourceRect[0] : 0,
      sourceRect ? sourceRect[1] : 0,
      sourceRect ? sourceRect[2] : image.width,
      sourceRect ? sourceRect[3] : image.height,
      targetRect ? targetRect[0] : 0,
      targetRect ? targetRect[1] : 0,
      targetRect ? targetRect[2] : ctx.canvas.width,
      targetRect ? targetRect[3] : ctx.canvas.height
    );
  }
};

export const load: ItemLoadFn<IDrawImageConfig> = (config) => {
  // Nothing to load: sync return undefined
  if (!config.imageUrl) return undefined;

  // Check cache
  const key = config.imageUrl;
  const cacheValue = imageCache.get(key);

  // Promise in cache: still busy
  if (cacheValue && typeof cacheValue === "object" && "then" in cacheValue)
    return cacheValue.then(() => undefined);

  // In cache: sync return undefined
  if (cacheValue !== undefined) return undefined;

  // Not in cache: start loading
  const promise = loadImageAsync(config.imageUrl);
  imageCache.set(key, promise);

  return promise.then((image) => {
    imageCache.set(key, image);
  });
};

addRenderer("drawImage", {
  draw,
  load,
});
