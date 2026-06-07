# Simulación con Autómatas Celulares: Cardumen de Peces, Evacuación de Muchedumbres y Propagación de Opiniones

## I. INTRODUCCIÓN

Los autómatas celulares (AC) constituyen un paradigma de modelado discreto capaz de representar fenómenos complejos emergentes a partir de reglas locales simples. Desde los trabajos pioneros de Von Neumann sobre autorreproducción [1] hasta las clasificaciones de Wolfram [2], los AC han demostrado ser una herramienta versátil para simular sistemas donde el comportamiento global no puede deducirse trivialmente de las interacciones individuales.

El presente trabajo implementa tres simulaciones basadas en autómatas celulares bidimensionales, cada una modelando un fenómeno colectivo distinto:

1. **Parte I — Cardumen de Peces**: Simulación del movimiento colectivo de peces basada en las reglas de Boids de Reynolds [3], adaptadas a un espacio celular discreto con vecindad de Moore.
2. **Parte II — Evacuación de Muchedumbres**: Modelado del comportamiento de personas evacuando un espacio cerrado, considerando pánico, colaboración, visión limitada y propagación de fuego.
3. **Parte III — Propagación de Opiniones**: Propuesta original que modela la difusión de opiniones en una red social con influencers, enlaces de largo alcance (small-world) y misinformación periódica.

Las tres simulaciones comparten una arquitectura base implementada en TypeScript con Vite, renderización mediante Canvas API y gráficos en tiempo real con Chart.js. Todos los parámetros son configurables interactivamente por el usuario.

---

## II. MARCO TEÓRICO

### A. Autómatas Celulares

Un autómata celular se define como una tupla *(L, S, N, f)* donde:

- **L** es una lattice discreta de celdas (en este trabajo, grillas bidimensionales).
- **S** es un conjunto finito de estados posibles para cada celda.
- **N** es la vecindad que define qué celdas influyen sobre cada celda (vecindad de Moore o Von Neumann).
- **f** es la función de transición local que determina el estado futuro de una celda en función de su estado actual y el de sus vecinas.

Esta estructura permite que reglas locales simples generen comportamientos globales complejos, una propiedad conocida como **emergencia** [4].

### B. Vecindades Utilizadas

Se implementaron dos tipos de vecindad en la clase base `CellularAutomaton<T>`:

**Vecindad de Moore** (radio *r*): Incluye las 8 celdas circundantes para *r = 1*, o hasta (2r + 1)² - 1 celdas para radios mayores. Se utiliza en las tres simulaciones como vecindad principal.

**Vecindad de Von Neumann** (radio *r*): Incluye las 4 celdas adyacentes cardinales para *r = 1*. Se ofrece como alternativa en la clase base, disponible para extensiones futuras.

### C. Condiciones de Frontera

Se implementaron dos condiciones de frontera:

- **Toroidal**: Los bordes superior e inferior se conectan, al igual que los bordes izquierdo y derecho, formando un toro. Las celdas en el borde tienen vecinos al otro lado del espacio. Utilizada en la Parte I y Parte III.
- **Fija**: Las celdas fuera del límite se consideran inexistentes. Los agentes que alcanzan un borde rebotan o permanecen en su posición. Utilizada en la Parte II.

### D. Modelo de Boids

Craig Reynolds [3] propuso tres reglas para simular el comportamiento de bandadas:

1. **Separación**: Evitar colisiones con vecinos cercanos.
2. **Alineación**: Coincidir la dirección de movimiento con los vecinos.
3. **Cohesión**: Moverse hacia el centro de masa del grupo local.

Estas reglas se adaptan al espacio celular discreto donde las direcciones posibles son 8 (N, NE, E, SE, S, SO, O, NO) y el movimiento se produce celda a celda.

---

## III. DISEÑO E IMPLEMENTACIÓN

### A. Arquitectura General

El proyecto sigue una arquitectura orientada a objetos con herencia:

```
CellularAutomaton<T>         (clase base abstracta)
├── FishSchool               (Parte I)
├── CrowdEvacuation          (Parte II)
└── OpinionSpread             (Parte III)
```

**Herramientas utilizadas:**

