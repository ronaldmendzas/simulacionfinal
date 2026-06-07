import { CellularAutomaton, type CellularAutomatonConfig } from "../core/CellularAutomaton.ts";

export const EvacCellType = {
  EMPTY: 0,
  PERSON: 1,
  WALL: 2,
  EXIT: 3,
  FIRE: 4,
} as const;
export type EvacCellType = (typeof EvacCellType)[keyof typeof EvacCellType];

export const PersonState = {
  NORMAL: "normal",
  PANIC: "panic",
  FALLEN: "fallen",
  EVACUATED: "evacuated",
} as const;
export type PersonState = (typeof PersonState)[keyof typeof PersonState];

export interface EvacCell {
  type: EvacCellType;
  personState: PersonState | null;
  panicLevel: number;
  speed: number;
  vision: number;
  potential: number;
}

export interface CrowdEvacuationConfig extends CellularAutomatonConfig {
  personCount: number;
  exitCount: number;
  hasFire: boolean;
  initialPanicThreshold: number;
  scenario: "room" | "bottleneck";
}

export class CrowdEvacuation extends CellularAutomaton<EvacCell> {
  private personCount: number;
  private exitCount: number;
  private hasFire: boolean;
  private panicThreshold: number;
  private potentialMap: number[][];
  private evacuatedCount: number;
  private panicCount: number;
  private fallenCount: number;
  private totalPersons: number;
  private scenario: "room" | "bottleneck";

  constructor(config: CrowdEvacuationConfig) {
    super(config);
    this.personCount = config.personCount;
    this.exitCount = config.exitCount;
    this.hasFire = config.hasFire;
    this.panicThreshold = config.initialPanicThreshold;
    this.scenario = config.scenario ?? "room";
    this.potentialMap = [];
    this.evacuatedCount = 0;
    this.panicCount = 0;
    this.fallenCount = 0;
    this.totalPersons = config.personCount;
    this.reset();
  }

  protected getDefaultState(): EvacCell {
    return {
      type: EvacCellType.EMPTY,
      personState: null,
      panicLevel: 0,
      speed: 1,
      vision: 3,
      potential: 0,
    };
  }

  reset(): void {
    this.generation = 0;
    this.evacuatedCount = 0;
    this.panicCount = 0;
    this.fallenCount = 0;
    this.totalPersons = this.personCount;
    this.grid = this.createGrid();
    this.initialize();
    this.computePotentialMap();
  }

