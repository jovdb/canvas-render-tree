interface Point2D {
  x: number;
  y: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface CylinderRenderOptions {
  controlPoints: Point2D[];
  diameterTop: number;
  diameterBottom: number;
  height: number;
  side: 1 | -1;
}

interface CameraProjection {
  position: Point3D;
  screenToRay: number[][];
}

function invert3x3(matrix: number[][]): number[][] | undefined {
  const augmented = matrix.map((row, rowIndex) => [
    ...row,
    ...[0, 1, 2].map((columnIndex) =>
      rowIndex === columnIndex ? 1 : 0,
    ),
  ]);
  const scale = Math.max(...matrix.flat().map(Math.abs));
  if (!Number.isFinite(scale) || scale === 0) return undefined;

  for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
    let pivotIndex = columnIndex;
    for (let rowIndex = columnIndex + 1; rowIndex < 3; rowIndex++) {
      if (
        Math.abs(augmented[rowIndex][columnIndex]) >
        Math.abs(augmented[pivotIndex][columnIndex])
      ) {
        pivotIndex = rowIndex;
      }
    }

    if (Math.abs(augmented[pivotIndex][columnIndex]) <= scale * 1e-12) {
      return undefined;
    }

    [augmented[columnIndex], augmented[pivotIndex]] = [
      augmented[pivotIndex],
      augmented[columnIndex],
    ];

    const pivot = augmented[columnIndex][columnIndex];
    for (let entryIndex = 0; entryIndex < 6; entryIndex++) {
      augmented[columnIndex][entryIndex] /= pivot;
    }

    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      if (rowIndex === columnIndex) continue;
      const factor = augmented[rowIndex][columnIndex];
      for (let entryIndex = 0; entryIndex < 6; entryIndex++) {
        augmented[rowIndex][entryIndex] -=
          factor * augmented[columnIndex][entryIndex];
      }
    }
  }

  return augmented.map((row) => row.slice(3));
}

function smallestEigenvector(matrix: number[][]): number[] | undefined {
  const size = matrix.length;
  const eigenvectors: number[][] = Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, columnIndex): number =>
      rowIndex === columnIndex ? 1 : 0,
    ),
  );
  const diagonalScale = Math.max(
    ...matrix.map((row, rowIndex) => Math.abs(row[rowIndex])),
  );
  const tolerance = diagonalScale * 1e-12;

  for (let iteration = 0; iteration < size * size * 100; iteration++) {
    let pivotRow = 0;
    let pivotColumn = 1;
    let largestOffDiagonal = 0;

    for (let rowIndex = 0; rowIndex < size; rowIndex++) {
      for (
        let columnIndex = rowIndex + 1;
        columnIndex < size;
        columnIndex++
      ) {
        const magnitude = Math.abs(matrix[rowIndex][columnIndex]);
        if (magnitude > largestOffDiagonal) {
          largestOffDiagonal = magnitude;
          pivotRow = rowIndex;
          pivotColumn = columnIndex;
        }
      }
    }

    if (largestOffDiagonal <= tolerance) break;

    const offDiagonal = matrix[pivotRow][pivotColumn];
    const theta =
      (matrix[pivotColumn][pivotColumn] - matrix[pivotRow][pivotRow]) /
      (2 * offDiagonal);
    const tangent =
      theta === 0
        ? 1
        : Math.sign(theta) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
    const cosine = 1 / Math.sqrt(1 + tangent * tangent);
    const sine = tangent * cosine;

    const oldPivot = matrix[pivotRow][pivotRow];
    const oldOther = matrix[pivotColumn][pivotColumn];
    matrix[pivotRow][pivotRow] = oldPivot - tangent * offDiagonal;
    matrix[pivotColumn][pivotColumn] = oldOther + tangent * offDiagonal;
    matrix[pivotRow][pivotColumn] = 0;
    matrix[pivotColumn][pivotRow] = 0;

    for (let index = 0; index < size; index++) {
      if (index !== pivotRow && index !== pivotColumn) {
        const toPivot = matrix[index][pivotRow];
        const toOther = matrix[index][pivotColumn];
        matrix[index][pivotRow] = cosine * toPivot - sine * toOther;
        matrix[pivotRow][index] = matrix[index][pivotRow];
        matrix[index][pivotColumn] = sine * toPivot + cosine * toOther;
        matrix[pivotColumn][index] = matrix[index][pivotColumn];
      }

      const vectorToPivot = eigenvectors[index][pivotRow];
      const vectorToOther = eigenvectors[index][pivotColumn];
      eigenvectors[index][pivotRow] =
        cosine * vectorToPivot - sine * vectorToOther;
      eigenvectors[index][pivotColumn] =
        sine * vectorToPivot + cosine * vectorToOther;
    }
  }

  let smallestIndex = 0;
  for (let index = 1; index < size; index++) {
    if (matrix[index][index] < matrix[smallestIndex][smallestIndex]) {
      smallestIndex = index;
    }
  }

  const vector = eigenvectors.map((row) => row[smallestIndex]);
  const magnitude = Math.hypot(...vector);
  if (!Number.isFinite(magnitude) || magnitude === 0) return undefined;
  return vector.map((value) => value / magnitude);
}

