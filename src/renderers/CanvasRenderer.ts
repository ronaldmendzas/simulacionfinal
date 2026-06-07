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
    const maxCanvasWidth = 800;
    const maxCanvasHeight = 600;
    this.cellSize = Math.min(maxCanvasWidth / width, maxCanvasHeight / height);
    this.canvas.width = Math.floor(width * this.cellSize);
    this.canvas.height = Math.floor(height * this.cellSize);
  }

  clear(): void {
    this.ctx.fillStyle = "#0a0a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCell(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(x * this.cellSize),
      Math.floor(y * this.cellSize),
      Math.ceil(this.cellSize),
      Math.ceil(this.cellSize)
    );
  }

  drawTriangle(x: number, y: number, direction: number, size: number, color: string): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    const s = this.cellSize * size * 0.5;

    const angles = [
      -Math.PI / 2,
      -Math.PI / 4,
      0,
      Math.PI / 4,
      Math.PI / 2,
      (3 * Math.PI) / 4,
      Math.PI,
      (-3 * Math.PI) / 4,
    ];

    const angle = angles[direction] || 0;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(angle);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(s, 0);
    this.ctx.lineTo(-s * 0.5, -s * 0.5);
    this.ctx.lineTo(-s * 0.5, s * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  drawCircle(x: number, y: number, radius: number, color: string): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * this.cellSize, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawRect(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(x * this.cellSize),
      Math.floor(y * this.cellSize),
      Math.ceil(this.cellSize),
      Math.ceil(this.cellSize)
    );
  }

  getCellSize(): number {
    return this.cellSize;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}