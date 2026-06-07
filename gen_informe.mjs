import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, Header, Footer, PageNumber,
  NumberFormat
} from "docx";
import { writeFileSync } from "fs";

const FONT = "Calibri";
const FONT_SIZE = 24;

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 360, after: 120 }, children: [new TextRun({ text, font: FONT, bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 28 : 24 })] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE, bold: opts.bold, italics: opts.italics })],
  });
}

function boldPara(label, text) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    children: [
      new TextRun({ text: label, font: FONT, size: FONT_SIZE, bold: true }),
      new TextRun({ text, font: FONT, size: FONT_SIZE }),
    ],
  });
}

function tableRow(cells, header = false) {
  return new TableRow({
    children: cells.map(c => new TableCell({
      shading: header ? { fill: "1F4E79", type: ShadingType.CLEAR, color: "auto" } : undefined,
      width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: c, font: FONT, size: 20, bold: header, color: header ? "FFFFFF" : "000000" })]
      })],
    })),
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableRow(headers, true), ...rows.map(r => tableRow(r))],
  });
}

const BR = () => new Paragraph({ spacing: { after: 60 } });

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: FONT_SIZE } } } },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      heading("SIMULACIÓN CON AUTÓMATAS CELULARES"),
      para("Cardumen de Peces · Evacuación de Muchedumbres · Propagación de Opiniones", { center: true, italics: true }),
      BR(),

      heading("I. INTRODUCCIÓN", HeadingLevel.HEADING_1),
      para("Los autómatas celulares (AC) constituyen un paradigma de modelado discreto capaz de representar fenómenos complejos emergentes a partir de reglas locales simples. Desde los trabajos pioneros de Von Neumann sobre autorreproducción [1] hasta las clasificaciones de Wolfram [2], los AC han demostrado ser una herramienta versátil para simular sistemas donde el comportamiento global no puede deducirse trivialmente de las interacciones individuales."),
      para("El presente trabajo implementa tres simulaciones basadas en autómatas celulares bidimensionales, cada una modelando un fenómeno colectivo distinto:"),
      para("1) Cardumen de Peces: Simulación del movimiento colectivo basada en las reglas de Boids de Reynolds [3], adaptadas a un espacio celular discreto con vecindad de Moore, velocidad discreta y evitación de depredadores y obstáculos."),
      para("2) Evacuación de Muchedumbres: Modelado del comportamiento de personas evacuando un espacio cerrado, considerando pánico, colaboración, visión limitada, propagación de fuego y escenario de cuello de botella."),
      para("3) Propagación de Opiniones: Propuesta original que modela la difusión de opiniones en una red social con influencers, enlaces de largo alcance (small-world) y misinformación periódica."),
      para("Las tres simulaciones comparten una arquitectura base implementada en TypeScript con Vite, renderización mediante Canvas API y gráficos en tiempo real con Chart.js. Todos los parámetros son configurables interactivamente por el usuario."),

      heading("II. MARCO TEÓRICO", HeadingLevel.HEADING_1),
      heading("A. Autómatas Celulares", HeadingLevel.HEADING_2),
      para("Un autómata celular se define como una tupla (L, S, N, f) donde L es una lattice discreta de celdas (grillas bidimensionales en este trabajo), S es el conjunto finito de estados posibles, N es la vecindad (Moore o Von Neumann), y f es la función de transición local. Esta estructura permite que reglas locales simples generen comportamientos globales complejos, una propiedad conocida como emergencia [4]."),

      heading("B. Vecindades", HeadingLevel.HEADING_2),
      boldPara("Vecindad de Moore (radio r): ", "Incluye las 8 celdas circundantes para r = 1, o hasta (2r+1)² - 1 celdas para radios mayores. Utilizada en las tres simulaciones."),
      boldPara("Vecindad de Von Neumann (radio r): ", "Incluye las 4 celdas adyacentes cardinales. Disponible en la clase base para extensiones futuras."),

      heading("C. Condiciones de Frontera", HeadingLevel.HEADING_2),
      boldPara("Toroidal: ", "Los bordes se conectan formando un toro. Las celdas en el borde tienen vecinos al otro lado del espacio. Utilizada en las Partes I y III."),
      boldPara("Fija: ", "Las celdas fuera del límite se consideran inexistentes. Los agentes rebotan o permanecen en su posición. Utilizada en la Parte II."),

      heading("D. Modelo de Boids", HeadingLevel.HEADING_2),
      para("Craig Reynolds [3] propuso tres reglas para simular el comportamiento de bandadas: Separación (evitar colisiones con vecinos cercanos), Alineación (coincidir dirección con los vecinos) y Cohesión (moverse hacia el centro de masa del grupo local). Estas reglas se adaptan al espacio celular discreto donde las direcciones posibles son 8 y el movimiento es celda a celda."),

      heading("III. DISEÑO E IMPLEMENTACIÓN", HeadingLevel.HEADING_1),
      heading("A. Arquitectura General", HeadingLevel.HEADING_2),
      para("El proyecto sigue una arquitectura orientada a objetos con herencia: la clase base CellularAutomaton<T> provee grilla genérica, métodos de vecindad, acceso a celdas con frontera toroidal, y métodos abstractos step() y reset(). Las tres simulaciones heredan de esta base."),
      BR(),
      makeTable(
        ["Componente", "Tecnología"],
        [
          ["Lenguaje", "TypeScript 5.x"],
          ["Bundler", "Vite 8.x"],
          ["Renderización", "Canvas API (HTML5)"],
          ["Gráficos", "Chart.js 4.x"],
          ["Control de versiones", "Git / GitHub"],
          ["Estilos", "CSS con efecto light-beam"],
        ]
      ),
      BR(),
      para("La clase CanvasRenderer implementa métodos especializados: drawTriangle() para peces direccionales, drawCircle() y drawGlowCircle() para depredadores e influencers, drawPulsatingRect() para salidas, drawFireRect() para fuego parpadeante, drawXMark() para personas caídas, y drawGradientBg() para fondos atmosféricos."),

      heading("B. PARTE I — Cardumen de Peces", HeadingLevel.HEADING_2),
      heading("1. Espacio Celular y Estados", HeadingLevel.HEADING_3),
      para("Grilla bidimensional de 120 × 80 celdas con frontera configurable (toroidal o fija)."),
      makeTable(
        ["Estado", "Descripción", "Atributos"],
        [
          ["empty", "Celda vacía (agua)", "—"],
          ["fish", "Ocupada por un pez", "direction (0-7), speed (1-3)"],
          ["predator", "Depredador", "direction (0-7), speed = 3"],
          ["obstacle", "Obstáculo fijo", "—"],
        ]
      ),
      BR(),

      heading("2. Velocidad Discreta", HeadingLevel.HEADING_3),
      makeTable(
        ["Velocidad", "Valor", "Comportamiento"],
        [
          ["SLOW", "1", "Se mueve cada 2 generaciones"],
          ["MEDIUM", "2", "Se mueve cada generación (1 celda/tick)"],
          ["FAST", "3", "Se mueve cada generación, avanzando 2 celdas/tick"],
        ]
      ),
      BR(),
      para("Los peces con velocidad SLOW son omitidos en generaciones impares. Los peces FAST intentan moverse 2 celdas; si la segunda celda está ocupada, retroceden a 1 celda; si tampoco es posible, permanecen en su posición."),

      heading("3. Reglas de Transición", HeadingLevel.HEADING_3),
      boldPara("a) Separación: ", "Si hay 2 o más peces en la vecindad inmediata (radio 1), el pez se aleja en dirección opuesta al promedio de posiciones de los vecinos cercanos. Si el vector resultante es nulo, invierte su dirección."),
      boldPara("b) Alineación: ", "Se calcula la dirección promedio de los peces en la vecindad de radio 2. El vector resultante se convierte en dirección mediante atan2 y sectorización en las 8 direcciones posibles."),
      boldPara("c) Cohesión: ", "Se calcula el centro de masa de los peces visibles (radio = perceptionRadius). Solo se activa si hay al menos 3 peces vecinos."),
      boldPara("d) Evitación de depredadores: ", "Si un depredador se encuentra dentro de radio 5, el pez huye en dirección opuesta. Tiene prioridad sobre todas las demás reglas."),
      boldPara("e) Evitación de obstáculos: ", "Si hay un obstáculo en la vecindad inmediata, el pez se aleja del obstáculo."),
      boldPara("f) Movimiento del depredador: ", "Busca al pez más cercano dentro de radio 3, se mueve 2 celdas en su dirección. Al alcanzar un pez, lo consume."),
      para("Prioridad de reglas: depredador cercano → evitación de obstáculos → ≥2 peces cercanos (separación) → combinación ponderada de separación + alineación + cohesión."),
      BR(),
      makeTable(
        ["Parámetro", "Rango", "Valor por defecto"],
        [
          ["Cantidad de peces", "50-500", "200"],
          ["Depredador activo", "on/off", "off"],
          ["Densidad de obstáculos", "0-0.05", "0.01"],
          ["Radio de percepción", "2-6", "3"],
          ["Tipo de frontera", "toroidal/fija", "toroidal"],
        ]
      ),
      BR(),

      heading("C. PARTE II — Evacuación de Muchedumbres", HeadingLevel.HEADING_2),
      heading("1. Espacio Celular y Escenarios", HeadingLevel.HEADING_3),
      para("Grilla de 80 × 60 celdas con frontera fija. Se implementan dos escenarios: Habitación (room) con paredes y salidas, y Pasillo estrecho (bottleneck) con pared horizontal divisoria y pasillo de 3 celdas."),
      makeTable(
        ["Estado", "Código", "Descripción"],
        [
          ["EMPTY", "0", "Celda libre (piso)"],
          ["PERSON", "1", "Ocupada por una persona"],
          ["WALL", "2", "Pared u obstáculo"],
          ["EXIT", "3", "Salida de evacuación"],
          ["FIRE", "4", "Celda con fuego"],
        ]
      ),
      BR(),
      heading("2. Atributos de cada Persona", HeadingLevel.HEADING_3),
      makeTable(
        ["Atributo", "Tipo", "Descripción"],
        [
          ["personState", "NORMAL / PANIC / FALLEN / EVACUATED", "Estado conductual"],
          ["panicLevel", "float [0, 1]", "Nivel de pánico"],
          ["speed", "int {1, 2}", "Velocidad discreta"],
          ["vision", "int [3, 7]", "Radio de visión"],
        ]
      ),
      BR(),

      heading("3. Campo de Potencial (BFS)", HeadingLevel.HEADING_3),
      para("Se implementa un campo de potencial mediante BFS desde las salidas, calculando la distancia mínima de cada celda vacía a la salida más cercana. El campo se recalcula en la inicialización y cada vez que el fuego se propaga, excluyendo celdas con fuego como intransitables."),

      heading("4. Reglas de Transición", HeadingLevel.HEADING_3),
      boldPara("a) Movimiento hacia la salida: ", "Cada persona evalúa sus 8 vecinos y se mueve a la celda vacía con menor valor de potencial. Si un vecino es salida, la persona se evacúa inmediatamente."),
      boldPara("b) Visión limitada: ", "Las personas solo pueden considerar celdas dentro de su radio de visión. Las direcciones que excedan este radio son filtradas."),
      boldPara("c) Pánico por vecindad: ", "Si una persona normal tiene ≥3 vecinos en pánico, o la densidad local supera el umbral (0.7 por defecto), entra en pánico."),
      boldPara("d) Comportamiento en pánico: ", "Las personas en pánico evalúan direcciones en orden aleatorio en lugar de seguir el gradiente de potencial."),
      boldPara("e) Caída: ", "Una persona con panicLevel > 0.9 tiene 2% de probabilidad por tick de caer (estado FALLEN). Las personas caídas no se mueven."),
      boldPara("f) Colaboración: ", "Una persona NORMAL que tiene un vecino caído lo ayuda: el caído se levanta (vuelve a NORMAL) y su pánico se reduce a la mitad."),
      boldPara("g) Propagación del fuego: ", "Cada 8 generaciones, cada celda con fuego tiene 15% de probabilidad de propagar fuego a cada vecino vacío. Tras la propagación, el campo de potencial se recalcula."),
      BR(),
      makeTable(
        ["Parámetro", "Rango", "Valor por defecto"],
        [
          ["Cantidad de personas", "10-300", "120"],
          ["Cantidad de salidas", "1-4", "2"],
          ["Fuego activo", "on/off", "off"],
          ["Umbral de pánico", "0.1-1.0", "0.7"],
          ["Escenario", "room/bottleneck", "room"],
        ]
      ),
      BR(),

      heading("D. PARTE III — Propagación de Opiniones", HeadingLevel.HEADING_2),
      heading("1. Descripción del Problema", HeadingLevel.HEADING_3),
      para("Se modela la difusión de opiniones en una red social donde dos posturas (A y B) compiten por la aceptación de los agentes. El modelo incorpora influencers con alcance amplificado, enlaces de largo alcance (red small-world) y eventos de misinformación periódica. Grilla de 100 × 100 celdas con frontera toroidal."),
      makeTable(
        ["Estado", "Descripción", "Atributos"],
        [
          ["NEUTRAL", "Sin opinión formada", "conviction = 0"],
          ["A_FAVORABLE", "Favorece opinión A", "conviction ∈ [0,1], resistance ∈ [0,1]"],
          ["B_FAVORABLE", "Favorece opinión B", "conviction ∈ [0,1], resistance ∈ [0,1]"],
          ["INDIFERENTE", "Con resistencia sin postura", "resistance > 0.5"],
          ["INFLUENCER", "Agente de influencia masiva", "influencerForce ∈ [0.8,1.0], opinionType"],
        ]
      ),
      BR(),

      heading("2. Reglas de Transición", HeadingLevel.HEADING_3),
      boldPara("a) Agentes neutrales: ", "Se convierten a la opinión mayoritaria entre sus 8 vecinos de Moore + K long-links, siempre que haya ≥2 vecinos con la opinión ganadora. Convicción inicial: 0.2."),
      boldPara("b) Agentes con opinión: ", "Si conviction < convictionThreshold, pueden cambiar de opinión según mayoría de contactos. La convicción aumenta 0.15 por tick cuando están en la opinión mayoritaria."),
      boldPara("c) Resistencia: ", "Agentes con conviction > 0.8 y resistance > 0.5 resisten cambios. La resistencia se reduce 0.33 por tick hasta llegar a 0."),
      boldPara("d) Cámara de eco: ", "Si un agente mantiene su opinión >10 ticks y >4 vecinos confirman su postura, conviction aumenta 0.1."),
      boldPara("e) Influencers: ", "Afectan agentes dentro de radio 5 con conviction < threshold, cambiándolos a su opinión e incrementando su convicción proporcionalmente a influencerForce × 0.2."),
      boldPara("f) Misinformación: ", "Cada 20 generaciones, se inyecta opinión forzada (conviction = 0.6) en un área de radio 2, afectando agentes con conviction < 0.5 que no son influencers."),
      BR(),
      makeTable(
        ["Parámetro", "Rango", "Valor por defecto"],
        [
          ["Densidad opinión A", "0.05-0.50", "0.20"],
          ["Densidad opinión B", "0.05-0.50", "0.15"],
          ["Cantidad de influencers", "0-10", "3"],
          ["Umbral de convicción", "0.1-1.0", "0.5"],
          ["Long-links (K)", "0-5", "2"],
          ["Misinformación", "on/off", "off"],
        ]
      ),
      BR(),

      heading("IV. RESULTADOS Y ANÁLISIS", HeadingLevel.HEADING_1),
      heading("A. Cardumen de Peces", HeadingLevel.HEADING_2),
      para("1) Formación de cardúmenes: A partir de posiciones aleatorias, los peces se agrupan progresivamente en cardúmenes densos debido a la regla de cohesión. El radio de percepción determina el tamaño máximo del cardumen."),
      para("2) Evasión de depredadores: Al activar el depredador, los peces cercanos huyen generando un efecto de 'ola' visual a medida que la información se propaga. Los peces que no perciben al depredador continúan su comportamiento normal."),
      para("3) Velocidad diferenciada: Los peces lentos forman el núcleo del cardumen mientras que los rápidos tienden a liderar el movimiento, generando estructura de liderazgo natural."),
      para("4) Separación en obstáculos: Los obstáculos generan división temporal del cardumen, con subgrupos que se reunifican después de rodear el obstáculo."),

      heading("B. Evacuación de Muchedumbres", HeadingLevel.HEADING_2),
      para("1) Flujo hacia salidas: El campo de potencial guía eficientemente a las personas, creando flujos organizados en los pasillos."),
      para("2) Congestión: Cuando múltiples personas convergen hacia una misma salida, se forman atascos que retrasan la evacuación, especialmente en el escenario de pasillo estrecho."),
      para("3) Efecto del pánico: Las personas en pánico toman decisiones subóptimas al elegir direcciones aleatoriamente, aumentando el tiempo de evacuación."),
      para("4) Caída y colaboración: Las personas caídas generan obstáculos temporales. La colaboración permite levantarlas, reduciendo bloqueos."),
      para("5) Fuego dinámico: La propagación obliga recalculación de rutas, creando redistribución de flujos."),
      para("6) Efecto bottleneck: Se observa el fenómeno de arco donde las personas se acumulan en el pasillo estrecho, con velocidad de evacuación significativamente menor."),

      heading("C. Propagación de Opiniones", HeadingLevel.HEADING_2),
      para("1) Formación de clusters: Se forman regiones homogéneas de opiniones A y B, similares a los patrones del modelo de Schelling [5]."),
      para("2) Efecto de influencers: Actúan como núcleos de difusión, expandiendo rápidamente su opinión en su vecindario."),
      para("3) Competencia de opiniones: Dos influencers de distinta opinión cercanos generan una zona de frontera inestable con cambios frecuentes."),
      para("4) Misinformación: Los eventos periódicos inyectan opinión forzada en áreas aleatorias, creando islas temporales que pueden persistir o ser absorbidas."),
      para("5) Cámara de eco: Los agentes con opinión sostenida ven incrementada su convicción, creando regiones estables resistentes al cambio."),
      para("6) Red small-world: Los long-links permiten que opiniones minoritarias se propaguen a áreas distantes, manteniendo competencia dinámica."),

      heading("V. CONCLUSIONES", HeadingLevel.HEADING_1),
      para("Se implementó exitosamente un sistema de tres simulaciones con autómatas celulares bidimensionales que demuestran propiedades emergentes a partir de reglas locales simples:"),
      para("1) El cardumen exhibe comportamiento colectivo realista donde la separación, alineación y cohesión generan movimiento coordinado sin dirección central. La velocidad diferenciada agrega heterogeneidad que produce estructura de liderazgo natural."),
      para("2) La evacuación demuestra que el pánico empeora los tiempos, la colaboración reduce los bloqueos causados por personas caídas, y la visión limitada modela la incertidumbre real. El escenario de bottleneck evidencia el fenómeno de arco, un resultado clásico en la literatura [6]."),
      para("3) La propagación de opiniones muestra cómo la dinámica de redes sociales puede generar polarización a partir de preferencias individuales moderadas, conectando con los resultados del modelo de Schelling [5]."),
      BR(),
      boldPara("Limitaciones: ", "El modelo de evacuación no considera fuerzas de empuje entre personas. La propagación de opiniones usa una red small-world estática. Los parámetros fueron calibrados empíricamente."),
      boldPara("Trabajo futuro: ", "Implementar fuerzas de empuje, agregar humo como obstáculo visual, incorporar redes dinámicas en opiniones, y análisis estadístico automático."),

      heading("VI. REFERENCIAS", HeadingLevel.HEADING_1),
      para("[1] J. Von Neumann, Theory of Self-Reproducing Automata, A. W. Burks, Ed. Urbana, IL: University of Illinois Press, 1966.", { italics: true }),
      para("[2] S. Wolfram, A New Kind of Science. Champaign, IL: Wolfram Media, 2002.", { italics: true }),
      para("[3] C. W. Reynolds, \"Flocks, herds and schools: A distributed behavioral model,\" ACM SIGGRAPH Computer Graphics, vol. 21, no. 4, pp. 25-34, 1987.", { italics: true }),
      para("[4] P. Bak, How Nature Works: The Science of Self-Organized Criticality. New York, NY: Copernicus Press, 1996.", { italics: true }),
      para("[5] T. C. Schelling, \"Dynamic models of segregation,\" Journal of Mathematical Sociology, vol. 1, no. 2, pp. 143-186, 1971.", { italics: true }),
      para("[6] P. C. Tissera, M. Printista, and M. L. Errecalde, \"Evacuation simulations using cellular automata,\" JCS&T, vol. 7, no. 1, 2007.", { italics: true }),
      para("[7] M. Batty, Cities and Complexity: Understanding Cities with Cellular Automata, Agent-Based Models, and Fractals. Cambridge, MA: MIT Press, 2005.", { italics: true }),
      para("[8] D. J. Watts and S. H. Strogatz, \"Collective dynamics of 'small-world' networks,\" Nature, vol. 393, pp. 440-442, 1998.", { italics: true }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("C:\\Users\\HP\\OneDrive\\Desktop\\ULTIMO DE SOMULACION\\docs\\Informe_Tecnico.docx", buffer);
console.log("DOCX generado: docs/Informe_Tecnico.docx");