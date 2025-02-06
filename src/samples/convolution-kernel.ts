import { IRenderItem } from '../canvas';
import { operations } from '../operations';
import { kernels } from '../kernels';
import { IRenderResources } from '../resources';

export function convolutionSamplesTree(resources: IRenderResources) {
  const commonTextProps = {
    fontSize: 20,
    fontFamilyName: 'Arial',
    foregroundColor: '#2222DD',
  };
  const imageProps = {
    image: resources.glass,
    targetRect: [0, 10, 200, 200],
  } as const;

  const commonKernelProps: Partial<
    Parameters<typeof operations.convolve>[0]
  > = {};

  const tree: IRenderItem[] = [
    operations.fillColor(),
    operations.transform({ translateX: 30, translateY: 30 }, [
      operations.drawImage({
        ...imageProps,
      }),
      operations.drawText({ ...commonTextProps, text: 'Original' }),
    ]),
    operations.transform({ translateX: 260, translateY: 30 }, [
      operations.layer([
        operations.drawImage({
          ...imageProps,
        }),
        operations.convolve({
          ...commonKernelProps,
          kernel: kernels.embossKernel(),
        }),
      ]),
      operations.drawText({
        ...commonTextProps,
        text: 'Emboss',
      }),
    ]),
    operations.transform({ translateX: 30, translateY: 270 }, [
      operations.layer([
        operations.drawImage({
          ...imageProps,
        }),
        operations.convolve({
          ...commonKernelProps,
          // debugKernel: true,
          kernel: kernels.guassianBlurKernel(5, 5/2),
        }),
      ]),
      operations.drawText({ ...commonTextProps, text: 'Gaussian Blur' }),
    ]),
    operations.transform({ translateX: 260, translateY: 270 }, [
      operations.layer([
        operations.drawImage({
          ...imageProps,
        }),
        operations.convolve({
          ...commonKernelProps,
          kernel: kernels.edgeDetectKernel(),
        }),
        // operations.invert(),
      ]),
      operations.drawText({
        ...commonTextProps,
        text: 'Edge Detection',
      }),
    ]),
  ];
  return tree;
}
