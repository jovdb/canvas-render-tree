import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function uvTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.testbeeld }),
    operations.uvMap([
      operations.drawImage({ imageUrl: availableImages.uvMap2 }),
    ]),
  ];

  return tree;
}
