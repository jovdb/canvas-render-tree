import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function goldFoilTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.goldBack }),

    operations.layer([
      operations.drawImage({ imageUrl: availableImages.gold }),
      operations.blend("destination-in", [
        operations.drawImage({ imageUrl: availableImages.goldFoil }),
      ]),
    ]),

    operations.shadow({
      type: "inner",
      shadowBlur: 3,
      shadowOffsetX: -2,
      shadowOffsetY: -2,
      shadowColor: "#0003",
    }),

    operations.shadow({
      type: "inner",
      shadowBlur: 3,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: "#fff2",
    }),
  ];

  return tree;
}
