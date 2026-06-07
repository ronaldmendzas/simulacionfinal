import { FishSchool, type FishSchoolConfig } from "./simulations/FishSchool.ts";
import { CrowdEvacuation, type CrowdEvacuationConfig, EvacCellType, PersonState } from "./simulations/CrowdEvacuation.ts";
import { OpinionSpread, type OpinionSpreadConfig, OpinionState } from "./simulations/OpinionSpread.ts";
import { CanvasRenderer } from "./renderers/CanvasRenderer.ts";
import { SimulationControls } from "./ui/SimulationControls.ts";
import { SimulationChart } from "./charts/SimulationChart.ts";
import { lerpColor } from "./utils/colors.ts";
import "./style.css";

type SimulationType = "fish" | "evacuation" | "opinion";

let currentSim: SimulationType = "fish";
let animationId: number | null = null;
let speedMultiplier: number = 1;
let lastStepTime: number = 0;
let paused: boolean = false;
let fps: number = 0;
let frameCount: number = 0;
let lastFpsTime: number = 0;
let mouseMode: string = "observe";

let fishSim: FishSchool;
let evacSim: CrowdEvacuation;
let opinionSim: OpinionSpread;
let renderer: CanvasRenderer;
let controls: SimulationControls;
let fishChart: SimulationChart | null = null;
let evacChart: SimulationChart | null = null;
let opinionChart: SimulationChart | null = null;

const evacHistory: { evacuated: number; panic: number }[] = [];
const opinionHistory: { a: number; b: number; neutral: number }[] = [];
const fishHistory: { count: number }[] = [];

