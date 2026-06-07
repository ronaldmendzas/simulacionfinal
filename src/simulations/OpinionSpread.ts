import { CellularAutomaton, type CellularAutomatonConfig } from "../core/CellularAutomaton.ts";

export const OpinionState = {
  NEUTRAL: "neutral",
  A_FAVORABLE: "a_favorable",
  B_FAVORABLE: "b_favorable",
  INDIFERENTE: "indiferente",
  INFLUENCER: "influencer",
} as const;
export type OpinionState = (typeof OpinionState)[keyof typeof OpinionState];

export interface OpinionCell {
  state: OpinionState;
  conviction: number;
  resistance: number;
  opinionType: "A" | "B" | "none";
  sameOpinionTicks: number;
  influencerForce: number;
}

export interface OpinionSpreadConfig extends CellularAutomatonConfig {
  densityA: number;
  densityB: number;
  influencerCount: number;
  convictionThreshold: number;
  longLinksK: number;
  misinformation: boolean;
}

export class OpinionSpread extends CellularAutomaton<OpinionCell> {
  private densityA: number;
  private densityB: number;
  private influencerCount: number;
  private convictionThreshold: number;
  private longLinksK: number;
  private misinformation: boolean;
  private longLinks: Map<string, Array<[number, number]>>;

  private countA: number;
  private countB: number;
  private countNeutral: number;

  constructor(config: OpinionSpreadConfig) {
    super(config);
    this.densityA = config.densityA;
    this.densityB = config.densityB;
    this.influencerCount = config.influencerCount;
    this.convictionThreshold = config.convictionThreshold;
    this.longLinksK = config.longLinksK;
    this.misinformation = config.misinformation;
    this.longLinks = new Map();
    this.countA = 0;
    this.countB = 0;
    this.countNeutral = 0;
    this.reset();
  }

  protected getDefaultState(): OpinionCell {
    return {
      state: OpinionState.NEUTRAL,
      conviction: 0,
      resistance: 0,
      opinionType: "none",
      sameOpinionTicks: 0,
      influencerForce: 0,
    };
  }

  reset(): void {
    this.generation = 0;
    this.grid = this.createGrid();
    this.initialize();
    this.generateLongLinks();
    this.countStates();
  }

