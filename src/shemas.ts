// drawText: No input
// opacity: input
// uvmap: input + uvmap renders

import { IRenderItem } from "./canvas";
import { drawImageSchema } from "./operations/draw-image";
import { opacitySchema } from "./operations/opacity";
import { shadowSchema } from "./operations/shadow";

//
export interface OperationRenderArg {
  description?: string;
  required?: boolean;
}

export interface OperationSchema<TOperationName extends string> {
  name: TOperationName;
  description?: string;
  input?: OperationRenderArg | undefined;
  args?: OperationRenderArg[];
}

export const schemas = {
  drawImage: drawImageSchema,
  opacity: opacitySchema,
  shadow: shadowSchema,
};

export function validateSchema(renderItem: IRenderItem) {
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

  if (!schema?.input) {
    if (Array.isArray(renderItem.input) && renderItem.input.length !== 0) {
      throw new Error(`Operation "${operationName}" does not expect input`);
    }
  }

  return schema;
}

export function validateSchemas(renderTree: IRenderItem[]) {
  renderTree.forEach((item) => {
    validateSchema(item);
  });
}