function init(): void {
  const app = document.getElementById("app")!;

  app.innerHTML = `
    <header class="app-header">
      <div class="header-content">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div>
            <h1>Simulacion CA</h1>
            <p class="subtitle">Autómatas Celulares — IINF-391</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="fps-badge" id="fps-badge">0 FPS</div>
          <div class="gen-badge" id="gen-badge">Gen: 0</div>
        </div>
      </div>
    </header>

    <nav class="tab-nav">
      <button class="tab-btn active" data-sim="fish">
        <span class="tab-icon">🐟</span>
        <span>Cardumen de Peces</span>
      </button>
      <button class="tab-btn" data-sim="evacuation">
        <span class="tab-icon">🏃</span>
        <span>Evacuación</span>
      </button>
      <button class="tab-btn" data-sim="opinion">
        <span class="tab-icon">💬</span>
        <span>Opiniones</span>
      </button>
    </nav>

    <div class="toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" id="btn-play" title="Play/Pause">⏸</button>
        <button class="toolbar-btn" id="btn-step" title="Step">⏭</button>
        <button class="toolbar-btn" id="btn-reset" title="Reset">🔄</button>
      </div>
      <div class="toolbar-center">
        <label class="toolbar-label">Velocidad:</label>
        <input type="range" id="global-speed" min="1" max="20" value="1" step="1" class="toolbar-slider">
        <span id="speed-val">1x</span>
      </div>
      <div class="toolbar-right">
        <label class="toolbar-label">Mouse:</label>
        <select id="mouse-mode" class="toolbar-select">
          <option value="observe">Observar</option>
        </select>
      </div>
    </div>

    <main class="simulation-container">
      <section id="sim-fish" class="sim-panel active">
        <div class="sim-layout">
          <div class="canvas-area">
            <canvas id="canvas-fish"></canvas>
          </div>
          <aside class="sidebar">
            <div id="controls-fish" class="controls-panel"></div>
            <div class="chart-container">
              <h4 class="chart-title">Peces Activos</h4>
              <canvas id="chart-fish"></canvas>
            </div>
          </aside>
        </div>
      </section>

      <section id="sim-evacuation" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-area">
            <canvas id="canvas-evac"></canvas>
          </div>
          <aside class="sidebar">
            <div id="controls-evac" class="controls-panel"></div>
            <div class="chart-container">
              <h4 class="chart-title">Evacuación en Vivo</h4>
              <canvas id="chart-evac"></canvas>
            </div>
          </aside>
        </div>
      </section>

      <section id="sim-opinion" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-area">
            <canvas id="canvas-opinion"></canvas>
          </div>
          <aside class="sidebar">
            <div id="controls-opinion" class="controls-panel"></div>
            <div class="chart-container">
              <h4 class="chart-title">Distribución de Opiniones</h4>
              <canvas id="chart-opinion"></canvas>
            </div>
          </aside>
        </div>
      </section>
    </main>
  `;

  setupTabs();
  setupToolbar();
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

function setupToolbar(): void {
  document.getElementById("btn-play")!.addEventListener("click", () => {
    paused = !paused;
    document.getElementById("btn-play")!.textContent = paused ? "▶" : "⏸";
  });

  document.getElementById("btn-step")!.addEventListener("click", () => {
    if (currentSim === "fish") { fishSim.step(); renderFish(); }
    else if (currentSim === "evacuation") { evacSim.step(); renderEvacuation(); }
    else { opinionSim.step(); renderOpinion(); }
  });

  document.getElementById("btn-reset")!.addEventListener("click", () => {
    if (currentSim === "fish") fishSim.reset();
    else if (currentSim === "evacuation") evacSim.reset();
    else opinionSim.reset();
    evacHistory.length = 0;
    opinionHistory.length = 0;
    fishHistory.length = 0;
    fishChart?.reset();
    evacChart?.reset();
    opinionChart?.reset();
  });

  const speedSlider = document.getElementById("global-speed") as HTMLInputElement;
  speedSlider.addEventListener("input", () => {
    speedMultiplier = Number(speedSlider.value);
    document.getElementById("speed-val")!.textContent = `${speedMultiplier}x`;
  });

  const modeSelect = document.getElementById("mouse-mode") as HTMLSelectElement;
  modeSelect.addEventListener("change", () => {
    mouseMode = modeSelect.value;
  });
}

function updateMouseOptions(): void {
  const select = document.getElementById("mouse-mode") as HTMLSelectElement;
  select.innerHTML = "";
  if (currentSim === "fish") {
    select.innerHTML = '<option value="observe">Observar</option><option value="add-fish">Agregar Pez</option><option value="add-predator">Agregar Depredador</option><option value="add-obstacle">Agregar Obstáculo</option>';
  } else if (currentSim === "evacuation") {
    select.innerHTML = '<option value="observe">Observar</option><option value="add-person">Agregar Persona</option><option value="add-wall">Agregar Pared</option><option value="add-fire">Agregar Fuego</option>';
  } else {
    select.innerHTML = '<option value="observe">Observar</option><option value="add-a">Agregar Opinión A</option><option value="add-b">Agregar Opinión B</option><option value="add-influencer">Agregar Influencer</option>';
  }
  mouseMode = "observe";
}

function setupCanvasClick(): void {
  const canvasId = currentSim === "fish" ? "canvas-fish" : currentSim === "evacuation" ? "canvas-evac" : "canvas-opinion";
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  canvas.onclick = null;
  canvas.addEventListener("click", (e) => {
    if (mouseMode === "observe") return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const cellSize = renderer.getCellSize();
    const gridX = Math.floor(canvasX / cellSize);
    const gridY = Math.floor(canvasY / cellSize);

    if (currentSim === "fish") handleFishClick(gridX, gridY);
    else if (currentSim === "evacuation") handleEvacClick(gridX, gridY);
    else handleOpinionClick(gridX, gridY);
  });
}

function handleFishClick(x: number, y: number): void {
  const grid = fishSim.getGrid();
  if (x < 0 || x >= fishSim.getWidth() || y < 0 || y >= fishSim.getHeight()) return;
  if (mouseMode === "add-fish" && grid[y][x].type === "empty") {
    fishSim.setCell(x, y, { type: "fish", direction: Math.floor(Math.random() * 8), speed: 2 });
  } else if (mouseMode === "add-predator" && grid[y][x].type === "empty") {
    fishSim.setCell(x, y, { type: "predator", direction: Math.floor(Math.random() * 8), speed: 3 });
  } else if (mouseMode === "add-obstacle" && grid[y][x].type === "empty") {
    fishSim.setCell(x, y, { type: "obstacle", direction: 0, speed: 1 });
  }
}

function handleEvacClick(x: number, y: number): void {
  if (x < 0 || x >= evacSim.getWidth() || y < 0 || y >= evacSim.getHeight()) return;
  const grid = evacSim.getGrid();
  if (mouseMode === "add-person" && grid[y][x].type === EvacCellType.EMPTY) {
    evacSim.setCell(x, y, { type: EvacCellType.PERSON, personState: PersonState.NORMAL, panicLevel: 0.1, speed: 1, vision: 4, potential: 0 });
  } else if (mouseMode === "add-wall" && grid[y][x].type === EvacCellType.EMPTY) {
    evacSim.setCell(x, y, { type: EvacCellType.WALL, personState: null, panicLevel: 0, speed: 0, vision: 0, potential: 0 });
  } else if (mouseMode === "add-fire" && grid[y][x].type === EvacCellType.EMPTY) {
    evacSim.setCell(x, y, { type: EvacCellType.FIRE, personState: null, panicLevel: 0, speed: 0, vision: 0, potential: 0 });
  }
}

function handleOpinionClick(x: number, y: number): void {
  if (x < 0 || x >= opinionSim.getWidth() || y < 0 || y >= opinionSim.getHeight()) return;
  const grid = opinionSim.getGrid();
  if (mouseMode === "add-a" && grid[y][x].state === OpinionState.NEUTRAL) {
    opinionSim.setCell(x, y, { state: OpinionState.A_FAVORABLE, conviction: 0.5, resistance: 0.2, opinionType: "A", sameOpinionTicks: 0, influencerForce: 0 });
  } else if (mouseMode === "add-b" && grid[y][x].state === OpinionState.NEUTRAL) {
    opinionSim.setCell(x, y, { state: OpinionState.B_FAVORABLE, conviction: 0.5, resistance: 0.2, opinionType: "B", sameOpinionTicks: 0, influencerForce: 0 });
  } else if (mouseMode === "add-influencer" && grid[y][x].state === OpinionState.NEUTRAL) {
    const type = Math.random() < 0.5 ? "A" as const : "B" as const;
    opinionSim.setCell(x, y, { state: OpinionState.INFLUENCER, conviction: 1, resistance: 1, opinionType: type, sameOpinionTicks: 0, influencerForce: 0.9 });
  }
}

function switchSimulation(sim: SimulationType): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  paused = false;
  document.getElementById("btn-play")!.textContent = "⏸";
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

  updateMouseOptions();
  setupCanvasClick();
  runLoop();
}

