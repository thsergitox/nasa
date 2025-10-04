# Reto “Embiggen Your Eyes!” — Resumen de Propuesta (MVP 1 día)

## Objetivo

Crear una **plataforma web** que permita **explorar imágenes masivas** (giga/tera-píxel) de **Tierra, Luna y Marte** con:

1. **Zoom fluido** sobre mosaicos en teselas (WMTS).
2. **Etiquetado** sencillo (puntos/polígonos → GeoJSON).
3. **Descubrimiento/comparación** básica (tiempo/capas).
4. (**Wow**) Un **selector 3D** (three.js) que “vuela” al visor 2D y un mini-**chat** que convierte texto → búsqueda geoespacial (auto-zoom por nombre/coords/fecha).

---

## Alcance (cuerpos y capas)

- **Tierra**: GIBS/Worldview (WMTS) — p. ej. _VIIRS Corrected Reflectance True Color_ con dimensión **time**.
- **Luna**: Solar System Treks (WMTS) — _LRO WAC Global Mosaic_ (EQ) y, si hay tiempo, mosaico polar (SP/NP).
- **Marte**: Solar System Treks (WMTS) — mosaico global equirectangular; opcional comparar con capa de elevación.

> En todos los casos: **tiles WMTS** para evitar cargar rásteres gigantes.

---

## Fuentes y patrones de URL (listas para código)

- **GIBS (Tierra, EPSG:4326):**
  `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{Layer}/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.{Ext}`
  Ej.: `Layer=VIIRS_SNPP_CorrectedReflectance_TrueColor`, `Time=YYYY-MM-DD`, `TileMatrixSet=250m|500m|1km`, `Ext=jpg`.

- **Treks (Luna/Marte, WMTS REST):**
  `https://trek.nasa.gov/tiles/{Body}/{Proj}/{Layer}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`
  Ej. Luna EQ: `Body=Moon`, `Proj=EQ`, `Layer=LRO_WAC_Mosaic_Global_303ppd_v02`.
  **Siempre leer `WMTSCapabilities.xml`** de cada layer para `Style`, `TileMatrixSet`, niveles y formato.

---

## Funcionalidades del MVP (demo-ready)

- **Selector 3D** (three.js): mini sistema solar (Tierra/Luna/Marte). Click → **fly-to** y abre visor 2D.
- **Visor 2D** (Cesium/Resium u OpenLayers):

  - Carga **WMTS** (Tierra/Luna/Marte).
  - **Time-picker** (Tierra) para cambiar fecha.
  - **Comparación simple**: _slider/spyglass_ entre dos capas/fechas.

- **Mini-chat NL → mapa**:

  - Diccionario pre-horneado de 6–8 lugares (Tycho, Valles Marineris, Amazonía, Olympus Mons, Mare Imbrium…).
  - Consulta → (cuerpo, lat, lon, fecha opcional) → **auto-zoom**.

- **Etiquetado**:

  - Crear **puntos/polígonos**, guardar/exportar **GeoJSON**.

- **Modo “Tour”**:

  - 3 escenas guiadas: (1) Incendios en Amazonía (Tierra), (2) Cráter Tycho (Luna), (3) Valles Marineris (Marte).

---

## Arquitectura (alto nivel)

- **Frontend**: React + **Cesium/Resium** (o OpenLayers) para WMTS; **three.js** para selector 3D; UI minimal (botones: capas, fecha, comparar, etiquetar, tour).
- **Backend (opcional/light)**: diccionario de topónimos → (lat,lon); si hay tiempo, wrapper de búsqueda (STAC/CMR para Tierra).
- **Datos**: solo **WMTS** (pirámides). Si se requiere ráster puntual, usar _COG/HTTP Range_ o stream puntual (no prioritario en 1 día).

---

## Convenciones de coordenadas (clave)

- **Tierra**: EPSG:4326/3857 estándar.
- **Luna/Marte**: proyecciones planetarias (Equirectangular/Polar) con convenciones IAU/USGS; **Marte**: preferir **planetocéntrica, longitudes Este 0–360**.
- Convertir nombres → (lat,lon) según el cuerpo y la proyección de la capa WMTS cargada.

---

## Gamificación (opcional)

- **Misión relámpago**: “Encuentra 2 focos de incendio hoy (Tierra), marca Tycho (Luna) y delimita Valles Marineris (Marte)”.
- Puntuar por **tiempo** y **precisión** (intersección con capa de referencia).

---

## Roadmap para el día de la hackaton

1. **Base React + Cesium/Resium** (1 h).
2. **Tierra WMTS (GIBS)** + time-picker (2 h).
3. **Luna WMTS (Treks)** (1.5 h).
4. **Marte WMTS (Treks)** + comparador simple (1.5 h).
5. **Mini-chat → go-to** (diccionario) (1.5 h).
6. **Etiquetado + export GeoJSON** (1.5 h).
7. **Selector 3D (three.js)** (1.5 h).
8. **Tour + pulido demo** (1.5 h).

---

## Criterios de éxito (demo)

- **< 2 s** en mostrar tiles al cambiar de zoom/capa.
- **3 saltos “auto-zoom”** por nombre funcionando (uno por cuerpo).
- **Etiquetado** exporta GeoJSON.
- **Comparación** visible (slider/spyglass) al menos en 1 cuerpo.
- **Tour** corre sin fallos (3 escenas).

---

## Riesgos y mitigaciones

- **tileMatrixSet/maximumLevel incorrectos** → leer `WMTSCapabilities.xml` y usar IDs reales.
- **Proyección/coordenadas** (Marte/Luna) → normalizar a convención de la capa; probar 2–3 puntos conocidos.
- **Rendimiento** → limitar zoom al máximo del `TileMatrix`, cache local del navegador, prefetch de 1 nivel.

---

## Stack y librerías

- **React**, **Cesium + Resium** (o OpenLayers), **three.js**.
- **GeoJSON** para anotaciones.
- (Opc.) utilidades para parsing de **WMTSCapabilities** y diccionario de topónimos.

---

## Snippet Cesium/Resium (WMTS ejemplo)

```tsx
import { Viewer, ImageryLayer } from "resium";
import * as Cesium from "cesium";

const provider = new Cesium.WebMapTileServiceImageryProvider({
  url: "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
  layer: "LRO_WAC_Mosaic_Global_303ppd_v02",
  style: "default",
  format: "image/png",
  tileMatrixSetID: "default028mm",
  tilingScheme: new Cesium.GeographicTilingScheme(),
  maximumLevel: 8,
});
/* <Viewer ...><ImageryLayer imageryProvider={provider} /></Viewer> */
```

---

## Pitch (mensaje corto)

“**Embigen Your Eyes**: un explorador 3D/2D ultrafluido para imágenes masivas de **Tierra, Luna y Marte**. Busca por **nombre** o **fecha**, **vuela** al sitio, **compara** capas y **anota** hallazgos en segundos. Perfecto para educación, museos y ciencia ciudadana.”
