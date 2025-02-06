import { Drawable } from "../canvas";
import { createNodeId, IRenderNode } from "./blend";

export const drawImage = ({ image }: { image: Drawable }): IRenderNode<0> => ({
  id: createNodeId(),
  inputNames: [],
  name: 'drawImage',
  draw(ctx) {
    ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);
  },
});
