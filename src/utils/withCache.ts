/** Cache results of an async function, use with pipe */
export function withCache<TResult>(options: {
  cacheMap: Map<string, TResult>;
  argsToKey?: (args: unknown[]) => string;
}) {
  const { cacheMap, argsToKey = (args) => JSON.stringify(args) } = options;

  /** Add a cache to an async function */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function addCache<TFn extends (...args: any[]) => TResult>(fn: TFn) {
    /** A function that caches */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function cacheWrapper(...args: any[]) {
      const key = argsToKey(args);

      // used function to have better call stack
      let result = cacheMap.get(key);
      if (result !== undefined) {
        return result; // Return cached promise
      }

      result = fn(...args); // Execute
      cacheMap.set(key, result); // add promise to the cache
      return result;
    } as TFn;
  };
}