| Componente | Tecnología |
|---|---|
| Lenguaje | TypeScript 5.x |
| Bundler | Vite 8.x |
| Renderización | Canvas API (HTML5) |
| Gráficos | Chart.js 4.x |
| Control de versiones | Git / GitHub |
| Estilos | CSS personalizado con efecto light-beam |

La clase base `CellularAutomaton<T>` provee:

- Grilla genérica con tipo de estado parametrizado.
- Métodos `getMooreNeighbors()`, `getVonNeumannNeighbors()`, `getMooreNeighborCoords()`.
- Acceso a celdas con soporte para frontera toroidal (`getCell`).
- Métodos abstractos `step()` y `reset()`.
- Contador de generaciones.

**Renderización**: Se implementó la clase `CanvasRenderer` con métodos especializados:

- `drawTriangle()` para representar peces con dirección.
- `drawCircle()` y `drawGlowCircle()` para depredadores e influencers.
- `drawRect()`, `drawBorderedRect()`, `drawPulsatingRect()`, `drawFireRect()`, `drawXMark()`, `drawGradientRect()` para los distintos tipos de celda.
- `drawGradientBg()` para fondos con degradado atmosférico.

---

### B. PARTE I — Cardumen de Peces

#### 1. Espacio Celular

Grilla bidimensional de 120 × 80 celdas con frontera configurable (toroidal o fija).

#### 2. Estados de las Celdas

| Estado | Descripción | Atributos |
|---|---|---|
| `empty` | Celda vacía (agua) | — |
| `fish` | Ocupada por un pez | `direction` (0-7), `speed` (1-3) |
| `predator` | Depredador | `direction` (0-7), `speed` = 3 |
| `obstacle` | Obstáculo fijo | — |

#### 3. Velocidad Discreta

Se implementa el atributo de velocidad como velocidad discreta que afecta el movimiento de los peces:

| Velocidad | Valor | Comportamiento |
|---|---|---|
| `SLOW` | 1 | Se mueve cada 2 generaciones (saltos impares) |
| `MEDIUM` | 2 | Se mueve cada generación (1 celda/tick) |
| `FAST` | 3 | Se mueve cada generación, avanzando 2 celdas/tick |

Los peces con velocidad `SLOW` son omitidos en generaciones impares (`generation % 2 !== 0`). Los peces `FAST` intentan moverse 2 celdas en su dirección calculada; si la segunda celda está ocupada, retroceden a 1 celda; si tampoco es posible, permanecen en su posición.

#### 4. Reglas de Transición

Para cada pez en la grilla, se calcula una dirección de movimiento combinando las tres reglas de Boids más reglas adicionales:

**a) Separación** — Si hay 2 o más peces en la vecindad inmediata (radio 1), el pez se aleja calculando la dirección opuesta al promedio de posiciones de los vecinos cercanos. Si el vector resultante es nulo, el pez invierte su dirección (`(direction + 4) % 8`).

**b) Alineación** — Se calcula la dirección promedio de los peces en la vecindad de radio 2. El vector resultante se convierte en una dirección mediante la función `vectorToDirection()`, que usa `atan2` y sectoriza el ángulo en las 8 direcciones posibles.

**c) Cohesión** — Se calcula el centro de masa de los peces visibles (radio = `perceptionRadius`, configurable). El pez se dirige hacia ese centro. Solo se activa si hay al menos 3 peces vecinos.

**d) Evitación de depredadores** — Si un depredador se encuentra dentro de radio 5, el pez huye en la dirección opuesta al depredador más cercano. Esta regla tiene prioridad sobre todas las demás.

**e) Evitación de obstáculos** — Si hay un obstáculo en la vecindad inmediata, el pez se aleja del obstáculo.

**Prioridad de reglas:**

```
depredador cercano → evitación de depredadores
obstáculo cercano → evitación de obstáculos
≥2 peces cercanos → separación
caso general → combinación ponderada de separación + alineación + cohesión
```

**f) Movimiento del depredador** — El depredador busca al pez más cercano dentro de radio 3 y se mueve 2 celdas en su dirección. Si no hay peces cercanos, se mueve aleatoriamente. Al alcanzar un pez, lo consume (la celda del pez se vacía).

