import PptxGenJS from "pptxgenjs";
import { writeFileSync } from "fs";

const pptx = new PptxGenJS();

pptx.author = "IINF-391";
pptx.title = "Simulación con Autómatas Celulares";
pptx.subject = "3er Parcial";

const DARK = "0A0A0F";
const BLUE = "1488FC";
const GREEN = "22C55E";
const RED = "EF4444";
const ORANGE = "F59E0B";
const PURPLE = "8B5CF6";
const WHITE = "FFFFFF";
const GRAY = "94A3B8";
const LIGHT = "E2E8F0";

function addTitleSlide(title, subtitle) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: DARK } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 3.2, w: "100%", h: 0.04, fill: { color: BLUE } });
  slide.addText(title, { x: 0.8, y: 1.2, w: 8.5, h: 1.8, fontSize: 36, fontFace: "Calibri", color: WHITE, bold: true, align: "center" });
  slide.addText(subtitle, { x: 0.8, y: 3.5, w: 8.5, h: 0.8, fontSize: 18, fontFace: "Calibri", color: GRAY, align: "center" });
  return slide;
}

function addSlide(title, bullets, opts = {}) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: BLUE } });
  slide.addText(title, { x: 0.5, y: 0.15, w: 9, h: 0.7, fontSize: 26, fontFace: "Calibri", color: BLUE, bold: true });
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: BLUE, transparency: 70 } });

  const bulletRows = bullets.map(b => ({
    text: b,
    options: { fontSize: 17, fontFace: "Calibri", color: LIGHT, bullet: { code: "25CF" }, paraSpaceAfter: 8 }
  }));

  slide.addText(bulletRows, {
    x: 0.7, y: 1.1, w: opts.sideTable ? 5.3 : 8.8, h: 5.5,
    valign: "top",
  });
  return slide;
}

function addTwoColumnSlide(title, leftBullets, rightBullets, leftTitle, rightTitle) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: BLUE } });
  slide.addText(title, { x: 0.5, y: 0.15, w: 9, h: 0.7, fontSize: 26, fontFace: "Calibri", color: BLUE, bold: true });
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: BLUE, transparency: 70 } });

  slide.addText(leftTitle, { x: 0.5, y: 1.1, w: 4.3, h: 0.4, fontSize: 16, fontFace: "Calibri", color: GREEN, bold: true });
  const leftRows = leftBullets.map(b => ({
    text: b,
    options: { fontSize: 14, fontFace: "Calibri", color: LIGHT, bullet: { code: "25CF" }, paraSpaceAfter: 6 }
  }));
  slide.addText(leftRows, { x: 0.5, y: 1.55, w: 4.3, h: 4.8, valign: "top" });

  slide.addText(rightTitle, { x: 5.3, y: 1.1, w: 4.3, h: 0.4, fontSize: 16, fontFace: "Calibri", color: ORANGE, bold: true });
  const rightRows = rightBullets.map(b => ({
    text: b,
    options: { fontSize: 14, fontFace: "Calibri", color: LIGHT, bullet: { code: "25CF" }, paraSpaceAfter: 6 }
  }));
  slide.addText(rightRows, { x: 5.3, y: 1.55, w: 4.3, h: 4.8, valign: "top" });

  return slide;
}

function addTableSlide(title, headers, rows) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: BLUE } });
  slide.addText(title, { x: 0.5, y: 0.15, w: 9, h: 0.7, fontSize: 26, fontFace: "Calibri", color: BLUE, bold: true });

  const tableRows = [
    headers.map(h => ({ text: h, options: { fontSize: 14, fontFace: "Calibri", color: WHITE, bold: true, fill: { color: BLUE }, align: "center" } })),
    ...rows.map(row => row.map((cell, i) => ({
      text: cell,
      options: { fontSize: 13, fontFace: "Calibri", color: LIGHT, fill: { color: i === 0 ? "1E293B" : DARK }, align: i === 0 ? "left" : "center" }
    })))
  ];

  slide.addTable(tableRows, {
    x: 0.5, y: 1.1, w: 9,
    border: { pt: 0.5, color: "334155" },
    colW: headers.map((_, i) => i === 0 ? 2.5 : (6.5 / (headers.length - 1))),
    rowH: 0.4,
  });
  return slide;
}

// === SLIDE 1: Title ===
addTitleSlide("Simulación con Autómatas Celulares", "IINF-391 — 3er Parcial\nCardumen de Peces · Evacuación de Muchedumbres · Propagación de Opiniones");

