# Simulación con Autómatas Celulares

> **IINF-391 — Simulación y Estadística — 3er Parcial**
> Tecnología: TypeScript + Vite + Canvas API

---

## Descripción General

Se implementan tres simulaciones interactivas basadas en Autómatas Celulares, visualizadas en tiempo real en el navegador. Cada simulación incluye controles configurables, visualización en color y análisis de comportamiento emergente.

---

## Partes del Proyecto

### Parte I — Cardumen de Peces (Boids Celular)

Simulación del movimiento colectivo de un banco de peces usando un AC sobre grilla 2D con los tres principios clásicos de Boids: **separación**, **alineación** y **cohesión**.

| Componente       | Detalle                                              |
| ----------------- | ---------------------------------------------------- |
| Grilla            | 2D toroidal 120×80                                   |
| Vecindad          | Moore (8 celdas) + percepción extendida               |
| Estados           | Vacío / Pez (dirección 8 opciones) / Depredador / Obstáculo |
| Atributos del pez | Dirección, velocidad discreta (lenta/media/rápida)    |
| Fronteras         | Toroidal (predeterminada) / Bordes fijos              |

**Reglas de transición:**
- **Separación:** si hay pez en vecindad inmediata, alejarse del centroide local
- **Alineación:** adoptar dirección promedio de vecinos en radio 2
- **Cohesión:** si hay < 3 vecinos en radio 3, moverse hacia el centroide
- **Movimiento:** si celda destino ocupada, esperar o buscar alternativa
- **Depredador:** repele peces en radio 5 (modo opcional)
- **Obstáculos:** zonas intransitables que el cardumen evita

---

### Parte II — Evacuación de Muchedumbres

Simulación de evacuación en un edificio con campo de potencial (BFS), pánico, aglomeración y rutas de escape.

| Componente       | Detalle                                              |
| ----------------- | ---------------------------------------------------- |
| Plano             | Grilla 2D 80×60 representando planta de edificio     |
| Estados           | 0=Vacío, 1=Persona, 2=Pared, 3=Salida, 4=Fuego       |
| Atributos persona | Dirección, nivel de pánico, velocidad, visión limitada |
| Vecindad          | Moore (8 celdas) para movimiento                     |
| Campo potencial   | BFS desde salidas al inicio                            |

**Reglas de transición:**
- **Búsqueda de salida:** moverse hacia celda con menor potencial
- **Pánico:** densidad > 0.7 → dirección aleatorizada, velocidad reducida
- **Contagio de pánico:** ≥ 3 vecinos en pánico → entrar en pánico
- **Caída:** 2% probabilidad por tick en pánico máximo
- **Visión limitada:** las personas solo ven su vecindad inmediata
- **Colaboración:** seguir a otros o ayudar caídos (opcional)
- **Fuego/Humo:** celdas inaccesibles que cambian rutas dinámicamente

---

### Parte III — Propagación de Opiniones en Redes Sociales

Modelado de polarización, cámaras de eco y viralización en una red social con topología small-world.

| Componente          | Detalle                                              |
| -------------------- | ---------------------------------------------------- |
| Grilla               | 2D 100×100 toroidal con enlaces small-world           |
| Estados              | Neutral / A-Favorable / B-Favorable / Indiferente / Influencer |
| Vecindad             | Moore radio 1 + k enlaces largos aleatorios            |
| Condición de frontera | Periódica toroidal                                    |
| Variables            | Convicción [0–1], resistencia, umbral, fuerza influencer |

**Reglas de transición:**
1. **Contagio:** mayoría de vecinos con opinión X y convicción < umbral → adopta X
2. **Resistencia:** convicción > 0.8 → inmune por 3 generaciones
3. **Influencer:** radio 5, fuerza amplificada configurable
4. **Indiferencia:** sin vecinos activos → volver a Neutral
5. **Radicalización:** > 10 ticks en misma opinión con alta densidad → convicción +0.1
6. **Desinformación:** nodos falsos que aceleran propagación (modo especial)

---

## Stack Técnico

| Tecnología         | Uso                                      |
| ------------------- | ---------------------------------------- |
| TypeScript          | Lógica de simulación, tipado fuerte      |
| Vite                | Bundler, dev server rápido                |
| HTML5 Canvas API    | Renderizado 60 FPS                       |
| HTML + CSS          | Controles y UI interactiva               |

## Arquitectura de Código

```
src/
├── core/
│   ├── CellularAutomaton.ts   # Clase base genérica <T>
│   └── index.ts
├── simulations/
│   ├── FishSchool.ts          # Parte I — Cardumen de Peces
│   ├── CrowdEvacuation.ts     # Parte II — Evacuación
│   ├── OpinionSpread.ts       # Parte III — Opiniones
│   └── index.ts
├── renderers/
│   ├── CanvasRenderer.ts      # Renderizado unificado
│   └── index.ts
├── ui/
│   ├── SimulationControls.ts  # Sliders, toggles, stats
│   └── index.ts
├── utils/
│   ├── colors.ts              # Utilidades de color
│   └── index.ts
├── main.ts                    # Orquestador principal
└── style.css                  # Estilos
```

## Instalación y Ejecución

```bash
# Clonar el repositorio
git clone https://github.com/ronaldmendzas/simulacionfinal.git

# Entrar al directorio
cd simulacionfinal

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

Abrir `http://localhost:5173` en el navegador.

## Parámetros Configurables (UI en tiempo real)

### Cardumen de Peces
- Cantidad de peces (50–800)
- Velocidad de simulación (1x–10x)
- Radio de percepción (1–5)
- Modo depredador ON/OFF
- Densidad de obstáculos
- Tipo de frontera: toroidal / bordes fijos

### Evacuación de Muchedumbres
- Cantidad de personas (20–300)
- Velocidad de simulación (1x–10x)
- Cantidad de salidas (1–4)
- Modo fuego/humo ON/OFF

### Propagación de Opiniones
- Densidad opinión A (5%–50%)
- Densidad opinión B (5%–50%)
- Cantidad de influencers (0–10)
- Umbral de convicción (0.1–0.9)
- Velocidad de simulación (1x–10x)
- Modo desinformación ON/OFF

## Autores

Proyecto desarrollado para la materia Simulación y Estadística — IINF-391.

## Licencia

Proyecto académico — Uso educativo.