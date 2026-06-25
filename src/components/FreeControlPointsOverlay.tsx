import React, { useState } from "react";
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

export interface FreeControlPointsOverlayProps<TConfig extends FreeControlPointsConfig> {
  config: Readonly<TConfig>;
  mutateConfig: (mutate: (config: TConfig) => void) => void;
  /** Color for source/anchor points */
  sourceColor?: string;
  /** Color for target/displaced points */
  targetColor?: string;
  /** Whether to show connecting lines */
  showLines?: boolean;
  /** Line color */
  lineColor?: string;
  /** Custom point component props */
  sourcePointProps?: Partial<ControlPointProps>;
  targetPointProps?: Partial<ControlPointProps>;
}

/**
 * A reusable overlay component for managing free control points with displacement
 * Can be used by any operation that needs control points (TPS, Beier-Neely, etc.)
 */
export function FreeControlPointsOverlay<TConfig extends FreeControlPointsConfig>({
  config,
  mutateConfig,
  sourceColor = "blue",
  targetColor = "green",
  showLines = true,
  lineColor = "rgba(255, 255, 0, 0.5)",
  sourcePointProps = {},
  targetPointProps = {},
}: FreeControlPointsOverlayProps<TConfig>) {
  const { controlPoints = [] } = config || {};

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragMode, setDragMode] = useState<"position" | "target">("target");

  const handleMouseDown =
    (index: number, mode: "position" | "target") => (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggedIndex(index);
      setDragMode(mode);
    };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    mutateConfig((newConfig: TConfig) => {
      const newControlPoints = [...(newConfig.controlPoints || [])];

      if (draggedIndex >= newControlPoints.length) {
        // Add new point at the dragged position
        newControlPoints.push({ x: normalizedX, y: normalizedY, dx: 0, dy: 0 });
      }

      if (dragMode === "position") {
        // Move the source position
        newControlPoints[draggedIndex] = {
          ...newControlPoints[draggedIndex],
          x: normalizedX,
          y: normalizedY,
        };
      } else {
        // Move the target position (by adjusting dx/dy)
        const cp = newControlPoints[draggedIndex];
        newControlPoints[draggedIndex] = {
          ...cp,
          dx: normalizedX - cp.x,
          dy: normalizedY - cp.y,
        };
      }

      newConfig.controlPoints = newControlPoints;
    });
  };

  const handleMouseUp = () => {
    setDraggedIndex(null);
  };

  const handleMouseLeave = () => {
    setDraggedIndex(null);
  };

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

    // Source point (blue) - the anchor position
    points.push(
      <ControlPoint
        key={`src-${i}`}
        left={sourceX}
        top={sourceY}
        color={sourceColor}
        draggable={true}
        onMouseDown={handleMouseDown(i, "position")}
        {...sourcePointProps}
      />,
    );

    // Target point (green) - where it should move to
    points.push(
      <ControlPoint
        key={`tgt-${i}`}
        left={targetX}
        top={targetY}
        color={targetColor}
        outer={false}
        draggable={true}
        onMouseDown={handleMouseDown(i, "target")}
        {...targetPointProps}
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
            transform: `translate(${(targetX > sourceX ? 0 : -100)}%, ${(targetY > sourceY ? 0 : -100)}%) rotate(${Math.atan2(targetY - sourceY, targetX - sourceX)}rad)`,
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
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
