import React from "react";
import { ControlPoint, ControlPointProps } from "./ControlPoint";

export interface FreeControlPoint {
  /** Normalized x position (0-1) */
  x: number;
  /** Normalized y position (0-1) */
  y: number;
  /** Normalized x displacement (-1 to 1) */
  dx: number;
  /** Normalized y displacement (-1 to 1) */
  dy: number;
}

export interface FreeControlPointsConfig {
  /** Control points with source position (x,y) and displacement (dx,dy) */
  controlPoints?: FreeControlPoint[];
}

export interface FreeControlPointsOverlayProps<
  TConfig extends FreeControlPointsConfig,
> {
  config: Readonly<TConfig>;
  mutateConfig: (mutate: (config: TConfig) => void) => void;
  /** Whether to show connecting lines */
  showLines?: boolean;
  /** Line color */
  lineColor?: string;
  /** Custom point component props */
  pointProps?: Partial<ControlPointProps>;
}

/**
 * A reusable overlay component for managing free control points with displacement
 * Can be used by any operation that needs control points (TPS, Beier-Neely, etc.)
 */
export function FreeControlPointsOverlay<
  TConfig extends FreeControlPointsConfig,
>({
  config,
  mutateConfig,
  showLines = true,
  lineColor = "rgba(255, 255, 0, 0.5)",
  pointProps = {},
}: FreeControlPointsOverlayProps<TConfig>) {
  const { controlPoints = [] } = config || {};

  const addPoint = () => {
    mutateConfig((newConfig: TConfig) => {
      newConfig.controlPoints = [
        ...(newConfig.controlPoints || []),
        { x: 0.5, y: 0.5, dx: 0, dy: 0 },
      ];
    });
  };

  const removePoint = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mutateConfig((newConfig: TConfig) => {
      const newControlPoints = [...(newConfig.controlPoints || [])];
      newControlPoints.splice(index, 1);
      newConfig.controlPoints = newControlPoints;
    });
  };

  const points = [];

  for (let i = 0; i < controlPoints.length; i++) {
    const cp = controlPoints[i];
    const sourceX = cp.x;
    const sourceY = cp.y;
    const targetX = cp.x + cp.dx;
    const targetY = cp.y + cp.dy;

    // Combined control point:
    // - draggable main point (filled) at the target/displaced position
    // - outer ring at the source/anchor position, also independently draggable
    points.push(
      <ControlPoint
        key={`cp-${i}`}
        left={targetX}
        top={targetY}
        outer
        outerLeft={sourceX}
        outerTop={sourceY}
        draggable={true}
        onDragInner={(x, y) => {
          mutateConfig((newConfig: TConfig) => {
            const newControlPoints = [...(newConfig.controlPoints || [])];
            const cp = newControlPoints[i];
            newControlPoints[i] = {
              ...cp,
              dx: x - cp.x,
              dy: y - cp.y,
            };
            newConfig.controlPoints = newControlPoints;
          });
        }}
        outerDraggable={true}
        onDragOuter={(x, y) => {
          mutateConfig((newConfig: TConfig) => {
            const newControlPoints = [...(newConfig.controlPoints || [])];
            const cp = newControlPoints[i];
            newControlPoints[i] = {
              ...cp,
              x,
              y,
            };
            newConfig.controlPoints = newControlPoints;
          });
        }}
        {...pointProps}
      />,
    );

    // Line connecting source to target
    if (showLines) {
      points.push(
        <div
          key={`line-${i}`}
          style={{
            position: "absolute",
            left: `${sourceX * 100}%`,
            top: `${sourceY * 100}%`,
            width: `${Math.abs(targetX - sourceX) * 100}%`,
            height: `${Math.abs(targetY - sourceY) * 100}%`,
            border: `1px solid ${lineColor}`,
            transform: `translate(${targetX > sourceX ? 0 : -100}%, ${targetY > sourceY ? 0 : -100}%) rotate(${Math.atan2(targetY - sourceY, targetX - sourceX)}rad)`,
            pointerEvents: "none",
            borderRadius: "0",
          }}
        />,
      );
    }

    // Remove button for each pair
    points.push(
      <div
        key={`remove-${i}`}
        onClick={removePoint(i)}
        style={{
          position: "absolute",
          left: `${targetX * 100}%`,
          top: `calc(${targetY * 100}% - 16px)`,
          width: "20px",
          height: "20px",
          backgroundColor: "red",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transform: "translate(-50%, -50%)",
          fontSize: "12px",
          color: "white",
          userSelect: "none",
        }}
        title="Remove point"
      >
        ×
      </div>,
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.4)",
      }}
    >
      {points}
      <button
        onClick={addPoint}
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          padding: "5px 10px",
          backgroundColor: "rgba(255,255,255,0.7)",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        + Add Point
      </button>
    </div>
  );
}
