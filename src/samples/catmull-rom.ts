import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function catmullRomTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.testbeeld}),
    operations.catmullRom(),
  ];
  return tree;
}
