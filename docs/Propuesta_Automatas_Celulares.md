**SIMULACIÓN CON AUTÓMATAS CELULARES**

Propuesta de Diseño — 3er Parcial

*Tecnología: TypeScript + Canvas API (Web) / Python (soporte numérico)*

Materia: Simulación y Estadística  |  Junio 2025

# **Visión General del Proyecto**
Se implementarán tres simulaciones interactivas basadas en Autómatas Celulares, visualizadas en el navegador mediante TypeScript y Canvas API. Cada simulación incluye controles en tiempo real, visualización en color y análisis de comportamiento emergente. Python se usará únicamente como soporte para cálculos estadísticos o análisis de datos cuando sea necesario.

|**TypeScript**|**Canvas API**|**HTML5 Web**|**Python (soporte)**|**Tiempo Real**|**Interactivo**|
| :-: | :-: | :-: | :-: | :-: | :-: |


# **PARTE I — Cardumen de Peces (Boids Celular)**
Simulación del movimiento colectivo de un banco de peces usando un autómata celular sobre grilla 2D, incorporando los tres principios clásicos de Boids: separación, alineación y cohesión, adaptados a reglas discretas por vecindad.

## **Espacio Celular**

|**Diseño del Autómata**||
| :- | :- |
|**Grilla**|2D toroidal (bordes conectados): 120×80 celdas|
|**Vecindad**|Moore (8 celdas) para percepción del entorno del pez|
|**Estados**|0 = Vacío  |  1 = Pez (dirección codificada: N/NE/E/SE/S/SO/O/NO)|
|**Atributos del pez**|Dirección actual de movimiento, Velocidad discreta (lenta/media/rápida)|
|**Actualización**|Sincrónica — todas las celdas se actualizan en paralelo cada tick|
|**Paso temporal**|~60ms por generación (aprox. 16 FPS animación fluida)|

## **Reglas de Transición (Boids adaptados a AC)**
- **SEPARACIÓN (evitar colisiones):** si hay otro pez en la vecindad inmediata (radio 1), el pez intenta alejarse cambiando a dirección contraria al centroide local
- **ALINEACIÓN (coherencia de dirección):** el pez ajusta su dirección para coincidir con la dirección promedio de los peces vecinos en radio 2
- **COHESIÓN (mantenerse cerca del grupo):** el pez intenta moverse hacia el centro de masa del grupo local (promedio de posiciones de los vecinos en radio 3)
- **MOVIMIENTO:** el pez se mueve a la celda vecina en la dirección resultante si está vacía. Si está ocupada, puede esperar o buscar una dirección alternativa
- **DEPREDADOR:** celda especial que repele peces en radio 5 (modo opcional)
- **OBSTÁCULO:** zonas intransitables del espacio (paredes, arrecife) que el cardumen evita

## **Condiciones de Frontera**
- **Toroidal (predeterminada):** los peces que salen por un borde entran por el opuesto (espacio continuo)
- **Bordes fijos:** opción configurable para limitar el espacio

## **Parámetros Configurables (UI en tiempo real)**
- Cantidad de peces (50 — 800)
- Velocidad de simulación (1x — 10x)
- Radio de percepción
- Velocidad discreta de los peces (lenta/media/rápida)
- Modo depredador ON/OFF
- Densidad de obstáculos
- Tipo de frontera: toroidal / bordes fijos

## **Visualización**
Cada pez se representa como un triángulo orientado según su dirección. Color en gradiente azul→turquesa según densidad local. Mapa de calor de densidad superpuesto opcionalmente. El depredador aparece en rojo con halo de influencia visible. Obstáculos en gris oscuro.


# **PARTE II — Evacuación de Muchedumbres**
Simulación de evacuación de personas en un edificio o estadio usando un autómata celular con campo de potencial social. El sistema modela pánico, aglomeración y rutas de escape.

## **Diseño del Autómata**

|**Espacio y Estados**||
| :- | :- |
|**Plano**|Grilla 2D de 80×60 celdas representando planta de edificio (pasillos, habitaciones, salidas)|
|**Estados celda**|0 = VACÍO | 1 = PERSONA | 2 = OBSTÁCULO/PARED | 3 = SALIDA | 4 = FUEGO (modo avanzado)|
|**Atributos internos de cada persona**|Dirección preferida (hacia la salida), Nivel de pánico (modifica comportamiento), Velocidad (tiempo entre pasos), Memoria parcial del entorno (visión limitada)|
|**Estado persona**|Normal / Pánico / Caído / Evacuado|
|**Vecindad**|Moore (8 celdas) para libertad de movimiento en todas direcciones|
|**Campo potencial**|Mapa de distancia hacia salidas calculado por BFS al inicio|

