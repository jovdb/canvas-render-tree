import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function bSplinePointsTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.checkerboard }),
    operations.bSplinePoints(),
  ];
  return tree;
}
