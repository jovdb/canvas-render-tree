import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export interface IOpacityConfig {
  opacity: number;
}

export const cyl = (
  /** When passed, only the children will have opacity */
  input?: RenderTree | undefined,
): IRenderItem<IOpacityConfig> => ({
  name: "cyl",
  config: undefined,
  input,
});

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ControlPoints {
  topCenter: Point3D;
  topRadius: number; // Use a single radius for a circular cylinder
  bottomCenter: Point3D;
  bottomRadius: number;
  // No need for separate rx, ry since it's a cylinder.
}

function drawCylinder(
  imageData: ImageData,
  controlPoints: ControlPoints,
  color: [number, number, number, number] = [0, 0, 255, 255],
): void {
  const width = imageData.width;
  const height = imageData.height;

  // Unpack control points for easier access
  const { topCenter, topRadius, bottomCenter, bottomRadius } = controlPoints;

  // Perspective projection parameters (can be adjusted)
  const focalLength = 500;
  const cameraZ = -1000; // Camera position

  // Simple lighting:  Ambient + directional from top-right
  const ambientLight = 0.3;
  const directionalLight = 0.7;
  const lightDirection = { x: 1, y: -1, z: -1 }; // Normalized direction

  function project(point: Point3D): { x: number; y: number } | null {
    const x = point.x;
    const y = point.y;
    const z = point.z;
    // Perspective projection
    const perspective = focalLength / (focalLength + z + cameraZ);
    const projectedX = x * perspective + width / 2; // Center on screen
    const projectedY = y * perspective + height / 2;
    return { x: projectedX, y: projectedY };
  }

  function setPixel(
    x: number,
    y: number,
    color: [number, number, number, number],
  ) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return; // Out of bounds
    }
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    imageData.data[index] = color[0]; // R
    imageData.data[index + 1] = color[1]; // G
    imageData.data[index + 2] = color[2]; // B
    imageData.data[index + 3] = color[3]; // A
  }
  function normalizeVector(v: Point3D): Point3D {
    const magnitude = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return {
      x: v.x / magnitude,
      y: v.y / magnitude,
      z: v.z / magnitude,
    };
  }

  function dotProduct(v1: Point3D, v2: Point3D): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  // Iterate over a grid of points in 3D space that define the cylinder's surface
  const numStepsTheta = 60; // Resolution around the circumference
  const numStepsHeight = 60; // Resolution along the height
  const heightDiff = {
    x: bottomCenter.x - topCenter.x,
    y: bottomCenter.y - topCenter.y,
    z: bottomCenter.z - topCenter.z,
  };

  for (let i = 0; i <= numStepsTheta; i++) {
    const theta = (i / numStepsTheta) * 2 * Math.PI;

    for (let j = 0; j <= numStepsHeight; j++) {
      const t = j / numStepsHeight; // Parameter along cylinder height (0 to 1)

      // Calculate the radius and center at the current height
      const currentRadius = topRadius * (1 - t) + bottomRadius * t;
      const currentCenter = {
        x: topCenter.x + heightDiff.x * t,
        y: topCenter.y + heightDiff.y * t,
        z: topCenter.z + heightDiff.z * t,
      };

      // Calculate the 3D point on the cylinder's surface
      const x = currentCenter.x + currentRadius * Math.cos(theta);
      const y = currentCenter.y + currentRadius * Math.sin(theta);
      const z = currentCenter.z;
      const point3D: Point3D = { x, y, z };

      // Project the 3D point to 2D
      const point2D = project(point3D);
      if (!point2D) continue; // Skip points behind the camera

      // --- Calculate Lighting ---
      // Calculate surface normal (simplified for a cylinder)
      const normal: Point3D = normalizeVector({
        x: x - currentCenter.x,
        y: y - currentCenter.y,
        z: 0, // For a cylinder, Z component of normal is 0 along the sides
      });

      // Calculate diffuse light intensity
      const normalizedLight = normalizeVector(lightDirection);
      let diffuseIntensity = dotProduct(normal, normalizedLight);
      diffuseIntensity = Math.max(0, diffuseIntensity); // Clamp to avoid negative light

      // Combine ambient and diffuse light
      const lightIntensity = ambientLight + directionalLight * diffuseIntensity;

      // Apply lighting to the color
      const litColor: [number, number, number, number] = [
        color[0] * lightIntensity,
        color[1] * lightIntensity,
        color[2] * lightIntensity,
        color[3],
      ];
      // Draw the pixel

      setPixel(point2D.x, point2D.y, litColor);
    }
  }
}

export const draw: ItemDrawFn<IOpacityConfig> = (
  ctx,
  drawPrev,
  _config,
  drawInput,
) => {
  // first draw previous items
  drawPrev?.(ctx);

  if (drawInput) ctx.save();

  const controlPoints: ControlPoints = {
    topCenter: { x: 0, y: -50, z: 0 },
    topRadius: 30,
    bottomCenter: { x: 50, y: 50, z: 100 },
    bottomRadius: 60,
  };

  const imageData = new ImageData(ctx.canvas.width, ctx.canvas.height);
  drawCylinder(imageData, controlPoints, [50, 100, 200, 255]); // Blueish cylinder

  ctx.putImageData(imageData, 0, 0);

  drawInput?.(ctx);
  if (drawInput) ctx.restore();
};

addRenderer("cyl", {
  draw,
});