function initFishSim(): void {
  const config: FishSchoolConfig = {
    width: 120, height: 80, boundaryType: "toroidal",
    fishCount: 200, hasPredator: false, obstacleDensity: 0.01,
    perceptionRadius: 3, speedMultiplier: 1,
  };
  fishSim = new FishSchool(config);
}

function initEvacSim(): void {
  const config: CrowdEvacuationConfig = {
    width: 80, height: 60, boundaryType: "fixed",
    personCount: 120, exitCount: 2, hasFire: false, initialPanicThreshold: 0.7,
  };
  evacSim = new CrowdEvacuation(config);
}

function initOpinionSim(): void {
  const config: OpinionSpreadConfig = {
    width: 100, height: 100, boundaryType: "toroidal",
    densityA: 0.2, densityB: 0.15, influencerCount: 3,
    convictionThreshold: 0.5, longLinksK: 2, misinformation: false,
  };
  opinionSim = new OpinionSpread(config);
}

function initFishControls(): void {
  controls = new SimulationControls("controls-fish");
  controls.createSectionTitle("Parámetros");
  controls.createSlider({ id: "fish-count", label: "Peces", min: 50, max: 800, value: 200, step: 10, onChange: (v) => fishSim.setFishCount(v) });
  controls.createSlider({ id: "fish-perception", label: "Radio percepción", min: 1, max: 5, value: 3, step: 1, onChange: (v) => fishSim.setPerceptionRadius(v) });
  controls.createSlider({ id: "fish-obstacles", label: "Obstáculos %", min: 0, max: 10, value: 1, step: 1, onChange: (v) => fishSim.setObstacleDensity(v / 100) });
  controls.createSeparator();
  controls.createSectionTitle("Modos");
  controls.createToggle({ id: "fish-predator", label: "Depredador", checked: false, onChange: (v) => fishSim.setPredator(v) });
  controls.createToggle({ id: "fish-glow", label: "Efecto Glow", checked: true, onChange: (v) => renderer.setGlow(v) });
  controls.createToggle({ id: "fish-trails", label: "Estelas", checked: false, onChange: (v) => renderer.setTrails(v) });
  controls.createSeparator();
  controls.createStats({ "Generación": 0, "Peces": 200 });

  if (!fishChart) {
    fishChart = new SimulationChart("chart-fish", [{ label: "Activos", color: "#00b4d8" }], 300);
  }
}