#### 5. Condiciones de Frontera

- **Toroidal** (por defecto): Los peces que salen por un borde aparecen en el opuesto.
- **Fija**: Los peces no pueden moverse fuera de la grilla; si la celda destino está fuera de límites, permanecen en su posición.

#### 6. Parámetros Configurables

| Parámetro | Rango | Valor por defecto |
|---|---|---|
| Cantidad de peces | 50-500 | 200 |
| Depredador activo | on/off | off |
| Densidad de obstáculos | 0-0.05 | 0.01 |
| Radio de percepción | 2-6 | 3 |
| Tipo de frontera | toroidal/fija | toroidal |

---

### C. PARTE II — Evacuación de Muchedumbres

#### 1. Espacio Celular

Grilla bidimensional de 80 × 60 celdas con frontera fija. La grilla representa el plano de un edificio con paredes, salidas y opcionalmente fuego.

Se implementan dos escenarios:

- **Habitación** (room): Rectángulo con paredes en los bordes y salidas en la parte inferior (y opcionalmente superior).
- **Pasillo estrecho** (bottleneck): Pared horizontal divisoria con un pasillo de 3 celdas de ancho, obligando a las personas a atravesar un cuello de botella. Las personas se colocan en la mitad superior y evacúan por una salida en la parte inferior.

#### 2. Estados de las Celdas

| Estado | Código | Descripción |
|---|---|---|
| `EMPTY` | 0 | Celda libre (piso) |
| `PERSON` | 1 | Ocupada por una persona |
| `WALL` | 2 | Pared u obstáculo |
| `EXIT` | 3 | Salida de evacuación |
| `FIRE` | 4 | Celda con fuego |

#### 3. Atributos Internos de cada Persona

| Atributo | Tipo | Descripción |
|---|---|---|
| `personState` | NORMAL / PANIC / FALLEN / EVACUATED | Estado conductual de la persona |
| `panicLevel` | float [0, 1] | Nivel de pánico; a mayor nivel, peor toma de decisiones |
| `speed` | int {1, 2} | Velocidad discreta (número de pasos por iteración) |
| `vision` | int [3, 7] | Radio de visión; limita qué celdas puede evaluar |

#### 4. Campo de Potencial (BFS)

Se implementa un campo de potencial mediante BFS desde las salidas, calculando la distancia mínima de cada celda vacía a la salida más cercana. Las celdas con valor de potencial menor representan rutas más cortas hacia la salida.

El campo se recalcula en los siguientes casos:

- **Inicialización**: Al comenzar o reiniciar la simulación.
- **Propagación de fuego**: Cada vez que el fuego se propaga a nuevas celdas (cada 8 generaciones), el campo se recalcula, excluyendo las celdas con fuego como intransitables.

#### 5. Reglas de Transición

**a) Movimiento hacia la salida** — Cada persona evalúa sus 8 vecinos (vecindad de Moore) y se mueve a la celda vacía con menor valor de potencial. Si un vecino es una salida, la persona se evacúa inmediatamente.

**b) Visión limitada** — Una persona solo puede considerar celdas dentro de su radio de `vision`. Las direcciones cuyo desplazamiento exceda este radio son filtradas. Esto simula la limitación perceptual real en situaciones de emergencia.

**c) Pánico por vecindad** — Si una persona normal tiene 3 o más vecinos en estado de pánico, entra en pánico. Además, si la densidad local de personas (razón de vecinos ocupados sobre los 8 posibles) supera el umbral de pánico (`panicThreshold` = 0.7 por defecto), la persona entra en pánico.

**d) Comportamiento en pánico** — Las personas en pánico evalúan las direcciones en orden aleatorio en lugar de elegir la de menor potencial, simulando decisiones irracionales.

**e) Caída** — Una persona con `panicLevel > 0.9` tiene una probabilidad del 2% por tick de caer, pasando al estado `FALLEN`. Las personas caídas no se mueven.

**f) Colaboración** — Una persona en estado `NORMAL` que tiene un vecino caído lo ayuda: el caído se levanta (vuelve a `NORMAL`) y su nivel de pánico se reduce a la mitad. Se marca la celda del caído como `moved` para evitar que múltiples personas ayuden al mismo caído en un mismo tick.