  protected initialize(): void {
    const totalCells = this.width * this.height;
    const countACells = Math.floor(totalCells * this.densityA);
    const countBCells = Math.floor(totalCells * this.densityB);

    const positions: Array<[number, number]> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        positions.push([x, y]);
      }
    }
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let idx = 0;
    for (let i = 0; i < countACells; i++) {
      if (idx >= positions.length) break;
      const [x, y] = positions[idx++];
      this.grid[y][x] = {
        state: OpinionState.A_FAVORABLE,
        conviction: 0.3 + Math.random() * 0.4,
        resistance: Math.random() * 0.3,
        opinionType: "A",
        sameOpinionTicks: 0,
        influencerForce: 0,
      };
    }

    for (let i = 0; i < countBCells; i++) {
      if (idx >= positions.length) break;
      const [x, y] = positions[idx++];
      this.grid[y][x] = {
        state: OpinionState.B_FAVORABLE,
        conviction: 0.3 + Math.random() * 0.4,
        resistance: Math.random() * 0.3,
        opinionType: "B",
        sameOpinionTicks: 0,
        influencerForce: 0,
      };
    }

    for (let i = 0; i < this.influencerCount; i++) {
      if (idx >= positions.length) break;
      const [x, y] = positions[idx++];
      const type: "A" | "B" = Math.random() < 0.5 ? "A" : "B";
      this.grid[y][x] = {
        state: OpinionState.INFLUENCER,
        conviction: 1.0,
        resistance: 1.0,
        opinionType: type,
        sameOpinionTicks: 0,
        influencerForce: 0.8 + Math.random() * 0.2,
      };
    }

    while (idx < positions.length) {
      const [x, y] = positions[idx++];
      if (Math.random() < 0.05) {
        this.grid[y][x] = {
          ...this.getDefaultState(),
          state: OpinionState.INDIFERENTE,
          resistance: 0.5 + Math.random() * 0.5,
        };
      }
    }
  }

  private generateLongLinks(): void {
    this.longLinks = new Map();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const links: Array<[number, number]> = [];
        for (let k = 0; k < this.longLinksK; k++) {
          const lx = Math.floor(Math.random() * this.width);
          const ly = Math.floor(Math.random() * this.height);
          if (lx !== x || ly !== y) {
            links.push([lx, ly]);
          }
        }
        this.longLinks.set(`${x},${y}`, links);
      }
    }
  }

  step(): void {
    const newGrid = this.grid.map(row => row.map(cell => ({ ...cell })));

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        const newCell = { ...cell };

        if (cell.state === OpinionState.INDIFERENTE) {
          const neighbors = this.getMooreNeighbors(x, y, 1);
          const activeNeighbors = neighbors.filter(
            n => n.state !== OpinionState.NEUTRAL && n.state !== OpinionState.INDIFERENTE
          );
          if (activeNeighbors.length === 0) {
            newCell.state = OpinionState.NEUTRAL;
            newCell.conviction = 0;
            newCell.opinionType = "none";
          }
          newGrid[y][x] = newCell;
          continue;
        }

        if (cell.state === OpinionState.INFLUENCER) {
          const influencerCoords = this.getMooreNeighborCoords(x, y, 5);
          for (const [nx, ny] of influencerCoords) {
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
              const target = newGrid[ny][nx];
              if (target.state !== OpinionState.INFLUENCER && target.conviction < this.convictionThreshold) {
                if (cell.opinionType === "A") {
                  target.state = OpinionState.A_FAVORABLE;
                  target.opinionType = "A";
                  target.conviction = Math.min(1, target.conviction + cell.influencerForce * 0.2);
                } else {
                  target.state = OpinionState.B_FAVORABLE;
                  target.opinionType = "B";
                  target.conviction = Math.min(1, target.conviction + cell.influencerForce * 0.2);
                }
                newGrid[ny][nx] = target;
              }
            }
          }
          continue;
        }

        if (cell.state === OpinionState.NEUTRAL) {
          const neighbors = this.getMooreNeighbors(x, y, 1);
          const longLinks = this.longLinks.get(`${x},${y}`) || [];
          const allNeighborStates: OpinionCell[] = [...neighbors];
          for (const [lx, ly] of longLinks) {
            if (lx >= 0 && lx < this.width && ly >= 0 && ly < this.height) {
              allNeighborStates.push(this.grid[ly][lx]);
            }
          }

          const aCount = allNeighborStates.filter(n => n.opinionType === "A").length;
          const bCount = allNeighborStates.filter(n => n.opinionType === "B").length;

          if (aCount > bCount && aCount >= 2) {
            newCell.state = OpinionState.A_FAVORABLE;
            newCell.opinionType = "A";
            newCell.conviction = 0.2;
          } else if (bCount > aCount && bCount >= 2) {
            newCell.state = OpinionState.B_FAVORABLE;
            newCell.opinionType = "B";
            newCell.conviction = 0.2;
          }
          newGrid[y][x] = newCell;
          continue;
        }

        if (cell.conviction > 0.8 && cell.resistance > 0.5) {
          newCell.resistance = Math.max(0, cell.resistance - 0.33);
          newCell.sameOpinionTicks = cell.sameOpinionTicks + 1;
          newGrid[y][x] = newCell;
          continue;
        }

        const neighbors = this.getMooreNeighbors(x, y, 1);
        const longLinks = this.longLinks.get(`${x},${y}`) || [];
        const allNeighborStates: OpinionCell[] = [...neighbors];
        for (const [lx, ly] of longLinks) {
          if (lx >= 0 && lx < this.width && ly >= 0 && ly < this.height) {
            allNeighborStates.push(this.grid[ly][lx]);
          }
        }

        const aCount = allNeighborStates.filter(n => n.opinionType === "A").length;
        const bCount = allNeighborStates.filter(n => n.opinionType === "B").length;

        if ((aCount + bCount) > 0 && cell.conviction < this.convictionThreshold) {
          if (aCount > bCount) {
            newCell.state = OpinionState.A_FAVORABLE;
            newCell.opinionType = "A";
            newCell.conviction = Math.min(1, cell.conviction + 0.15);
          } else if (bCount > aCount) {
            newCell.state = OpinionState.B_FAVORABLE;
            newCell.opinionType = "B";
            newCell.conviction = Math.min(1, cell.conviction + 0.15);
          }
        }

        newCell.sameOpinionTicks = cell.sameOpinionTicks + 1;

        if (newCell.sameOpinionTicks > 10) {
          const localDensity = allNeighborStates.filter(n => n.opinionType === cell.opinionType).length;
          if (localDensity > 4) {
            newCell.conviction = Math.min(1, cell.conviction + 0.1);
          }
        }

        newGrid[y][x] = newCell;
      }
    }

    if (this.misinformation && this.generation % 20 === 0) {
      const mx = Math.floor(Math.random() * this.width);
      const my = Math.floor(Math.random() * this.height);
      const fakeType: "A" | "B" = Math.random() < 0.5 ? "A" : "B";
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = ((mx + dx) % this.width + this.width) % this.width;
          const ny = ((my + dy) % this.height + this.height) % this.height;
          if (newGrid[ny][nx].state !== OpinionState.INFLUENCER && newGrid[ny][nx].conviction < 0.5) {
            newGrid[ny][nx] = {
              state: fakeType === "A" ? OpinionState.A_FAVORABLE : OpinionState.B_FAVORABLE,
              conviction: 0.6,
              resistance: 0,
              opinionType: fakeType,
              sameOpinionTicks: 0,
              influencerForce: 0,
            };
          }
        }
      }
    }

    this.grid = newGrid;
    this.generation++;
    this.countStates();
  }

  private countStates(): void {
    this.countA = 0;
    this.countB = 0;
    this.countNeutral = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell.opinionType === "A") this.countA++;
        else if (cell.opinionType === "B") this.countB++;
        else this.countNeutral++;
      }
    }
  }

  getCountA(): number { return this.countA; }
  getCountB(): number { return this.countB; }
  getCountNeutral(): number { return this.countNeutral; }

  setDensityA(d: number): void { this.densityA = d; this.reset(); }
  setDensityB(d: number): void { this.densityB = d; this.reset(); }
  setInfluencerCount(c: number): void { this.influencerCount = c; this.reset(); }
  setConvictionThreshold(t: number): void { this.convictionThreshold = t; }
  setMisinformation(m: boolean): void { this.misinformation = m; }
}