function initEvacControls(): void {
  controls = new SimulationControls("controls-evac");
  controls.createSectionTitle("Parámetros");
  controls.createSlider({ id: "evac-persons", label: "Personas", min: 20, max: 300, value: 120, step: 10, onChange: (v) => evacSim.setPersonCount(v) });
  controls.createSlider({ id: "evac-exits", label: "Salidas", min: 1, max: 4, value: 2, step: 1, onChange: (v) => evacSim.setExitCount(v) });
  controls.createSeparator();
  controls.createSectionTitle("Modos");
  controls.createToggle({ id: "evac-fire", label: "Fuego/Humo", checked: false, onChange: (v) => evacSim.setHasFire(v) });
  controls.createToggle({ id: "evac-glow", label: "Efecto Glow", checked: true, onChange: (v) => renderer.setGlow(v) });
  controls.createSeparator();
  controls.createStats({ "Generación": 0, "Evacuados": 0, "Pánico": 0, "Caídos": 0, "% Evacuado": "0%" });

  if (!evacChart) {
    evacChart = new SimulationChart("chart-evac", [
      { label: "Evacuados", color: "#00b894" },
      { label: "Pánico", color: "#fdcb6e" },
      { label: "Caídos", color: "#e17055" },
    ], 300);
  }
}

function initOpinionControls(): void {
  controls = new SimulationControls("controls-opinion");
  controls.createSectionTitle("Parámetros");
  controls.createSlider({ id: "op-density-a", label: "Densidad A %", min: 5, max: 50, value: 20, step: 1, onChange: (v) => opinionSim.setDensityA(v / 100) });
  controls.createSlider({ id: "op-density-b", label: "Densidad B %", min: 5, max: 50, value: 15, step: 1, onChange: (v) => opinionSim.setDensityB(v / 100) });
  controls.createSlider({ id: "op-influencers", label: "Influencers", min: 0, max: 10, value: 3, step: 1, onChange: (v) => opinionSim.setInfluencerCount(v) });
  controls.createSlider({ id: "op-threshold", label: "Umbral convicción %", min: 10, max: 90, value: 50, step: 5, onChange: (v) => opinionSim.setConvictionThreshold(v / 100) });
  controls.createSeparator();
  controls.createSectionTitle("Modos");
  controls.createToggle({ id: "op-misinfo", label: "Desinformación", checked: false, onChange: (v) => opinionSim.setMisinformation(v) });
  controls.createToggle({ id: "op-glow", label: "Efecto Glow", checked: true, onChange: (v) => renderer.setGlow(v) });
  controls.createSeparator();
  controls.createStats({ "Generación": 0, "Opinión A": 0, "Opinión B": 0, "Neutral": 0 });

  if (!opinionChart) {
    opinionChart = new SimulationChart("chart-opinion", [
      { label: "Opinión A", color: "#6c5ce7" },
      { label: "Opinión B", color: "#e17055" },
      { label: "Neutral", color: "#636e72" },
    ], 300);
  }
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
          const color = lerpColor("rgb(0,180,216)", "rgb(0,255,200)", t);
          renderer.drawTriangle(x, y, cell.direction, 0.8, color, "rgba(0,180,216,0.6)");
          break;
        }
        case "predator":
          renderer.drawCircle(x, y, 0.7, "#ff2255", "rgba(255,34,85,0.4)");
          break;
        case "obstacle":
          renderer.drawRect(x, y, "#3d5a80", 0.7);
          break;
      }
    }
  }

  controls.updateStat("Generación", fishSim.getGeneration());
  const fishCount = grid.flat().filter(c => c.type === "fish").length;
  controls.updateStat("Peces", fishCount);

  if (fishSim.getGeneration() % 5 === 0) {
    fishChart?.addDataPoint(String(fishSim.getGeneration()), [fishCount]);
  }
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
          renderer.drawRect(x, y, "#2d3436");
          break;
        case EvacCellType.EXIT:
          renderer.drawGlowRect(x, y, "#00b894", "rgba(0,184,148,0.6)");
          break;
        case EvacCellType.FIRE:
          renderer.drawGlowRect(x, y, "#e17055", "rgba(225,112,85,0.5)");
          break;
        case EvacCellType.PERSON:
          if (cell.personState === PersonState.PANIC) {
            renderer.drawRect(x, y, "#fdcb6e");
          } else if (cell.personState === PersonState.FALLEN) {
            renderer.drawRect(x, y, "#636e72");
          } else {
            renderer.drawRect(x, y, "#74b9ff");
          }
          break;
        case EvacCellType.EMPTY: {
          const maxPot = 60;
          const pot = Math.min((potentialMap[y]?.[x] ?? 999) / maxPot, 1);
          const r = Math.round(15 + pot * 10);
          const g = Math.round(15 + (1 - pot) * 10);
          const b = Math.round(30 + (1 - pot) * 8);
          renderer.drawRect(x, y, `rgb(${r},${g},${b})`);
          break;
        }
      }
    }
  }

  const total = evacSim.getTotalPersons();
  const evacuated = evacSim.getEvacuatedCount();
  const pct = total > 0 ? ((evacuated / total) * 100).toFixed(1) : "0";
  controls.updateStat("Generación", evacSim.getGeneration());
  controls.updateStat("Evacuados", evacuated);
  controls.updateStat("Pánico", evacSim.getPanicCount());
  controls.updateStat("Caídos", evacSim.getFallenCount());
  controls.updateStat("% Evacuado", `${pct}%`);

  if (evacSim.getGeneration() % 5 === 0) {
    evacChart?.addDataPoint(String(evacSim.getGeneration()), [evacuated, evacSim.getPanicCount(), evacSim.getFallenCount()]);
  }
}

