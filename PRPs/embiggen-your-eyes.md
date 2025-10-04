# PRP: Embiggen Your Eyes! - Explorador Interactivo de Imágenes Masivas Planetarias

## 📋 Resumen Ejecutivo

Crear una plataforma web interactiva para explorar imágenes masivas (giga/tera-píxel) de Tierra, Luna y Marte con navegación 3D, zoom fluido WMTS, etiquetado GeoJSON, búsqueda por lenguaje natural y comparación temporal de capas.

**Tiempo estimado**: 10-12 horas (1 día hackathon)
**Stack principal**: React + TypeScript + Cesium/Resium + Three.js + Tailwind CSS
**Score de confianza**: 8/10 para implementación one-pass

## 🎯 Objetivos y Requisitos

### Funcionalidades Core (MVP)
1. **Selector 3D** - Sistema solar interactivo con Three.js para navegación
2. **Visor 2D WMTS** - Exploración fluida de tiles con Cesium/Resium
3. **Time Navigation** - Control temporal para datos de Tierra
4. **Chat NL** - Búsqueda geoespacial por texto
5. **Etiquetado** - Anotaciones GeoJSON exportables
6. **Comparación** - Slider/spyglass entre capas
7. **Tour Guiado** - 3 escenas predefinidas

### Métricas de Éxito
- Tiles cargan en < 2 segundos
- 3 auto-zoom funcionando (1 por cuerpo)
- Export GeoJSON funcional
- Tour completo sin errores

## 🔗 Contexto Crítico y Referencias

### APIs y Documentación

#### NASA GIBS (Tierra)
- **Docs**: https://nasa-gibs.github.io/gibs-api-docs/
- **REST Endpoint**: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/`
- **Capabilities XML**: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml`
- **Formato REST**: `{Layer}/default/{Time}/{TileMatrixSet}/{ZoomLevel}/{TileRow}/{TileCol}.{ext}`
- **Ejemplo**: VIIRS_SNPP_CorrectedReflectance_TrueColor con time dimension

#### NASA Trek (Luna/Marte)
- **Moon API**: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon
- **Mars API**: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars
- **REST Format**: `https://trek.nasa.gov/tiles/{Body}/{Proj}/{Layer}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`

#### Librerías Clave
- **Cesium Docs**: https://cesium.com/learn/cesiumjs/ref-doc/WebMapTileServiceImageryProvider.html
- **Resium (React)**: https://github.com/reearth/resium
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber

### Patrones de Código Verificados

```javascript
// WMTS Provider para GIBS (Tierra con tiempo)
const earthProvider = new Cesium.WebMapTileServiceImageryProvider({
  url: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
  style: 'default',
  format: 'image/jpeg',
  tileMatrixSetID: '250m',
  maximumLevel: 8,
  times: timeIntervalCollection,
  clock: viewer.clock
});

// WMTS Provider para Trek (Luna)
const moonProvider = new Cesium.WebMapTileServiceImageryProvider({
  url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
  layer: 'LRO_WAC_Mosaic_Global_303ppd_v02',
  style: 'default',
  format: 'image/png',
  tileMatrixSetID: 'default028mm',
  tilingScheme: new Cesium.GeographicTilingScheme(),
  maximumLevel: 8
});
```

## 🏗️ Blueprint de Implementación

### Arquitectura de Componentes

```
src/
├── App.tsx                 # Root con context providers
├── components/
│   ├── Solar3DSelector/    # Three.js sistema solar
│   │   ├── index.tsx       # Container principal
│   │   ├── Planet.tsx      # Componente planeta
│   │   └── Navigation.tsx  # Fly-to animations
│   ├── MapViewer/          # Cesium/Resium viewer
│   │   ├── index.tsx       # Viewer container
│   │   ├── WMTSLayer.tsx   # Provider wrapper
│   │   ├── TimeControl.tsx # Time picker
│   │   └── Comparator.tsx  # Slider/spyglass
│   ├── NLChat/             # Chat interface
│   │   ├── index.tsx       # Chat UI
│   │   └── Geocoder.tsx    # Text → coords
│   ├── Annotator/          # GeoJSON tools
│   │   ├── index.tsx       # Drawing tools
│   │   └── Export.tsx      # GeoJSON export
│   └── Tour/               # Guided tour
│       └── index.tsx       # Tour controller
├── services/
│   ├── wmts.service.ts     # WMTS providers
│   ├── geocoding.service.ts # NL → coords
│   └── tour.service.ts     # Tour sequences
├── hooks/
│   ├── useWMTS.ts          # WMTS management
│   ├── useCamera.ts        # Camera controls
│   └── useAnnotations.ts   # Annotation state
└── data/
    ├── locations.json       # Diccionario lugares
    └── tours.json          # Tour definitions
```