## **Reglas de Transición**
- **BÚSQUEDA DE SALIDA:** cada persona evalúa las celdas vecinas y selecciona la dirección que minimiza la distancia (costo) a la salida
- **MOVIMIENTO BASE:** la persona se mueve a la celda vecina libre con menor valor de campo potencial. Si varias personas desean la misma celda: se resuelve por prioridad (calma) o aleatoriedad; si está ocupada, espera o busca ruta alternativa (atascos realistas)
- **PÁNICO:** si densidad local > 0.7, la velocidad se reduce y la dirección se aleatoriza ±45°; la persona toma decisiones menos óptimas (al azar o por imitación)
- **CONTAGIO DE PÁNICO:** si ≥ 3 vecinos en pánico → la persona entra en pánico
- **CAÍDA:** probabilidad 2% por tick en pánico máximo — bloquea una celda temporalmente
- **SALIDA:** al alcanzar celda SALIDA, la persona se elimina del sistema (contabilizada como evacuada)
- **VISIÓN LIMITADA:** las personas no ven todo el mapa, solo su vecindad inmediata; solo conocen la dirección de la salida más cercana dentro de su campo de visión
- **COLABORACIÓN:** personas en estado normal pueden seguir a otros o ayudar a compañeros caídos (modo opcional)
- **FUEGO/HUMO:** celdas que se vuelven inaccesibles o peligrosas, cambiando dinámicamente las rutas de evacuación (modo avanzado)

## **Escenarios Incluidos**
- Edificio rectangular con 2 salidas — baseline normal
- Obstrucción dinámica de una salida (simula bloqueo por humo/fuego)
- Botella de cuello: pasillo estrecho — observar formación de arco

## **Métricas en Tiempo Real**
- Tiempo total de evacuación (en ticks)
- Porcentaje evacuado por intervalos de tiempo
- Mapa de densidad acumulada (zonas críticas de aglomeración)
- Gráfica en vivo: evacuados vs. tiempo
- Cantidad de personas en pánico / caídas


# **PARTE III — Propagación de Opiniones en Redes Sociales**
Propuesta original: simulación de cómo una opinión, noticia o tendencia se propaga en una población conectada, modelando fenómenos reales como cámaras de eco, polarización política y viralización. Inspirado en el modelo SIR (epidemiológico) pero aplicado a información.

|**¿Por qué este tema?**|**Conexión con AC**|
| :-: | :-: |
|Modela fenómenos sociales reales y actuales: fake news, polarización, trending topics. Totalmente original y visualmente impactante.|Cada celda = persona. Estados discretos. Reglas locales producen comportamiento global emergente (polarización, burbujas). 100% autómata celular.|

## **1. Problema a Modelar**
¿Cómo se forma la polarización y las cámaras de eco en una red social? ¿Bajo qué condiciones una opinión minoritaria logra volverse mayoritaria?

## **2. Objetivo de la Simulación**
Modelar la dinámica de propagación de opiniones en una red social, identificando las condiciones bajo las cuales se generan cámaras de eco, polarización y viralización, y determinar el papel de los influencers en la formación de consensos.

## **3. Estados de las Células**

|**Estado**|**Color**|**Descripción**|
| :- | :- | :- |
|NEUTRAL|Gris|Persona sin opinión definida|
|A-FAVORABLE|Azul|Persona que sostiene la opinión A|
|B-FAVORABLE|Rojo|Persona que sostiene la opinión B|
|INDIFERENTE|Blanco|Persona sin contacto social activo|
|INFLUENCER|Estrella|Nodo especial con capacidad amplificada de influencia|

## **4. Reglas de Transición**
- **CONTAGIO:** si mayoría de vecinos tiene opinión X y tu convicción < umbral → adoptas opinión X
- **RESISTENCIA:** convicción alta (>0.8) → inmune a cambio por 3 generaciones
- **INFLUENCER:** celda especial con radio de influencia 5, fuerza configurable (amplifica la opinión que sostiene)
- **INDIFERENCIA:** persona sin contacto social (0 vecinos activos) → vuelve a NEUTRAL
- **RADICALIZACIÓN:** si llevas >10 ticks en misma opinión con alta densidad local de igual opinión → convicción +0.1
- **DESINFORMACIÓN:** modo especial donde aparecen nodos falsos que aceleran propagación

