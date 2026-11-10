import { useState } from "react";
import { IConfig, ItemConfigFn } from ".";

export const JsonConfig: ItemConfigFn<IConfig> = ({ config, mutateConfig }) => {
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
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
