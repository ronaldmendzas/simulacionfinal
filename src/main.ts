import { FishSchool, type FishSchoolConfig } from "./simulations/FishSchool.ts";
import { CrowdEvacuation, type CrowdEvacuationConfig, EvacCellType, PersonState } from "./simulations/CrowdEvacuation.ts";
import { OpinionSpread, type OpinionSpreadConfig, OpinionState } from "./simulations/OpinionSpread.ts";
import { CanvasRenderer } from "./renderers/CanvasRenderer.ts";
import { SimulationControls } from "./ui/SimulationControls.ts";
import { lerpColor } from "./utils/colors.ts";
import "./style.css";

type SimulationType = "fish" | "evacuation" | "opinion";

let currentSim: SimulationType = "fish";
let animationId: number | null = null;
let speedMultiplier: number = 1;
let lastStepTime: number = 0;

let fishSim: FishSchool;
let evacSim: CrowdEvacuation;
let opinionSim: OpinionSpread;
let renderer: CanvasRenderer;
let controls: SimulationControls;

function init(): void {
  const app = document.getElementById("app")!;

  app.innerHTML = `
    <header class="app-header">
      <h1>Simulacion con Automatas Celulares</h1>
      <p class="subtitle">IINF-391 — 3er Parcial</p>
    </header>

    <nav class="tab-nav">
      <button class="tab-btn active" data-sim="fish">Parte I — Cardumen de Peces</button>
      <button class="tab-btn" data-sim="evacuation">Parte II — Evacuacion</button>
      <button class="tab-btn" data-sim="opinion">Parte III — Opiniones</button>
    </nav>

    <main class="simulation-container">
      <section id="sim-fish" class="sim-panel active">
        <div class="sim-layout">
          <div class="canvas-wrapper">
            <canvas id="canvas-fish"></canvas>
          </div>
          <aside id="controls-fish" class="controls-panel"></aside>
        </div>
      </section>

      <section id="sim-evacuation" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-wrapper">
            <canvas id="canvas-evac"></canvas>
          </div>
          <aside id="controls-evac" class="controls-panel"></aside>
        </div>
      </section>

      <section id="sim-opinion" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-wrapper">
            <canvas id="canvas-opinion"></canvas>
          </div>
          <aside id="controls-opinion" class="controls-panel"></aside>
        </div>
      </section>
    </main>
  `;

  setupTabs();
  initFishSim();
  initEvacSim();
  initOpinionSim();
  switchSimulation("fish");
}

function setupTabs(): void {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const sim = (tab as HTMLElement).dataset.sim as SimulationType;
      switchSimulation(sim);
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });
}

function switchSimulation(sim: SimulationType): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  currentSim = sim;

  document.querySelectorAll(".sim-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`sim-${sim}`)?.classList.add("active");

  switch (sim) {
    case "fish":
      renderer = new CanvasRenderer("canvas-fish", fishSim.getWidth(), fishSim.getHeight());
      initFishControls();
      break;
    case "evacuation":
      renderer = new CanvasRenderer("canvas-evac", evacSim.getWidth(), evacSim.getHeight());
      initEvacControls();
      break;
    case "opinion":
      renderer = new CanvasRenderer("canvas-opinion", opinionSim.getWidth(), opinionSim.getHeight());
      initOpinionControls();
      break;
  }

  runLoop();
}

function initFishSim(): void {
  const config: FishSchoolConfig = {
    width: 120,
    height: 80,
    boundaryType: "toroidal",
    fishCount: 200,
    hasPredator: false,
    obstacleDensity: 0.01,
    perceptionRadius: 3,
    speedMultiplier: 1,
  };
  fishSim = new FishSchool(config);
}

function initEvacSim(): void {
  const config: CrowdEvacuationConfig = {
    width: 80,
    height: 60,
    boundaryType: "fixed",
    personCount: 120,
    exitCount: 2,
    hasFire: false,
    initialPanicThreshold: 0.7,
  };
  evacSim = new CrowdEvacuation(config);
}

function initOpinionSim(): void {
  const config: OpinionSpreadConfig = {
    width: 100,
    height: 100,
    boundaryType: "toroidal",
    densityA: 0.2,
    densityB: 0.15,
    influencerCount: 3,
    convictionThreshold: 0.5,
    longLinksK: 2,
    misinformation: false,
  };
  opinionSim = new OpinionSpread(config);
}

