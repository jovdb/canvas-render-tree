export interface ILogger {
  log(s: string): void;
}

// Wrap strings with quotes
function logArgs(args: ArrayLike<unknown>) {
  return `${[...args]
    .map((v) => {
      const type = typeof v;
      return type === 'string' || type === 'object'
        ? JSON.stringify(v)
        : `${v}`;
    })
    .join(', ')}`;
}

export class CanvasContext implements Partial<CanvasRenderingContext2D> {
  private ctx: CanvasRenderingContext2D;
  private logger: ILogger | undefined;
  private name: string;

  constructor(ctx: CanvasRenderingContext2D, logger?: ILogger, name = 'ctx') {
    this.ctx = ctx;
    this.logger = logger;
    this.name = name;
    this.logger?.log(`const ${this.name} = new CanvasrenderingContext2D`);
  }

  drawImage(): void {
    this.logger?.log(
      `${this.name}.drawImage(image, ${logArgs([...arguments].slice(1))})`
    );
    this.ctx.drawImage.apply(this.ctx, arguments);
  }

  reset() {
    this.logger?.log(`${this.name}.reset()`);
    this.ctx.reset();
  }

  save() {
    this.logger?.log(`${this.name}.save()`);
    this.ctx.save();
  }

  restore() {
    this.logger?.log(`${this.name}.restore()`);
    this.ctx.restore();
  }

  fillRect() {
    this.logger?.log(`${this.name}.fillRect(${logArgs(arguments)})`);
    this.ctx.fillRect.apply(this.ctx, arguments);
  }

  clearRect() {
    this.logger?.log(`${this.name}.clearRect(${logArgs(arguments)})`);
    this.ctx.clearRect.apply(this.ctx, arguments);
  }

  strokeRect() {
    this.logger?.log(`${this.name}.strokeRect(${logArgs(arguments)})`);
    this.ctx.strokeRect.apply(this.ctx, arguments);
  }

  fillText() {
    this.logger?.log(`${this.name}.fillText(${logArgs(arguments)})`);
    this.ctx.fillText.apply(this.ctx, arguments);
  }

  measureText() {
    return this.ctx.measureText.apply(this.ctx, arguments);
  }

  translate() {
    this.logger?.log(`${this.name}.translate(${logArgs(arguments)})`);
    this.ctx.translate.apply(this.ctx, arguments);
  }

  get canvas() {
    return this.ctx.canvas;
  }

  getImageData() {
    this.logger?.log(`${this.name}.getImageData(${logArgs(arguments)})`);
    return this.ctx.getImageData.apply(this.ctx, arguments);
  }
  putImageData() {
    this.logger?.log(`${this.name}.putImageData(<data>)`);
    return this.ctx.putImageData.apply(this.ctx, arguments);
  }

  set fillStyle(v: string) {
    this.logger?.log(`${this.name}.fillStyle = '${v}'`);
    this.ctx.fillStyle = v;
  }

  set strokeStyle(v: string) {
    this.logger?.log(`${this.name}.strokeStyle = '${v}'`);
    this.ctx.strokeStyle = v;
  }

  set globalCompositeOperation(v: GlobalCompositeOperation) {
    this.logger?.log(`${this.name}.globalCompositeOperation = '${v}'`);
    this.ctx.globalCompositeOperation = v;
  }

  set shadowBlur(v: number) {
    this.logger?.log(`${this.name}.shadowBlur = ${v}`);
    this.ctx.shadowBlur = v;
  }

  set shadowOffsetX(v: number) {
    this.logger?.log(`${this.name}.shadowOffsetX = ${v}`);
    this.ctx.shadowOffsetX = v;
  }

  set shadowOffsetY(v: number) {
    this.logger?.log(`${this.name}.shadowOffsetY = ${v}`);
    this.ctx.shadowOffsetY = v;
  }

  set shadowColor(v: string) {
    this.logger?.log(`${this.name}.shadowColor = '${v}'`);
    this.ctx.shadowColor = v;
  }

  set globalAlpha(v: number) {
    this.logger?.log(`${this.name}.globalAlpha = ${v}`);
    this.ctx.globalAlpha = v;
  }

  set font(v: string) {
    this.logger?.log(`${this.name}.font = '${v}'`);
    this.ctx.font = v;
  }
}