**g) Propagación del fuego** — Cada 8 generaciones, cada celda con fuego tiene una probabilidad del 15% de propagar fuego a cada vecino vacío (Moore). Tras la propagación, el campo de potencial se recalcula automáticamente para que las personas eviten las nuevas zonas con fuego.

#### 6. Escenario de Pasillo Estrecho (Bottleneck)

El escenario de cuello de botella es relevante en estudios de evacuación porque genera el fenómeno de **arco** donde las personas se acumulan en el paso estrecho, creando un embudo natural. La pared central tiene un pasillo de solo 3 celdas de ancho, lo que obliga a las personas a organizarse para atravesarlo de a poco. Este escenario permite estudiar:

- Cómo la densidad en el pasillo afecta el tempo de evacuación.
- Cómo el pánico empeora la congestión en el cuello de botella.
- Cómo la colaboración permite que personas caídas en el paso no bloqueen completamente la evacuación.

#### 7. Parámetros Configurables

| Parámetro | Rango | Valor por defecto |
|---|---|---|
| Cantidad de personas | 10-300 | 120 |
| Cantidad de salidas | 1-4 | 2 |
| Fuego activo | on/off | off |
| Umbral de pánico | 0.1-1.0 | 0.7 |
| Escenario | room/bottleneck | room |

---

### D. PARTE III — Propagación de Opiniones (Propuesta Original)

#### 1. Descripción del Problema

Se modela la difusión de opiniones en una red social donde dos posturas (A y B) compiten por la aceptación de los agentes. El modelo incorpora influencers con alcance amplificado, enlaces de largo alcance (red small-world) y eventos de misinformación periódica.

#### 2. Espacio Celular

Grilla bidimensional de 100 × 100 celdas con frontera toroidal.

#### 3. Estados de las Celdas

| Estado | Descripción | Atributos |
|---|---|---|
| `NEUTRAL` | Sin opinión formada | conviction = 0 |
| `A_FAVORABLE` | Favorece opinión A | conviction ∈ [0, 1], resistance ∈ [0, 1] |
| `B_FAVORABLE` | Favorece opinión B | conviction ∈ [0, 1], resistance ∈ [0, 1] |
| `INDIFERENTE` | Con resistencia pero sin postura | resistance > 0.5 |
| `INFLUENCER` | Agente de influencia masiva | influencerForce ∈ [0.8, 1.0], opinionType = A o B |

#### 4. Reglas de Transición

**a) Agentes neutrales** — Se convierten a la opinión mayoritaria entre sus 8 vecinos de Moore más K enlaces de largo alcance, siempre que haya al menos 2 vecinos con la opinión ganadora. La convicción inicial es 0.2.

**b) Agentes con opinión (A o B)** — Si la convicción es menor al umbral (`convictionThreshold`, configurable), el agente puede cambiar de opinión si la mayoría de sus contactos (Moore + long-links) favorecen la opinión opuesta. La convicción aumenta en 0.15 por tick cuando el agente está en la opinión mayoritaria local.

**c) Resistencia** — Los agentes con `conviction > 0.8` y `resistance > 0.5` son resistentes al cambio. La resistencia se reduce en 0.33 por tick hasta llegar a 0, momento en que el agente vuelve a ser susceptible.

**d) Conteo de mismos ticks** — Si el agente ha mantenido su opinión por más de 10 ticks y su entorno confirma su postura (más de 4 vecinos con la misma opinión), su convicción aumenta en 0.1, representando el efecto de la cámara de eco.

**e) Influencers** — Un influencer afecta a todos los agentes dentro de un radio de 5 celdas (vecindad de Moore extendida). Los agentes con convicción menor al umbral dentro de ese radio cambian a la opinión del influencer, incrementando su convicción proporcionalmente a la `influencerForce`.

**f) Agentes indiferentes** — Mantienen su resistencia pero sin postura activa. Si no tienen vecinos activos (no neutrales ni indiferentes), eventualmente regresan al estado neutral.

#### 5. Red Small-World (Long-Links)

