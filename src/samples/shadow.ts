import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function shadowTree() {
  const tree: IRenderItem[] = [
    operations.shadow(
      {
        type: "outer",
        shadowBlur: 3,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowColor: "#0003",
      },
      [operations.drawImage({ imageUrl: availableImages.text })],
    ),
  ];

  return tree;
}
