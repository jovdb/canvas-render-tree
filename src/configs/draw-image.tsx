import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IDrawImageConfig } from "../operations/draw-image";
import { availableImages } from "../resources";

export const DrawImageConfig: ItemConfigFn<IDrawImageConfig> = ({
  config,
  mutateConfig,
}) => {
  const { imageUrl } = config;

  const [resourceName] = availableImages
    ? (Object.entries(availableImages).find(([_resourceName, imageUrl2]) => {
        return imageUrl === imageUrl2;
      }) ?? [undefined, undefined])
    : [undefined, undefined];

  return (
    <div>
      image:{" "}
      <select
        value={resourceName}
        onChange={(e) => {
          const resourceName = e.target.value as keyof typeof availableImages;
          mutateConfig((draftConfig) => {
            draftConfig.imageUrl = availableImages[resourceName];
          });
        }}
      >
        {availableImages &&
          Object.keys(availableImages).map((resourceName) => {
            return (
              <option key={resourceName} value={resourceName}>
                {resourceName}
              </option>
            );
          })}
      </select>
    </div>
  );
};

addRendererConfig("drawImage", DrawImageConfig);