function initFishControls(): void {
  controls = new SimulationControls("controls-fish");
  controls.createSlider({
    id: "fish-count",
    label: "Cantidad de peces",
    min: 50, max: 800, value: 200, step: 10,
    onChange: (v) => { fishSim.setFishCount(v); },
  });
  controls.createSlider({
    id: "fish-speed",
    label: "Velocidad simulacion",
    min: 1, max: 10, value: 1, step: 1,
    onChange: (v) => { speedMultiplier = v; },
  });
  controls.createSlider({
    id: "fish-perception",
    label: "Radio de percepcion",
    min: 1, max: 5, value: 3, step: 1,
    onChange: (v) => { fishSim.setPerceptionRadius(v); },
  });
  controls.createToggle({
    id: "fish-predator",
    label: "Depredador",
    checked: false,
    onChange: (v) => { fishSim.setPredator(v); },
  });
  controls.createSlider({
    id: "fish-obstacles",
    label: "Densidad obstaculos",
    min: 0, max: 10, value: 1, step: 1,
    onChange: (v) => { fishSim.setObstacleDensity(v / 100); },
  });
  controls.createButton("Reset", () => { fishSim.setFishCount(controls.getValue("fish-count")); });
  controls.createStats({ "Generacion": 0, "Peces": 200, "Peces cerca": 0, "Velocidad": "1x" });
}

function initEvacControls(): void {
  controls = new SimulationControls("controls-evac");
  controls.createSlider({
    id: "evac-persons",
    label: "Cantidad de personas",
    min: 20, max: 300, value: 120, step: 10,
    onChange: (v) => { evacSim.setPersonCount(v); },
  });
  controls.createSlider({
    id: "evac-speed",
    label: "Velocidad simulacion",
    min: 1, max: 10, value: 1, step: 1,
    onChange: (v) => { speedMultiplier = v; },
  });
  controls.createSlider({
    id: "evac-exits",
    label: "Cantidad de salidas",
    min: 1, max: 4, value: 2, step: 1,
    onChange: (v) => { evacSim.setExitCount(v); },
  });
  controls.createToggle({
    id: "evac-fire",
    label: "Fuego/Humo",
    checked: false,
    onChange: (v) => { evacSim.setHasFire(v); },
  });
  controls.createButton("Reset", () => { evacSim.setPersonCount(controls.getValue("evac-persons")); });
  controls.createStats({ "Generacion": 0, "Evacuados": 0, "En panico": 0, "Caidos": 0, "% Evacuado": "0%" });
}

function initOpinionControls(): void {
  controls = new SimulationControls("controls-opinion");
  controls.createSlider({
    id: "op-density-a",
    label: "Densidad opinion A",
    min: 5, max: 50, value: 20, step: 1,
    onChange: (v) => { opinionSim.setDensityA(v / 100); },
  });
  controls.createSlider({
    id: "op-density-b",
    label: "Densidad opinion B",
    min: 5, max: 50, value: 15, step: 1,
    onChange: (v) => { opinionSim.setDensityB(v / 100); },
  });
  controls.createSlider({
    id: "op-speed",
    label: "Velocidad simulacion",
    min: 1, max: 10, value: 1, step: 1,
    onChange: (v) => { speedMultiplier = v; },
  });
  controls.createSlider({
    id: "op-influencers",
    label: "Cantidad influencers",
    min: 0, max: 10, value: 3, step: 1,
    onChange: (v) => { opinionSim.setInfluencerCount(v); },
  });
  controls.createSlider({
    id: "op-threshold",
    label: "Umbral de conviccion",
    min: 10, max: 90, value: 50, step: 5,
    onChange: (v) => { opinionSim.setConvictionThreshold(v / 100); },
  });
  controls.createToggle({
    id: "op-misinfo",
    label: "Desinformacion",
    checked: false,
    onChange: (v) => { opinionSim.setMisinformation(v); },
  });
  controls.createButton("Reset", () => { opinionSim.reset(); });
  controls.createStats({ "Generacion": 0, "Opinion A": 0, "Opinion B": 0, "Neutral": 0 });
}

function renderFish(): void {
  renderer.clear();
  const grid = fishSim.getGrid();

  for (let y = 0; y < fishSim.getHeight(); y++) {
    for (let x = 0; x < fishSim.getWidth(); x++) {
      const cell = grid[y][x];
      switch (cell.type) {
        case "fish": {
          const localFish = fishSim.getMooreNeighbors(x, y, 2).filter(c => c.type === "fish").length;
          const t = Math.min(localFish / 6, 1);
          const color = lerpColor("rgb(0,100,200)", "rgb(0,220,220)", t);
          renderer.drawTriangle(x, y, cell.direction, 0.8, color);
          break;
        }
        case "predator":
          renderer.drawCircle(x, y, 0.6, "#ff2244");
          break;
        case "obstacle":
          renderer.drawRect(x, y, "#445566");
          break;
      }
    }
  }

  controls.updateStat("Generacion", fishSim.getGeneration());
}

