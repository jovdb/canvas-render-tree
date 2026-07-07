import { IRenderItem, ItemDrawFn } from "../canvas";
import { IConfig } from "../configs";
import { ItemOverlayFn } from "../overlays";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";
import React, { useState, useEffect } from "react";

export interface IDrawTextConfig extends IConfig {
  text: string;
  x?: number;
  y?: number;
  foregroundColor?: string;
  fontSize?: number;
  fontFamilyName?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

// Overlay component for drawText position - just a draggable blue dot
const DrawTextOverlay: ItemOverlayFn<IDrawTextConfig> = ({
  config,
  mutateConfig,
}) => {
  const { x = 100, y = 100 } = config || {};
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startConfig, setStartConfig] = useState({ x: 0, y: 0 });
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);

    // Store the starting position and config
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartConfig({ x: x || 0, y: y || 0 });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !overlayRef.current) return;

    // Calculate the delta in pixels
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    // Calculate new pixel coordinates (no clamping - allow negative or > container size)
    const newX = startConfig.x + dx;
    const newY = startConfig.y + dy;

    mutateConfig((newConfig: IDrawTextConfig) => {
      newConfig.x = newX;
      newConfig.y = newY;
    });

    // Update start position for next move event
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartConfig({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // x and y are pixel coordinates - convert to normalized for display
  // Get container size from parent
  const container = overlayRef.current?.parentElement;
  const containerWidth = container?.offsetWidth || 500;
  const containerHeight = container?.offsetHeight || 500;
  // Don't clamp - allow negative or > 1 for positions outside canvas
  const normalizedX = typeof x === "number" ? x / containerWidth : 0;
  const normalizedY = typeof y === "number" ? y / containerHeight : 0;

  // Add document event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, startPos, startConfig]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.4)",
      }}
    >
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          left: `${normalizedX * 100}%`,
          top: `${normalizedY * 100}%`,
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: "blue",
          transform: "translate(-50%, -50%)",
          cursor: "move",
          pointerEvents: "auto",
        }}
        onMouseDown={handleMouseDown}
        title="Drag to move text position"
      />
    </div>
  );
};

const schema: OperationSchema<"drawText"> = {
  name: "drawText",
  description: "Draw text on the canvas",
  getName: (config) =>
    config
      ? `drawText: "${
          ((config as IDrawTextConfig).text || "").length > 10
            ? ((config as IDrawTextConfig).text || "").substring(0, 10) + "..."
            : (config as IDrawTextConfig).text || ""
        }"`
      : "drawText",
};

export const draw: ItemDrawFn<IDrawTextConfig> = ({
  ctx,
  drawPrev,
  config,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  const {
    text,
    foregroundColor = "#000",
    fontSize = 16,
    fontFamilyName = "Arial",
    isBold = false,
    isItalic = false,
    x = 0,
    y = 0,
  } = config;

  ctx.fillStyle = foregroundColor;
  ctx.font = `${isBold ? "bold" : ""} ${
    isItalic ? "italic" : ""
  }${fontSize}px '${fontFamilyName}'`;
  ctx.fillText(text, x, y);
};

/** Draw text on a canvas */
const create = (config: IDrawTextConfig): IRenderItem<IDrawTextConfig> => ({
  name: "drawText",
  config: {
    ...config,
    text: config.text ?? "Text",
    x: config.x ?? 100,
    y: config.y ?? 100,
    foregroundColor: config.foregroundColor ?? "#000",
    fontSize: config.fontSize ?? 16,
    fontFamilyName: config.fontFamilyName ?? "Arial",
    isBold: config.isBold ?? false,
    isItalic: config.isItalic ?? false,
  },
  args: [],
});

const operation = {
  key: "drawText",
  create,
  draw,
  schema,
  overlayComponent: DrawTextOverlay,
} as const;
addOperation(operation);
declare global {
  interface IOperations {
    drawText: typeof create;
  }
}
