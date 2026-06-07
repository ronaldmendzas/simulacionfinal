# Autómatas Celulares: Fundamentos, Teoría y Aplicaciones

> **Curso:** IINF-391 — Simulación con Autómatas  
> **Fuentes:** Múltiples presentaciones sobre historia, sistemas complejos, modelos unidimensionales, Modelo de Schelling y aplicaciones de AC.

---

## Tabla de Contenidos

1. [Historia y Pioneros](#1-historia-y-pioneros)
2. [Definición y Estructura de un Autómata Celular](#2-definición-y-estructura-de-un-autómata-celular)
3. [Autómatas Celulares Unidimensionales (Elementales)](#3-autómatas-celulares-unidimensionales-elementales)
4. [Autómata Celular Bidimensional: El Juego de la Vida](#4-autómata-celular-bidimensional-el-juego-de-la-vida)
5. [Sistemas Complejos y Autómatas Celulares](#5-sistemas-complejos-y-autómatas-celulares)
6. [Modelo de Schelling: Segregación y Tolerancia](#6-modelo-de-schelling-segregación-y-tolerancia)
7. [Aplicaciones de los Autómatas Celulares](#7-aplicaciones-de-los-autómatas-celulares)
8. [Ejemplos Avanzados de Simulación](#8-ejemplos-avanzados-de-simulación)
9. [Referencias Bibliográficas](#9-referencias-bibliográficas)

---

## 1. Historia y Pioneros

### 1.1 Alan Turing (1936)

En 1936, Alan Turing se planteó una pregunta fundamental de la matemática:

> **¿Todo enunciado matemático es decidible?** Es decir, ¿existe un procedimiento que, aplicado a cualquier sentencia, nos diga si es verdadera o falsa?

Como respuesta, Turing introdujo el concepto de la **Máquina de Turing**, un modelo abstracto de cómputo que sentó las bases de la computación moderna y, de manera indirecta, del estudio de los autómatas.

---

### 1.2 John Von Neumann (1940)

En 1940, Von Neumann inició el desarrollo de la **teoría de autómatas**, inspirado en el fenómeno biológico de la **autorreproducción**. Su pregunta central era:

> ¿Qué tipo de organización lógica es suficiente para que un autómata sea capaz de autorreproducirse?

Su razonamiento fue el siguiente: si la autorreproducción es ejecutada por una máquina bioquímica (altamente compleja), entonces el comportamiento de esa máquina puede describirse como una secuencia lógica de pasos (un algoritmo). Y si ese algoritmo puede ejecutarse en alguna máquina, entonces existe una Máquina de Turing capaz de ejecutarlo.

Su trabajo fue publicado de forma póstuma por **Arthur W. Burks** bajo el título *Theory of Self-Reproducing Automata* (1966).

---

### 1.3 Stanislaw Ulam (1950)

Ulam colaboró directamente con Von Neumann y fue quien sugirió el **modelo de configuración celular** en 1950. Su propuesta consistía en:

- Considerar una gráfica finita de puntos (celdas).
- Cada punto tiene un número finito de conexiones a vecinos.
- Cada punto puede adoptar un valor de un conjunto finito de estados.
- El estado de una celda en el tiempo `n+1` se determina a partir del estado de sus vecinos y del propio estado en el tiempo `n`.

Esta idea es, en esencia, la definición formal de un autómata celular.

---

### 1.4 Otros Pioneros

| Persona | Período | Contribución |
|---|---|---|
| **Konrad Zuse** (1910–1995) | 1967 | Propuso en su tesis que el universo entero está siendo "computado" por un autómata celular (*Calculating Space*, 1969). |
| **Edgar F. Codd** (1923–2003) | 1968 | Diseñó un AC para recrear la computación y la construcción-universalidad del modelo de Von Neumann con solo 8 estados. |
| **Edward Fredkin** (1934–) | — | Pionero en autómatas celulares y cómputo reversible. |
| **Christopher Langton** (1949–) | — | Fundador del campo de la **vida artificial**. Propuso la idea de "computación al borde del caos". Creó el Loop de Langton (autorreproducción en AC) y la Hormiga de Langton. Cofundador del Santa Fe Institute (SFI). |
| **Stephen Wolfram** (1959–) | — | Estudió sistemáticamente las dinámicas de los AC elementales y los clasificó en cuatro tipos. Publicó *A New Kind of Science* (2002). |

---

## 2. Definición y Estructura de un Autómata Celular

Un **Autómata Celular (AC)** es un sistema dinámico discreto formado por un conjunto de celdas (o células) que tienen un comportamiento dentro de una dimensión dada. Los AC representan comportamientos complejos determinísticos: bajo las mismas condiciones iniciales y reglas de evolución, los resultados de n experimentos serán siempre los mismos.

### 2.1 Componentes Fundamentales

Todo autómata celular está formado por tres partes esenciales:

#### a) Lattice discreta (L)
El **arreglo de celdas** que constituye el espacio del sistema. Puede ser unidimensional (una línea de celdas), bidimensional (una cuadrícula 2D), o de mayor dimensión.

#### b) Vecindad (r)
Son las celdas que rodean a una celda determinada (la celda-estado). De la definición de vecindad depende la forma en que el autómata se comporta y evoluciona a través del tiempo.

Las vecindades más comunes en 2D son:
- **Vecindad de Von Neumann:** las 4 celdas adyacentes (arriba, abajo, izquierda, derecha).
- **Vecindad de Moore:** las 8 celdas que rodean a la celda central (incluye diagonales).

#### c) Reglas de transición (f)
Son **funciones de transición local** que determinan el estado futuro de cada celda en función de su estado actual y el de sus vecinas. Pueden expresarse como:
- Una fórmula matemática.
- Una tabla de transiciones de la forma `u(x)ₖ → xₖ₊₁`.
- Un conjunto de reglas condicionales.

### 2.2 Ventajas del Modelado con AC

La principal ventaja de modelar Sistemas Complejos con AC es **evitar el uso de ecuaciones diferenciales no lineales**, las cuales requieren estudios de estabilidad y convergencia que pueden derivar en algoritmos no computables. Los AC ofrecen:

- Reglas locales simples que generan comportamientos globales complejos.
- Paralelismo natural (todas las celdas se actualizan simultáneamente).
- Determinismo bajo condiciones iniciales fijas.
- Facilidad de implementación computacional.

---

## 3. Autómatas Celulares Unidimensionales (Elementales)

### 3.1 Definición Formal

El **autómata celular elemental** es una colección **unidimensional** de celdas con dos posibles estados `{0, 1}`, que evoluciona a través de pasos de tiempo discretos de acuerdo a un conjunto de reglas basadas en los estados de sus celdas vecinas.

- `aᵢ(t)` indica el estado de la celda i-ésima (i = 1, 2, ..., N) en el instante discreto t.

La dinámica se define a partir de una "vecindad":

```
aᵢ(t+1) = F(aᵢ₋₁(t), aᵢ(t), aᵢ₊₁(t))
```

Donde los valores de `F` pertenecen a una **tabla de transiciones** compuesta por las posibles ternas formadas con el alfabeto `k = {0,1}`.

### 3.2 Tabla de Transiciones

Dado que hay 2³ = 8 posibles combinaciones de estados para (izquierda, centro, derecha), y cada una puede mapearse a 0 o 1, existen **2⁸ = 256 reglas posibles** para los AC elementales. Wolfram las numeró del 0 al 255.

### 3.3 Reglas Notables

#### Regla 30
Una de las reglas más famosas por su **comportamiento caótico** a partir de condiciones iniciales simples. Genera patrones aparentemente aleatorios y se ha utilizado como generador de números pseudoaleatorios. Es notable porque su patrón de evolución es visualmente similar a los caparazones de caracoles marinos de la especie *Conus textile*.

#### Regla 110
Esta regla es especialmente importante porque ha sido demostrada como **Turing-completa** (computacionalmente universal), lo que significa que puede simular cualquier computación realizable por una Máquina de Turing.

### 3.4 Tipos de Comportamiento (Clasificación de Wolfram)

Wolfram clasificó los AC elementales en cuatro clases según su comportamiento dinámico:

| Clase | Tipo de Dinámica | Descripción |
|---|---|---|
| I | Estable (punto fijo) | El sistema converge a un estado uniforme. |
| II | Periódica | El sistema entra en un ciclo de estados que se repite. |
| III | Caótica | Comportamiento aparentemente aleatorio e impredecible. |
| IV | Compleja | Mezcla de estructuras estables y caóticas; computacionalmente interesante. |

### 3.5 Variaciones de Comportamiento

Dependiendo de las reglas aplicadas, un AC unidimensional puede exhibir los siguientes comportamientos:

- **Extinción inmediata:** cualquier población se extingue en el primer paso.
- **Marcha hacia la derecha:** toda la población se desplaza indefinidamente en una dirección.
- **Comportamiento alternante:** el estado oscila eternamente entre dos configuraciones.
- **Multiplicación:** la población crece indefinidamente.
- **Multiplicación controlada:** la población crece pero está limitada por el espacio disponible.

---

## 4. Autómata Celular Bidimensional: El Juego de la Vida

### 4.1 Historia

El **Juego de la Vida** fue diseñado por el matemático británico **John Horton Conway** (Liverpool, 26 de diciembre de 1937 – Princeton, 11 de abril de 2020). Conway fue un prolífico matemático especialista en teoría de grupos, teoría de nudos, teoría de números y teoría de juegos, formado en la Universidad de Cambridge.

El juego fue publicado en octubre de **1970** en la revista *Scientific American*, en la columna de juegos matemáticos de **Martin Gardner**.

### 4.2 Estructura

- **Espacio:** Un tablero (cuadrícula 2D) conceptualmente infinito.
- **Estados de cada celda:** Dos estados posibles:
  - `1` — Celda **viva** (encendida).
  - `0` — Celda **muerta** (apagada).
- **Vecindad:** Cada casilla del tablero tiene **8 casillas vecinas** (vecindad de Moore).

### 4.3 Reglas

Las reglas del Juego de la Vida son sorprendentemente simples:

1. **Nacimiento:** Una celda muerta con exactamente **3 vecinos vivos** "nace" (pasa a estado vivo en el siguiente turno).
2. **Supervivencia:** Una celda viva con **2 o 3 vecinos vivos** sobrevive al siguiente turno.
3. **Soledad:** Una celda viva con **menos de 2 vecinos** muere (subpoblación).
4. **Superpoblación:** Una celda viva con **más de 3 vecinos** muere (sobrepoblación).

> **Principio clave:** Reglas sencillas → Comportamiento complejo emergente.

### 4.4 Condiciones de Frontera

El comportamiento del juego varía según cómo se trate el borde del tablero:

- **Fronteras abiertas:** Las celdas en el borde tienen menos vecinos (el exterior se considera siempre muerto).
- **Frontera circular (Toroide):** El borde superior se conecta con el inferior, y el borde izquierdo con el derecho, formando una superficie toroidal. Esto simula un espacio infinito de forma compacta.

---

## 5. Sistemas Complejos y Autómatas Celulares

### 5.1 ¿Qué es un Sistema Complejo?

Los **Sistemas Complejos (SC)** se encuentran frecuentemente en la naturaleza. Se caracterizan por estar formados por muchos elementos que **interactúan entre sí**; a mayor número de elementos, mayor complejidad del sistema.

Un SC está compuesto por varias partes interconectadas cuyos vínculos contienen **información adicional y oculta** al observador externo.

#### Ejemplos de Sistemas Complejos

- El **vuelo hipnótico de las aves** (bandadas que se mueven como una sola entidad).
- Una **cascada de agua**: millones de gotas independientes que al interactuar forman un torrente complejo.
- El **tráfico vehicular** urbano (Nagel, 1995): cada auto es una célula del SC; uno solo no crea tráfico, pero el conjunto sí.
- La **red eléctrica nacional**: sistema de transmisión y distribución donde cada elemento es crítico e interdependiente; una falla en una estación afecta inmediatamente a los elementos contiguos.

### 5.2 Propiedades de los Sistemas Complejos

| Propiedad | Descripción |
|---|---|
| **Emergencia** | Las propiedades del sistema surgen de las interacciones entre sus elementos; los elementos por sí solos no las poseen. |
| **Holismo** | "El todo es más que la suma de las partes." |
| **Autoorganización** | El sistema genera estructuras ordenadas sin un controlador central. |
| **Impredecibilidad** | Se puede predecir la evolución solo hasta ciertos límites, con un error que crece con el tiempo. |
| **Información emergente** | La información del sistema en conjunto es superior a la suma de la información de cada parte individual. |

### 5.3 Técnicas para Modelar Sistemas Complejos

Históricamente se usaron métodos matemáticos clásicos: estadística, probabilidad, ecuaciones diferenciales y métodos numéricos. Sin embargo, ante la enorme cantidad de variables internas de los SC, estas técnicas quedaban rápidamente superadas. Esto llevó al desarrollo de nuevos enfoques:

- **Teoría del Caos**
- **Sistemas multiagente**
- **Lógica difusa**
- **Redes neuronales**
- **Autómatas Celulares (AC)** ← la alternativa más natural para sistemas discretos

### 5.4 Opciones de Modelado para SC

Para modelar SC en los que no es conveniente aplicar técnicas matemáticas (sistemas químicos, biológicos, evolutivos, genéticos, eléctricos, computacionales), existen tres opciones:

1. **Modelo continuo:** para sistemas analógicos.
2. **Métodos de discretización aproximados:** con posibles problemas de digitalización.
3. **Modelar con Autómatas Celulares:** la opción más potente para sistemas discretos complejos.

---

## 6. Modelo de Schelling: Segregación y Tolerancia

### 6.1 Thomas Schelling

**Thomas Schelling** (California, 1921 – 2016) fue Premio Nobel de Economía en 2005. Publicó trabajos influyentes en áreas como estrategia militar y control de armas, política energética y ambiental, teoría del conflicto y del regateo, y **segregación e integración racial**.

### 6.2 El Problema de la Segregación (1969–1971)

El modelo de Schelling estudia cómo la **segregación espacial emerge de preferencias individuales simples**, incluso en ausencia de prejuicios extremos.

**Configuración inicial:**
- `R` agentes rojos, `A` agentes azules y `V` lugares vacíos en una red con `R + A + V` nodos.
- Cada agente tiene una **tolerancia** `Tc`.

**Regla de movimiento:**
- Si el cociente entre vecinos de color opuesto y vecinos del mismo color es menor que `Tc`:

```
#{vecinos de color opuesto} / #{vecinos del mismo color} < Tc
```

... entonces el agente se **muda a un lugar vacío aceptable**.

### 6.3 Paradoja del Modelo

> Aunque los agentes individuales **toleran la diversidad**, el sistema en su conjunto termina **altamente segregado**.

Esto ilustra perfectamente el concepto de emergencia: el comportamiento macro (segregación) surge de micro-preferencias individuales moderadas.

### 6.4 Efectos del Umbral de Tolerancia

| Umbral `Tc` | Efecto observado |
|---|---|
| `Tc = 1/4` | Baja intolerancia; sistema relativamente mezclado. |
| `Tc = 1/2` | Segregación moderada. |
| `Tc = 2/3` | Alta segregación. |
| `Tc = 3/4` | Segregación extrema. |

A mayor umbral de tolerancia (los agentes exigen más similitud para estar cómodos), mayor es el nivel de segregación final.

### 6.5 El Modelo como Autómata Celular

El Modelo de Schelling puede formalizarse como un AC con la siguiente estructura:

#### Espacio (Cuadrícula 2D)
Cada celda representa una vivienda con tres estados posibles:
- **Agente Azul** (grupo A)
- **Agente Rojo** (grupo B)
- **Vacía** (vivienda desocupada)

#### Agentes y Reglas
- **Preferencia de similitud (T):** umbral mínimo del porcentaje de vecinos "similares" para que un agente se sienta cómodo (ej. T = 30%).
- **Movimiento:** si un agente tiene menos del T% de vecinos similares, se mueve a una celda vacía aleatoria.

#### Dinámica
1. **Inicialización:** distribución aleatoria de agentes (ej. 50% Azules, 50% Rojos, 10% vacías).
2. **Paso temporal:** para cada agente insatisfecho, calcular el % de vecinos similares en su vecindario de Moore. Si % < T, moverlo a una celda vacía aleatoria.
3. **Condición de estabilidad:** el sistema se detiene cuando ningún agente quiere moverse.

#### Métricas de Análisis (Sociología/Economía)
- Porcentaje de agentes sin vecinos del otro color (aislamiento total).
- Cantidad y tamaño de los clusters formados.
- Distancia al trabajo, escuelas (en barrios mixtos vs. segregados).

### 6.6 Evidencia Empírica

El modelo de Schelling ha sido comparado con patrones reales de segregación racial en ciudades estadounidenses como **Los Ángeles**, **Nueva York** y **Washington D.C.**, mostrando similitudes notables con los patrones generados por el AC.

---

## 7. Aplicaciones de los Autómatas Celulares

Los AC han demostrado ser herramientas potentes para modelar una amplia variedad de fenómenos del mundo real.

### 7.1 Panorama General de Aplicaciones

| Dominio | Referencia |
|---|---|
| **Dinámica del tráfico** | Nagel & Schreckenberg (1992) — *J. Physics I. France* |
| **Dinámica de epidemias** | Ching Fu & Milne — *Epidemic Modelling Using Cellular Automata* |
| **Modelos de evacuación** | Tissera et al. (2007) — *JCS&T Vol. 7, No. 1* |
| **Crecimiento urbano** | Batty (2005) — *Cities and Complexity*, MIT Press |
| **Modelos de segregación** | Schelling (1971) — *J. of Mathematical Sociology* |
| **Crecimiento de bosques** | Iwasa, Sato & Nakashima (1991) — *J. Theor. B.* |
| **Incendios forestales** | Chen & Bak (2002) — *Physica A* |
| **Otras áreas** | Comunidades de insectos sociales, reacciones químicas, crecimiento de bacterias, DLA, etc. |

---

### 7.2 Crecimiento Urbano: La Paz 2040

Una de las aplicaciones más cercanas a nuestra región es el modelo de crecimiento urbano de la ciudad de **La Paz, Bolivia**.

#### Estructura del Modelo

- **Retícula:** Cuadrícula 2D de células (mapa raster).
- **Vecindario:** Vecindario extendido de Moore (radio 500 píxeles).

**Estados de cada celda:**

| Estado | Significado |
|---|---|
| 1 | Apto para edificación |
| 2 | Área verde |
| 3 | Lecho de río |
| 4 | Risco de montaña |

#### Factores Considerados
- **Accesibilidad a las vías** (calles, avenidas, callejones).
- **Vecindad urbana** (densidad del entorno construido).
- **Pendiente del terreno**.

#### Restricciones
- Zonas no urbanizables.
- Áreas ya urbanizadas.
- Vacíos urbanos.
- Vías de comunicación.

#### Regla de Evolución
La probabilidad de cambio de uso del suelo se calcula en función de los tres factores anteriores mediante una ecuación de transición probabilística, generando **proyecciones de la mancha urbana hacia el año 2040**.

---

### 7.3 Propagación del Fuego

La simulación de incendios forestales con AC permite estudiar cómo se propaga el fuego considerando factores como:

- **Dirección e intensidad del viento.**
- **Proximidad de material combustible.**
- **Topografía del terreno.**

Cada celda puede representar un estado: terreno sin vegetación, vegetación no quemada, en llamas, o quemada. La regla de transición determina cuándo una celda ignita a sus vecinas.

---

### 7.4 Generación de Patrones de Piel (Reacción-Difusión de Turing)

#### Concepto Base
**Problema:** ¿Cómo surgen patrones periódicos (rayas, manchas) en animales a partir de interacciones químicas locales?

**Solución:** El modelo de **Alan Turing** (1952) propone que dos morfógenos (activador e inhibidor) interactúan y se difunden, creando patrones estables.

#### Componentes
- **Activador (A):** promueve su propia producción y la del inhibidor.
- **Inhibidor (I):** suprime la producción del activador.

#### Estructura del AC
- **Retícula:** cuadrícula 2D (ej. 100×100 o 200×200 celdas).
- **Vecindario:** extendido (radio 3–5) para capturar interacciones de largo alcance.
- **Estado de cada celda:** dos concentraciones químicas (A e I) que evolucionan según ecuaciones de reacción-difusión discretizadas.

El resultado son patrones emergentes similares a los que se observan en pieles de cebras, leopardos, peces tropicales y otros animales.

---

### 7.5 Detección de Bordes en Imágenes

Los AC pueden aplicarse al **procesamiento digital de imágenes**, particularmente para la detección de bordes.

#### Estructura
- **Retícula 2D:** cada célula corresponde a un píxel de la imagen (matriz M×N).
- **Estado de cada célula:** `S(i,j)` — puede ser binario: 0 = sin borde, 1 = borde.
- **Vecindario:** vecindad de Moore (8 vecinos).

La regla de transición compara la intensidad del píxel central con la de sus vecinos; si la diferencia supera un umbral, la celda se marca como borde.

---

## 8. Ejemplos Avanzados de Simulación

### 8.1 Cardumen de Peces

Este ejemplo modela el **comportamiento colectivo de peces** (comportamiento de cardumen), inspirado en el modelo de *Boids* de Craig Reynolds.

#### Estructura del AC

**Espacio:** matriz bidimensional que representa el espacio marino. Cada celda puede estar:
- Vacía.
- Ocupada por un pez con una dirección de movimiento (8 posibles: N, NE, E, SE, S, SO, O, NO).

**Vecindad:** de Moore (8 celdas), simulando la percepción del entorno del pez.

**Estado de cada celda:**
- Estado: vacío u ocupado por un pez.
- Dirección actual de movimiento.
- Opcionalmente: velocidad discreta (lenta, media, rápida).

#### Reglas de Transición (Boids adaptados a AC)

**a) Separación (evitar colisiones)**
Si otro pez está en la vecindad inmediata, el pez intenta alejarse (cambia a dirección contraria).

**b) Alineación (coherencia de dirección)**
El pez ajusta su dirección para coincidir con la **dirección promedio** de los peces vecinos.

**c) Cohesión (mantenerse cerca del grupo)**
El pez intenta moverse hacia el **centro de masa** del grupo local (promedio de posiciones de los vecinos).

**d) Movimiento**
El pez se mueve a la celda vecina en la dirección resultante si está vacía. Si está ocupada, puede esperar o buscar una dirección alternativa.

#### Condiciones de Frontera
- **Toroidal:** los peces que salen por un borde entran por el opuesto (espacio continuo).
- **Bordes fijos:** si se desea limitar el espacio.

#### Extensiones Posibles
- **Depredadores:** celdas que simulan amenazas; los peces huyen.
- **Obstáculos:** zonas intransitables del espacio.

---

### 8.2 Evacuación de Muchedumbre

Este modelo simula la **evacuación de un edificio** durante una emergencia, permitiendo estudiar comportamientos colectivos considerando densidad, pánico y obstáculos.

#### Estructura del AC

**Espacio:** matriz bidimensional que representa el plano del edificio (pasillos, habitaciones, salidas). Cada celda puede ser:
- Espacio libre.
- Pared u obstáculo.
- Persona (con estado y dirección).
- Salida o punto de evacuación.

**Estados:**

| Estado | Descripción |
|---|---|
| 0 | Celda vacía |
| 1 | Persona |
| 2 | Obstáculo/Pared |
| 3 | Salida |

**Atributos internos de cada persona:**
- Dirección preferida (hacia la salida).
- Nivel de pánico (modifica el comportamiento).
- Velocidad (tiempo entre pasos).
- Memoria parcial del entorno (visión limitada).

**Vecindad:** de Moore (8 celdas) para representar libertad de movimiento en todas direcciones.

#### Reglas de Transición

**a) Búsqueda de salida**
Cada persona evalúa las celdas vecinas y selecciona la dirección que minimiza la distancia (costo) a la salida.

**b) Movimiento**
La persona se mueve a la celda vecina libre con menor costo hacia la salida. Si varias personas desean la misma celda: se resuelve por prioridad (calma, aleatoriedad) o se bloquean mutuamente (atascos realistas).

#### Ciclo de Actualización
1. Calcular el campo de potencial (distancia a la salida) para todo el mapa.
2. Para cada celda con persona: buscar la vecina libre con menor valor de campo; si hay varias, elegir aleatoriamente o por prioridad; moverse a esa celda.
3. Las personas que alcanzan celdas de salida se eliminan del sistema.
4. Repetir en cada paso de tiempo hasta evacuar a todos.

#### Extensiones Posibles
- **Visión limitada:** las personas no ven todo el mapa, solo su vecindad inmediata.
- **Pánico:** al aumentar el pánico, las personas toman decisiones menos óptimas (al azar o por imitación).
- **Colaboración:** personas que siguen a otras o ayudan a compañeros.
- **Fuego/Humo:** celdas que se vuelven inaccesibles o peligrosas, cambiando dinámicamente las rutas de evacuación.

---

## 9. Referencias Bibliográficas

- Batty, M. (2005). *Cities and Complexity: Understanding the City with Cellular Automata, Agent-Based Models and Fractals*. MIT Press.
- Chen, K., & Bak, P. (2002). Forest fires and the structure of the universe. *Physica A*, 306, 15–24.
- Ching Fu, & Milne. *Epidemic Modelling Using Cellular Automata*.
- Iwasa, Y., Sato, K., & Nakashima, S. (1991). Dynamic modeling of wave regeneration (Shimagare) in Subalpine Abies Forests. *J. Theor. B.*, 152, 143–158.
- Nagel, K., & Schreckenberg, M. (1992). A cellular automaton model for freeway traffic. *J. Physics I. France*, 2, 2221–2229.
- Schelling, T. (1971). Dynamic Models of Segregation. *Journal of Mathematical Sociology*, 1, 143–186.
- Tissera, P. C., Printista, M., & Errecalde, M. L. (2007). Evacuation Simulations Using Cellular Automata. *JCS&T*, Vol. 7, No. 1.
- Turing, A. M. (1952). The Chemical Basis of Morphogenesis. *Philosophical Transactions of the Royal Society B*, 237, 37–72.
- Von Neumann, J. (1966). *Theory of Self-Reproducing Automata* (ed. A. W. Burks). University of Illinois Press.
- Wolfram, S. (2002). *A New Kind of Science*. Wolfram Media.
- Zuse, K. (1969). *Calculating Space*. MIT Technical Translation.

---

> **Herramienta recomendada para simulación:** [NetLogo](https://ccl.northwestern.edu/netlogo/) — plataforma de modelado multi-agente y AC ampliamente usada en investigación y educación.