function estimateCamera(
  controlPoints: Point2D[],
  diameterTop: number,
  diameterBottom: number,
  height: number,
): CameraProjection | undefined {
  if (
    controlPoints.length !== 6 ||
    controlPoints.some(
      (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
    )
  ) {
    return undefined;
  }

  const topRadius = diameterTop / 2;
  const bottomRadius = diameterBottom / 2;
  const halfHeight = height / 2;
  const worldPoints: Point3D[] = [
    { x: -topRadius, y: 0, z: -halfHeight },
    { x: 0, y: topRadius, z: -halfHeight },
    { x: topRadius, y: 0, z: -halfHeight },
    { x: -bottomRadius, y: 0, z: halfHeight },
    { x: 0, y: bottomRadius, z: halfHeight },
    { x: bottomRadius, y: 0, z: halfHeight },
  ];
  const equationRows: number[][] = [];

  for (let pointIndex = 0; pointIndex < 6; pointIndex++) {
    const worldPoint = worldPoints[pointIndex];
    const screenPoint = controlPoints[pointIndex];
    equationRows.push([
      worldPoint.x,
      worldPoint.y,
      worldPoint.z,
      1,
      0,
      0,
      0,
      0,
      -screenPoint.x * worldPoint.x,
      -screenPoint.x * worldPoint.y,
      -screenPoint.x * worldPoint.z,
      -screenPoint.x,
    ]);
    equationRows.push([
      0,
      0,
      0,
      0,
      worldPoint.x,
      worldPoint.y,
      worldPoint.z,
      1,
      -screenPoint.y * worldPoint.x,
      -screenPoint.y * worldPoint.y,
      -screenPoint.y * worldPoint.z,
      -screenPoint.y,
    ]);
  }

  const normalMatrix = Array.from({ length: 12 }, () =>
    new Array<number>(12).fill(0),
  );
  for (const equationRow of equationRows) {
    for (let rowIndex = 0; rowIndex < 12; rowIndex++) {
      for (let columnIndex = 0; columnIndex < 12; columnIndex++) {
        normalMatrix[rowIndex][columnIndex] +=
          equationRow[rowIndex] * equationRow[columnIndex];
      }
    }
  }

  const projection = smallestEigenvector(normalMatrix);
  if (!projection) return undefined;

  const inverseLinear = invert3x3([
    [projection[0], projection[1], projection[2]],
    [projection[4], projection[5], projection[6]],
    [projection[8], projection[9], projection[10]],
  ]);
  if (!inverseLinear) return undefined;

  const translation = [projection[3], projection[7], projection[11]];
  const cameraPosition = inverseLinear.map((row) =>
    -row.reduce((sum, value, index) => sum + value * translation[index], 0),
  );
  if (cameraPosition.some((value) => !Number.isFinite(value))) {
    return undefined;
  }

  const firstRay = inverseLinear.map(
    (row) =>
      row[0] * controlPoints[0].x +
      row[1] * controlPoints[0].y +
      row[2],
  );
  const firstWorldPoint = worldPoints[0];
  const firstWorldDirection = [
    firstWorldPoint.x - cameraPosition[0],
    firstWorldPoint.y - cameraPosition[1],
    firstWorldPoint.z - cameraPosition[2],
  ];
  const rayAlignment = firstRay.reduce(
    (sum, value, index) => sum + value * firstWorldDirection[index],
    0,
  );
  const screenToRay =
    rayAlignment < 0
      ? inverseLinear.map((row) => row.map((value) => -value))
      : inverseLinear;

  return {
    position: {
      x: cameraPosition[0],
      y: cameraPosition[1],
      z: cameraPosition[2],
    },
    screenToRay,
  };
}

function intersectFrustum(
  origin: Point3D,
  direction: Point3D,
  options: CylinderRenderOptions,
): Point3D | undefined {
  const topRadius = options.diameterTop / 2;
  const bottomRadius = options.diameterBottom / 2;
  const radiusSlope = (bottomRadius - topRadius) / options.height;
  const slopeAlongRay = radiusSlope * direction.z;
  const radiusAtOrigin =
    radiusSlope * origin.z + topRadius + (bottomRadius - topRadius) / 2;
  const quadratic =
    direction.x * direction.x +
    direction.y * direction.y -
    slopeAlongRay * slopeAlongRay;
  const linear =
    2 *
    (direction.x * origin.x +
      direction.y * origin.y -
      slopeAlongRay * radiusAtOrigin);
  const constant =
    origin.x * origin.x +
    origin.y * origin.y -
    radiusAtOrigin * radiusAtOrigin;

  let intersections: number[];
  if (Math.abs(quadratic) < 1e-12) {
    if (Math.abs(linear) < 1e-12) return undefined;
    intersections = [-constant / linear];
  } else {
    const discriminant = linear * linear - 4 * quadratic * constant;
    if (discriminant < 0 || !Number.isFinite(discriminant)) return undefined;
    const root = Math.sqrt(discriminant);
    intersections = [
      (-linear - root) / (2 * quadratic),
      (-linear + root) / (2 * quadratic),
    ];
  }

  intersections = intersections
    .filter((distance) => distance > 0 && Number.isFinite(distance))
    .sort((left, right) => left - right);
  if (options.side < 0) intersections.reverse();

  const halfHeight = options.height / 2;
  for (const distance of intersections) {
    const point = {
      x: origin.x + distance * direction.x,
      y: origin.y + distance * direction.y,
      z: origin.z + distance * direction.z,
    };
    if (point.z < -halfHeight || point.z > halfHeight) continue;

    const normalizedHeight = point.z / options.height + 0.5;
    const expectedRadius = topRadius + normalizedHeight * (bottomRadius - topRadius);
    const actualRadius = Math.hypot(point.x, point.y);
    if (
      expectedRadius <= 0 ||
      Math.abs(actualRadius - expectedRadius) >
        Math.max(1, expectedRadius) * 1e-5
    ) {
      continue;
    }
    return point;
  }

  return undefined;
}

function sampleTexture(
  source: ImageData,
  textureU: number,
  textureV: number,
  destination: Uint8ClampedArray,
  destinationOffset: number,
): void {
  const wrappedU = ((textureU % 1) + 1) % 1;
  const sourceX = wrappedU * source.width;
  const sourceY = textureV * (source.height - 1);
  const x0 = Math.floor(sourceX) % source.width;
  const x1 = (x0 + 1) % source.width;
  const y0 = Math.max(0, Math.min(source.height - 1, Math.floor(sourceY)));
  const y1 = Math.min(source.height - 1, y0 + 1);
  const horizontalMix = sourceX - Math.floor(sourceX);
  const verticalMix = sourceY - Math.floor(sourceY);
  const topLeft = (y0 * source.width + x0) * 4;
  const topRight = (y0 * source.width + x1) * 4;
  const bottomLeft = (y1 * source.width + x0) * 4;
  const bottomRight = (y1 * source.width + x1) * 4;

  for (let channel = 0; channel < 4; channel++) {
    const topValue =
      source.data[topLeft + channel] * (1 - horizontalMix) +
      source.data[topRight + channel] * horizontalMix;
    const bottomValue =
      source.data[bottomLeft + channel] * (1 - horizontalMix) +
      source.data[bottomRight + channel] * horizontalMix;
    destination[destinationOffset + channel] =
      topValue * (1 - verticalMix) + bottomValue * verticalMix;
  }
}

export function renderCylinderTexture(
  destinationContext: CanvasRenderingContext2D,
  source: ImageData,
  options: CylinderRenderOptions,
): boolean {
  const width = destinationContext.canvas.width;
  const height = destinationContext.canvas.height;
  if (
    width === 0 ||
    height === 0 ||
    source.width === 0 ||
    source.height === 0 ||
    options.height <= 0 ||
    options.diameterTop <= 0 ||
    options.diameterBottom <= 0
  ) {
    return false;
  }

  const camera = estimateCamera(
    options.controlPoints,
    options.diameterTop,
    options.diameterBottom,
    options.height,
  );
  if (!camera) return false;

  const output = new ImageData(width, height);
  for (let pixelY = 0; pixelY < height; pixelY++) {
    const screenY = (pixelY + 0.5) / height;
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const screenX = (pixelX + 0.5) / width;
      const ray = {
        x:
          camera.screenToRay[0][0] * screenX +
          camera.screenToRay[0][1] * screenY +
          camera.screenToRay[0][2],
        y:
          camera.screenToRay[1][0] * screenX +
          camera.screenToRay[1][1] * screenY +
          camera.screenToRay[1][2],
        z:
          camera.screenToRay[2][0] * screenX +
          camera.screenToRay[2][1] * screenY +
          camera.screenToRay[2][2],
      };
      const hit = intersectFrustum(camera.position, ray, options);
      if (!hit) continue;

      const textureU =
        (Math.atan2(hit.y, -hit.x) + Math.PI / 2) / (2 * Math.PI);
      const textureV = hit.z / options.height + 0.5;
      if (textureV < 0 || textureV > 1) continue;

      sampleTexture(
        source,
        textureU,
        textureV,
        output.data,
        (pixelY * width + pixelX) * 4,
      );
    }
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) return false;
  outputContext.putImageData(output, 0, 0);
  destinationContext.drawImage(outputCanvas, 0, 0);
  return true;
}