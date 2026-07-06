import { addRendererConfig, ItemConfigFn } from ".";
import { IThinPlatesSplinesConfig } from "../operations/thin-plate-splines";

export const ThinPlatesSplinesConfig: ItemConfigFn<
  IThinPlatesSplinesConfig
> = ({ config, mutateConfig }) => {
  const { strength = 1.0, regularization = 0.001 } = config || {};

  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Strength: {strength.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={strength}
          onChange={(e) => {
            mutateConfig((newConfig: IThinPlatesSplinesConfig) => {
              newConfig.strength = parseFloat(e.target.value);
            });
          }}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Regularization: {regularization.toFixed(4)}
        </label>
        <input
          type="range"
          min="0"
          max="0.01"
          step="0.0001"
          value={regularization}
          onChange={(e) => {
            mutateConfig((newConfig: IThinPlatesSplinesConfig) => {
              newConfig.regularization = parseFloat(e.target.value);
            });
          }}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ fontSize: "12px", color: "#666" }}>
        <p>Click and drag blue points to move source positions.</p>
        <p>Click and drag green points to move target positions.</p>
        <p>Lines show the deformation direction.</p>
      </div>
    </div>
  );
};

addRendererConfig("thinPlateSplines", ThinPlatesSplinesConfig);
