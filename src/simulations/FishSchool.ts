import { CellularAutomaton, type CellularAutomatonConfig } from "../core/CellularAutomaton.ts";

export const Direction = {
  N: 0, NE: 1, E: 2, SE: 3,
  S: 4, SW: 5, W: 6, NW: 7,
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

export const FishSpeed = { SLOW: 1, MEDIUM: 2, FAST: 3 } as const;
export type FishSpeed = (typeof FishSpeed)[keyof typeof FishSpeed];

export interface FishCell {
  type: "empty" | "fish" | "predator" | "obstacle";
  direction: number;
  speed: number;
}

export interface FishSchoolConfig extends CellularAutomatonConfig {
  fishCount: number;
  hasPredator: boolean;
  obstacleDensity: number;
  perceptionRadius: number;
  speedMultiplier: number;
}

const DIRECTION_DX = [0, 1, 1, 1, 0, -1, -1, -1];
const DIRECTION_DY = [-1, -1, 0, 1, 1, 1, 0, -1];

export class FishSchool extends CellularAutomaton<FishCell> {
  private fishCount: number;
  private hasPredator: boolean;
  private obstacleDensity: number;
  private perceptionRadius: number;

  constructor(config: FishSchoolConfig) {
    super(config);
    this.fishCount = config.fishCount;
    this.hasPredator = config.hasPredator;
    this.obstacleDensity = config.obstacleDensity;
    this.perceptionRadius = config.perceptionRadius;
    this.reset();
  }

  protected getDefaultState(): FishCell {
    return { type: "empty", direction: Direction.N, speed: FishSpeed.MEDIUM };
  }

  reset(): void {
    this.generation = 0;
    this.grid = this.createGrid();
    this.initialize();
  }

  protected initialize(): void {
    for (let i = 0; i < this.fishCount; i++) {
      let x: number, y: number;
      do {
        x = Math.floor(Math.random() * this.width);
        y = Math.floor(Math.random() * this.height);
      } while (this.grid[y][x].type !== "empty");

      this.grid[y][x] = {
        type: "fish",
        direction: Math.floor(Math.random() * 8),
        speed: [FishSpeed.SLOW, FishSpeed.MEDIUM, FishSpeed.FAST][Math.floor(Math.random() * 3)],
      };
    }

    if (this.hasPredator) {
      const px = Math.floor(Math.random() * this.width);
      const py = Math.floor(Math.random() * this.height);
      if (this.grid[py][px].type === "empty") {
        this.grid[py][px] = { type: "predator", direction: Math.floor(Math.random() * 8), speed: FishSpeed.FAST };
      }
    }

    const obstacleCount = Math.floor(this.width * this.height * this.obstacleDensity);
    for (let i = 0; i < obstacleCount; i++) {
      const ox = Math.floor(Math.random() * this.width);
      const oy = Math.floor(Math.random() * this.height);
      if (this.grid[oy][ox].type === "empty") {
        this.grid[oy][ox] = { type: "obstacle", direction: Direction.N, speed: FishSpeed.SLOW };
      }
    }
  }

  step(): void {
    const newGrid = this.grid.map(row => row.map(cell => ({ ...cell })));
    const moved = Array.from({ length: this.height }, () => Array(this.width).fill(false));

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell.type !== "fish" && cell.type !== "predator") continue;
        if (moved[y][x]) continue;

        // Velocidad discreta: lento = se mueve cada 2 ticks, rapido = cada tick
        if (cell.type === "fish" && cell.speed === FishSpeed.SLOW && this.generation % 2 !== 0) continue;

        if (cell.type === "predator") {
          this.movePredator(x, y, newGrid, moved);
          continue;
        }

        const neighbors1 = this.getMooreNeighbors(x, y, 1);
        const closeFish = neighbors1.filter(n => n.type === "fish");
        const sepDir = this.computeSeparation(x, y, closeFish);
        const alignDir = this.computeAlignment(x, y);
        const cohDir = this.computeCohesion(x, y);
        const predDir = this.computePredatorAvoidance(x, y);
        const obsDir = this.computeObstacleAvoidance(x, y);

        let finalDir: number;

        if (predDir !== null) {
          finalDir = predDir;
        } else if (obsDir !== null) {
          finalDir = obsDir;
        } else if (closeFish.length >= 2) {
          finalDir = sepDir;
        } else {
          const weights = [sepDir, alignDir, cohDir];
          const validDirs = weights.filter((d): d is number => d !== null);
          if (validDirs.length > 0) {
            let dx = 0, dy = 0;
            for (const d of validDirs) {
              dx += DIRECTION_DX[d];
              dy += DIRECTION_DY[d];
            }
            finalDir = this.vectorToDirection(dx, dy);
          } else {
            finalDir = cell.direction;
          }
        }

        const nx = x + DIRECTION_DX[finalDir];
        const ny = y + DIRECTION_DY[finalDir];

        let destX: number, destY: number;
        if (this.boundaryType === "toroidal") {
          destX = ((nx % this.width) + this.width) % this.width;
          destY = ((ny % this.height) + this.height) % this.height;
        } else {
          destX = nx;
          destY = ny;
        }

        if (
          destX >= 0 && destX < this.width &&
          destY >= 0 && destY < this.height &&
          newGrid[destY][destX].type === "empty" &&
          !moved[destY][destX]
        ) {
          newGrid[destY][destX] = { ...cell, direction: finalDir };
          newGrid[y][x] = this.getDefaultState();
          moved[destY][destX] = true;
          moved[y][x] = true;
        } else {
          newGrid[y][x] = { ...cell, direction: finalDir };
          moved[y][x] = true;
        }
      }
    }

    this.grid = newGrid;
    this.generation++;
  }

  private computeSeparation(x: number, y: number, _closeFish: FishCell[]): number {
    if (_closeFish.length === 0) return this.grid[y][x].direction;
    let dx = 0, dy = 0;
    const neighborCoords = this.getMooreNeighborCoords(x, y, 1);
    for (const [nx, ny] of neighborCoords) {
      if (this.grid[ny][nx].type === "fish") {
        dx += x - nx;
        dy += y - ny;
      }
    }
    if (dx === 0 && dy === 0) return (this.grid[y][x].direction + 4) % 8;
    return this.vectorToDirection(dx, dy);
  }

  private computeAlignment(x: number, y: number): number {
    const neighbors = this.getMooreNeighborCoords(x, y, 2);
    let dx = 0, dy = 0, count = 0;
    for (const [nx, ny] of neighbors) {
      if (this.grid[ny][nx].type === "fish") {
        dx += DIRECTION_DX[this.grid[ny][nx].direction];
        dy += DIRECTION_DY[this.grid[ny][nx].direction];
        count++;
      }
    }
    if (count === 0) return this.grid[y][x].direction;
    return this.vectorToDirection(dx, dy);
  }

  private computeCohesion(x: number, y: number): number {
    const neighbors = this.getMooreNeighborCoords(x, y, this.perceptionRadius);
    let cx = 0, cy = 0, count = 0;
    for (const [nx, ny] of neighbors) {
      if (this.grid[ny][nx].type === "fish") {
        cx += nx;
        cy += ny;
        count++;
      }
    }
    if (count < 3) {
      if (count === 0) return this.grid[y][x].direction;
      cx /= count;
      cy /= count;
      return this.vectorToDirection(cx - x, cy - y);
    }
    return this.grid[y][x].direction;
  }

  private computePredatorAvoidance(x: number, y: number): number | null {
    const predatorRadius = 5;
    const coords = this.getMooreNeighborCoords(x, y, predatorRadius);
    for (const [nx, ny] of coords) {
      if (this.grid[ny][nx].type === "predator") {
        return this.vectorToDirection(x - nx, y - ny);
      }
    }
    return null;
  }

  private computeObstacleAvoidance(x: number, y: number): number | null {
    const coords = this.getMooreNeighborCoords(x, y, 1);
    for (const [nx, ny] of coords) {
      if (this.grid[ny][nx].type === "obstacle") {
        return this.vectorToDirection(x - nx, y - ny);
      }
    }
    return null;
  }

  private movePredator(x: number, y: number, newGrid: FishCell[][], moved: boolean[][]): void {
    const neighbors = this.getMooreNeighborCoords(x, y, 3);
    let targetX = x, targetY = y;
    let minDist = Infinity;

    for (const [nx, ny] of neighbors) {
      if (this.grid[ny][nx].type === "fish") {
        const dist = Math.abs(nx - x) + Math.abs(ny - y);
        if (dist < minDist) {
          minDist = dist;
          targetX = nx;
          targetY = ny;
        }
      }
    }

    if (targetX === x && targetY === y) {
      const dir = Math.floor(Math.random() * 8);
      targetX = x + DIRECTION_DX[dir];
      targetY = y + DIRECTION_DY[dir];
    }

    const ddx = Math.sign(targetX - x);
    const ddy = Math.sign(targetY - y);
    const dir = this.vectorToDirection(ddx, ddy);

    let nx = x + DIRECTION_DX[dir] * 2;
    let ny = y + DIRECTION_DY[dir] * 2;

    if (this.boundaryType === "toroidal") {
      nx = ((nx % this.width) + this.width) % this.width;
      ny = ((ny % this.height) + this.height) % this.height;
    }

    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && newGrid[ny][nx].type !== "obstacle") {
      if (newGrid[ny][nx].type === "fish" || (newGrid[ny][nx].type === "empty" && !moved[ny][nx])) {
        newGrid[ny][nx] = { type: "predator", direction: dir, speed: FishSpeed.FAST };
        newGrid[y][x] = this.getDefaultState();
        moved[ny][nx] = true;
        moved[y][x] = true;
      }
    } else {
      newGrid[y][x] = { ...this.grid[y][x], direction: dir };
      moved[y][x] = true;
    }
  }

  private vectorToDirection(dx: number, dy: number): number {
    const angle = Math.atan2(dy, dx);
    const deg = ((angle * 180) / Math.PI + 360) % 360;
    const sector = Math.round(deg / 45) % 8;
    const mapping = [2, 3, 4, 5, 6, 7, 0, 1];
    return mapping[sector];
  }

  setFishCount(count: number): void { this.fishCount = count; this.reset(); }
  setPredator(active: boolean): void { this.hasPredator = active; this.reset(); }
  setObstacleDensity(density: number): void { this.obstacleDensity = density; this.reset(); }
  setPerceptionRadius(radius: number): void { this.perceptionRadius = radius; }
  setBoundaryType(type: "toroidal" | "fixed"): void { this.boundaryType = type; this.reset(); }
}