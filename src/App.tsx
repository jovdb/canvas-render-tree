import "./App.css";

import { IRenderItem } from "./canvas";
import { AppOverlay } from "./components/AppOverlay";
import { Canvas } from "./components/Canvas";
import { useEffect, useMemo, useState, useTransition } from "react";
import "./operations";
import "./operations/operations";

import { samples } from "./samples";
import { produce } from "immer";
import { RenderTreePanel } from "./components/RenderTreePanel";
import { TreeIndex } from "./components/RenderTree";
import { getRendererConfig, IConfig, JsonConfig } from "./configs";
import { RenderItemName } from "./operations";
import "./configs/load";
import { schemas, OperationSchema } from "./schemas";
import { getRendererOverlay } from "./overlays";
import { useWorkTree, useWorkTreeActions } from "./stores/useWorkTreeStore";

export function selectIndex(tree: IRenderItem[], index: TreeIndex) {
  if (index.length === 0) return undefined;
  if (index.length === 1) return tree[index[0]];

  const [nextIndex, ...restIndex] = index;
  const restTree = tree[nextIndex];
  const items = [
    ...(restTree.args ? restTree.args.flat() : []),
    ...(restTree.input ? restTree.input : []),
  ];
  if (!restTree || !items) return undefined;
  return selectIndex(items, restIndex);
}

