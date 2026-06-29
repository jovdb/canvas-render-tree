// import { IRenderItem } from "../canvas";
// import { IConfig } from "../configs";
// import { OperationSchema } from "../schemas";
// import { addOperation, operations } from ".";

// export interface IRepaintConfig extends IConfig {}

// const schema: OperationSchema<"repaint"> = {
//   name: "repaint",
//   description: "Repaint pixels based on transparency (same as blend source-in)",
//   input: {
//     required: true,
//   },
//   args: [],
// };

// /**
//  * Repaint pixels based on transparency
//  * Same as blend("source-in")
//  */
// export const create = (
//   /** Repaint with
//    * 1 draw operation required, bundle in layer if needed
//    */
//   repaintWith: [IRenderItem],
// ): IRenderItem<IRepaintConfig> => ({
//   name: "repaint",
//   input: [operations.blend("source-in", repaintWith)],
// });

// const operation = {
//   key: "repaint",
//   create,
//   draw: undefined,
//   schema,
// } as const;
// addOperation(operation);

// declare global {
//   interface IOperations {
//     repaint: typeof create;
//   }
// }
