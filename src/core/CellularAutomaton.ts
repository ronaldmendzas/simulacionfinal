export interface CellularAutomatonConfig {
  width: number;
  height: number;
  boundaryType: "toroidal" | "fixed";
}

export abstract class CellularAutomaton<T> {
  protected width: number;
  protected height: number;
  protected boundaryType: "toroidal" | "fixed";
  protected grid: T[][];
  protected generation: number;
  protected running: boolean;

  constructor(config: CellularAutomatonConfig) {
    this.width = config.width;
    this.height = config.height;
    this.boundaryType = config.boundaryType;
    this.grid = this.createGrid();
    this.generation = 0;
    this.running = false;
  }

  protected createGrid(): T[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => this.getDefaultState())
    );
  }

  protected abstract getDefaultState(): T;

  abstract step(): void;
  abstract reset(): void;

  getGrid(): T[][] {
    return this.grid;
  }

  getGeneration(): number {
    return this.generation;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  isRunning(): boolean {
    return this.running;
  }

  setRunning(running: boolean): void {
    this.running = running;
  }

  getCell(x: number, y: number): T {
    if (this.boundaryType === "toroidal") {
      x = ((x % this.width) + this.width) % this.width;
      y = ((y % this.height) + this.height) % this.height;
    }
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return this.getDefaultState();
    }
    return this.grid[y][x];
  }

  setCell(x: number, y: number, state: T): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y][x] = state;
    }
  }

  getMooreNeighbors(x: number, y: number, radius: number = 1): T[] {
    const neighbors: T[] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        neighbors.push(this.getCell(x + dx, y + dy));
      }
    }
    return neighbors;
  }

  getVonNeumannNeighbors(x: number, y: number, radius: number = 1): T[] {
    const neighbors: T[] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (Math.abs(dx) + Math.abs(dy) <= radius) {
          neighbors.push(this.getCell(x + dx, y + dy));
        }
      }
    }
    return neighbors;
  }

  getMooreNeighborCoords(x: number, y: number, radius: number = 1): Array<[number, number]> {
    const coords: Array<[number, number]> = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        let nx = x + dx;
        let ny = y + dy;
        if (this.boundaryType === "toroidal") {
          nx = ((nx % this.width) + this.width) % this.width;
          ny = ((ny % this.height) + this.height) % this.height;
        }
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          coords.push([nx, ny]);
        }
      }
    }
    return coords;
  }
}