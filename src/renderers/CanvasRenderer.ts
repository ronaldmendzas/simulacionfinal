export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private tick: number = 0;

  constructor(canvasId: string, width: number, height: number) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.cellSize = 1;
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.resize(width, height);
  }

  advanceTick(): number { this.tick++; return this.tick; }
  getTick(): number { return this.tick; }

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

  drawGradientBg(color1: string, color2: string, vertical: boolean = true): void {
    const grad = vertical
      ? this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
      : this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    this.ctx.fillStyle = grad;
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

  drawGlowCircle(x: number, y: number, baseRadius: number, color: string, glowColor: string, pulseSpeed: number = 0.1): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    const r = baseRadius * this.cellSize;
    const pulse = 1 + Math.sin(this.tick * pulseSpeed) * 0.3;
    const glowR = r * 2.5 * pulse;

    const grad = this.ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowR);
    grad.addColorStop(0, color);
    grad.addColorStop(0.4, glowColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    this.ctx.fill();
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

  drawPulsatingRect(x: number, y: number, color: string, glowColor: string, speed: number = 0.12): void {
    const px = Math.floor(x * this.cellSize);
    const py = Math.floor(y * this.cellSize);
    const size = Math.ceil(this.cellSize);
    const pulse = 0.6 + Math.sin(this.tick * speed) * 0.4;

    this.ctx.save();
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 6 + pulse * 8;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(px, py, size, size);
    this.ctx.restore();
  }

  drawFireRect(x: number, y: number): void {
    const px = Math.floor(x * this.cellSize);
    const py = Math.floor(y * this.cellSize);
    const size = Math.ceil(this.cellSize);
    const flicker = Math.random();

    const colors = ["#ef4444", "#f97316", "#eab308", "#dc2626"];
    const ci = Math.floor(flicker * colors.length) % colors.length;

    this.ctx.save();
    this.ctx.shadowColor = "#fbbf24";
    this.ctx.shadowBlur = 4 + flicker * 6;
    this.ctx.fillStyle = colors[ci];
    this.ctx.fillRect(px, py, size, size);
    this.ctx.restore();
  }

  drawXMark(x: number, y: number, color: string): void {
    const px = Math.floor(x * this.cellSize);
    const py = Math.floor(y * this.cellSize);
    const size = Math.ceil(this.cellSize);
    const pad = size * 0.25;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = Math.max(1, size * 0.15);
    this.ctx.beginPath();
    this.ctx.moveTo(px + pad, py + pad);
    this.ctx.lineTo(px + size - pad, py + size - pad);
    this.ctx.moveTo(px + size - pad, py + pad);
    this.ctx.lineTo(px + pad, py + size - pad);
    this.ctx.stroke();
  }

  drawGradientRect(x: number, y: number, color1: string, color2: number[], alpha: number = 1): void {
    const px = Math.floor(x * this.cellSize);
    const py = Math.floor(y * this.cellSize);
    const size = Math.ceil(this.cellSize);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    const grad = this.ctx.createLinearGradient(px, py, px + size, py + size);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, `rgba(${color2[0]},${color2[1]},${color2[2]},1)`);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(px, py, size, size);
    this.ctx.restore();
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