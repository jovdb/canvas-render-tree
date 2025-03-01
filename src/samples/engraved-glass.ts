import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function engravedGlassTree() {
  const tree: IRenderItem[] = [
    // operations.drawImage({ imageUrl: availableImages.glass }),
    // operations.layer([
    //   operations.drawImage({ imageUrl: availableImages.noise }),
    //   operations.fillColor("#0001"), // make a bit darker
    //   operations.mask([operations.drawImage({ imageUrl: availableImages.glassText })]),
    // ]),
    // operations.shadow({
    //   type: "inner",
    //   shadowBlur: 2,
    //   shadowOffsetX: 3,
    //   shadowOffsetY: 3,
    //   shadowColor: "#0003",
    // }),

    operations.drawImage({ imageUrl: availableImages.glass }),
    operations.layer([
      operations.drawImage({ imageUrl: availableImages.noise }),
      operations.fillColor("#0001"), // make a bit darker
      operations.blend("destination-in"),
      operations.drawImage({ imageUrl: availableImages.glassText }),
    ]),
    operations.shadow({
      type: "inner",
      shadowBlur: 2,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowColor: "#0003",
    }),

  ];
  return tree;
}
