import { ItemConfigFn } from "../canvas";
import { useResources } from "../hooks/use-resources";
import { IDrawImageConfig } from "../operations/draw-image";

export const DrawImageConfig: ItemConfigFn<IDrawImageConfig> = ({
  config,
  mutateConfig,
}) => {
  const { image } = config;
  const { resources } = useResources();

  const [resourceName] = resources
    ? Object.entries(resources).find(([_resourceName, image2]) => {
        return image === image2;
      }) ?? [undefined, undefined]
    : [undefined, undefined];

  return (
    <div>
      image:{" "}
      <select
        value={resourceName}
        onChange={(e) => {
          const resourceName = e.target.value as keyof typeof resources;
          mutateConfig((draftConfig) => {
            if (!resources) return;
            draftConfig.image = resources[resourceName];
          });
        }}
      >
        {resources &&
          Object.keys(resources).map((resourceName) => {
            return <option value={resourceName}>{resourceName}</option>;
          })}
      </select>
    </div>
  );
};
