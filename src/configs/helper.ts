/** Helper function to edit a config property */
export function mutateProp<
  TConfig extends object,
  TPropName extends keyof TConfig,
  TType extends TConfig[TPropName],
>(
  config: TConfig,
  propName: TPropName,
  mutateConfig: (mutate: (config: Pick<TConfig, TPropName>) => void) => void,
) {
  return [
    config[propName],
    (value: TType) => {
      mutateConfig((draft) => {
        if (draft) draft[propName] = value;
      });
    },
  ] as const;
}
