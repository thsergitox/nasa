import * as Cesium from 'cesium';

// Tipo para los cuerpos celestes
export type CelestialBody = 'earth' | 'moon' | 'mars';

// Configuración para cada proveedor WMTS
export const createEarthProvider = (date?: Date) => {
  // NASA GIBS para Tierra - MODIS True Color de alta resolución
  // Volviendo a MODIS que funciona bien y tiene buena resolución
  return new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
    layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: '250m',
    maximumLevel: 20, // Cesium intentará cargar hasta donde existan tiles
    credit: 'NASA GIBS'
  });
};

export const createMoonProvider = () => {
  // NASA Trek para Luna - LRO WAC con máxima resolución disponible
  // 303ppd = 303 píxeles por grado = ~100 metros/píxel
  return new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
    layer: 'LRO_WAC_Mosaic_Global_303ppd_v02',
    style: 'default',
    format: 'image/png',
    tileMatrixSetID: 'default028mm',
    tilingScheme: new Cesium.GeographicTilingScheme(),
    maximumLevel: 20, // Máximo zoom - Cesium cargará hasta donde haya datos
    credit: 'NASA Trek - LRO WAC'
  });
};

export const createMarsProvider = () => {
  // NASA Trek para Marte - Viking MDIM21 Color Mosaic
  // 232 metros/píxel de resolución base
  return new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg',
    layer: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'default028mm',
    tilingScheme: new Cesium.GeographicTilingScheme(),
    maximumLevel: 20, // Máximo zoom absoluto
    credit: 'NASA Trek - Viking MDIM21'
  });
};

// Providers alternativos de alta resolución para áreas específicas
export const createHighResMoonProvider = () => {
  // Intentar usar Kaguya TC Mosaic - Mayor resolución que WAC
  return new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/Kaguya_TC_Ortho_Global_4096ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
    layer: 'Kaguya_TC_Ortho_Global_4096ppd',
    style: 'default',
    format: 'image/png',
    tileMatrixSetID: 'default028mm',
    tilingScheme: new Cesium.GeographicTilingScheme(),
    maximumLevel: 20, // Zoom extremo
    credit: 'NASA Trek - Kaguya TC'
  });
};

export const createHighResMarsProvider = () => {
  // Mars Odyssey THEMIS Day IR - Mejor resolución en infrarrojo
  return new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_THEMIS_IR_Day_100m_v14/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
    layer: 'Mars_THEMIS_IR_Day_100m',
    style: 'default',
    format: 'image/png',
    tileMatrixSetID: 'default028mm',
    tilingScheme: new Cesium.GeographicTilingScheme(),
    maximumLevel: 20, // Zoom extremo
    credit: 'NASA Trek - THEMIS IR'
  });
};

// Función helper para obtener el provider según el cuerpo celeste
export const getProviderForBody = (body: CelestialBody, date?: Date) => {
  switch (body) {
    case 'earth':
      return createEarthProvider(date);
    case 'moon':
      return createMoonProvider();
    case 'mars':
      return createMarsProvider();
    default:
      return createEarthProvider();
  }
};