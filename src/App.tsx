import "./App.css";

import { IRenderItem, ItemConfigFn } from "./canvas";
import { Canvas } from "./components/Canvas";
import { RenderTree, TreeIndex } from "./components/RenderTree";
import { useEffect, useState } from "react";
import { samples } from "./samples";
import { configs, ConfigsName } from "./configs";
import { produce } from "immer";
import { useResources } from "./hooks/use-resources";

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
  const { resources, error, isFetching } = useResources();

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
    <div
      style={{
        display: "flex",
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ flexGrow: 1, padding: "0.5rem" }}>
        Samples:{" "}
        <select
          value={sampleKey}
          onChange={(e) => {
            const sampleKey = e.target.value as keyof typeof samples;
            setSampleKey(sampleKey);
          }}
          style={{ marginBottom: "1rem" }}
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
        <br />
        {error && `Error loading resources: ${error.message}`}
        <Canvas items={selectedTree ?? []} />
        {isFetching ? "Loading..." : <br />}
      </div>

      <div
        style={{
          borderLeft: "2px solid #888",
          width: 280,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{ flexGrow: 1, height: "50%", padding: "0.5rem" }}
          onKeyDown={(e) => {
            const key = e.key;
            const divEl = e.currentTarget as HTMLDivElement;
            const items = [
              ...divEl.querySelectorAll(".render-item"),
            ] as HTMLDivElement[];
            const item = e.target as HTMLDivElement;
            const index = items.indexOf(item);
            if (index === -1) return;

            let selectEl: HTMLDivElement | undefined = undefined;
            if (key === "ArrowUp") {
              selectEl = items[index - 1];
            } else if (key === "ArrowDown") {
              selectEl = items[index + 1];
            }

            if (selectEl) {
              selectEl.focus();
              selectEl.click();
              selectEl.scrollIntoView({ block: "nearest" });
              e.preventDefault();
            }
          }}
        >
          <h3>Render tree (select items)</h3>
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
        <div
          style={{
            flexGrow: 1,
            height: "50%",
            borderTop: "1px solid #888",
            padding: "0.5rem",
          }}
        >
          <h3>Details</h3>
          <ItemConfigurator
            config={editItem?.config as IRenderItem<unknown>}
            mutateConfig={onConfigChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
