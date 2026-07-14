import { addRendererConfig, ItemConfigFn } from ".";
import { addRendererOverlay, ItemOverlayFn } from "../overlays";
import { ControlPoint } from "../components/ControlPoint";
import {
  createOriginalGrid,
  IBicubicGridConfig,
} from "../operations/bicubic-grid";
import React, { useState } from "react";

export const BicubicGridConfig: ItemConfigFn<IBicubicGridConfig> = () => {
  return (
    <div style={{ fontSize: "12px", color: "#666" }}>
      <p>Drag the control points in the canvas to warp the grid.</p>
    </div>
  );
};

addRendererConfig("bicubicGrid", BicubicGridConfig);

/**
 * Overlay showing the bicubic grid control points.
 * Each point can be dragged from its original grid position to deform the image.
 */
export const BicubicGridOverlay: ItemOverlayFn<IBicubicGridConfig> = ({
  config,
  mutateConfig,
}) => {
  const { controlsPoints } = config || {};
  const [dragged, setDragged] = useState<{
    row: number;
    col: number;
  } | null>(null);

  if (!controlsPoints || !controlsPoints.length) return null;

  const rows = controlsPoints.length;
  const cols = controlsPoints[0].length;
  const originalGrid = createOriginalGrid(rows, cols);

  const handleMouseDown =
    (row: number, col: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragged({ row, col });
    };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragged) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mutateConfig((newConfig) => {
      newConfig.controlsPoints[dragged.row][dragged.col] = { x, y };
    });
  };

  const handleMouseUp = () => setDragged(null);

  const elements: React.ReactNode[] = [];

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const original = originalGrid[j][i];
      const current = controlsPoints[j][i];

      // Combined control point: draggable current position (filled),
      // with an outer ring showing the original grid position
      elements.push(
        <ControlPoint
          key={`cp-${j}-${i}`}
          left={current.x}
          top={current.y}
          outer
          outerLeft={original.x}
          outerTop={original.y}
          draggable
          onMouseDown={handleMouseDown(j, i)}
        />,
      );
    }
  }

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {elements}
    </div>
  );
};

addRendererOverlay("bicubicGrid", BicubicGridOverlay);
