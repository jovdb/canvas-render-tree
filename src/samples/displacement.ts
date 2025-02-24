import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { IRenderResources } from "../resources";

export function displacementTree(resources: IRenderResources) {
  const tree: IRenderItem[] = [
    operations.drawImage({ image: resources.checkerboard }),
    operations.displacement(20, [
      operations.drawImage({ image: resources.displacementMap }),
    ]),
  ];

  return tree;
}
