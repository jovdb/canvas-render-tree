import React from "react";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { ControlPoint } from "../components/ControlPoint";
import { ItemOverlayFn } from "../overlays";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";
import { renderCylinderTexture } from "./cyl-renderer";

interface NormalizedPoint {
  x: number;
  y: number;
}

export interface ICylConfig extends IConfig {
  controlPoints?: NormalizedPoint[];
  diameterTop?: number;
  diameterBottom?: number;
  height?: number;
  side?: 1 | -1;
}

const defaultControlPoints: NormalizedPoint[] = [
  { x: 0.38, y: 0.28 },
  { x: 0.5, y: 0.22 },
  { x: 0.62, y: 0.28 },
  { x: 0.29, y: 0.73 },
  { x: 0.5, y: 0.82 },
  { x: 0.71, y: 0.73 },
];

const schema: OperationSchema<"cyl"> = {
  name: "cyl",
  description: "Render a textured cone using six draggable perspective points",
  args: [
    {
      description: "Rendering to composite with the cylinder",
      required: true,
    },
  ],
};

/** Create a cylinder render */
function create(input: RenderTree | undefined): IRenderItem<ICylConfig>;
function create(
  config?: Partial<ICylConfig>,
  input?: RenderTree,
): IRenderItem<ICylConfig>;
function create(
  configOrInput: Partial<ICylConfig> | RenderTree | undefined = {},
  input?: RenderTree,
): IRenderItem<ICylConfig> {
  const isLegacyInput = Array.isArray(configOrInput);
  const config =
    isLegacyInput || configOrInput === undefined ? {} : configOrInput;
  const children = isLegacyInput ? configOrInput : input;

  return {
    name: "cyl",
    config: {
      controlPoints:
        config.controlPoints?.map((point) => ({ ...point })) ??
        defaultControlPoints.map((point) => ({ ...point })),
      diameterTop: config.diameterTop ?? 1,
      diameterBottom: config.diameterBottom ?? 2,
      height: config.height ?? 1.6,
      side: config.side ?? 1,
    },
    args: [Array.isArray(children) ? children : undefined],
  };
}

const CylinderControlPointsOverlay: ItemOverlayFn<ICylConfig> = ({
  config,
  mutateConfig,
}) => {
  const controlPoints =
    config.controlPoints?.length === 6
      ? config.controlPoints
      : defaultControlPoints;

  return React.createElement(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.2)",
      },
    },
    ...controlPoints.map((point, index) =>
      React.createElement(ControlPoint, {
        key: index,
        left: point.x,
        top: point.y,
        onDragInner: (x, y) => {
          mutateConfig((draftConfig) => {
            const nextPoints =
              draftConfig.controlPoints?.length === 6
                ? [...draftConfig.controlPoints]
                : defaultControlPoints.map((defaultPoint) => ({
                    ...defaultPoint,
                  }));
            nextPoints[index] = {
              x: Math.max(0, Math.min(1, x)),
              y: Math.max(0, Math.min(1, y)),
            };
            draftConfig.controlPoints = nextPoints;
          });
        },
      }),
    ),
  );
};

/** Draw a 3D cylinder */
export const draw: ItemDrawFn<ICylConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  drawPrev?.(ctx);

  const drawInput = drawArgs?.[0];
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceContext = sourceCanvas.getContext("2d");
  if (!sourceContext) throw new Error("Failed to create cylinder texture context");

  if (drawInput) {
    drawInput(sourceContext);
  } else {
    sourceContext.fillStyle = "#3264c8";
    sourceContext.fillRect(0, 0, width, height);
  }

  const cylinderConfig = config ?? {};
  renderCylinderTexture(
    ctx,
    sourceContext.getImageData(0, 0, width, height),
    {
      controlPoints: cylinderConfig.controlPoints ?? defaultControlPoints,
      diameterTop: cylinderConfig.diameterTop ?? 1,
      diameterBottom: cylinderConfig.diameterBottom ?? 2,
      height: cylinderConfig.height ?? 1.6,
      side: cylinderConfig.side ?? 1,
    },
  );

};

const operation = {
  key: "cyl",
  create,
  draw,
  schema,
  overlayComponent: CylinderControlPointsOverlay,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    cyl: typeof create;
  }
}
