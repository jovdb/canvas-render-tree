import { useState } from "react";
import { ItemConfigFn } from "../canvas";
import { RenderItemName } from "../operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const configs: Partial<Record<RenderItemName, ItemConfigFn<any>>> = {} as const;

export function addRendererConfig(
  name: RenderItemName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rendererConfig: ItemConfigFn<any>,
) {
  // Disabled for hot module reloading
  // if (configs[name as RenderItemName]) {
  //   throw new Error(`Renderer config for '${name}' already exists`);
  // }
  configs[name as RenderItemName] = rendererConfig;
}

export function getRendererConfig(
  name: RenderItemName | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ItemConfigFn<any> | undefined {
  if (!name) return undefined;
  const configComponent = configs[name as RenderItemName];
  return configComponent;
}

export const JsonConfig: ItemConfigFn<unknown> = ({ config, mutateConfig }) => {
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Get value of textarea
        const textAreaEl = (e.target as HTMLFormElement).elements.namedItem(
          "json",
        ) as HTMLTextAreaElement;
        try {
          const parsed = JSON.parse(textAreaEl.value);
          mutateConfig((config) =>
            config !== null && typeof config === "object"
              ? Object.assign(config, parsed)
              : config,
          );
          setError("");
        } catch (err) {
          console.error("Invalid JSON", err);
          setError("Invalid JSON: " + (err as Error).message);
        }
      }}
    >
      <button type="submit" style={{ marginBottom: "10px" }}>
        Update
      </button>
      <br />
      <span style={{ color: "red" }}>{error}</span>
      <textarea
        name="json"
        style={{ fontFamily: "monospace", width: "100%", height: "150px" }}
        defaultValue={JSON.stringify(config, null, 2)}
      />
    </form>
  );
};
