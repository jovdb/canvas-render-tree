import { createNodeId, IRenderNode } from './blend';

export const fillColor = (color: string): IRenderNode<0> => ({
  id: createNodeId(),
  inputNames: [],
  name: 'fillColor',
  draw(ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
});
