// drawText: No input
// opacity: input
// uvmap: input + uvmap renders

import { IRenderItem } from "./canvas";
import { IConfig } from "./configs";

//
export interface OperationRenderArg {
  description?: string;
  required?: boolean;
}

export interface OperationSchema<TOperationName extends string> {
  name: TOperationName;

  /** Short name to show in the block */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getName?: (config: IConfig | undefined) => string;

  description?: string;
  input?: OperationRenderArg | undefined;
  args?: OperationRenderArg[];
}

export const schemas: Record<string, OperationSchema<string>> = {};

export function validateSchema(renderItem: IRenderItem, hasPrev: boolean) {
  const operationName = renderItem.name;
  const schema = schemas[operationName as keyof typeof schemas] as
    | OperationSchema<string>
    | undefined;

  if (!schema) return undefined; // No schema, no validation

  // Expected input
  if (schema?.input && (schema.input.required ?? true)) {
    if (!Array.isArray(renderItem.input) || renderItem.input.length === 0) {
      throw new Error(`Operation "${operationName}" requires input`);
    } else {
      // Validate child input
      validateSchemas(renderItem.input);
    }
  }

  // Don't expect input
  if (!schema?.input) {
    if (Array.isArray(renderItem.input) && renderItem.input.length !== 0) {
      throw new Error(`Operation "${operationName}" does not expect input`);
    }
  }

  return schema;
}

export function validateSchemas(renderTree: IRenderItem[]) {
  renderTree.forEach((item) => {
    const itemPrev = renderTree[renderTree.indexOf(item) - 1];
    validateSchema(item, !!itemPrev);
  });
}

export function getSchema<T extends string>(
  name: T,
): OperationSchema<T> | undefined;
export function getSchema(name: string): OperationSchema<string> | undefined;
export function getSchema(name: string): OperationSchema<string> | undefined {
  return schemas[name as keyof typeof schemas];
}

export function addSchema<T extends string>(schema: OperationSchema<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemas[schema.name as unknown as any] = schema;
}
