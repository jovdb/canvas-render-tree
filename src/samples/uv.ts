import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { IRenderResources } from "../resources";

export function uvTree(resources: IRenderResources) {
  const tree: IRenderItem[] = [
    operations.drawImage({ image: resources.checkerboard }),
    operations.uvMap(20, [
      operations.drawImage({ image: resources.uvMap }),
    ]),
  ];

  return tree;
}
