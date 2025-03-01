import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function displacementTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.checkerboard }),
    operations.displacement(20, [
      operations.drawImage({ imageUrl: availableImages.displacementMap1 }),
    ]),
  ];

  return tree;
}
