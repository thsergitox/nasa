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
    <div className="map-viewer-container">
      {/* Search Panel */}
      <div className="search-panel">
        <div className="search-header">
          <h3>Search Locations</h3>
          <div className="search-stats">
            {gazetteerData.length.toLocaleString()} locations
          </div>
        </div>
        
        <div className="search-input-group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search places on ${currentBody === 'earth' ? 'Earth' : currentBody === 'moon' ? 'Moon' : 'Mars'}...`}
            className="search-input"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedFeature(null);
            }}
            className="search-clear-btn"
            title="Clear search"
          >
            ✕
          </button>
        </div>

        {/* Search Results */}
        {showSearch && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((feature, index) => (
              <button
                key={index}
                onClick={() => flyToLocation(feature)}
                className="search-result-item"
              >
                <div className="result-name">{feature.properties.name}</div>
                <div className="result-coords">
                  {feature.properties.lat.toFixed(4)}°, {convertLonTo180(feature.geometry.coordinates[0]).toFixed(4)}°
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Feature Info */}
        {selectedFeature && (
          <div className="feature-info">
            <div className="feature-header">
              <h4>{selectedFeature.properties.name}</h4>
              <button 
                onClick={() => setSelectedFeature(null)}
                className="feature-close-btn"
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="feature-details">
              <div className="detail-item">
                <span className="detail-label">Latitude</span>
                <span className="detail-value">{selectedFeature.properties.lat.toFixed(4)}°</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Longitude</span>
                <span className="detail-value">{convertLonTo180(selectedFeature.geometry.coordinates[0]).toFixed(4)}°</span>
              </div>
              {selectedFeature.properties.feature_type && (
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{selectedFeature.properties.feature_type}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Display Controls */}
        <div className="display-controls">
          <label className="control-label">
            <input
              type="checkbox"
              checked={showAllPoints}
              onChange={(e) => setShowAllPoints(e.target.checked)}
              className="control-checkbox"
            />
            <span className="control-text">
              Show locations ({visiblePoints.length.toLocaleString()} of {gazetteerData.length.toLocaleString()})
            </span>
          </label>
          {hoveredFeature && !selectedFeature && (
            <div className="hover-info">
              <span className="hover-label">Hovering:</span>
              <span className="hover-name">{hoveredFeature.properties.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cesium Viewer */}
      <div className="cesium-container">
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
    </div>
  );
};

export default MapViewer;