// === SLIDE 2: ¿Qué son los AC? ===
addSlide("¿Qué son los Autómatas Celulares?", [
  "Sistemas dinámicos discretos: espacio, tiempo y estados son discretos",
  "Definidos por una tupla (L, S, N, f): Lattice, Estados, Vecindad, Reglas",
  "Reglas locales simples → comportamientos globales complejos (emergencia)",
  "Ejemplos: Juego de la Vida (Conway), Regla 110 (Turing-completa), Modelo de Schelling",
  "Vecindad de Moore (8 vecinos) y Von Neumann (4 vecinos)",
  "Condiciones de frontera: toroidal (bordes conectados) o fija (bordes como paredes)",
  "Herramienta natural para modelar sistemas complejos sin ecuaciones diferenciales",
]);

// === SLIDE 3: Parte I Title ===
addTitleSlide("Parte I", "Simulación de Cardumen de Peces");

// === SLIDE 4: Cardumen - Espacio y Estados ===
addTableSlide("Cardumen — Espacio Celular y Estados", ["Estado", "Descripción", "Atributos"], [
  ["empty", "Celda vacía (agua)", "—"],
  ["fish", "Ocupada por un pez", "direction (0-7), speed (1-3)"],
  ["predator", "Depredador", "direction (0-7), speed = 3"],
  ["obstacle", "Obstáculo fijo", "—"],
]);

// === SLIDE 5: Cardumen - Reglas ===
addSlide("Cardumen — Reglas de Transición (Boids)", [
  "Separación: Si ≥2 peces en vecindad inmediata, alejarse del promedio de posiciones",
  "Alineación: Ajustar dirección al promedio de direcciones de vecinos (radio 2)",
  "Cohesión: Moverse hacia centro de masa del grupo local (≥3 peces, radio configurable)",
  "Prioridad: Depredador cercano → Evitar obstáculo → Separación → Boids combinado",
  "Depredador: Busca pez más cercano (radio 3), avanza 2 celdas, consume al pez",
  "Velocidad discreta: SLOW = cada 2 ticks, MEDIUM = 1 celda/tick, FAST = 2 celdas/tick",
  "Frontera configurable: toroidal (peces cruzan bordes) o fija (peces rebotan)",
]);

// === SLIDE 6: Cardumen - Parámetros ===
addTableSlide("Cardumen — Parámetros Configurables", ["Parámetro", "Rango", "Por defecto"], [
  ["Cantidad de peces", "50 — 500", "200"],
  ["Depredador activo", "on / off", "off"],
  ["Densidad obstáculos", "0 — 0.05", "0.01"],
  ["Radio de percepción", "2 — 6", "3"],
  ["Tipo de frontera", "toroidal / fija", "toroidal"],
]);

// === SLIDE 7: Cardumen - Resultados ===
addSlide("Cardumen — Resultados Observados", [
  "Formación progresiva de cardúmenes desde posiciones aleatorias (emergencia)",
  "Efecto de 'ola' cuando el depredador ataca: información se propaga en cadena",
  "Peces lentos forman núcleo, rápidos lideran el movimiento (estructura natural)",
  "Obstáculos dividen el cardumen temporalmente; subgrupos se reunifican",
  "Frontera toroidal permite cardúmenes continuos; fija causa concentración en esquinas",
]);

// === SLIDE 8: Parte II Title ===
addTitleSlide("Parte II", "Simulación de Evacuación de Muchedumbres");

// === SLIDE 9: Evacuación - Espacio y Estados ===
addTableSlide("Evacuación — Espacio Celular y Estados", ["Estado", "Código", "Descripción"], [
  ["EMPTY", "0", "Celda libre (piso)"],
  ["PERSON", "1", "Persona con estado, pánico, velocidad, visión"],
  ["WALL", "2", "Pared u obstáculo"],
  ["EXIT", "3", "Salida de evacuación"],
  ["FIRE", "4", "Celda con fuego (se propaga)"],
]);

// === SLIDE 10: Evacuación - Atributos ===
addTableSlide("Evacuación — Atributos de Persona", ["Atributo", "Tipo", "Descripción"], [
  ["personState", "NORMAL / PANIC / FALLEN / EVACUATED", "Estado conductual"],
  ["panicLevel", "float [0, 1]", "Nivel de pánico"],
  ["speed", "int {1, 2}", "Velocidad discreta"],
  ["vision", "int [3, 7]", "Radio de visión limitada"],
]);

