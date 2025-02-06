import { Drawable, IRenderItem } from '../canvas';

/** Draw an image on the canvas */
export const drawImage = ({
  image,
  sourceRect,
  targetRect,
}: {
  image: Drawable;
  sourceRect?: readonly [x: number, y: number, w: number, h: number];
  targetRect?: readonly [x: number, y: number, w: number, h: number];
}): IRenderItem => ({
  name: 'drawImage',
  draw(ctx, drawPrev) {
    drawPrev?.(ctx);
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
  },
});
