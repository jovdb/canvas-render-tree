import { IRenderItem } from '../canvas';

export const edge1 = ({
  noOutlineColor = [0, 0, 0, 255],
  outlineColor = [255, 255, 255, 255],
}: {
  noOutlineColor?: [r: number, g: number, b: number, a?: number];
  outlineColor?: [r: number, g: number, b: number, a?: number];
} = {}): IRenderItem => ({
  name: 'edge',
  draw(ctx) {
    function isEdgePixel(imageData: ImageData, x: number, y: number) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue; // Skip the current pixel

          const nx = x + i;
          const ny = y + j;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const currentIndex = (y * width + x) * 4;
            const neighborIndex = (ny * width + nx) * 4;
            if (
              data[currentIndex] !== data[neighborIndex] ||
              data[currentIndex + 1] !== data[neighborIndex + 1] ||
              data[currentIndex + 2] !== data[neighborIndex + 2]
            )
              return true;
          }
        }
      }
      return false;
    }

    function createInnerBevelMask(imageData: ImageData, bevelWidth: number) {
      const width = imageData.width;
      const height = imageData.height;

      const edge = new ImageData(width, height);
      const edgeData = edge.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          const isEdge = isEdgePixel(imageData, x, y, bevelWidth); // Check if pixel is near the edge

          if (isEdge) {
            edgeData[pixelIndex] = outlineColor[0] ?? 255;
            edgeData[pixelIndex + 1] = outlineColor[1] ?? 255;
            edgeData[pixelIndex + 2] = outlineColor[2] ?? 255;
            edgeData[pixelIndex + 3] = outlineColor[3] ?? 255;
          } else {
            edgeData[pixelIndex] = noOutlineColor[0] ?? 0;
            edgeData[pixelIndex + 1] = noOutlineColor[1] ?? 0;
            edgeData[pixelIndex + 2] = noOutlineColor[2] ?? 0;
            edgeData[pixelIndex + 3] = noOutlineColor[3] ?? 255;
          }
        }
      }
      return edge;
    }

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const bevelWidth = 10;

    const edge = createInnerBevelMask(imageData, bevelWidth);
    ctx.putImageData(edge, 0, 0); // Draw the mask onto the canvas for blurring
  },
});

// Inner and outer supported
export const edge2 = ({
  noOutlineColor = [0, 0, 0, 255],
  outlineColor = [255, 255, 255, 255],
}: {
  noOutlineColor?: [r: number, g: number, b: number, a?: number];
  outlineColor?: [r: number, g: number, b: number, a?: number];
} = {}): IRenderItem => ({
  name: 'edge',
  draw(ctx) {
    function hasOuterAlphaNeighbor(imageData: ImageData, x: number, y: number) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;

      const currentIndex = (y * width + x) * 4;
      if (data[currentIndex + 3] === 255) return 0;

      // Checked as square
      const distance = 10;
      let a = 0;
      for (let i = -distance; i <= distance; i++) {
        for (let j = -distance; j <= distance; j++) {
          if (i === 0 && j === 0) continue; // Skip the current pixel

          const nx = x + i;
          const ny = y + j;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborIndex = (ny * width + nx) * 4;
            // Check if a neighbor has alpha
            if (data[neighborIndex + 3] >= 128) a += 2 / distance ** 2;
          }
        }
      }
      return a;
    }

    function hasInnerAlphaNeighbor(imageData: ImageData, x: number, y: number) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;

      const currentIndex = (y * width + x) * 4;
      if (data[currentIndex + 3] === 0) return 0;

      // Checked as square
      const distance = 8;
      let a = 0;
      for (let i = -distance; i <= distance; i++) {
        for (let j = -distance; j <= distance; j++) {
          if (i === 0 && j === 0) continue; // Skip the current pixel

          const nx = x + i;
          const ny = y + j;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborIndex = (ny * width + nx) * 4;
            // Check if a neighbor has alpha
            if (data[neighborIndex + 3] < 128) a += 1 / distance ** 2;
          }
        }
      }
      return a;
    }

    function createInnerBevelMask(imageData: ImageData, bevelWidth: number) {
      const width = imageData.width;
      const height = imageData.height;

      const edge = new ImageData(width, height);
      const edgeData = edge.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          const isEdgeFactor = hasInnerAlphaNeighbor(
            imageData,
            x,
            y,
            bevelWidth
          ); // Check if pixel is near the edge

          if (isEdgeFactor >= 0) {
            edgeData[pixelIndex] = outlineColor[0] ?? 255;
            edgeData[pixelIndex + 1] = outlineColor[1] ?? 255;
            edgeData[pixelIndex + 2] = outlineColor[2] ?? 255;
            edgeData[pixelIndex + 3] = (outlineColor[3] ?? 255) * isEdgeFactor;
          } else {
            edgeData[pixelIndex] = noOutlineColor[0] ?? 0;
            edgeData[pixelIndex + 1] = noOutlineColor[1] ?? 0;
            edgeData[pixelIndex + 2] = noOutlineColor[2] ?? 0;
            edgeData[pixelIndex + 3] = noOutlineColor[3] ?? 255;
          }
        }
      }
      return edge;
    }

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const bevelWidth = 10;

    const edge = createInnerBevelMask(imageData, bevelWidth);
    ctx.putImageData(edge, 0, 0); // Draw the mask onto the canvas for blurring
  },
});