// === SLIDE 11: Evacuación - Reglas ===
addSlide("Evacuación — Reglas de Transición", [
  "Campo de potencial (BFS): distancia mínima a la salida desde cada celda vacía",
  "Se recalcula cuando el fuego se propaga → rutas dinámicas",
  "Movimiento: persona elige vecino con menor potencial = ruta óptima",
  "Pánico: ≥3 vecinos en pánico O densidad local > 0.7 → persona entra en pánico",
  "Pánico: evaluación aleatoria en lugar de gradiente de potencial (decisión irracional)",
  "Caída: panicLevel > 0.9 con 2% probabilidad/tick → estado FALLEN (inmóvil)",
  "Colaboración: persona NORMAL levanta vecino caído; pánico se reduce a la mitad",
  "Fuego: cada 8 ticks, 15% probabilidad de propagar a cada vecino vacío",
]);

// === SLIDE 12: Evacuación - Escenarios ===
addTwoColumnSlide("Evacuación — Escenarios", [
  "Rectángulo con paredes en los bordes",
  "1-4 salidas en paredes inferior y superior",
  "Personas distribuidas aleatoriamente",
  "Fuego opcional en el centro",
  "Flujo libre hacia salidas",
], [
  "Pared horizontal divisoria en el medio",
  "Pasillo estrecho de solo 3 celdas",
  "Personas en la mitad superior",
  "1 salida en la parte inferior",
  "Fenómeno de arco: congestión en el pasillo",
], "Escenario: Habitación", "Escenario: Pasillo Estrecho");

// === SLIDE 13: Evacuación - Parámetros ===
addTableSlide("Evacuación — Parámetros Configurables", ["Parámetro", "Rango", "Por defecto"], [
  ["Personas", "10 — 300", "120"],
  ["Salidas", "1 — 4", "2"],
  ["Fuego", "on / off", "off"],
  ["Umbral de pánico", "0.1 — 1.0", "0.7"],
  ["Escenario", "room / bottleneck", "room"],
]);

// === SLIDE 14: Evacuación - Resultados ===
addSlide("Evacuación — Resultados Observados", [
  "Campo potencial guía eficientemente → flujos organizados hacia salidas",
  "Congestión en salidas: atascos realistas cuando muchas personas convergen",
  "Pánico empeora evacuación: decisiones aleatorias aumentan tiempo de salida",
  "Colaboración reduce bloqueos: personas caídas levantadas por vecinos normales",
  "Fuego cambia rutas dinámicamente: recalcula potencial automáticamente",
  "Bottleneck: arco humano en pasillo estrecho, vitesse reducida significativamente",
]);

// === SLIDE 15: Parte III Title ===
addTitleSlide("Parte III", "Propagación de Opiniones (Propuesta Original)");

// === SLIDE 16: Opiniones - Descripción ===
addSlide("Opiniones — Descripción del Problema", [
  "Se modela la difusión de opiniones en una red social donde dos posturas (A y B) compiten",
  "Grilla 100×100 con frontera toroidal",
  "Cada celda = un agente con estado de opinión y nivel de convicción",
  "Influencers: agentes con alcance amplificado (radio 5) que difunden su opinión masivamente",
  "Red small-world: cada celda tiene K enlaces aleatorios a celdas distantes (long-links)",
  "Misinformación periódica: cada 20 ticks se inyecta opinión forzada en área aleatoria",
  "El modelo conecta con los resultados del Modelo de Schelling sobre segregación espacial",
]);

// === SLIDE 17: Opiniones - Estados ===
addTableSlide("Opiniones — Estados de las Celdas", ["Estado", "Descripción", "Atributos clave"], [
  ["NEUTRAL", "Sin opinión formada", "conviction = 0"],
  ["A_FAVORABLE", "Favorece opinión A", "conviction, resistance"],
  ["B_FAVORABLE", "Favorece opinión B", "conviction, resistance"],
  ["INDIFERENTE", "Resistencia sin postura", "resistance > 0.5"],
  ["INFLUENCER", "Agente de influencia masiva", "influencerForce, opinionType"],
]);

