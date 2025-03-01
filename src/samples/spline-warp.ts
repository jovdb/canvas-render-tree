import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function bSplineWarpTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.checkerboard }),
    operations.bSplineWrap(),
  ];
  return tree;
}
