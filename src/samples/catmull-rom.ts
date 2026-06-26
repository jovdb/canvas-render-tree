import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function catmullRomTree() {
  const controlPoints = [];
  for (let x = 0; x <= 4; x += 1) {
    for (let y = 0; y <= 4; y += 1) {
      controlPoints.push({
        col: x,
        row: y,
        dx: (0.5 - x / 5) * 0.3 * (y / 5),
        dy: (0.5 - y / 5) * 0.3,
      });
    }
  }

  const tree: IRenderItem[] = [
    operations.catmullRom(
      {
        gridCols: 5,
        gridRows: 5,
        controlPoints,
      },
      [operations.drawImage({ imageUrl: availableImages.testbeeld })],
    ),
  ];
  return tree;
}

export function catmullRomShirtTree() {
  const controlPoints = [];
  for (let x = 0; x <= 4; x += 1) {
    for (let y = 0; y <= 4; y += 1) {
      controlPoints.push({
        col: x,
        row: y,
        dx: (0.5 - x / 5) * 3,
        dy: (0.5 - y / 5) * 3,
      });
    }
  }

  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.curvy }),
    operations.catmullRom(
      {
        gridCols: 5,
        gridRows: 5,
        controlPoints,
      },
      [operations.drawImage({ imageUrl: availableImages.testbeeld })],
    ),
    operations.drawImage({ imageUrl: availableImages.homer }),
  ];
  return tree;
}
