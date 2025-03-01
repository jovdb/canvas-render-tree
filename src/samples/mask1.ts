import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function mask1Tree() {
  const tree: RenderTree = [
    operations.fillColor("red"),
    operations.drawImage({ imageUrl: availableImages.glassText }),
    operations.mask([operations.drawImage({ imageUrl: availableImages.text })]),
  ];
  return tree;
}