function filterTree(
  items: readonly IRenderItem[] | undefined,
  visibleIndexes: readonly TreeIndex[],
  parentTreeIndexes: TreeIndex = [],
) {
  const newItems: IRenderItem[] = [];

  items?.forEach((item, index) => {
    const treeIndex = [...parentTreeIndexes, index];
    const items = [
      ...(item.args ? item.args.flat() : []),
      ...(item.input ? item.input : []),
    ];
    const children = filterTree(items, visibleIndexes, treeIndex);

    if (
      visibleIndexes.some(
        (visibleTreeIndex) =>
          JSON.stringify(visibleTreeIndex) === JSON.stringify(treeIndex),
      )
    ) {
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

function replaceWithInput(
  items: readonly IRenderItem[],
  targetIndex: TreeIndex,
): IRenderItem[] {
  if (targetIndex.length === 0) return [...items];

  const [targetPos, ...restIndex] = targetIndex;

  if (restIndex.length === 0) {
    // Replace item at root level
    const newItems = [...items];
    const itemToReplace = newItems[targetPos];
    if (itemToReplace) {
      const replacementItems = itemToReplace.input ?? [];
      newItems.splice(targetPos, 1, ...replacementItems);
    }
    return newItems;
  }

  // Need to recurse into a specific item's children
  const newItems = [...items];
  const parentItem = newItems[targetPos];
  if (!parentItem) return newItems;

  const [childTargetPos, ...childRestIndex] = restIndex;
  const flatArgs = parentItem.args?.flat() ?? [];
  if (childTargetPos < flatArgs.length) {
    // Target is in args
    let positionInFoundArg = childTargetPos;
    let foundArgIndex = -1;

    for (let i = 0; i < (parentItem.args?.length ?? 0); i++) {
      const arg = parentItem.args![i];
      if (positionInFoundArg < arg.length) {
        foundArgIndex = i;
        break;
      }
      positionInFoundArg -= arg.length;
    }

    if (foundArgIndex >= 0 && parentItem.args) {
      const newArgs = [...parentItem.args];
      const argArray = [...newArgs[foundArgIndex]];

      if (childRestIndex.length === 0) {
        // Replace this arg item with its input
        const itemToReplace = argArray[positionInFoundArg];
        const replacementItems = itemToReplace?.input ?? [];
        argArray.splice(positionInFoundArg, 1, ...replacementItems);
      } else {
        // Recurse deeper into this arg
        const newArgArray = replaceWithInput(argArray, [
          positionInFoundArg,
          ...childRestIndex,
        ]);
        newArgs[foundArgIndex] = newArgArray;
      }

      newItems[targetPos] = {
        ...parentItem,
        args: newArgs.length > 0 ? newArgs : undefined,
      };
    }
  } else {
    // Target is in input
    const positionInInput = childTargetPos - flatArgs.length;
    const input = parentItem.input ?? [];

    if (childRestIndex.length === 0) {
      // Replace this input item with its input
      const newInput = [...input];
      const itemToReplace = newInput[positionInInput];
      const replacementItems = itemToReplace?.input ?? [];
      newInput.splice(positionInInput, 1, ...replacementItems);
      newItems[targetPos] = {
        ...parentItem,
        input: newInput.length > 0 ? newInput : undefined,
      };
    } else {
      // Recurse into input
      const newInput = replaceWithInput(input, [
        positionInInput,
        ...childRestIndex,
      ]);
      newItems[targetPos] = {
        ...parentItem,
        input: newInput.length > 0 ? newInput : undefined,
      };
    }
  }

  return newItems;
}

function App() {
  const [editIndex, setEditIndex] = useState<TreeIndex | undefined>();
  const [visibleIndexes, setVisibleIndexes] = useState<TreeIndex[]>([]);

  /** Working tree is a copy of the entire sample and can be modified */
  const workTree = useWorkTree();
  const { setWorkTree, updateWorkTree, resetWorkTree } = useWorkTreeActions();

  const [sampleKey, setSampleKey] = useState<string>("opacity");

  useEffect(() => {
    const tree = samples[sampleKey]?.tree() ?? [];
    resetWorkTree(tree);
    setEditIndex([]);
    setVisibleIndexes([]);
  }, [resetWorkTree, sampleKey]);

  /** The items to render, workTree with selection filter */
  const renderTree =
    workTree && visibleIndexes.length
      ? filterTree(workTree, visibleIndexes)
      : (workTree ?? []);
  // console.log(JSON.stringify(renderTree, null, 2));

  // Configurator
  const editItem = selectIndex(workTree, editIndex ?? []);
  const renderItemName = editItem?.name as RenderItemName | undefined;
  const ItemConfigurator = getRendererConfig(renderItemName) || (() => null);

  const RendererOverlay = getRendererOverlay(renderItemName);

  const [_isPending, startTransition] = useTransition();
  const onConfigChange = (mutate: (config: IConfig) => void) => {
    const newTree = produce(workTree, (draftTree) => {
      const item = selectIndex(draftTree, editIndex ?? []);
      const cfg = item?.config;
      if (cfg) mutate(cfg);
    });
    startTransition(() => updateWorkTree(() => newTree));
  };

  const schema = useMemo(() => {
    if (!editItem) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (schemas as unknown as any)[editItem.name] as
      | OperationSchema<string>
      | undefined;
  }, [editItem]);

  const sampleGroups = Object.values(samples)
    .map((sample) => sample.type)
    .filter((value, index, self) => self.indexOf(value) === index);

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
          {sampleGroups.map((group) => (
            <optgroup label={group} key={group}>
              {Object.keys(samples)
                .filter(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (key) => (samples as any)[key]?.type === group,
                )
                .map((key) => {
                  return (
                    <option key={key} value={key}>
                      {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ((samples as any)[key] as unknown as IRenderItem).name
                      }
                    </option>
                  );
                })}
            </optgroup>
          ))}
        </select>
        <br />
        <div className="app__canvas">
          <Canvas items={renderTree ?? []} />
          <AppOverlay>
            {RendererOverlay && (
              <RendererOverlay
                config={editItem?.config ?? {}}
                mutateConfig={onConfigChange}
              />
            )}
          </AppOverlay>
        </div>
      </div>

      <div className="app__edit-panel">
        <div className="app__render-tree">
          <RenderTreePanel
            items={workTree}
            editIndex={editIndex}
            visibleIndexes={visibleIndexes}
            onClick={(_item, treeIndex) => {
              setEditIndex(treeIndex);
            }}
            onDelete={(_item, treeIndex) => {
              setWorkTree(replaceWithInput(workTree, treeIndex));
            }}
            onVisibilityChange={(_item, treeIndex) => {
              setVisibleIndexes((prev) => {
                const treeItemSTring = JSON.stringify(treeIndex);
                const isSelected = prev.some(
                  (treeIndex) => JSON.stringify(treeIndex) === treeItemSTring,
                );
                if (isSelected) {
                  return prev.filter(
                    (treeIndex) => JSON.stringify(treeIndex) !== treeItemSTring,
                  );
                } else {
                  return [...prev, treeIndex];
                }
              });
            }}
            onTreeChange={(newTree) => {
              setWorkTree(newTree);
              console.log("New tree:", JSON.stringify(newTree, null, 2));
            }}
          />
        </div>
        <div className="app__render-item-info">
          <h3>Info</h3>
          {schema?.description && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Description:</strong> {schema?.description}
            </div>
          )}
        </div>
        <div className="app__render-item-details">
          <h3>Details</h3>
          <ItemConfigurator
            config={editItem?.config as IRenderItem<IConfig>}
            mutateConfig={onConfigChange}
          />
        </div>
        <div className="app__render-item-json">
          <h3>JSON</h3>
          {editItem && (
            <JsonConfig
              key={JSON.stringify(editItem?.config)}
              config={editItem?.config as IRenderItem<IConfig>}
              mutateConfig={onConfigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
