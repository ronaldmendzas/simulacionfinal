import { FishSchool, type FishSchoolConfig } from "./simulations/FishSchool.ts";
import { CrowdEvacuation, type CrowdEvacuationConfig, EvacCellType, PersonState } from "./simulations/CrowdEvacuation.ts";
import { OpinionSpread, type OpinionSpreadConfig, OpinionState } from "./simulations/OpinionSpread.ts";
import { CanvasRenderer } from "./renderers/CanvasRenderer.ts";
import { SimulationControls } from "./ui/SimulationControls.ts";
import { SimulationChart } from "./charts/SimulationChart.ts";
import { lerpColor } from "./utils/colors.ts";
import "./style.css";

const SVG_FISH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8c2-3 5-4 8-3l3 3-3 3c-3 1-6 0-8-3z"/><circle cx="11" cy="8" r="1" fill="currentColor"/></svg>';
const SVG_PERSON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="3" r="2.5"/><path d="M4 15v-4c0-2 1.5-3 4-3s4 1 4 3v4"/></svg>';
const SVG_OPINION = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 2h12v8H6l-3 3v-3H2z"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="7.5" x2="9" y2="7.5"/></svg>';

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

function svgIcon(svgStr: string): string {
  return `<span class="tab-icon">${svgStr}</span>`;
}

