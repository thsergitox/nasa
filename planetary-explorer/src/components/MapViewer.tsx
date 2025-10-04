import React, { useEffect, useRef, useState } from 'react';
import { Viewer, Entity, ImageryLayer } from 'resium';
import * as Cesium from 'cesium';
import { type CelestialBody, getProviderForBody } from '../services/wmts.service';
import { 
  type GazetteerFeature, 
  loadGazetteerData, 
  convertLonTo180,
  searchFeaturesByName 
} from '../services/gazetteer.service';

interface MapViewerProps {
  currentBody: CelestialBody;
}

const MapViewer: React.FC<MapViewerProps> = ({ currentBody }) => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [provider, setProvider] = useState(() => getProviderForBody(currentBody));
  const [gazetteerData, setGazetteerData] = useState<GazetteerFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<GazetteerFeature | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GazetteerFeature[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showAllPoints, setShowAllPoints] = useState(true);
  const [visiblePoints, setVisiblePoints] = useState<GazetteerFeature[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<GazetteerFeature | null>(null);

  // Cargar datos del gazetteer cuando cambia el cuerpo celeste
  useEffect(() => {
    loadGazetteerData(currentBody).then(data => {
      setGazetteerData(data.features);
      // Limitar puntos visibles para no sobrecargar el renderizado
      // Para la Luna hay ~9000 puntos, mostramos solo una muestra
      const maxPoints = currentBody === 'earth' ? 500 : 1000;
      setVisiblePoints(data.features.slice(0, maxPoints));
      setSelectedFeature(null);
      setSearchTerm('');
      setSearchResults([]);
    });

    // Actualizar provider
    setProvider(getProviderForBody(currentBody));
  }, [currentBody]);

  // Buscar features cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.length > 2) {
      const results = searchFeaturesByName(gazetteerData, searchTerm, 30);
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [searchTerm, gazetteerData]);

  // Función para volar a un punto específico
  const flyToLocation = (feature: GazetteerFeature) => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const lon180 = convertLonTo180(feature.geometry.coordinates[0]);
    const lat = feature.properties.lat;

    // Cerrar búsqueda
    setShowSearch(false);
    setSelectedFeature(feature);

    // Volar al punto
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon180, lat, 500000),
      duration: 2.0,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Barra de búsqueda */}
      <div className="absolute top-4 left-4 z-10 w-96">
        <div className="bg-gray-900/90 backdrop-blur rounded-lg p-4 shadow-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar lugares en ${currentBody === 'earth' ? 'la Tierra' : currentBody === 'moon' ? 'la Luna' : 'Marte'}...`}
              className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFeature(null);
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700"
            >
              Limpiar
            </button>
          </div>

          {/* Resultados de búsqueda */}
          {showSearch && searchResults.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto bg-gray-800 rounded border border-gray-700">
              {searchResults.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => flyToLocation(feature)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white border-b border-gray-700 last:border-b-0"
                >
                  <div className="font-medium">{feature.properties.name}</div>
                  <div className="text-xs text-gray-400">
                    Lat: {feature.properties.lat.toFixed(4)}°, 
                    Lon: {convertLonTo180(feature.geometry.coordinates[0]).toFixed(4)}°
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Feature seleccionado */}
          {selectedFeature && (
            <div className="mt-4 p-3 bg-blue-900/50 rounded border border-blue-700">
              <div className="text-white">
                <div className="font-bold text-lg">{selectedFeature.properties.name}</div>
                <div className="text-sm">
                  <div>Lat: {selectedFeature.properties.lat.toFixed(4)}°</div>
                  <div>Lon: {convertLonTo180(selectedFeature.geometry.coordinates[0]).toFixed(4)}°</div>
                </div>
              </div>
            </div>
          )}

          {/* Control de visualización de puntos */}
          <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
            <label className="flex items-center text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showAllPoints}
                onChange={(e) => setShowAllPoints(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">
                Mostrar todos los puntos ({visiblePoints.length} de {gazetteerData.length})
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Mostrando primeros {visiblePoints.length} puntos para mejor rendimiento
            </p>
            {hoveredFeature && !selectedFeature && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="text-xs text-yellow-400">
                  Hover: {hoveredFeature.properties.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visor de Cesium */}
      <Viewer
        ref={e => { viewerRef.current = e?.cesiumElement || null; }}
        full
        scene3DOnly={false}
        homeButton={false}
        sceneModePicker={true}
        baseLayerPicker={false}
        navigationHelpButton={false}
        animation={false}
        timeline={false}
        fullscreenButton={false}
        vrButton={false}
      >
        <ImageryLayer imageryProvider={provider} />
        
        {/* Mostrar todos los puntos del gazetteer */}
        {showAllPoints && visiblePoints.map((feature, index) => {
          const isSelected = selectedFeature?.properties.name === feature.properties.name;
          const isHovered = hoveredFeature?.properties.name === feature.properties.name;
          return (
            <Entity
              key={`${currentBody}-${index}`}
              position={Cesium.Cartesian3.fromDegrees(
                convertLonTo180(feature.geometry.coordinates[0]),
                feature.properties.lat
              )}
              point={{
                pixelSize: isSelected ? 15 : isHovered ? 12 : 5,
                color: isSelected || isHovered ? Cesium.Color.RED : Cesium.Color.YELLOW.withAlpha(0.7),
                outlineColor: isSelected || isHovered ? Cesium.Color.WHITE : Cesium.Color.ORANGE.withAlpha(0.5),
                outlineWidth: isSelected || isHovered ? 3 : 1,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
              }}
              onMouseEnter={() => setHoveredFeature(feature)}
              onMouseLeave={() => setHoveredFeature(null)}
              onClick={() => {
                setSelectedFeature(feature);
                flyToLocation(feature);
              }}
            />
          );
        })}
        
        {/* Etiqueta para el punto seleccionado o hover */}
        {(selectedFeature || hoveredFeature) && (
          <Entity
            position={Cesium.Cartesian3.fromDegrees(
              convertLonTo180((selectedFeature || hoveredFeature)!.geometry.coordinates[0]),
              (selectedFeature || hoveredFeature)!.properties.lat
            )}
            label={{
              text: (selectedFeature || hoveredFeature)!.properties.name,
              font: selectedFeature ? '14pt sans-serif' : '12pt sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              fillColor: selectedFeature ? Cesium.Color.WHITE : Cesium.Color.YELLOW,
              outlineColor: selectedFeature ? Cesium.Color.BLACK : Cesium.Color.RED.withAlpha(0.8),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }}
          />
        )}
      </Viewer>
    </div>
  );
};

export default MapViewer;