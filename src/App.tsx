import "./App.css";

import { IRenderItem } from "./canvas";
import { Canvas } from "./components/Canvas";
import { useEffect, useState } from "react";
import { samples } from "./samples";
import { produce } from "immer";
import { RenderTreePanel } from "./components/RenderTreePanel";
import { TreeIndex } from "./components/RenderTree";
import { getRendererConfig } from "./configs";
import { RenderItemName } from "./operations";
import "./configs/load";


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
  // TODO: Show Tree, multiselect layers
  const [selectedItems] = useState<IRenderItem[]>([]);
  const [editIndex, setEditIndex] = useState<TreeIndex | undefined>();

  const [sampleKey, setSampleKey] = useState<keyof typeof samples>("cap");

  const [workTree, setWorkTree] = useState<IRenderItem[]>([]);

  useEffect(() => {
    const sample = samples[sampleKey];
    const tree = sample.tree();
    setWorkTree(tree);
  }, [sampleKey]);

  const selectedTree =
    workTree && selectedItems.length
      ? filterTree(workTree, selectedItems)
      : workTree ?? [];

  // Configurator
  const editItem = selectIndex(selectedTree, editIndex ?? []);
  const renderItemName = editItem?.name as RenderItemName | undefined;
  const ItemConfigurator = getRendererConfig(renderItemName) || (() => null);
  console.log(getRendererConfig(renderItemName));
  const onConfigChange = (mutate: (config: unknown) => void) => {
    const newTree = produce(workTree, (draftTree) => {
      const item = selectIndex(draftTree, editIndex ?? []);
      mutate(item?.config);
    });
    setWorkTree(newTree);
  };

  return (
    <div className="app">
      <div className="app__preview">
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
        <Canvas items={selectedTree ?? []} />
      </div>

      <div className="app__edit-panel">
        <div className="app__render-tree">
          <RenderTreePanel
            items={workTree}
            editIndex={editIndex}
            onClick={(_item, treeIndex) => {
              setEditIndex(treeIndex);
            }}
          />
        </div>
        <div className="app__render-item-details">
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
