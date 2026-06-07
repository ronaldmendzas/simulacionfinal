export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private glowEnabled: boolean = true;
  private trailsEnabled: boolean = false;
  private trailBuffer: HTMLCanvasElement | null = null;
  private trailCtx: CanvasRenderingContext2D | null = null;

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
    const maxCanvasHeight = 680;
    this.cellSize = Math.min(maxCanvasWidth / width, maxCanvasHeight / height);
    this.canvas.width = Math.floor(width * this.cellSize);
    this.canvas.height = Math.floor(height * this.cellSize);
    this.trailBuffer = null;
    this.trailCtx = null;
  }

  clear(): void {
    if (this.trailsEnabled && this.trailBuffer) {
      this.ctx.fillStyle = "rgba(10, 10, 26, 0.15)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.trailCtx!.fillStyle = "rgba(10, 10, 26, 0.08)";
      this.trailCtx!.fillRect(0, 0, this.trailBuffer!.width, this.trailBuffer!.height);
    } else {
      this.ctx.fillStyle = "#0a0a1a";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawTriangle(x: number, y: number, direction: number, size: number, color: string, glowColor?: string): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    const s = this.cellSize * size * 0.6;

    const angles = [
      -Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4,
      Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (-3 * Math.PI) / 4,
    ];
    const angle = angles[direction] || 0;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(angle);

    if (this.glowEnabled && glowColor) {
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 6;
    }

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(s, 0);
    this.ctx.lineTo(-s * 0.6, -s * 0.5);
    this.ctx.lineTo(-s * 0.3, 0);
    this.ctx.lineTo(-s * 0.6, s * 0.5);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  drawCircle(x: number, y: number, radius: number, color: string, glowColor?: string): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    const r = radius * this.cellSize;

    if (this.glowEnabled && glowColor) {
      this.ctx.save();
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      this.ctx.save();
      this.ctx.strokeStyle = glowColor;
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = 0.3;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r * 5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.fill();
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

  drawGlowRect(x: number, y: number, color: string, glowColor: string): void {
    const px = Math.floor(x * this.cellSize);
    const py = Math.floor(y * this.cellSize);
    const size = Math.ceil(this.cellSize);

    this.ctx.save();
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 4;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(px, py, size, size);
    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, color: string = "#fff", fontSize: number = 14): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${fontSize}px 'Segoe UI', system-ui, sans-serif`;
    this.ctx.fillText(text, x, y);
  }

  drawParticle(x: number, y: number, radius: number, color: string, alpha: number = 0.6): void {
    const cx = (x + 0.5) * this.cellSize;
    const cy = (y + 0.5) * this.cellSize;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * this.cellSize * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawGrid(): void {
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255,255,255,0.03)";
    this.ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.canvasWidth; x += 10) {
      const px = x * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(px, 0);
      this.ctx.lineTo(px, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.canvasHeight; y += 10) {
      const py = y * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, py);
      this.ctx.lineTo(this.canvas.width, py);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  setGlow(enabled: boolean): void { this.glowEnabled = enabled; }
  setTrails(enabled: boolean): void { this.trailsEnabled = enabled; }
  getCellSize(): number { return this.cellSize; }
  getContext(): CanvasRenderingContext2D { return this.ctx; }
  getCanvas(): HTMLCanvasElement { return this.canvas; }
  getWidth(): number { return this.canvasWidth; }
  getHeight(): number { return this.canvasHeight; }
}