Se implementa una red de Watts-Strogatz simplificada donde cada celda tiene K enlaces de largo alcance a celdas aleatorias de la grilla. Estos enlaces se regeneran en cada reset y permiten que opiniones se propaguen a distancias grandes sin necesidad de vecinos físicos contiguos, reflejando la estructura de redes sociales reales.

#### 6. Misinformación

Cada 20 generaciones (si está activada), se genera un evento de misinformación en una ubicación aleatoria. En un radio de 2 celdas, todos los agentes con convicción menor a 0.5 (no influencers) son forzados a una opinión aleatoria (A o B) con convicción 0.6. Esto simula la inyección de noticias falsas que alteran la dinámica del sistema.

#### 7. Parámetros Configurables

| Parámetro | Rango | Valor por defecto |
|---|---|---|
| Densidad opinión A | 0.05-0.50 | 0.20 |
| Densidad opinión B | 0.05-0.50 | 0.15 |
| Cantidad de influencers | 0-10 | 3 |
| Umbral de convicción | 0.1-1.0 | 0.5 |
| Long-links (K) | 0-5 | 2 |
| Misinformación | on/off | off |

---

## IV. RESULTADOS Y ANÁLISIS

### A. Parte I — Cardumen de Peces

**Comportamiento emergente observado:**

1. **Formación de cardúmenes**: A partir de posiciones aleatorias, los peces se agrupan progresivamente en cardúmenes densos debido a la regla de cohesión. El radio de percepción determina el tamaño máximo del cardumen.

2. **Evasión de depredadores**: Al activar el depredador, los peces cercanos huyen en dirección opuesta, generando un efecto de "ola" visual a medida que la información se propaga por el cardumen. Los peces que no perciben al depredador continúan su comportamiento normal, lo que genera la separación realista observada en la naturaleza.

3. **Efecto de frontera**: En modo toroidal, los cardúmenes pueden cruzar los bordes y mantener su cohesión. En frontera fija, los peces rebotan en los bordes, generando concentraciones temporales en las esquinas.

4. **Velocidad discreta**: Los peces lentos (SLOW) forman el núcleo del cardumen ya que se mueven menos, mientras que los peces rápidos (FAST) tienden a liderar el movimiento del grupo al avanzar 2 celdas por tick. Esta diferenciación genera una estructura de liderazgo natural.

5. **Separación en obstáculos**: Los obstáculos generan división del cardumen, con los subgrupos re小巷合andose después de rodear el obstáculo, un fenómeno observable en cardúmenes reales.

### B. Parte II — Evacuación de Muchedumbres

**Comportamiento emergente observado:**

1. **Flujo hacia salidas**: El campo de potencial guía eficientemente a las personas hacia las salidas más cercanas, creando flujos organizados en los pasillos.

2. **Congestión**: Cuando múltiples personas convergen hacia una misma salida, se forman atascos que retrasan la evacuación, especialmente en el escenario de pasillo estrecho.

3. **Efecto del pánico**: Las personas en pánico toman decisiones subóptimas al elegir direcciones aleatoriamente en lugar de seguir el gradiente de potencial. Esto genera desorden y aumenta el tiempo de evacuación.

4. **Caída y colaboración**: Las personas caídas generan obstáculos temporales. La colaboración permite que las personas caídas se levanten, reduciendo los bloqueos. Sin colaboración, las salidas se bloquean más frecuentemente.

5. **Fuego dinámico**: La propagación del fuego obliga a recalculación de rutas. Las personas que estaban cerca del fuego deben buscar rutas alternativas, creando redistribución de flujos.

6. **Efecto bottleneck**: En el escenario de pasillo estrecho, se observa el fenómeno de arco donde las personas se acumulan en el pasillo. La velocidad de evacuación disminuye drásticamente comparada con el escenario de habitación abierta, y los niveles de pánico son significativamente mayores.

### C. Parte III — Propagación de Opiniones

**Comportamiento emergente observado:**

1. **Formación declusters**: A partir de una distribución aleatoria, se forman regiones homogéneas de opiniones A y B, similares a los patrones del modelo de Schelling [5].