### Pseudocódigo Core

```typescript
// 1. SETUP INICIAL
interface AppState {
  currentBody: 'earth' | 'moon' | 'mars'
  currentDate: Date
  annotations: GeoJSON.FeatureCollection
  tourActive: boolean
}

// 2. SOLAR SELECTOR
function Solar3DSelector({ onPlanetClick }) {
  // Three.js scene setup
  const scene = new THREE.Scene()
  const planets = {
    earth: createPlanet({ radius: 1, texture: 'earth.jpg', position: [5, 0, 0] }),
    moon: createPlanet({ radius: 0.27, texture: 'moon.jpg', position: [6.5, 0, 0] }),
    mars: createPlanet({ radius: 0.53, texture: 'mars.jpg', position: [8, 0, 0] })
  }
  
  // Raycaster for click detection
  onMouseClick((intersects) => {
    const planet = detectPlanet(intersects)
    if (planet) {
      animateCamera(planet.position)
      setTimeout(() => onPlanetClick(planet.name), 1000)
    }
  })
}

// 3. WMTS VIEWER
function MapViewer({ body, date }) {
  const provider = useMemo(() => {
    switch(body) {
      case 'earth': return createGIBSProvider(date)
      case 'moon': return createTrekProvider('Moon')
      case 'mars': return createTrekProvider('Mars')
    }
  }, [body, date])
  
  return (
    <Viewer>
      <ImageryLayer imageryProvider={provider} />
      <AnnotationLayer features={annotations} />
      {comparing && <ComparisonLayer />}
    </Viewer>
  )
}

// 4. NL CHAT
function NLChat({ onLocationFound }) {
  const locations = {
    'tycho': { body: 'moon', lat: -43.3, lon: -11.36 },
    'valles marineris': { body: 'mars', lat: -13.9, lon: -59.2 },
    'amazon': { body: 'earth', lat: -3.4653, lon: -62.2159 },
    'olympus mons': { body: 'mars', lat: 18.65, lon: 226.2 },
    'mare imbrium': { body: 'moon', lat: 32.8, lon: -15.6 }
  }
  
  function parseQuery(text: string) {
    const normalized = text.toLowerCase()
    for (const [name, coords] of Object.entries(locations)) {
      if (normalized.includes(name)) {
        return coords
      }
    }
    // Parse coordinates if format: "lat,lon"
    const coordMatch = text.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    if (coordMatch) {
      return { lat: parseFloat(coordMatch[1]), lon: parseFloat(coordMatch[2]) }
    }
  }
}

// 5. ANNOTATION SYSTEM
function AnnotationTools({ viewer }) {
  const [drawing, setDrawing] = useState(false)
  const [features, setFeatures] = useState([])
  
  function startDrawing(type: 'point' | 'polygon') {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    if (type === 'point') {
      handler.setInputAction((click) => {
        const cartesian = viewer.camera.pickEllipsoid(click.position)
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        addFeature({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              Cesium.Math.toDegrees(cartographic.longitude),
              Cesium.Math.toDegrees(cartographic.latitude)
            ]
          }
        })
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
  }
  
  function exportGeoJSON() {
    const geojson = {
      type: 'FeatureCollection',
      features: features
    }
    downloadJSON(geojson, 'annotations.geojson')
  }
}
```

## 📝 Tareas de Implementación (Orden de Ejecución)

### Fase 1: Setup Base (1.5h)
1. ✅ Inicializar proyecto React + TypeScript + Vite
2. ✅ Instalar dependencias: `cesium resium three @react-three/fiber @react-three/drei tailwindcss`
3. ✅ Configurar Cesium assets y workers
4. ✅ Crear estructura de carpetas
5. ✅ Setup contexto global de estado

### Fase 2: Visor 2D Core (2.5h)
6. ✅ Implementar MapViewer con Cesium/Resium básico
7. ✅ Crear servicio WMTS para Tierra (GIBS)
8. ✅ Agregar TimeControl para dimensión temporal
9. ✅ Implementar provider para Luna (Trek)
10. ✅ Implementar provider para Marte (Trek)
11. ✅ Validar zoom levels y tile matrix sets

### Fase 3: Selector 3D (1.5h)
12. ✅ Setup Three.js scene con sistema solar
13. ✅ Crear planetas con texturas y órbitas
14. ✅ Implementar raycaster para clicks
15. ✅ Agregar animación fly-to
16. ✅ Conectar con cambio de vista 2D

