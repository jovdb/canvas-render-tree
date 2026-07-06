import React from "react";
import { addOperation } from ".";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig, ItemConfigFn } from "../configs";
import { OperationSchema } from "../schemas";

export interface IOpacityConfig extends IConfig {
  opacity: number;
}

const schema: OperationSchema<"opacity"> = {
  name: "opacity",
  description: "Draw each child with the given opacity",
  getName: (config) =>
    config
      ? `opacity: ${Math.round(((config as IOpacityConfig).opacity ?? 0.5) * 100)}%`
      : "opacity",
  args: [
    {
      description: "Rendering to apply opacity to",
      required: true,
    },
  ],
};

export const draw: ItemDrawFn<IOpacityConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  ctx.save();
  ctx.globalAlpha = config.opacity ?? 0.5;
  drawArgs?.[0]?.(ctx);
  ctx.restore();
};

const create = (
  opacity: number = 0.5,
  /** When passed, only the children will have opacity */
  input: RenderTree | undefined,
): IRenderItem<IOpacityConfig> => ({
  name: "opacity",
  config: { opacity },
  args: [input],
});

export const OpacityConfig: ItemConfigFn<IOpacityConfig> = ({
  config,
  mutateConfig,
}) => {
  const opacity = config.opacity ?? 0.5;

  return React.createElement(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "0.25rem" } },
    React.createElement("label", { htmlFor: "opacity-slider" }, "Opacity"),
    React.createElement("input", {
      id: "opacity-slider",
      type: "range",
      min: "0",
      max: "1",
      step: "0.01",
      value: opacity,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        mutateConfig((draftConfig) => {
          draftConfig.opacity = parseFloat(event.target.value);
        });
      },
    }),
    React.createElement("div", null, `${Math.round(opacity * 100)}%`),
  );
};

const operation = {
  key: "opacity",
  create,
  draw,
  schema,
  configComponent: OpacityConfig,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    opacity: typeof create;
  }
}
