export type TypeOf<T extends string> = Record<T, T>;
export type NodeId = string & TypeOf<'NodeId'>;
export type FixedLengthArray<T, N extends number> = N extends 0
  ? []
  : [T, ...T[]] & { length: N };

let nodeId = 0;
export function createNodeId() {
  return `node-${++nodeId}` as NodeId;
}

export interface IRenderNode<TInputCount extends number> {
  id: NodeId;
  name: string;
  inputNames: FixedLengthArray<string, TInputCount>;
  draw: (
    ctx: CanvasRenderingContext2D,
    drawInput: FixedLengthArray<
      (ctx: CanvasRenderingContext2D) => void,
      TInputCount
    >
  ) => void;
}

/** Adjancency list of nodes to build a DAG */
export type RenderEdges = Record<NodeId, NodeId[]>;

export interface IRenderGraph {
  vertices: readonly IRenderNode<number>[];
  edges: RenderEdges;
  // root?
}

export const blend = (
  blendMode: GlobalCompositeOperation = 'multiply'
): IRenderNode<2> => ({
  id: createNodeId(),
  name: 'blend',
  inputNames: ['base', 'toBlend'],
  draw(ctx, drawInputs) {
    if (ctx.globalCompositeOperation === blendMode) return;
    ctx.save();
    drawInputs[0](ctx);
    ctx.globalCompositeOperation = blendMode;
    drawInputs[1](ctx);
    ctx.restore();
  },
});