  protected initialize(): void {
    if (this.scenario === "bottleneck") {
      this.initializeBottleneck();
      return;
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          this.grid[y][x] = { ...this.getDefaultState(), type: EvacCellType.WALL };
        }
      }
    }

    const exitsOnBottom = Math.min(this.exitCount, 2);
    const exitSpacing = Math.floor(this.width / (exitsOnBottom + 1));
    for (let i = 0; i < exitsOnBottom; i++) {
      const ex = exitSpacing * (i + 1);
      this.grid[this.height - 1][ex] = { ...this.getDefaultState(), type: EvacCellType.EXIT };
    }

    if (this.exitCount > 2) {
      const topExits = this.exitCount - 2;
      const topSpacing = Math.floor(this.width / (topExits + 1));
      for (let i = 0; i < topExits; i++) {
        const ex = topSpacing * (i + 1);
        this.grid[0][ex] = { ...this.getDefaultState(), type: EvacCellType.EXIT };
      }
    }

    if (this.hasFire) {
      const fx = Math.floor(this.width / 4);
      const fy = Math.floor(this.height / 2);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nnx = fx + dx;
          const nny = fy + dy;
          if (nnx > 0 && nnx < this.width - 1 && nny > 0 && nny < this.height - 1) {
            this.grid[nny][nnx] = { ...this.getDefaultState(), type: EvacCellType.FIRE };
          }
        }
      }
    }

    let placed = 0;
    while (placed < this.personCount) {
      const px = 1 + Math.floor(Math.random() * (this.width - 2));
      const py = 1 + Math.floor(Math.random() * (this.height - 2));
      if (this.grid[py][px].type === EvacCellType.EMPTY) {
        this.grid[py][px] = {
          ...this.getDefaultState(),
          type: EvacCellType.PERSON,
          personState: PersonState.NORMAL,
          panicLevel: Math.random() * 0.1,
          speed: 1 + Math.floor(Math.random() * 2),
          vision: 3 + Math.floor(Math.random() * 3),
        };
        placed++;
      }
    }
  }

  private computePotentialMap(): void {
    this.potentialMap = Array.from({ length: this.height }, () => Array(this.width).fill(Infinity));

    const queue: Array<[number, number]> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].type === EvacCellType.EXIT) {
          this.potentialMap[y][x] = 0;
          queue.push([x, y]);
        }
      }
    }

    const ddx = [0, 0, 1, -1, 1, 1, -1, -1];
    const ddy = [-1, 1, 0, 0, -1, 1, -1, 1];

    let head = 0;
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      for (let d = 0; d < 8; d++) {
        const nnx = cx + ddx[d];
        const nny = cy + ddy[d];
        if (nnx < 0 || nnx >= this.width || nny < 0 || nny >= this.height) continue;
        if (this.grid[nny][nnx].type === EvacCellType.WALL) continue;
        if (this.grid[nny][nnx].type === EvacCellType.FIRE) continue;
        const cost = (d < 4) ? 1 : 1.414;
        const newDist = this.potentialMap[cy][cx] + cost;
        if (newDist < this.potentialMap[nny][nnx]) {
          this.potentialMap[nny][nnx] = newDist;
          queue.push([nnx, nny]);
        }
      }
    }
  }

  step(): void {
    const newGrid = this.grid.map(row => row.map(cell => ({ ...cell })));
    const moved = Array.from({ length: this.height }, () => Array(this.width).fill(false));

    const persons: Array<[number, number]> = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x].type === EvacCellType.PERSON) {
          persons.push([x, y]);
        }
      }
    }

    for (const [x, y] of persons.sort(() => Math.random() - 0.5)) {
      if (moved[y][x]) continue;
      const cell = this.grid[y][x];

      if (cell.personState === PersonState.FALLEN) continue;

      let panicNeighbors = 0;
      const neighborCoords = this.getMooreNeighborCoords(x, y, 1);
      for (const [nx, ny] of neighborCoords) {
        if (this.grid[ny][nx].personState === PersonState.PANIC) panicNeighbors++;
      }

      if (panicNeighbors >= 3 && cell.personState === PersonState.NORMAL) {
        cell.personState = PersonState.PANIC;
        cell.panicLevel = Math.min(1, cell.panicLevel + 0.3);
      }

      const localDensity = neighborCoords.filter(([nx, ny]) => this.grid[ny][nx].type === EvacCellType.PERSON).length / 8;
      if (localDensity > this.panicThreshold && cell.personState === PersonState.NORMAL) {
        cell.personState = PersonState.PANIC;
        cell.panicLevel = Math.min(1, cell.panicLevel + 0.2);
      }

      if (cell.panicLevel > 0.9 && Math.random() < 0.02) {
        newGrid[y][x] = { ...cell, personState: PersonState.FALLEN };
        this.fallenCount++;
        continue;
      }

      // Collaboración: persona normal ayuda a caído cercano
      if (cell.personState === PersonState.NORMAL) {
        for (const [fnx, fny] of neighborCoords) {
          if (this.grid[fny][fnx].personState === PersonState.FALLEN && !moved[fny][fnx]) {
            // Ayudar al caído: se levanta y recupera estado normal
            newGrid[fny][fnx] = { ...this.grid[fny][fnx], personState: PersonState.NORMAL, panicLevel: this.grid[fny][fnx].panicLevel * 0.5 };
            this.fallenCount = Math.max(0, this.fallenCount - 1);
            break;
          }
        }
      }

      // Visión limitada: persona solo ve celdas dentro de su radio de visión
      let bestX = x, bestY = y;
      let bestPotential = this.potentialMap[y]?.[x] ?? Infinity;
      if (bestPotential === Infinity) bestPotential = 999;

      // Visión limitada: filtrar direcciones fuera del radio de visión
      const vision = cell.vision;
      const directions = cell.personState === PersonState.PANIC
        ? this.shuffleArray([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])
        : [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

      let evacuated = false;
      for (const [ddx, ddy] of directions) {
        const nnx = x + ddx;
        const nny = y + ddy;
        if (nnx < 0 || nnx >= this.width || nny < 0 || nny >= this.height) continue;

        // Visión limitada: no puede ver más allá de su radio
        if (Math.abs(ddx) > 0 && Math.abs(ddy) > 0 && (Math.abs(ddx) > vision || Math.abs(ddy) > vision)) continue;
        if (Math.abs(ddx) > vision || Math.abs(ddy) > vision) continue;

        const targetCell = this.grid[nny][nnx];

        if (targetCell.type === EvacCellType.EXIT) {
          this.evacuatedCount++;
          newGrid[y][x] = this.getDefaultState();
          moved[y][x] = true;
          evacuated = true;
          break;
        }

        if (targetCell.type === EvacCellType.EMPTY && newGrid[nny][nnx].type !== EvacCellType.PERSON && !moved[nny][nnx]) {
          const potVal = this.potentialMap[nny]?.[nnx] ?? Infinity;
          if (potVal < bestPotential) {
            bestPotential = potVal;
            bestX = nnx;
            bestY = nny;
          }
        }
      }

      if (evacuated) continue;

      if (bestX !== x || bestY !== y) {
        newGrid[bestY][bestX] = { ...cell };
        newGrid[y][x] = this.getDefaultState();
        moved[bestY][bestX] = true;
        moved[y][x] = true;
      } else {
        newGrid[y][x] = { ...cell };
        moved[y][x] = true;
      }
    }

    if (this.hasFire && this.generation % 8 === 0 && this.generation > 0) {
      this.spreadFire(newGrid);
    }

    this.grid = newGrid;
    this.panicCount = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].personState === PersonState.PANIC) this.panicCount++;
      }
    }
    this.generation++;
  }

  private spreadFire(grid: EvacCell[][]): void {
    const fireCells: Array<[number, number]> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (grid[y][x].type === EvacCellType.FIRE) fireCells.push([x, y]);
      }
    }
    for (const [fx, fy] of fireCells) {
      for (const [nx, ny] of this.getMooreNeighborCoords(fx, fy, 1)) {
        if (grid[ny][nx].type === EvacCellType.EMPTY && Math.random() < 0.15) {
          grid[ny][nx] = { ...this.getDefaultState(), type: EvacCellType.FIRE };
        }
      }
    }
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  getEvacuatedCount(): number { return this.evacuatedCount; }
  getPanicCount(): number { return this.panicCount; }
  getFallenCount(): number { return this.fallenCount; }
  getTotalPersons(): number { return this.totalPersons; }
  getPotentialMap(): number[][] { return this.potentialMap; }

  setPersonCount(count: number): void { this.personCount = count; this.reset(); }
  setExitCount(count: number): void { this.exitCount = count; this.reset(); }
  setHasFire(has: boolean): void { this.hasFire = has; this.reset(); }
  setScenario(scenario: "room" | "bottleneck"): void { this.scenario = scenario; this.reset(); }

  private initializeBottleneck(): void {
    // Borders as walls
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          this.grid[y][x] = { ...this.getDefaultState(), type: EvacCellType.WALL };
        }
      }
    }

    // Central horizontal wall with a narrow passage (bottleneck)
    const wallY = Math.floor(this.height / 2);
    const passageWidth = 3;
    const passageStart = Math.floor(this.width / 2) - Math.floor(passageWidth / 2);
    for (let x = 1; x < this.width - 1; x++) {
      if (x < passageStart || x >= passageStart + passageWidth) {
        this.grid[wallY][x] = { ...this.getDefaultState(), type: EvacCellType.WALL };
      }
    }

    // Exit at bottom center
    const exitX = Math.floor(this.width / 2);
    this.grid[this.height - 1][exitX] = { ...this.getDefaultState(), type: EvacCellType.EXIT };

    // Place people in top half only
    let placed = 0;
    while (placed < this.personCount) {
      const px = 1 + Math.floor(Math.random() * (this.width - 2));
      const py = 1 + Math.floor(Math.random() * (wallY - 1));
      if (py < wallY && this.grid[py][px].type === EvacCellType.EMPTY) {
        this.grid[py][px] = { ...this.getDefaultState(), type: EvacCellType.PERSON, personState: PersonState.NORMAL, panicLevel: Math.random() * 0.1, speed: 1 + Math.floor(Math.random() * 2), vision: 3 + Math.floor(Math.random() * 3) };
        placed++;
      }
    }

    if (this.hasFire) {
      const fx = Math.floor(this.width / 4);
      const fy = 2;
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          if (this.grid[fy + dy][fx + dx].type === EvacCellType.EMPTY) {
            this.grid[fy + dy][fx + dx] = { ...this.getDefaultState(), type: EvacCellType.FIRE };
          }
        }
      }
    }
  }
}