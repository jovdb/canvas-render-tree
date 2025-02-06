/*
import { blend, FixedLengthArray, IRenderNode } from './blend';
import { drawImage } from './draw-image';
import { mask } from './mask';


function addNode<TInputCount extends number>(node: IRenderNode<TInputCount>, inputs: FixedLengthArray<IRenderNode<any>, TInputCount): IRenderNode<number> {
  return {

  }
}


const background = drawImage();
const text = drawImage();
const blend2 = blend();
/*
const a: IRenderGraph = {
  vertices: [background, text],
  edges: {
    [blend2.id]: [bac]
  }
};*/

type Inputs<T extends string> = {
    [P in T]: string;
};

type IRenderGraph2<TInputCount extends number> = {
  node: IRenderNode<TInputCount>;
  inputs: FixedLengthArray<IRenderGraph<any>, TInputCount>;
}

type IRenderGraph<TRenderNode extends IRenderNode<any> = IRenderNode<number>> = TRenderNode extends IRenderNode<infer TInputCount> ? {
  node: IRenderNode<TInputCount>;
  inputs: FixedLengthArray<IRenderGraph<any>, TInputCount>;
} : never

const a: IRenderGraph<ReturnType<typeof blend>> = 
{
  node: blend(),
  inputs: [
    {
      node: drawImage(),
      inputs: [],
    },
    {
      node: mask(),
      inputs: [],
    },
  ],
}

addNode(blend(), [background, text])

addNode(blend(), [background, addNode(mask(), text)])

const g = {
  blend(),

}
*/