import React from "react";

export interface ControlPointProps {
  left: number; // Normalized x position (0-1)
  top: number; // Normalized y position (0-1)
  radius?: number; // Radius in pixels
  borderWidth?: number; // Border width in pixels
  color?: string; // Color of the control point
  outer?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  draggable?: boolean;
}

export const ControlPoint: React.FC<ControlPointProps> = ({
  left,
  top,
  radius = 4,
  borderWidth = 2,
  color = "blue",
  outer = true,
  onMouseDown,
  draggable = false,
}) => {
  const diameter = radius * 2;
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: `${left * 100}%`,
        top: `${top * 100}%`,
        width: outer ? `${diameter}px` : `calc(${diameter}px - 1px)`,
        height: outer ? `${diameter}px` : `calc(${diameter}px - 1px)`,
        borderRadius: "50%",
        backgroundColor: outer ? "transparent" : color,
        border: outer ? `${borderWidth}px solid ${color}` : undefined,
        transform: "translate(-50%, -50%)",
        cursor: draggable ? "move" : undefined,
        userSelect: "none",
      }}
    />
  );
};
