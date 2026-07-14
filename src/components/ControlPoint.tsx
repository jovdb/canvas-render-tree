import React from "react";

export interface ControlPointProps {
  /** Normalized x position (0-1) of the draggable control point */
  left: number;
  /** Normalized y position (0-1) of the draggable control point */
  top: number;
  /** Normalized x position (0-1) of the outer ring, defaults to `left` */
  outerLeft?: number;
  /** Normalized y position (0-1) of the outer ring, defaults to `top` */
  outerTop?: number;
  /** Radius in pixels */
  radius?: number;
  /** Border width in pixels */
  borderWidth?: number;
  /** Color of the control point (and outer ring, unless overridden) */
  color?: string;
  /** Whether to also render an outer ring, e.g. showing the original/anchor position */
  outer?: boolean;
  /** Color of the outer ring, defaults to `color` */
  outerColor?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  /** Whether the outer ring itself is draggable (e.g. to move the anchor/source position independently) */
  outerDraggable?: boolean;
  onOuterMouseDown?: (e: React.MouseEvent) => void;
}

/**
 * Renders a control point.
 * It always draws the draggable control point at (left, top).
 * When `outer` is true, it additionally draws an outer ring at (outerLeft, outerTop),
 * e.g. to visualize the original/anchor position the control point was moved from.
 */
export const ControlPoint: React.FC<ControlPointProps> = ({
  left,
  top,
  outerLeft = left,
  outerTop = top,
  radius = 4,
  borderWidth = 2,
  outer = false,
  onMouseDown,
  draggable = false,
  outerDraggable = false,
  onOuterMouseDown,
}) => {
  const diameter = radius * 2;

  const outerHighlightColor = "#00f"; // Highlight color for outer ring when hovering inner point
  const outerColor2 = "#88f"; // Highlight color for outer ring when hovering inner point
  const innerHighlightColor = outerHighlightColor;
  const innerColor = outerColor2;

  const [isHoveringInner, setIsHoveringInner] = React.useState(false);
  const [isHoveringOuter, setIsHoveringOuter] = React.useState(false);

  return (
    <>
      {outer && (
        <div
          onMouseDown={onOuterMouseDown}
          onMouseEnter={() => setIsHoveringOuter(true)}
          onMouseLeave={() => setIsHoveringOuter(false)}
          style={{
            position: "absolute",
            left: `${outerLeft * 100}%`,
            top: `${outerTop * 100}%`,
            width: `${radius * 2 + borderWidth}px`,
            height: `${radius * 2 + borderWidth}px`,
            borderRadius: "50%",
            backgroundColor: "transparent",
            outline: `${borderWidth}px solid ${isHoveringInner ? outerHighlightColor : outerColor2}`,
            boxSizing: "border-box",
            transform: "translate(-50%, -50%)",
            cursor: outerDraggable ? "move" : undefined,
            userSelect: "none",
          }}
        />
      )}
      <div
        onMouseDown={onMouseDown}
        onMouseEnter={() => setIsHoveringInner(true)}
        onMouseLeave={() => setIsHoveringInner(false)}
        style={{
          position: "absolute",
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          width: `calc(${diameter}px - 1px)`,
          height: `calc(${diameter}px - 1px)`,
          borderRadius: "50%",
          backgroundColor: isHoveringOuter ? innerHighlightColor : innerColor,
          boxSizing: "border-box",
          transform: "translate(-50%, -50%)",
          cursor: draggable ? "move" : undefined,
          userSelect: "none",
          outline: `2px solid white`,
        }}
      />
    </>
  );
};
