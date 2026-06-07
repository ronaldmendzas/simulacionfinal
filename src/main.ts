import { FishSchool, type FishSchoolConfig } from "./simulations/FishSchool.ts";
import { CrowdEvacuation, type CrowdEvacuationConfig, EvacCellType, PersonState } from "./simulations/CrowdEvacuation.ts";
import { OpinionSpread, type OpinionSpreadConfig, OpinionState } from "./simulations/OpinionSpread.ts";
import { CanvasRenderer } from "./renderers/CanvasRenderer.ts";
import { SimulationControls } from "./ui/SimulationControls.ts";
import { SimulationChart } from "./charts/SimulationChart.ts";
import { lerpColor } from "./utils/colors.ts";
import "./style.css";

const SVG_GRID = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="5" rx="0.5"/><rect x="9" y="2" width="5" height="5" rx="0.5"/><rect x="2" y="9" width="5" height="5" rx="0.5"/><rect x="9" y="9" width="5" height="5" rx="0.5"/></svg>';

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

function init(): void {
  const app = document.getElementById("app")!;

  app.innerHTML = `
    <header class="app-header">
      <div class="header-content">
        <div class="logo-container">
          <h1>Aut&oacute;matas Celulares</h1>
          <span class="subtitle">IINF-391 &mdash; 3er Parcial</span>
        </div>
        <div class="header-stats">
          <span class="fps-badge" id="fps-badge">0 FPS</span>
          <span class="gen-badge" id="gen-badge">Gen 0</span>
        </div>
      </div>
    </header>

    <nav class="tab-nav">
      <button class="tab-btn active" data-sim="fish">Cardumen</button>
      <button class="tab-btn" data-sim="evacuation">Evacuaci&oacute;n</button>
      <button class="tab-btn" data-sim="opinion">Opiniones</button>
    </nav>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="light-beam-btn"><button class="btn-inside" id="btn-play" title="Play/Pause"><svg class="btn-svg" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="4" height="10" rx="1"/><rect x="9" y="3" width="4" height="10" rx="1"/></svg> Pause</button></div>
        <div class="light-beam-btn"><button class="btn-inside" id="btn-step" title="Step"><svg class="btn-svg" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,2 12,8 3,14"/><rect x="12" y="2" width="2" height="12" rx="0.5"/></svg> Step</button></div>
        <div class="light-beam-btn"><button class="btn-inside" id="btn-reset" title="Reset"><svg class="btn-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 8A5.5 5.5 0 1 1 8 13.5"/><polyline points="2.5,4 2.5,8.5 7,8.5"/></svg> Reset</button></div>
      </div>
      <div class="toolbar-center">
        <span class="toolbar-label">Velocidad</span>
        <input type="range" id="global-speed" min="1" max="20" value="1" step="1" class="toolbar-slider">
        <span id="speed-val">1x</span>
      </div>
      <div class="toolbar-right">
        <span class="toolbar-label">Click:</span>
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
            <div class="light-beam-panel"><div id="controls-fish" class="controls-panel inside"></div></div>
            <div class="light-beam-panel green-beam"><div class="chart-container inside"><div class="chart-title">Peces Activos</div><canvas id="chart-fish"></canvas></div></div>
          </aside>
        </div>
      </section>

      <section id="sim-evacuation" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-area"><canvas id="canvas-evac"></canvas></div>
          <aside class="sidebar">
            <div class="light-beam-panel"><div id="controls-evac" class="controls-panel inside"></div></div>
            <div class="light-beam-panel green-beam"><div class="chart-container inside"><div class="chart-title">Evacuaci&oacute;n</div><canvas id="chart-evac"></canvas></div></div>
          </aside>
        </div>
      </section>

      <section id="sim-opinion" class="sim-panel">
        <div class="sim-layout">
          <div class="canvas-area"><canvas id="canvas-opinion"></canvas></div>
          <aside class="sidebar">
            <div class="light-beam-panel"><div id="controls-opinion" class="controls-panel inside"></div></div>
            <div class="light-beam-panel green-beam"><div class="chart-container inside"><div class="chart-title">Opiniones</div><canvas id="chart-opinion"></canvas></div></div>
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
  document.querySelectorAll(".tab-btn").forEach((tab) => {
    tab.addEventListener("click", () => {
      const sim = (tab as HTMLElement).dataset.sim as SimulationType;
      switchSimulation(sim);
      document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });
}

function setupToolbar(): void {
  const playSvg = `<svg class="btn-svg" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="4" height="10" rx="1"/><rect x="9" y="3" width="4" height="10" rx="1"/></svg>`;
  const playActiveSvg = `<svg class="btn-svg" viewBox="0 0 16 16" fill="currentColor"><polygon points="4,2 14,8 4,14"/></svg>`;
  const playBtn = document.getElementById("btn-play")!;
  playBtn.addEventListener("click", () => {
    paused = !paused;
    playBtn.innerHTML = paused ? `${playActiveSvg} Play` : `${playSvg} Pause`;
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
  const sel = document.getElementById("mouse-mode") as HTMLSelectElement;
  sel.innerHTML = "";
  if (currentSim === "fish") sel.innerHTML = '<option value="observe">Observar</option><option value="add-fish">Pez</option><option value="add-predator">Depredador</option><option value="add-obstacle">Obst&aacute;culo</option>';
  else if (currentSim === "evacuation") sel.innerHTML = '<option value="observe">Observar</option><option value="add-person">Persona</option><option value="add-wall">Pared</option><option value="add-fire">Fuego</option>';
  else sel.innerHTML = '<option value="observe">Observar</option><option value="add-a">Opini&oacute;n A</option><option value="add-b">Opini&oacute;n B</option><option value="add-influencer">Influencer</option>';
  mouseMode = "observe";
}

function setupCanvasClick(): void {
  const canvasId = currentSim === "fish" ? "canvas-fish" : currentSim === "evacuation" ? "canvas-evac" : "canvas-opinion";
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  canvas.onclick = (e: MouseEvent) => {
    if (mouseMode === "observe") return;
    const rect = canvas.getBoundingClientRect();
    const gridX = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width) / renderer.getCellSize());
    const gridY = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height) / renderer.getCellSize());
    if (currentSim === "fish") handleFishClick(gridX, gridY);
    else if (currentSim === "evacuation") handleEvacClick(gridX, gridY);
    else handleOpinionClick(gridX, gridY);
  };
}

function handleFishClick(x: number, y: number): void {
  if (x < 0 || x >= fishSim.getWidth() || y < 0 || y >= fishSim.getHeight()) return;
  const g = fishSim.getGrid();
  if (mouseMode === "add-fish" && g[y][x].type === "empty") fishSim.setCell(x, y, { type: "fish", direction: Math.floor(Math.random() * 8), speed: 2 });
  else if (mouseMode === "add-predator" && g[y][x].type === "empty") fishSim.setCell(x, y, { type: "predator", direction: Math.floor(Math.random() * 8), speed: 3 });
  else if (mouseMode === "add-obstacle" && g[y][x].type === "empty") fishSim.setCell(x, y, { type: "obstacle", direction: 0, speed: 1 });
}

function handleEvacClick(x: number, y: number): void {
  if (x < 0 || x >= evacSim.getWidth() || y < 0 || y >= evacSim.getHeight()) return;
  const g = evacSim.getGrid();
  if (mouseMode === "add-person" && g[y][x].type === EvacCellType.EMPTY) evacSim.setCell(x, y, { type: EvacCellType.PERSON, personState: PersonState.NORMAL, panicLevel: 0.1, speed: 1, vision: 4, potential: 0 });
  else if (mouseMode === "add-wall" && g[y][x].type === EvacCellType.EMPTY) evacSim.setCell(x, y, { type: EvacCellType.WALL, personState: null, panicLevel: 0, speed: 0, vision: 0, potential: 0 });
  else if (mouseMode === "add-fire" && g[y][x].type === EvacCellType.EMPTY) evacSim.setCell(x, y, { type: EvacCellType.FIRE, personState: null, panicLevel: 0, speed: 0, vision: 0, potential: 0 });
}

function handleOpinionClick(x: number, y: number): void {
  if (x < 0 || x >= opinionSim.getWidth() || y < 0 || y >= opinionSim.getHeight()) return;
  const g = opinionSim.getGrid();
  if (mouseMode === "add-a" && g[y][x].state === OpinionState.NEUTRAL) opinionSim.setCell(x, y, { state: OpinionState.A_FAVORABLE, conviction: 0.5, resistance: 0.2, opinionType: "A", sameOpinionTicks: 0, influencerForce: 0 });
  else if (mouseMode === "add-b" && g[y][x].state === OpinionState.NEUTRAL) opinionSim.setCell(x, y, { state: OpinionState.B_FAVORABLE, conviction: 0.5, resistance: 0.2, opinionType: "B", sameOpinionTicks: 0, influencerForce: 0 });
  else if (mouseMode === "add-influencer" && g[y][x].state === OpinionState.NEUTRAL) { const t = Math.random() < 0.5 ? "A" as const : "B" as const; opinionSim.setCell(x, y, { state: OpinionState.INFLUENCER, conviction: 1, resistance: 1, opinionType: t, sameOpinionTicks: 0, influencerForce: 0.9 }); }
}

function switchSimulation(sim: SimulationType): void {
  if (animationId !== null) { cancelAnimationFrame(animationId); animationId = null; }
  paused = false;
  document.getElementById("btn-play")!.textContent = "\u23F8";
  currentSim = sim;
  document.querySelectorAll(".sim-panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`sim-${sim}`)?.classList.add("active");

  switch (sim) {
    case "fish": renderer = new CanvasRenderer("canvas-fish", fishSim.getWidth(), fishSim.getHeight()); initFishControls(); break;
    case "evacuation": renderer = new CanvasRenderer("canvas-evac", evacSim.getWidth(), evacSim.getHeight()); initEvacControls(); break;
    case "opinion": renderer = new CanvasRenderer("canvas-opinion", opinionSim.getWidth(), opinionSim.getHeight()); initOpinionControls(); break;
  }
  updateMouseOptions();
  setupCanvasClick();
  runLoop();
}

function initFishSim(): void { fishSim = new FishSchool({ width: 120, height: 80, boundaryType: "toroidal", fishCount: 200, hasPredator: false, obstacleDensity: 0.01, perceptionRadius: 3, speedMultiplier: 1 }); }
function initEvacSim(): void { evacSim = new CrowdEvacuation({ width: 80, height: 60, boundaryType: "fixed", personCount: 120, exitCount: 2, hasFire: false, initialPanicThreshold: 0.7 }); }
function initOpinionSim(): void { opinionSim = new OpinionSpread({ width: 100, height: 100, boundaryType: "toroidal", densityA: 0.2, densityB: 0.15, influencerCount: 3, convictionThreshold: 0.5, longLinksK: 2, misinformation: false }); }

function initFishControls(): void {
  controls = new SimulationControls("controls-fish");
  controls.createSectionTitle("Par\u00e1metros");
  controls.createSlider({ id: "fish-count", label: "Peces", min: 50, max: 800, value: 200, step: 10, onChange: (v) => fishSim.setFishCount(v) });
  controls.createSlider({ id: "fish-perception", label: "Radio percepci\u00f3n", min: 1, max: 5, value: 3, step: 1, onChange: (v) => fishSim.setPerceptionRadius(v) });
  controls.createSlider({ id: "fish-obstacles", label: "Obst\u00e1culos %", min: 0, max: 10, value: 1, step: 1, onChange: (v) => fishSim.setObstacleDensity(v / 100) });
  controls.createSeparator();
  controls.createToggle({ id: "fish-predator", label: "Depredador", checked: false, onChange: (v) => fishSim.setPredator(v) });
  controls.createSeparator();
  controls.createButton("Reiniciar", () => fishSim.setFishCount(controls.getValue("fish-count")));
  controls.createSeparator();
  controls.createStats({ "Generaci\u00f3n": 0, "Peces": 200 });
  if (!fishChart) fishChart = new SimulationChart("chart-fish", [{ label: "Activos", color: "#1d4ed8" }], 300);
}

function initEvacControls(): void {
  controls = new SimulationControls("controls-evac");
  controls.createSectionTitle("Par\u00e1metros");
  controls.createSlider({ id: "evac-persons", label: "Personas", min: 20, max: 300, value: 120, step: 10, onChange: (v) => evacSim.setPersonCount(v) });
  controls.createSlider({ id: "evac-exits", label: "Salidas", min: 1, max: 4, value: 2, step: 1, onChange: (v) => evacSim.setExitCount(v) });
  controls.createSeparator();
  controls.createToggle({ id: "evac-fire", label: "Fuego", checked: false, onChange: (v) => evacSim.setHasFire(v) });
  controls.createSeparator();
  controls.createButton("Reiniciar", () => evacSim.setPersonCount(controls.getValue("evac-persons")));
  controls.createSeparator();
  controls.createStats({ "Generaci\u00f3n": 0, "Evacuados": 0, "P\u00e1nico": 0, "Ca\u00eddos": 0, "% Evacuado": "0%" });
  if (!evacChart) evacChart = new SimulationChart("chart-evac", [{ label: "Evacuados", color: "#15803d" }, { label: "P\u00e1nico", color: "#b45309" }, { label: "Ca\u00eddos", color: "#b91c1c" }], 300);
}

function initOpinionControls(): void {
  controls = new SimulationControls("controls-opinion");
  controls.createSectionTitle("Par\u00e1metros");
  controls.createSlider({ id: "op-density-a", label: "Densidad A %", min: 5, max: 50, value: 20, step: 1, onChange: (v) => opinionSim.setDensityA(v / 100) });
  controls.createSlider({ id: "op-density-b", label: "Densidad B %", min: 5, max: 50, value: 15, step: 1, onChange: (v) => opinionSim.setDensityB(v / 100) });
  controls.createSlider({ id: "op-influencers", label: "Influencers", min: 0, max: 10, value: 3, step: 1, onChange: (v) => opinionSim.setInfluencerCount(v) });
  controls.createSlider({ id: "op-threshold", label: "Umbral convicci\u00f3n %", min: 10, max: 90, value: 50, step: 5, onChange: (v) => opinionSim.setConvictionThreshold(v / 100) });
  controls.createSeparator();
  controls.createToggle({ id: "op-misinfo", label: "Desinformaci\u00f3n", checked: false, onChange: (v) => opinionSim.setMisinformation(v) });
  controls.createSeparator();
  controls.createButton("Reiniciar", () => opinionSim.reset());
  controls.createSeparator();
  controls.createStats({ "Generaci\u00f3n": 0, "Opini\u00f3n A": 0, "Opini\u00f3n B": 0, "Neutral": 0 });
  if (!opinionChart) opinionChart = new SimulationChart("chart-opinion", [{ label: "A", color: "#1d4ed8" }, { label: "B", color: "#b91c1c" }, { label: "Neutral", color: "#888" }], 300);
}

function renderFish(): void {
  renderer.clear();
  const grid = fishSim.getGrid();
  for (let y = 0; y < fishSim.getHeight(); y++) {
    for (let x = 0; x < fishSim.getWidth(); x++) {
      const cell = grid[y][x];
      if (cell.type === "fish") {
        const lf = fishSim.getMooreNeighbors(x, y, 2).filter(c => c.type === "fish").length;
        renderer.drawTriangle(x, y, cell.direction, 0.8, lerpColor("rgb(37,99,235)", "rgb(6,150,200)", Math.min(lf / 6, 1)));
      } else if (cell.type === "predator") {
        renderer.drawCircle(x, y, 0.6, "#b91c1c", "rgba(185,28,28,0.3)");
      } else if (cell.type === "obstacle") {
        renderer.drawRect(x, y, "#64748b", 0.5);
      }
    }
  }
  controls.updateStat("Generaci\u00f3n", fishSim.getGeneration());
  const fc = grid.flat().filter(c => c.type === "fish").length;
  controls.updateStat("Peces", fc);
  if (fishSim.getGeneration() % 5 === 0) fishChart?.addDataPoint(String(fishSim.getGeneration()), [fc]);
}

function renderEvacuation(): void {
  renderer.clear();
  const grid = evacSim.getGrid();
  const pm = evacSim.getPotentialMap();
  for (let y = 0; y < evacSim.getHeight(); y++) {
    for (let x = 0; x < evacSim.getWidth(); x++) {
      const c = grid[y][x];
      if (c.type === EvacCellType.WALL) renderer.drawRect(x, y, "#334155");
      else if (c.type === EvacCellType.EXIT) renderer.drawBorderedRect(x, y, "#15803d", "#166534");
      else if (c.type === EvacCellType.FIRE) renderer.drawBorderedRect(x, y, "#b91c1c", "#991b1b");
      else if (c.type === EvacCellType.PERSON) {
        if (c.personState === PersonState.PANIC) renderer.drawRect(x, y, "#b45309");
        else if (c.personState === PersonState.FALLEN) renderer.drawRect(x, y, "#57534e");
        else renderer.drawRect(x, y, "#2563eb");
      } else {
        const p = Math.min((pm[y]?.[x] ?? 999) / 60, 1);
        const g = Math.round(27 + (1 - p) * 10);
        renderer.drawRect(x, y, `rgb(${g},${g},${Math.round(g * 1.1)})`);
      }
    }
  }
  const t = evacSim.getTotalPersons(), e = evacSim.getEvacuatedCount();
  controls.updateStat("Generaci\u00f3n", evacSim.getGeneration());
  controls.updateStat("Evacuados", e);
  controls.updateStat("P\u00e1nico", evacSim.getPanicCount());
  controls.updateStat("Ca\u00eddos", evacSim.getFallenCount());
  controls.updateStat("% Evacuado", `${t > 0 ? ((e / t) * 100).toFixed(1) : "0"}%`);
  if (evacSim.getGeneration() % 5 === 0) evacChart?.addDataPoint(String(evacSim.getGeneration()), [e, evacSim.getPanicCount(), evacSim.getFallenCount()]);
}

function renderOpinion(): void {
  renderer.clear();
  const grid = opinionSim.getGrid();
  for (let y = 0; y < opinionSim.getHeight(); y++) {
    for (let x = 0; x < opinionSim.getWidth(); x++) {
      const c = grid[y][x];
      let color: string;
      if (c.state === OpinionState.A_FAVORABLE) { const v = c.conviction; color = `rgb(${29 + Math.round(v * 20)},${78 + Math.round(v * 30)},${235 - Math.round(v * 40)})`; }
      else if (c.state === OpinionState.B_FAVORABLE) { const v = c.conviction; color = `rgb(${185 + Math.round(v * 30)},${28 + Math.round(v * 15)},${28 + Math.round(v * 10)})`; }
      else if (c.state === OpinionState.INFLUENCER) color = c.opinionType === "A" ? "#7c3aed" : "#ea580c";
      else if (c.state === OpinionState.INDIFERENTE) color = "#94a3b8";
      else color = "#1e293b";
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
      const fb = document.getElementById("fps-badge"); if (fb) fb.textContent = `${fps} FPS`;
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
        const gb = document.getElementById("gen-badge");
        if (gb) { const gen = currentSim === "fish" ? fishSim.getGeneration() : currentSim === "evacuation" ? evacSim.getGeneration() : opinionSim.getGeneration(); gb.textContent = `Gen ${gen}`; }
      }
    }
    animationId = requestAnimationFrame(loop);
  };
  animationId = requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", init);