### Fase 4: Chat NL (1.5h)
17. ✅ Crear UI de chat minimalista
18. ✅ Implementar diccionario de lugares
19. ✅ Parser de texto → coordenadas
20. ✅ Auto-zoom en viewer
21. ✅ Manejo de errores y feedback

### Fase 5: Anotaciones (1.5h)
22. ✅ Implementar drawing handlers
23. ✅ Crear herramientas punto/polígono
24. ✅ State management para features
25. ✅ Exportar GeoJSON
26. ✅ Visualización de anotaciones

### Fase 6: Comparación (1h)
27. ✅ Implementar slider/spyglass UI
28. ✅ Crear dual imagery layers
29. ✅ Sincronizar viewports
30. ✅ Control de opacidad

### Fase 7: Tour & Polish (1.5h)
31. ✅ Definir 3 escenas de tour
32. ✅ Implementar secuencia automática
33. ✅ Agregar narración/tooltips
34. ✅ UI polish y responsive design
35. ✅ Testing y debugging final

## 🚦 Validation Gates

### Gate 1: WMTS Loading (Después de Fase 2)
- [ ] Tiles de Tierra cargan con fecha actual
- [ ] Tiles de Luna cargan correctamente
- [ ] Tiles de Marte cargan correctamente
- [ ] Cambio de fecha actualiza tiles

### Gate 2: Navegación 3D (Después de Fase 3)
- [ ] Click en planeta activa transición
- [ ] Vista 2D se actualiza al cuerpo correcto
- [ ] Animación es fluida

### Gate 3: Features Completas (Después de Fase 6)
- [ ] Chat encuentra al menos 5 lugares
- [ ] Anotaciones se exportan como GeoJSON válido
- [ ] Comparación funciona en al menos 1 cuerpo

### Gate 4: Demo Ready (Después de Fase 7)
- [ ] Tour corre sin interrupciones
- [ ] UI responsive en desktop/tablet
- [ ] No errores en consola
- [ ] Performance < 2s para cambios

## ⚠️ Gotchas y Consideraciones

### Problemas Comunes
1. **CORS en tiles**: NASA GIBS/Trek permiten CORS, pero verificar headers
2. **TileMatrixSet IDs**: Deben coincidir exactamente con capabilities XML
3. **Coordenadas Marte**: Usar planetocéntricas con longitud Este 0-360
4. **Memory leaks**: Limpiar event handlers y dispose Three.js objects
5. **Cesium ion token**: No necesario para NASA tiles públicos

### Optimizaciones
- Prefetch tiles del siguiente zoom level
- Cache de tiles en localStorage (con límite)
- Lazy load componentes pesados
- WebWorkers para parsing GeoJSON grande

### Fallbacks
- Si WMTS falla → mostrar mensaje y cambiar a otro cuerpo
- Si 3D no carga → botones tradicionales de navegación
- Si chat no encuentra → sugerir lugares conocidos

## 🎨 UI/UX Guidelines

### Layout
```
┌─────────────────────────────────────────┐
│  [3D] [Earth] [Moon] [Mars] [Tour] [?]  │ Header
├─────────┬───────────────────────────────┤
│         │                               │
│  Solar  │         Map Viewer            │
│   3D    │                               │
│         │                               │
├─────────┼───────────────────────────────┤
│  Chat   │  [Time] [Compare] [Annotate]  │ Controls
└─────────┴───────────────────────────────┘
```

### Estilos
- Dark theme por defecto (espacio)
- Controles flotantes semi-transparentes
- Transiciones suaves (300ms)
- Fuente: Inter/System UI

## 📊 Score y Confianza

**Score Total: 8/10**

### Breakdown
- Claridad de requisitos: 9/10
- Documentación disponible: 9/10
- Complejidad técnica: 7/10
- Tiempo disponible: 7/10
- Riesgo de blockers: 8/10

### Factores de Éxito
✅ APIs públicas bien documentadas
✅ Librerías maduras (Cesium, Three.js)
✅ Alcance bien definido
✅ Fallbacks identificados

### Riesgos Principales
⚠️ Performance con múltiples layers
⚠️ Sincronización 3D-2D
⚠️ Tiempo ajustado para todas las features

## 🚀 Comandos de Inicio Rápido

```bash
# Setup inicial
npm create vite@latest embiggen-your-eyes -- --template react-ts
cd embiggen-your-eyes
npm install cesium resium three @react-three/fiber @react-three/drei
npm install -D @types/three tailwindcss postcss autoprefixer

# Configurar Vite para Cesium
# vite.config.ts - agregar cesium plugin y copy assets

# Desarrollo
npm run dev

# Build
npm run build
```

---

**Última actualización**: 2025-10-04
**Autor**: AI Agent con research profundo
**Validación**: Ready para implementación one-pass