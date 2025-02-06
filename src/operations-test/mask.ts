import { createNodeId, IRenderNode } from './blend';

/** Use children as mask */
export const mask = (): IRenderNode<2> => ({
  id: createNodeId(),
  name: 'mask',
  inputNames: ["base", "mask"],
  draw(ctx, drawInputs) {
    drawInputs[0](ctx);

    // for Alpha channel
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';

    drawInputs[1](ctx);
    ctx.restore();
    return this;
  },
});
