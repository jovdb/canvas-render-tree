import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { IRenderResources } from "../resources";

export function bSplineWarpTree(resources: IRenderResources) {
  const tree: IRenderItem[] = [
    operations.drawImage({ image: resources.checkerboard }),
    operations.bSplineWrap(),
  ];
  return tree;
}
