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
  /** Whether to also render an outer ring, e.g. showing the original/anchor position */
  outer?: boolean;
  onDragInner?: (x: number, y: number) => void;
  onDragOuter?: (x: number, y: number) => void;
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
  outer = false,
  onDragInner,
  onDragOuter,
}) => {
  const radius = 4;
  const borderWidth = 2;
  const diameter = radius * 2;
  const innerRef = React.useRef<HTMLDivElement>(null);
  const outerRef = React.useRef<HTMLDivElement>(null);

  const onDragInnerRef = React.useRef(onDragInner);
  onDragInnerRef.current = onDragInner;

  const onDragOuterRef = React.useRef(onDragOuter);
  onDragOuterRef.current = onDragOuter;

  const outerHighlightColor = "#00f"; // Highlight color for outer ring when hovering inner point
  const outerColor2 = "#88f"; // Highlight color for outer ring when hovering inner point
  const innerHighlightColor = outerHighlightColor;
  const innerColor = outerColor2;

  const [isHoveringInner, setIsHoveringInner] = React.useState(false);
  const [isDraggingInner, setIsDraggingInner] = React.useState(false);
  const [isDraggingOuter, setIsDraggingOuter] = React.useState(false);
  const [isHoveringOuter, setIsHoveringOuter] = React.useState(false);

  React.useEffect(() => {
    if (!isDraggingInner || !innerRef.current) return;

    const offsetParent = innerRef.current.offsetParent as HTMLElement;
    if (!offsetParent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const offsetRect = offsetParent.getBoundingClientRect();
      const x = (e.clientX - offsetRect.left) / offsetRect.width;
      const y = (e.clientY - offsetRect.top) / offsetRect.height;
      onDragInnerRef.current?.(x, y);
    };

    const handleMouseUp = () => {
      setIsDraggingInner(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingInner]);

  React.useEffect(() => {
    if (!isDraggingOuter || !outerRef.current) return;

    const offsetParent = outerRef.current.offsetParent as HTMLElement;
    if (!offsetParent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const offsetRect = offsetParent.getBoundingClientRect();
      const x = (e.clientX - offsetRect.left) / offsetRect.width;
      const y = (e.clientY - offsetRect.top) / offsetRect.height;
      onDragOuterRef.current?.(x, y);
    };

    const handleMouseUp = () => {
      setIsDraggingOuter(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingOuter]);

  return (
    <>
      {outer && (
        <div
          ref={outerRef}
          onMouseEnter={() => setIsHoveringOuter(true)}
          onMouseLeave={() => setIsHoveringOuter(false)}
          onClick={() => {
            onDragInner?.(outerLeft, outerTop);
          }}
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
            cursor: onDragOuter ? "move" : "pointer",
            userSelect: "none",
          }}
        />
      )}
      <div
        ref={innerRef}
        onMouseEnter={() => setIsHoveringInner(true)}
        onMouseLeave={() => setIsHoveringInner(false)}
        onMouseDown={(e) => {
          if (onDragInner) {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingInner(true);
          }
        }}
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
          cursor: onDragInner ? "move" : undefined,
          userSelect: "none",
          outline: `2px solid white`,
        }}
      />
    </>
  );
};
