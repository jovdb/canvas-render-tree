import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function bSplineGridsTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.checkerboard }),
    operations.bSplineGrid({
      debug: true,
    }),
  ];
  return tree;
}
