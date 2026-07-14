import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { kernels } from "../kernels";
import { availableImages } from "../resources";

export function convolutionSamplesTree() {
  const commonTextProps: Partial<Parameters<typeof operations.drawText>[0]> = {
    fontSize: 20,
    fontFamilyName: "Arial",
    foregroundColor: "#2222DD",
    x: 45,
    y: 5,
  };
  const imageProps = {
    imageUrl: availableImages.glass,
    targetRect: [0, 10, 200, 200],
  } as const;

  const commonKernelProps: Partial<Parameters<typeof operations.convolve>[0]> =
    {};

  const tree: RenderTree = [
    operations.fillColor({ color: "#ffffff" }),
    operations.transform({ translateX: 30, translateY: 30 }, [
      operations.drawImage({
        ...imageProps,
      }),
      operations.drawText({ ...commonTextProps, text: "Original" }),
    ]),
    operations.transform({ translateX: 260, translateY: 30 }, [
      operations.convolve(
        {
          ...commonKernelProps,
          kernel: kernels.embossKernel(),
        },
        [
          operations.drawImage({
            ...imageProps,
          }),
        ],
      ),
      operations.drawText({
        ...commonTextProps,
        text: "Emboss",
      }),
    ]),
    operations.transform({ translateX: 30, translateY: 270 }, [
      operations.convolve(
        {
          ...commonKernelProps,
          // debugKernel: true,
          kernel: kernels.gaussianBlurKernel(5, 5 / 2),
        },
        [
          operations.drawImage({
            ...imageProps,
          }),
        ],
      ),

      operations.drawText({ ...commonTextProps, text: "Gaussian Blur" }),
    ]),
    operations.transform({ translateX: 260, translateY: 270 }, [
      operations.convolve(
        {
          ...commonKernelProps,
          kernel: kernels.edgeDetectKernel(),
        },
        [
          operations.drawImage({
            ...imageProps,
          }),
        ],
      ),
      // operations.invert(),
      operations.drawText({
        ...commonTextProps,
        text: "Edge Detection",
      }),
    ]),
  ];
  return tree;
}