// === SLIDE 18: Opiniones - Reglas ===
addSlide("Opiniones — Reglas de Transición", [
  "Neutrales → adoptan opinión mayoritaria (≥2 vecinos con misma opinión, Moore + long-links)",
  "Agentes con opinión → cambian si conviction < threshold y mayoría opuesta",
  "Conviction aumenta 0.15/tick cuando están en opinión mayoritaria local",
  "Resistencia: conviction > 0.8 y resistance > 0.5 → agente resiste cambios; resistance baja 0.33/tick",
  "Cámara de eco: >10 ticks con misma opinión y >4 vecinos confirmando → +0.1 conviction",
  "Influencers: afectan agentes dentro de radio 5 con conviction < threshold",
  "Misinformación: cada 20 ticks, área aleatoria de radio 2, fuerza opinion con conviction=0.6",
]);

// === SLIDE 19: Opiniones - Parámetros ===
addTableSlide("Opiniones — Parámetros Configurables", ["Parámetro", "Rango", "Por defecto"], [
  ["Densidad opinión A", "0.05 — 0.50", "0.20"],
  ["Densidad opinión B", "0.05 — 0.50", "0.15"],
  ["Influencers", "0 — 10", "3"],
  ["Umbral de convicción", "0.1 — 1.0", "0.5"],
  ["Long-links (K)", "0 — 5", "2"],
  ["Misinformación", "on / off", "off"],
]);

// === SLIDE 20: Opiniones - Resultados ===
addSlide("Opiniones — Resultados Observados", [
  "Formación gradual de clusters homogéneos (polarización espacial)",
  "Influencers actúan como núcleos de difusión que expanden su opinión rápidamente",
  "Dos influencers cercanos con opiniones opuestas → frontera inestable con cambios frecuentes",
  "Misinformación crea 'islas' temporales de opinión que persisten o son absorbidas",
  "Cámara de eco: regiones estables con alta conviction resisten el cambio",
  "Long-links impiden monopolio local: opiniones minoritarias se propagan a áreas distantes",
]);

// === SLIDE 21: Arquitectura ===
addSlide("Arquitectura e Implementación", [
  "Lenguaje: TypeScript 5.x con Vite 8.x",
  "Clase base genérica CellularAutomaton<T> con vecindad Moore/VonNeumann",
  "Clases derivadas: FishSchool, CrowdEvacuation, OpinionSpread",
  "Renderización: Canvas API con efectos visuales (glow, pulsación, degradados)",
  "Gráficos en tiempo real: Chart.js (evacuados, pánico, opiniones)",
  "Controles interactivos: sliders, toggles, clicks en canvas",
  "3 pestañas con simulaciones independientes",
  "Repositorio: https://github.com/ronaldmendzas/simulacionfinal",
]);

// === SLIDE 22: Conclusiones ===
addSlide("Conclusiones", [
  "Se implementaron 3 simulaciones de AC bidimensionales con propiedades emergentes verificables",
  "Cardumen: separación + alineación + cohesión generan movimiento coordinado sin dirección central",
  "Evacuación: pánico empeora tiempos, colaboración reduce bloqueos, bottleneck genera arco humano",
  "Opiniones: la dinámica de redes sociales genera polarización desde preferencias moderadas",
  "Los 3 modelos cumplen los requisitos del instructivo: grilla 2D, estados definidos, reglas explícitas, vecindades, parámetros configurables, visualización interactiva",
  "Las simulaciones demuestran que reglas locales simples producen comportamientos complejos observables",
]);

// === SLIDE 23: Referencias ===
addSlide("Referencias", [
  "[1] J. Von Neumann, Theory of Self-Reproducing Automata, Univ. Illinois Press, 1966",
  "[2] S. Wolfram, A New Kind of Science, Wolfram Media, 2002",
  "[3] C. W. Reynolds, \"Flocks, herds and schools,\" ACM SIGGRAPH, 1987",
  "[4] P. Bak, How Nature Works, Copernicus Press, 1996",
  "[5] T. C. Schelling, \"Dynamic models of segregation,\" J. Math. Sociology, 1971",
  "[6] P. C. Tissera et al., \"Evacuation simulations using cellular automata,\" JCS&T, 2007",
  "[7] M. Batty, Cities and Complexity, MIT Press, 2005",
  "[8] D. J. Watts & S. H. Strogatz, \"Collective dynamics of small-world networks,\" Nature, 1998",
]);

const outPath = "C:\\Users\\HP\\OneDrive\\Desktop\\ULTIMO DE SOMULACION\\docs\\Presentacion.pptx";
await pptx.writeFile({ fileName: outPath });
console.log("PPTX generado:", outPath);