2. **Efecto de los influencers**: Los influencers actúan como núcleos de difusión, expandiendo rápidamente su opinión en su vecindario. Un solo influencer puede cambiar el balance de un área local significativa.

3. **Competencia de opiníones**: Cuando dos influencers de distinta opinión están cercanos, se forma una zona de frontera inestable donde los agentes cambian frecuentemente de opinión.

4. **Efecto de la misinformación**: Los eventos de misinformación periódicos inyectan opinion forzada en áreas aleatorias, creando "islas" temporales de opinión que pueden persistir o ser absorbidas por la opinión dominante vecina.

5. **Resistencia y cámara de eco**: Los agentes que mantienen su opinión por más de 10 ticks ven incrementada su convicción, creando regiones estables resistentes al cambio. Esto modela el efecto de cámara de eco observado en redes sociales reales.

6. **Red small-world**: Los long-links permiten que opiniones minoritarias en una región se propaguen a áreas distantes, impidiendo un monopolio local y manteniendo competencia dinámica entre A y B.

---

## V. CONCLUSIONES

Se implementó exitosamente un sistema de tres simulaciones con autómatas celulares bidimensionales que demuestran propiedades emergentes a partir de reglas locales simples:

1. **El cardumen** exhibe comportamiento colectivo realista donde la separación, alineación y cohesión generan movimiento coordinado sin dirección central, validando el modelo de Boids en un espacio celular discreto. La velocidad diferenciada (SLOW/MEDIUM/FAST) agrega heterogeneidad que produce estructura de liderazgo natural.

2. **La evacuación** demuestra que el pánico empeora los tiempos de evacuación, la colaboración reduce los bloqueos causados por personas caídas, y la visión limitada modela correctamente la incertidumbre en emergencias reales. El escenario de bottleneck evidencia el fenómeno de arco, un resultado clásico en la literatura de evacuación [6].

3. **La propagación de opiniones** muestra cómo la dinámica de redes sociales puede generar polarización (clusters homogéneos) a partir de preferencias individuales moderadas, conectando con los resultados del modelo de Schelling [5]. La inclusión de influencers y misinformación refleja fenómenos observables en plataformas digitales contemporáneas.

**Limitaciones:**

- El modelo de evacuación no considera fuerzas físicas de empuje entre personas (modelo exclusivamente celular).
- La propagación de opiniones utiliza una red small-world estática; en la práctica, estas redes evolucionan dinámicamente.
- Los parámetros (umbrales de pánico, fuerza de influencer, etc.) fueron calibrados empíricamente y no corresponden a datos experimentales.

**Trabajo futuro:**

- Implementar fuerzas de empuje en la evacuación.
- Agregar humo como obstáculo visual además del fuego.
- Incorporar redes dinámicas en la propagación de opiniones.
- Implementar análisis estadístico automático de los resultados de la simulación.

---

## VI. REFERENCIAS

[1] J. Von Neumann, *Theory of Self-Reproducing Automata*, A. W. Burks, Ed. Urbana, IL: University of Illinois Press, 1966.

[2] S. Wolfram, *A New Kind of Science*. Champaign, IL: Wolfram Media, 2002.

[3] C. W. Reynolds, "Flocks, herds and schools: A distributed behavioral model," *ACM SIGGRAPH Computer Graphics*, vol. 21, no. 4, pp. 25-34, 1987.

[4] P. Bak, *How Nature Works: The Science of Self-Organized Criticality*. New York, NY: Copernicus Press, 1996.

[5] T. C. Schelling, "Dynamic models of segregation," *Journal of Mathematical Sociology*, vol. 1, no. 2, pp. 143-186, 1971.

[6] P. C. Tissera, M. Printista, and M. L. Errecalde, "Evacuation simulations using cellular automata," *Journal of Computer Science & Technology*, vol. 7, no. 1, 2007.

[7] M. Batty, *Cities and Complexity: Understanding Cities with Cellular Automata, Agent-Based Models, and Fractals*. Cambridge, MA: MIT Press, 2005.

[8] D. J. Watts and S. H. Strogatz, "Collective dynamics of 'small-world' networks," *Nature*, vol. 393, pp. 440-442, 1998.