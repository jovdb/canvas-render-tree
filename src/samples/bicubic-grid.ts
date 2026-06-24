import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { createOriginalGrid } from "../operations/bicubic-grid";
import { availableImages } from "../resources";

export function bicubicGridTree() {
  const { rows, cols } = { rows: 4, cols: 4 };

  const deformationGrid = createOriginalGrid(rows, cols);

  const distance = 0.5 / cols;
  for (let j = 0; j < deformationGrid.length; j++) {
    for (let i = 0; i < deformationGrid[j].length; i++) {
      deformationGrid[i][j].x += Math.random() * distance - distance / 2;
      deformationGrid[i][j].y += Math.random() * distance - distance / 2;
    }
  }

  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.testbeeld }),
    operations.bicubicGrid({
      controlsPoints: deformationGrid,
      debug: true,
    }),
  ];
  return tree;
}
