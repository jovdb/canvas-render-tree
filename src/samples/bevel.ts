import { IRenderItem } from "../canvas";
import { operations } from "../operations";

export function bevel1Tree() {
  const x = 40;
  const offsetX = 220;
  const y = 150;
  const commonTextProps: Parameters<typeof operations.drawText>[0] = {
    text: "SY",
    x,
    fontSize: 160,
    fontFamilyName: "Arial",
    foregroundColor: "#CC0000",
  };
  const commonTextProps2: Parameters<typeof operations.drawText>[0] = {
    ...commonTextProps,
    text: "SY",
    x: commonTextProps.x! + offsetX,
  };

  const bevelProps: Partial<Parameters<typeof operations.bevel>[0]> = {};
  const bevelProps2: Partial<Parameters<typeof operations.bevel>[0]> = {
    ...bevelProps,
    onlyBevel: true,
  };

  // Tests for kernels
  const tree: IRenderItem[] = [
    operations.bevel({ ...bevelProps }, [
      operations.drawText({
        ...commonTextProps,
        x,
        y,
      }),
    ]),

    operations.bevel({ ...bevelProps2 }, [
      operations.drawText({
        ...commonTextProps2,
        y,
      }),
    ]),

    operations.bevel(
      {
        ...bevelProps,
        bevelSize: 10,
      },
      [
        operations.drawText({
          ...commonTextProps,
          y: y + commonTextProps.fontSize!,
        }),
      ],
    ),

    operations.bevel(
      {
        ...bevelProps2,
        bevelSize: 10,
      },
      [
        operations.drawText({
          ...commonTextProps2,
          y: y + commonTextProps.fontSize!,
        }),
      ],
    ),

    operations.bevel(
      {
        ...bevelProps,
        bevelSize: 3,
      },
      [
        operations.drawText({
          ...commonTextProps,
          y: y + commonTextProps.fontSize! * 2,
        }),
      ],
    ),

    operations.bevel(
      {
        ...bevelProps2,
        bevelSize: 3,
      },
      [
        operations.drawText({
          ...commonTextProps2,
          y: y + commonTextProps.fontSize! * 2,
        }),
      ],
    ),
  ];
  return tree;
}
