export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasId: string, width: number, height: number) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.cellSize = 1;
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    const maxCanvasWidth = 900;
    const maxCanvasHeight = 660;
    this.cellSize = Math.min(maxCanvasWidth / width, maxCanvasHeight / height);
    this.canvas.width = Math.floor(width * this.cellSize);
    this.canvas.height = Math.floor(height * this.cellSize);
  }

  clear(): void {
    this.ctx.fillStyle = "#1a1d23";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTriangle(x: number, y: number, direction: number, size: number, color: string): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    const s = this.cellSize * size * 0.55;

    const angles = [
      -Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4,
      Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (-3 * Math.PI) / 4,
    ];
    const angle = angles[direction] || 0;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(angle);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(s, 0);
    this.ctx.lineTo(-s * 0.5, -s * 0.45);
    this.ctx.lineTo(-s * 0.2, 0);
    this.ctx.lineTo(-s * 0.5, s * 0.45);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  drawCircle(x: number, y: number, radius: number, color: string, strokeColor?: string): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    const r = radius * this.cellSize;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();

    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawRect(x: number, y: number, color: string, alpha: number = 1): void {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    const px = Math.floor(x * this.cellSize);
    const py = Math.floor(y * this.cellSize);
    const size = Math.ceil(this.cellSize);
    this.ctx.fillRect(px, py, size, size);
    this.ctx.restore();
  }

  drawBorderedRect(x: number, y: number, fillColor: string, borderColor: string): void {
    const px = Math.floor(x * this.cellSize);
    const py = Math.floor(y * this.cellSize);
    const size = Math.ceil(this.cellSize);
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(px, py, size, size);
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  }

  drawText(text: string, x: number, y: number, color: string = "#fff", fontSize: number = 12): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px -apple-system, sans-serif`;
    this.ctx.fillText(text, x, y);
  }

  getCellSize(): number { return this.cellSize; }
  getContext(): CanvasRenderingContext2D { return this.ctx; }
  getCanvas(): HTMLCanvasElement { return this.canvas; }
  getWidth(): number { return this.canvasWidth; }
  getHeight(): number { return this.canvasHeight; }
}