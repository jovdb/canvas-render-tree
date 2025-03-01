import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IDrawTextConfig } from "../operations/draw-text";
import { ColorConfig } from "./color";

export const DrawTextConfig: ItemConfigFn<IDrawTextConfig> = ({
  config,
  mutateConfig,
}) => {
  const {
    foregroundColor = "#000",
    fontSize = 16,
    fontFamilyName = "Arial",
    text = "",
  } = config;

  return (
    <div>
      <div>
        Text:{" "}
        <input
          value={text}
          onChange={(e) => {
            const newText = e.target.value;
            mutateConfig((draftConfig) => {
              draftConfig.text = newText;
            });
          }}
        />
      </div>
      <div>
        Font Size:{" "}
        <input
          type="number"
          min="1"
          value={fontSize}
          style={{
            width: "3rem",
          }}
          onChange={(e) => {
            const newFontSize = parseInt(e.target.value, 10);
            mutateConfig((draftConfig) => {
              draftConfig.fontSize = newFontSize;
            });
          }}
        />
      </div>
      <div>
        Font Family:{" "}
        <select
          value={fontFamilyName}
          onChange={(e) => {
            const newFontFamily = e.target.value;
            mutateConfig((draftConfig) => {
              draftConfig.fontFamilyName = newFontFamily;
            });
          }}
        >
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>
      <div>
        Font Color:{" "}
        <ColorConfig
          color={foregroundColor}
          onChange={(newColor) => {
            mutateConfig((draftConfig) => {
              draftConfig.foregroundColor = newColor;
            });
          }}
        />
      </div>
    </div>
  );
};

addRendererConfig("drawText", DrawTextConfig);
