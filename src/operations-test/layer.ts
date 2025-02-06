import { getContext2d } from '../canvas';
import { createNodeId, IRenderNode } from './blend';

/** Draw children on a new render layer  */
export const layer = (): IRenderNode<1> => ({
  id: createNodeId(),
  name: 'layer',
  inputNames: ['forNewLayer'],
  draw(ctx, drawInputs) {
    const canvas = document.createElement('canvas');
    canvas.width = ctx.canvas.width;
    canvas.height = ctx.canvas.height;
    const layerCtx = getContext2d(canvas, "layerCtx");
    drawInputs[0](layerCtx);

    // Draw new child context on the parent context
    ctx.drawImage(canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  },
});