function init(): void {
  const app = document.getElementById("app")!;

  app.innerHTML = `
    <header class="app-header">
      <div class="header-content">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <div>
            <h1>Simulaci\u00f3n CA</h1>
            <p class="subtitle">Aut\u00f3matas Celulares \u2014 IINF-391</p>
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
        ${svgIcon(SVG_FISH)}<span>Cardumen</span>
      </button>
      <button class="tab-btn" data-sim="evacuation">
        ${svgIcon(SVG_PERSON)}<span>Evacuaci\u00f3n</span>
      </button>
      <button class="tab-btn" data-sim="opinion">
        ${svgIcon(SVG_OPINION)}<span>Opiniones</span>
      </button>
    </nav>

    <div class="toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" id="btn-play" title="Play/Pause">\u23f8</button>
        <button class="toolbar-btn" id="btn-step" title="Step">\u23ed</button>
        <button class="toolbar-btn" id="btn-reset" title="Reset">\u21bb</button>
      </div>
      <div class="toolbar-center">
        <label class="toolbar-label">Velocidad</label>
        <input type="range" id="global-speed" min="1" max="20" value="1" step="1" class="toolbar-slider">
        <span id="speed-val">1x</span>
      </div>
      <div class="toolbar-right">
        <label class="toolbar-label">Mouse</label>
        <select id="mouse-mode" class="toolbar-select">
          <option value="observe">Observar</option>
        </select>
      </div>
    </div>

    <main class="simulation-container">
      <section id="sim-fish" class="sim-panel active">
        <div class="sim-layout">
          <div class="canvas-area"><canvas id="canvas-fish"></canvas></div>
          <aside class="sidebar">
            <div id="controls-fish" class="controls-panel"></div>
            <div class="chart-container">
              <div class="chart-title">Peces Activos</div>
              <canvas id="chart-fish"></canvas>
            </div>
          </aside>
        </div>
      </section>

      <section id="sim-evacuation" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-area"><canvas id="canvas-evac"></canvas></div>
          <aside class="sidebar">
            <div id="controls-evac" class="controls-panel"></div>
            <div class="chart-container">
              <div class="chart-title">Evacuaci\u00f3n en Vivo</div>
              <canvas id="chart-evac"></canvas>
            </div>
          </aside>
        </div>
      </section>

      <section id="sim-opinion" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-area"><canvas id="canvas-opinion"></canvas></div>
          <aside class="sidebar">
            <div id="controls-opinion" class="controls-panel"></div>
            <div class="chart-container">
              <div class="chart-title">Distribuci\u00f3n de Opiniones</div>
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
    document.getElementById("btn-play")!.textContent = paused ? "\u25b6" : "\u23f8";
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
  });

  const speedSlider = document.getElementById("global-speed") as HTMLInputElement;
  speedSlider.addEventListener("input", () => {
    speedMultiplier = Number(speedSlider.value);
    document.getElementById("speed-val")!.textContent = `${speedMultiplier}x`;
  });

  const modeSelect = document.getElementById("mouse-mode") as HTMLSelectElement;
  modeSelect.addEventListener("change", () => { mouseMode = modeSelect.value; });
}

function updateMouseOptions(): void {
  const select = document.getElementById("mouse-mode") as HTMLSelectElement;
  select.innerHTML = "";
  if (currentSim === "fish") {
    select.innerHTML = '<option value="observe">Observar</option><option value="add-fish">Agregar Pez</option><option value="add-predator">Depredador</option><option value="add-obstacle">Obst\u00e1culo</option>';
  } else if (currentSim === "evacuation") {
    select.innerHTML = '<option value="observe">Observar</option><option value="add-person">Persona</option><option value="add-wall">Pared</option><option value="add-fire">Fuego</option>';
  } else {
    select.innerHTML = '<option value="observe">Observar</option><option value="add-a">Opini\u00f3n A</option><option value="add-b">Opini\u00f3n B</option><option value="add-influencer">Influencer</option>';
  }
  mouseMode = "observe";
}

function setupCanvasClick(): void {
  const canvasId = currentSim === "fish" ? "canvas-fish" : currentSim === "evacuation" ? "canvas-evac" : "canvas-opinion";
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const handler = (e: MouseEvent) => {
    if (mouseMode === "observe") return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const gridX = Math.floor((e.clientX - rect.left) * scaleX / renderer.getCellSize());
    const gridY = Math.floor((e.clientY - rect.top) * scaleY / renderer.getCellSize());
    if (currentSim === "fish") handleFishClick(gridX, gridY);
    else if (currentSim === "evacuation") handleEvacClick(gridX, gridY);
    else handleOpinionClick(gridX, gridY);
  };
  canvas.removeEventListener("click", (() => {}) as EventListener);
  canvas.addEventListener("click", handler);
}

function handleFishClick(x: number, y: number): void {
  if (x < 0 || x >= fishSim.getWidth() || y < 0 || y >= fishSim.getHeight()) return;
  const grid = fishSim.getGrid();
  if (mouseMode === "add-fish" && grid[y][x].type === "empty")
    fishSim.setCell(x, y, { type: "fish", direction: Math.floor(Math.random() * 8), speed: 2 });
  else if (mouseMode === "add-predator" && grid[y][x].type === "empty")
    fishSim.setCell(x, y, { type: "predator", direction: Math.floor(Math.random() * 8), speed: 3 });
  else if (mouseMode === "add-obstacle" && grid[y][x].type === "empty")
    fishSim.setCell(x, y, { type: "obstacle", direction: 0, speed: 1 });
}

function handleEvacClick(x: number, y: number): void {
  if (x < 0 || x >= evacSim.getWidth() || y < 0 || y >= evacSim.getHeight()) return;
  const grid = evacSim.getGrid();
  if (mouseMode === "add-person" && grid[y][x].type === EvacCellType.EMPTY)
    evacSim.setCell(x, y, { type: EvacCellType.PERSON, personState: PersonState.NORMAL, panicLevel: 0.1, speed: 1, vision: 4, potential: 0 });
  else if (mouseMode === "add-wall" && grid[y][x].type === EvacCellType.EMPTY)
    evacSim.setCell(x, y, { type: EvacCellType.WALL, personState: null, panicLevel: 0, speed: 0, vision: 0, potential: 0 });
  else if (mouseMode === "add-fire" && grid[y][x].type === EvacCellType.EMPTY)
    evacSim.setCell(x, y, { type: EvacCellType.FIRE, personState: null, panicLevel: 0, speed: 0, vision: 0, potential: 0 });
}

function handleOpinionClick(x: number, y: number): void {
  if (x < 0 || x >= opinionSim.getWidth() || y < 0 || y >= opinionSim.getHeight()) return;
  const grid = opinionSim.getGrid();
  if (mouseMode === "add-a" && grid[y][x].state === OpinionState.NEUTRAL)
    opinionSim.setCell(x, y, { state: OpinionState.A_FAVORABLE, conviction: 0.5, resistance: 0.2, opinionType: "A", sameOpinionTicks: 0, influencerForce: 0 });
  else if (mouseMode === "add-b" && grid[y][x].state === OpinionState.NEUTRAL)
    opinionSim.setCell(x, y, { state: OpinionState.B_FAVORABLE, conviction: 0.5, resistance: 0.2, opinionType: "B", sameOpinionTicks: 0, influencerForce: 0 });
  else if (mouseMode === "add-influencer" && grid[y][x].state === OpinionState.NEUTRAL) {
    const t = Math.random() < 0.5 ? "A" as const : "B" as const;
    opinionSim.setCell(x, y, { state: OpinionState.INFLUENCER, conviction: 1, resistance: 1, opinionType: t, sameOpinionTicks: 0, influencerForce: 0.9 });
  }
}

function switchSimulation(sim: SimulationType): void {
  if (animationId !== null) { cancelAnimationFrame(animationId); animationId = null; }
  paused = false;
  document.getElementById("btn-play")!.textContent = "\u23f8";
  currentSim = sim;
  document.querySelectorAll(".sim-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`sim-${sim}`)?.classList.add("active");

  switch (sim) {
    case "fish":
      renderer = new CanvasRenderer("canvas-fish", fishSim.getWidth(), fishSim.getHeight());
      initFishControls(); break;
    case "evacuation":
      renderer = new CanvasRenderer("canvas-evac", evacSim.getWidth(), evacSim.getHeight());
      initEvacControls(); break;
    case "opinion":
      renderer = new CanvasRenderer("canvas-opinion", opinionSim.getWidth(), opinionSim.getHeight());
      initOpinionControls(); break;
  }
  updateMouseOptions();
  setupCanvasClick();
  runLoop();
}

function initFishSim(): void {
  fishSim = new FishSchool({ width: 120, height: 80, boundaryType: "toroidal", fishCount: 200, hasPredator: false, obstacleDensity: 0.01, perceptionRadius: 3, speedMultiplier: 1 });
}
function initEvacSim(): void {
  evacSim = new CrowdEvacuation({ width: 80, height: 60, boundaryType: "fixed", personCount: 120, exitCount: 2, hasFire: false, initialPanicThreshold: 0.7 });
}
function initOpinionSim(): void {
  opinionSim = new OpinionSpread({ width: 100, height: 100, boundaryType: "toroidal", densityA: 0.2, densityB: 0.15, influencerCount: 3, convictionThreshold: 0.5, longLinksK: 2, misinformation: false });
}

function initFishControls(): void {
  controls = new SimulationControls("controls-fish");
  controls.createSectionTitle("Par\u00e1metros");
  controls.createSlider({ id: "fish-count", label: "Peces", min: 50, max: 800, value: 200, step: 10, onChange: (v) => fishSim.setFishCount(v) });
  controls.createSlider({ id: "fish-perception", label: "Radio percepci\u00f3n", min: 1, max: 5, value: 3, step: 1, onChange: (v) => fishSim.setPerceptionRadius(v) });
  controls.createSlider({ id: "fish-obstacles", label: "Obst\u00e1culos %", min: 0, max: 10, value: 1, step: 1, onChange: (v) => fishSim.setObstacleDensity(v / 100) });
  controls.createSeparator();
  controls.createSectionTitle("Modos");
  controls.createToggle({ id: "fish-predator", label: "Depredador", checked: false, onChange: (v) => fishSim.setPredator(v) });
  controls.createSeparator();
  controls.createButton("Reiniciar", () => fishSim.setFishCount(controls.getValue("fish-count")));
  controls.createSeparator();
  controls.createStats({ "Generaci\u00f3n": 0, "Peces": 200 });
  if (!fishChart) fishChart = new SimulationChart("chart-fish", [{ label: "Activos", color: "#2563eb" }], 300);
}

function initEvacControls(): void {
  controls = new SimulationControls("controls-evac");
  controls.createSectionTitle("Par\u00e1metros");
  controls.createSlider({ id: "evac-persons", label: "Personas", min: 20, max: 300, value: 120, step: 10, onChange: (v) => evacSim.setPersonCount(v) });
  controls.createSlider({ id: "evac-exits", label: "Salidas", min: 1, max: 4, value: 2, step: 1, onChange: (v) => evacSim.setExitCount(v) });
  controls.createSeparator();
  controls.createSectionTitle("Modos");
  controls.createToggle({ id: "evac-fire", label: "Fuego/Humo", checked: false, onChange: (v) => evacSim.setHasFire(v) });
  controls.createSeparator();
  controls.createButton("Reiniciar", () => evacSim.setPersonCount(controls.getValue("evac-persons")));
  controls.createSeparator();
  controls.createStats({ "Generaci\u00f3n": 0, "Evacuados": 0, "P\u00e1nico": 0, "Ca\u00eddos": 0, "% Evacuado": "0%" });
  if (!evacChart) evacChart = new SimulationChart("chart-evac", [{ label: "Evacuados", color: "#16a34a" }, { label: "P\u00e1nico", color: "#d97706" }, { label: "Ca\u00eddos", color: "#dc2626" }], 300);
}

function initOpinionControls(): void {
  controls = new SimulationControls("controls-opinion");
  controls.createSectionTitle("Par\u00e1metros");
  controls.createSlider({ id: "op-density-a", label: "Densidad A %", min: 5, max: 50, value: 20, step: 1, onChange: (v) => opinionSim.setDensityA(v / 100) });
  controls.createSlider({ id: "op-density-b", label: "Densidad B %", min: 5, max: 50, value: 15, step: 1, onChange: (v) => opinionSim.setDensityB(v / 100) });
  controls.createSlider({ id: "op-influencers", label: "Influencers", min: 0, max: 10, value: 3, step: 1, onChange: (v) => opinionSim.setInfluencerCount(v) });
  controls.createSlider({ id: "op-threshold", label: "Umbral convicci\u00f3n %", min: 10, max: 90, value: 50, step: 5, onChange: (v) => opinionSim.setConvictionThreshold(v / 100) });
  controls.createSeparator();
  controls.createSectionTitle("Modos");
  controls.createToggle({ id: "op-misinfo", label: "Desinformaci\u00f3n", checked: false, onChange: (v) => opinionSim.setMisinformation(v) });
  controls.createSeparator();
  controls.createButton("Reiniciar", () => opinionSim.reset());
  controls.createSeparator();
  controls.createStats({ "Generaci\u00f3n": 0, "Opini\u00f3n A": 0, "Opini\u00f3n B": 0, "Neutral": 0 });
  if (!opinionChart) opinionChart = new SimulationChart("chart-opinion", [{ label: "A", color: "#2563eb" }, { label: "B", color: "#dc2626" }, { label: "Neutral", color: "#94a3b8" }], 300);
}

function renderFish(): void {
  renderer.clear();
  const grid = fishSim.getGrid();
  for (let y = 0; y < fishSim.getHeight(); y++) {
    for (let x = 0; x < fishSim.getWidth(); x++) {
      const cell = grid[y][x];
      if (cell.type === "fish") {
        const localFish = fishSim.getMooreNeighbors(x, y, 2).filter(c => c.type === "fish").length;
        const t = Math.min(localFish / 6, 1);
        const color = lerpColor("rgb(37,99,235)", "rgb(6,182,212)", t);
        renderer.drawTriangle(x, y, cell.direction, 0.8, color);
      } else if (cell.type === "predator") {
        renderer.drawCircle(x, y, 0.6, "#dc2626", "rgba(220,38,38,0.4)");
      } else if (cell.type === "obstacle") {
        renderer.drawRect(x, y, "#64748b", 0.6);
      }
    }
  }
  controls.updateStat("Generaci\u00f3n", fishSim.getGeneration());
  const fishCount = grid.flat().filter(c => c.type === "fish").length;
  controls.updateStat("Peces", fishCount);
  if (fishSim.getGeneration() % 5 === 0) fishChart?.addDataPoint(String(fishSim.getGeneration()), [fishCount]);
}

function renderEvacuation(): void {
  renderer.clear();
  const grid = evacSim.getGrid();
  const potentialMap = evacSim.getPotentialMap();
  for (let y = 0; y < evacSim.getHeight(); y++) {
    for (let x = 0; x < evacSim.getWidth(); x++) {
      const cell = grid[y][x];
      if (cell.type === EvacCellType.WALL) {
        renderer.drawRect(x, y, "#334155");
      } else if (cell.type === EvacCellType.EXIT) {
        renderer.drawBorderedRect(x, y, "#16a34a", "#15803d");
      } else if (cell.type === EvacCellType.FIRE) {
        renderer.drawBorderedRect(x, y, "#dc2626", "#b91c1c");
      } else if (cell.type === EvacCellType.PERSON) {
        if (cell.personState === PersonState.PANIC) renderer.drawRect(x, y, "#f59e0b");
        else if (cell.personState === PersonState.FALLEN) renderer.drawRect(x, y, "#78716c");
        else renderer.drawRect(x, y, "#3b82f6");
      } else {
        const maxPot = 60;
        const pot = Math.min((potentialMap[y]?.[x] ?? 999) / maxPot, 1);
        const gray = Math.round(26 + (1 - pot) * 12);
        renderer.drawRect(x, y, `rgb(${gray},${gray},${Math.round(gray * 1.15)})`);
      }
    }
  }
  const total = evacSim.getTotalPersons();
  const evacuated = evacSim.getEvacuatedCount();
  const pct = total > 0 ? ((evacuated / total) * 100).toFixed(1) : "0";
  controls.updateStat("Generaci\u00f3n", evacSim.getGeneration());
  controls.updateStat("Evacuados", evacuated);
  controls.updateStat("P\u00e1nico", evacSim.getPanicCount());
  controls.updateStat("Ca\u00eddos", evacSim.getFallenCount());
  controls.updateStat("% Evacuado", `${pct}%`);
  if (evacSim.getGeneration() % 5 === 0) evacChart?.addDataPoint(String(evacSim.getGeneration()), [evacuated, evacSim.getPanicCount(), evacSim.getFallenCount()]);
}

function renderOpinion(): void {
  renderer.clear();
  const grid = opinionSim.getGrid();
  for (let y = 0; y < opinionSim.getHeight(); y++) {
    for (let x = 0; x < opinionSim.getWidth(); x++) {
      const cell = grid[y][x];
      let color: string;
      if (cell.state === OpinionState.A_FAVORABLE) {
        const c = cell.conviction;
        color = `rgb(${Math.round(37 + c * 30)},${Math.round(99 + c * 40)},${Math.round(235 - c * 30)})`;
      } else if (cell.state === OpinionState.B_FAVORABLE) {
        const c = cell.conviction;
        color = `rgb(${Math.round(220 + c * 25)},${Math.round(38 + c * 20)},${Math.round(38 + c * 10)})`;
      } else if (cell.state === OpinionState.INFLUENCER) {
        color = cell.opinionType === "A" ? "#7c3aed" : "#ea580c";
      } else if (cell.state === OpinionState.INDIFERENTE) {
        color = "#94a3b8";
      } else {
        color = "#1e293b";
      }
      renderer.drawRect(x, y, color);
    }
  }
  controls.updateStat("Generaci\u00f3n", opinionSim.getGeneration());
  controls.updateStat("Opini\u00f3n A", opinionSim.getCountA());
  controls.updateStat("Opini\u00f3n B", opinionSim.getCountB());
  controls.updateStat("Neutral", opinionSim.getCountNeutral());
  if (opinionSim.getGeneration() % 5 === 0) opinionChart?.addDataPoint(String(opinionSim.getGeneration()), [opinionSim.getCountA(), opinionSim.getCountB(), opinionSim.getCountNeutral()]);
}

function runLoop(): void {
  const loop = (timestamp: number) => {
    frameCount++;
    if (timestamp - lastFpsTime >= 1000) {
      fps = frameCount; frameCount = 0; lastFpsTime = timestamp;
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