## **5. Condición de Fronteras**
Periódica toroidal (sin bordes): el borde superior se conecta con el inferior y el borde izquierdo con el derecho, formando una superficie toroidal.

## **6. Variables Relevantes**

|**Variable**|**Tipo**|**Descripción**|
| :- | :- | :- |
|Convicción|[0.0 – 1.0]|Intensidad con la que una persona sostiene su opinión|
|Umbral de contagio|[0.0 – 1.0]|Nivel mínimo de convicción para resistir cambios|
|Resistencia al cambio|Entero|Número de generaciones inmune tras alta convicción|
|Influencia del influencer|[0.0 – 1.0]|Factor multiplicador del poder de convencimiento|
|Densidad inicial|Porcentaje|Proporción de celdas ocupadas al inicio|
|Enlaces largos (k)|Entero|Cantidad de conexiones aleatorias por celda (small-world)|

## **7. Resultados Esperados**
- Visualizar formación de clusters (cámaras de eco) con colores diferenciados
- Gráfica de evolución de proporciones A vs B vs Neutral en el tiempo
- Experimentos: ¿cuántos influencers B hacen falta para revertir mayoría A?
- Medir tiempo de convergencia según densidad inicial y umbral de convicción
- Identificar umbrales críticos donde una opinión minoritaria se vuelve mayoría
- Analizar efecto de los enlaces largos (small-world) en la velocidad de propagación


# **Stack Técnico y Arquitectura**

|**Tecnologías Utilizadas**||
| :- | :- |
|**Frontend**|TypeScript + Vite — compilado, tipado, rápido de desarrollar|
|**Renderizado**|HTML5 Canvas API — control total del pixel, 60 FPS fluido|
|**UI Controles**|HTML nativo + CSS moderno — sliders, botones, stats en tiempo real|
|**Lógica AC**|Clases TypeScript puras (CellularAutomaton base, herencia por simulación)|
|**Python (opcional)**|NumPy/SciPy para análisis estadístico de resultados, si necesario|
|**Despliegue**|Vite build → HTML estático, se abre directo en Chrome, sin servidor|

## **Arquitectura de Código**
- CellularAutomaton<T> — clase base genérica con grid, step(), reset()
- FishSchool extends CellularAutomaton — lógica Parte I
- CrowdEvacuation extends CellularAutomaton — lógica Parte II
- OpinionSpread extends CellularAutomaton — lógica Parte III
- CanvasRenderer — renderizado unificado con color maps configurables
- SimulationControls — UI reactiva con parámetros en tiempo real


# **Plan de Trabajo**

|**Fase**|**Tarea**|**Detalle**|**Estado**|
| :- | :- | :- | :- |
|**1**|**Setup proyecto**|Vite + TypeScript + estructura de clases base + Canvas renderer|Pendiente|
|**2**|**Parte I — Peces**|Grilla, estados, reglas Boids, visualización con gradiente de color|Pendiente|
|**3**|**Parte II — Evacuación**|Mapa potencial BFS, estados pánico, métricas y gráfica en vivo|Pendiente|
|**4**|**Parte III — Opiniones**|Red social, estados, influencers, análisis polarización|Pendiente|
|**5**|**UI & Controles**|Sliders, stats, reset, velocidad para las 3 simulaciones|Pendiente|
|**6**|**Informe IEEE**|Documento Word con capturas, análisis y conclusiones|Pendiente|
|**7**|**Video demo**|Video corto de demostración (opcional según instructivo)|Pendiente|
|**8**|**Defensa**|Demo en vivo + respuestas técnicas (5 min)|Pendiente|


# **Por qué esta propuesta destaca**
Más allá de cumplir los requisitos, este proyecto ofrece:

- Visualización en tiempo real en el navegador — no requiere instalar nada, se abre y funciona
- Tema original (Parte III) con relevancia social actual — va más allá de los ejemplos clásicos
- Código TypeScript limpio, tipado y modular — fácil de explicar y defender
- Parámetros configurables con sliders interactivos — permite experimentar en vivo durante la defensa
- Gráficas de métricas en tiempo real — demuestra análisis cuantitativo de resultados
- Tres niveles de complejidad creciente que muestran dominio del concepto de AC


**Entrega: Lunes 8 de junio — 8:00 AM  |  Defensa: 10:00 AM**