import { type CelestialBody } from './wmts.service';

export interface GazetteerFeature {
  type: 'Feature';  
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    body: string;
    name: string;
    feature_type?: string | null;
    lat: number;
    lon_east_0_360?: number;
    lon_westneg_180?: number;
  };
}

export interface GazetteerCollection {
  type: 'FeatureCollection';
  features: GazetteerFeature[];
}

// Cache para los datos cargados
const dataCache: Map<CelestialBody, GazetteerCollection> = new Map();

// Función para cargar datos GeoJSON del gazetteer
export const loadGazetteerData = async (body: CelestialBody): Promise<GazetteerCollection> => {
  // Verificar cache primero
  if (dataCache.has(body)) {
    return dataCache.get(body)!;
  }

  let fileName: string;
  switch (body) {
    case 'earth':
      fileName = 'earth/gazetteer_earth.geojson';
      break;
    case 'moon':
      fileName = 'marsandmoon/gazetteer_moon.geojson';
      break;
    case 'mars':
      fileName = 'marsandmoon/gazetteer_mars.geojson';
      break;
    default:
      throw new Error(`Unknown celestial body: ${body}`);
  }

  try {
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load gazetteer data for ${body}`);
    }
    const data: GazetteerCollection = await response.json();
    
    // Guardar en cache
    dataCache.set(body, data);
    
    return data;
  } catch (error) {
    console.error(`Error loading gazetteer data for ${body}:`, error);
    // Retornar colección vacía en caso de error
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

// Función para buscar features por nombre
export const searchFeaturesByName = (
  features: GazetteerFeature[],
  searchTerm: string,
  limit: number = 20
): GazetteerFeature[] => {
  const term = searchTerm.toLowerCase();
  return features
    .filter(feature => 
      feature.properties.name.toLowerCase().includes(term)
    )
    .slice(0, limit);
};

// Función helper para convertir coordenadas este 0-360 a -180/180
export const convertLonTo180 = (lonE: number): number => {
  return lonE > 180 ? lonE - 360 : lonE;
};