function renderEvacuation(): void {
  renderer.clear();
  const grid = evacSim.getGrid();
  const potentialMap = evacSim.getPotentialMap();

  for (let y = 0; y < evacSim.getHeight(); y++) {
    for (let x = 0; x < evacSim.getWidth(); x++) {
      const cell = grid[y][x];
      switch (cell.type) {
        case EvacCellType.WALL:
          renderer.drawRect(x, y, "#333344");
          break;
        case EvacCellType.EXIT:
          renderer.drawRect(x, y, "#44ff44");
          break;
        case EvacCellType.FIRE:
          renderer.drawRect(x, y, "#ff6600");
          break;
        case EvacCellType.PERSON:
          if (cell.personState === PersonState.PANIC) {
            renderer.drawRect(x, y, "#ff4444");
          } else if (cell.personState === PersonState.FALLEN) {
            renderer.drawRect(x, y, "#884444");
          } else {
            renderer.drawRect(x, y, "#44aaff");
          }
          break;
        case EvacCellType.EMPTY: {
          const maxPot = 50;
          const pot = Math.min((potentialMap[y]?.[x] ?? 999) / maxPot, 1);
          const r = Math.round(10 + pot * 20);
          const g = Math.round(10 + (1 - pot) * 15);
          const b = Math.round(26 + (1 - pot) * 10);
          renderer.drawRect(x, y, `rgb(${r},${g},${b})`);
          break;
        }
      }
    }
  }

  const total = evacSim.getTotalPersons();
  const evacuated = evacSim.getEvacuatedCount();
  const pct = total > 0 ? ((evacuated / total) * 100).toFixed(1) : "0";
  controls.updateStat("Generacion", evacSim.getGeneration());
  controls.updateStat("Evacuados", evacuated);
  controls.updateStat("En panico", evacSim.getPanicCount());
  controls.updateStat("Caidos", evacSim.getFallenCount());
  controls.updateStat("% Evacuado", `${pct}%`);
}

function renderOpinion(): void {
  renderer.clear();
  const grid = opinionSim.getGrid();

  for (let y = 0; y < opinionSim.getHeight(); y++) {
    for (let x = 0; x < opinionSim.getWidth(); x++) {
      const cell = grid[y][x];
      let color: string;
      switch (cell.state) {
        case OpinionState.A_FAVORABLE: {
          const conviction = cell.conviction;
          const r = Math.round(30 + conviction * 200);
          const g = Math.round(80 - conviction * 60);
          const b = Math.round(200 - conviction * 100);
          color = `rgb(${r},${g},${b})`;
          break;
        }
        case OpinionState.B_FAVORABLE: {
          const conviction = cell.conviction;
          const r = Math.round(200 + conviction * 55);
          const g = Math.round(50 + conviction * 30);
          const b = Math.round(50 - conviction * 30);
          color = `rgb(${r},${g},${b})`;
          break;
        }
        case OpinionState.INFLUENCER:
          color = cell.opinionType === "A" ? "#ff44ff" : "#ffaa00";
          break;
        case OpinionState.INDIFERENTE:
          color = "#dddddd";
          break;
        case OpinionState.NEUTRAL:
        default:
          color = "#1a1a2e";
          break;
      }
      renderer.drawRect(x, y, color);
    }
  }

  controls.updateStat("Generacion", opinionSim.getGeneration());
  controls.updateStat("Opinion A", opinionSim.getCountA());
  controls.updateStat("Opinion B", opinionSim.getCountB());
  controls.updateStat("Neutral", opinionSim.getCountNeutral());
}

function runLoop(): void {
  const stepInterval = 60 / speedMultiplier;

  const loop = (timestamp: number) => {
    if (timestamp - lastStepTime >= stepInterval) {
      switch (currentSim) {
        case "fish":
          fishSim.step();
          renderFish();
          break;
        case "evacuation":
          evacSim.step();
          renderEvacuation();
          break;
        case "opinion":
          opinionSim.step();
          renderOpinion();
          break;
      }
      lastStepTime = timestamp;
    }
    animationId = requestAnimationFrame(loop);
  };

  animationId = requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", init);