function renderOpinion(): void {
  renderer.clear();
  const grid = opinionSim.getGrid();

  for (let y = 0; y < opinionSim.getHeight(); y++) {
    for (let x = 0; x < opinionSim.getWidth(); x++) {
      const cell = grid[y][x];
      let color: string;
      let glowColor: string | undefined;
      switch (cell.state) {
        case OpinionState.A_FAVORABLE: {
          const c = cell.conviction;
          color = `rgb(${Math.round(108 + c * 147)},${Math.round(92 - c * 40)},${Math.round(231 - c * 100)})`;
          glowColor = "rgba(108,92,231,0.3)";
          break;
        }
        case OpinionState.B_FAVORABLE: {
          const c = cell.conviction;
          color = `rgb(${Math.round(225 + c * 30)},${Math.round(112 - c * 60)},${Math.round(85 - c * 40)})`;
          glowColor = "rgba(225,112,85,0.3)";
          break;
        }
        case OpinionState.INFLUENCER:
          color = cell.opinionType === "A" ? "#a29bfe" : "#ffeaa7";
          glowColor = cell.opinionType === "A" ? "rgba(162,155,254,0.5)" : "rgba(255,234,167,0.5)";
          break;
        case OpinionState.INDIFERENTE:
          color = "#b2bec3";
          break;
        case OpinionState.NEUTRAL:
        default:
          color = "#0d0d1a";
          break;
      }
      if (glowColor && cell.state !== OpinionState.NEUTRAL && cell.state !== OpinionState.INDIFERENTE && cell.conviction > 0.5) {
        renderer.drawGlowRect(x, y, color, glowColor);
      } else {
        renderer.drawRect(x, y, color);
      }
    }
  }

  controls.updateStat("Generación", opinionSim.getGeneration());
  controls.updateStat("Opinión A", opinionSim.getCountA());
  controls.updateStat("Opinión B", opinionSim.getCountB());
  controls.updateStat("Neutral", opinionSim.getCountNeutral());

  if (opinionSim.getGeneration() % 5 === 0) {
    opinionChart?.addDataPoint(String(opinionSim.getGeneration()), [opinionSim.getCountA(), opinionSim.getCountB(), opinionSim.getCountNeutral()]);
  }
}

function runLoop(): void {
  const loop = (timestamp: number) => {
    frameCount++;
    if (timestamp - lastFpsTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFpsTime = timestamp;
      const fpsBadge = document.getElementById("fps-badge");
      if (fpsBadge) fpsBadge.textContent = `${fps} FPS`;
    }

    if (!paused) {
      const stepInterval = Math.max(16, 100 / speedMultiplier);
      if (timestamp - lastStepTime >= stepInterval) {
        switch (currentSim) {
          case "fish": fishSim.step(); renderFish(); break;
          case "evacuation": evacSim.step(); renderEvacuation(); break;
          case "opinion": opinionSim.step(); renderOpinion(); break;
        }
        lastStepTime = timestamp;
        const genBadge = document.getElementById("gen-badge");
        if (genBadge) {
          const gen = currentSim === "fish" ? fishSim.getGeneration() : currentSim === "evacuation" ? evacSim.getGeneration() : opinionSim.getGeneration();
          genBadge.textContent = `Gen: ${gen}`;
        }
      }
    }
    animationId = requestAnimationFrame(loop);
  };
  animationId = requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", init);