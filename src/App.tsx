import "./App.css";

import { loadResourcesAsync } from "./resources";
import { IRenderItem, ItemConfigFn } from "./canvas";
import { Canvas } from "./components/Canvas";
import { RenderTree, TreeIndex } from "./components/RenderTree";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { samples } from "./samples";
import { configs, ConfigsName } from "./configs";
import { produce } from "immer";

export function selectIndex(tree: IRenderItem[], index: TreeIndex) {
  if (index.length === 0) return undefined;
  if (index.length === 1) return tree[index[0]];

  const [nextIndex, ...restIndex] = index;
  const restTree = tree[nextIndex];
  if (!restTree || !restTree.children) return undefined;
  return selectIndex(restTree.children, restIndex);
}

function filterTree(
  items: readonly IRenderItem[] | undefined,
  selectedItems: readonly IRenderItem[]
) {
  const newItems: IRenderItem[] = [];

  items?.forEach((item) => {
    const children = filterTree(item.children, selectedItems);

    if (selectedItems.includes(item)) {
      const clonedItem = {
        ...item,
        children,
      };
      newItems.push(clonedItem);
    } else {
      newItems.push(...children);
    }
  });
  return newItems;
}

function App() {
  const {
    data: resources,
    error,
    isFetching,
  } = useQuery({
    queryFn: () => loadResourcesAsync(),
    queryKey: ["init"],
  });

  // TODO: Show Tree, multiselect layers
  const [selectedItems] = useState<IRenderItem[]>([]);
  const [editIndex, setEditIndex] = useState<TreeIndex | undefined>();

  const [sampleKey, setSampleKey] = useState<keyof typeof samples>("cap");

  const [workTree, setWorkTree] = useState<IRenderItem[]>([]);

  useEffect(() => {
    if (!resources) return undefined;
    const sample = samples[sampleKey];
    const tree = sample.tree(resources);
    setWorkTree(tree);
  }, [resources, sampleKey]);

  const selectedTree =
    workTree && selectedItems.length
      ? filterTree(workTree, selectedItems)
      : workTree ?? [];

  // Configurator
  const editItem = selectIndex(selectedTree, editIndex ?? []);
  const configName = editItem?.name as ConfigsName | undefined;
  const ItemConfigurator =
    configName && configs[configName]
      ? (configs[configName] as ItemConfigFn)
      : () => null;

  const onConfigChange = (mutate: (config: unknown) => void) => {
    const newTree = produce(workTree, (draftTree) => {
      const item = selectIndex(draftTree, editIndex ?? []);
      mutate(item?.config);
    });
    setWorkTree(newTree);
  };

  return (
    <>
      Samples:{" "}
      <select
        value={sampleKey}
        onChange={(e) => {
          const sampleKey = e.target.value as keyof typeof samples;
          setSampleKey(sampleKey);
        }}
      >
        {Object.keys(samples).map((key) => (
          <option key={key} value={key}>
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((samples as any)[key] as unknown as IRenderItem).name
            }
          </option>
        ))}
      </select>
      <hr />
      {error && `Error loading resources: ${error.message}`}
      <Canvas items={selectedTree ?? []} />
      {isFetching ? "Loading..." : <br />}
      <hr />
      <div>
        <h3>Render tree (select items)</h3>
        <div style={{ display: "flex" }}>
          <div>
            <RenderTree
              items={workTree}
              selectedItems={selectedItems}
              parentIndexes={[]}
              editIndex={editIndex}
              onClick={(_item, treeIndex) => {
                /*
                setSelectedItems((prev) => {
                  const has = prev.includes(item);
                  return has ? prev.filter((i) => i !== item) : [...prev, item];
                });*/
                setEditIndex(treeIndex);
              }}
            />
          </div>
          <div style={{ marginLeft: "1rem" }}>
            <fieldset>
              <ItemConfigurator
                config={editItem?.config as IRenderItem<unknown>}
                mutateConfig={onConfigChange}
              />
            </fieldset>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
