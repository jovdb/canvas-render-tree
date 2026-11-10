/** Indexes in tree */
export type TreeIndex = number[];

/** Returns true when `index` is `ancestor` itself or a descendant of it. */
export function isWithinTree(index: TreeIndex, ancestor: TreeIndex): boolean {
  return (
    index.length >= ancestor.length &&
    ancestor.every((value, i) => index[i] === value)
  );
}
