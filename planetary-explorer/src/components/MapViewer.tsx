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
  is3DMode: boolean;
}

const MapViewer: React.FC<MapViewerProps> = ({ currentBody, is3DMode }) => {
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

  const getFeatureLongitude = (feature: GazetteerFeature): number | undefined => {
    const lonFromGeometry = feature.geometry?.coordinates?.[0];
    if (typeof lonFromGeometry === 'number' && Number.isFinite(lonFromGeometry)) {
      return lonFromGeometry;
    }

    const lonWest = feature.properties?.lon_westneg_180;
    if (typeof lonWest === 'number' && Number.isFinite(lonWest)) {
      return lonWest;
    }

    const lonEast = feature.properties?.lon_east_0_360;
    if (typeof lonEast === 'number' && Number.isFinite(lonEast)) {
      return lonEast;
    }

    return undefined;
  };

  const getFeatureLatitude = (feature: GazetteerFeature): number | undefined => {
    const latProp = feature.properties?.lat;
    if (typeof latProp === 'number' && Number.isFinite(latProp)) {
      return latProp;
    }

    const latFromGeometry = feature.geometry?.coordinates?.[1];
    if (typeof latFromGeometry === 'number' && Number.isFinite(latFromGeometry)) {
      return latFromGeometry;
    }

    return undefined;
  };

  const getFeaturePosition = (feature: GazetteerFeature) => {
    const lon = getFeatureLongitude(feature);
    const lat = getFeatureLatitude(feature);

    if (typeof lon !== 'number' || !Number.isFinite(lon) || typeof lat !== 'number' || !Number.isFinite(lat)) {
      return null;
    }

    return {
      lon,
      lat,
      lon180: convertLonTo180(lon)
    };
  };

  const isValidFeature = (feature: GazetteerFeature): boolean => {
    const lon = getFeatureLongitude(feature);
    const lat = getFeatureLatitude(feature);

    return typeof lat === 'number' && Number.isFinite(lat) && typeof lon === 'number' && Number.isFinite(lon);
  };

  // Cargar datos del gazetteer cuando cambia el cuerpo celeste
  useEffect(() => {
    loadGazetteerData(currentBody).then(data => {
      const validFeatures = data.features.filter(isValidFeature);

      setGazetteerData(validFeatures);
      // Limitar puntos visibles para no sobrecargar el renderizado
      // Para la Luna hay ~9000 puntos, mostramos solo una muestra
      const maxPoints = currentBody === 'earth' ? 500 : 1000;
      setVisiblePoints(validFeatures.slice(0, maxPoints));
      setSelectedFeature(null);
      setSearchTerm('');
      setSearchResults([]);
    });

    // Actualizar provider
    setProvider(getProviderForBody(currentBody));
  }, [currentBody]);

  // Cambiar modo 2D/3D cuando cambia is3DMode
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    if (is3DMode) {
      viewer.scene.mode = Cesium.SceneMode.SCENE3D;
      // Configuración para modo 3D
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.dynamicAtmosphereLighting = true;
    } else {
      viewer.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW;
      // Configuración optimizada para modo 2D
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.dynamicAtmosphereLighting = false;
      
      // Ajustar la cámara para vista 2D óptima
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // Vista global
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-90), // Vista desde arriba
          roll: 0.0
        }
      });
      
      // Configurar límites de zoom para modo 2D
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000000;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;
    }
  }, [is3DMode]);

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
    const position = getFeaturePosition(feature);
    if (!position) {
      return;
    }

    // Cerrar búsqueda
    setShowSearch(false);
    setSelectedFeature(feature);

    // Volar al punto
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(position.lon180, position.lat, 500000),
      duration: 2.0,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });
  };

  const selectedPosition = selectedFeature ? getFeaturePosition(selectedFeature) : null;
  const hoveredPosition = hoveredFeature ? getFeaturePosition(hoveredFeature) : null;

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
            {searchResults.map((feature, index) => {
              const lon = getFeatureLongitude(feature);
              const lat = getFeatureLatitude(feature);

              if (typeof lon !== 'number' || typeof lat !== 'number') {
                return null;
              }

              return (
                <button
                  key={index}
                  onClick={() => flyToLocation(feature)}
                  className="search-result-item"
                >
                  <div className="result-name">{feature.properties.name}</div>
                  <div className="result-coords">
                    {lat.toFixed(4)}°, {convertLonTo180(lon).toFixed(4)}°
                  </div>
                </button>
              );
            })}
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
                <span className="detail-value">
                  {selectedPosition ? `${selectedPosition.lat.toFixed(4)}°` : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Longitude</span>
                <span className="detail-value">
                  {selectedPosition ? `${selectedPosition.lon180.toFixed(4)}°` : 'N/A'}
                </span>
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
          sceneModePicker={false}
          baseLayerPicker={false}
          navigationHelpButton={false}
          animation={false}
          timeline={false}
          fullscreenButton={false}
          vrButton={false}
          shouldAnimate={false}
          requestRenderMode={true}
          maximumRenderTimeChange={Infinity}
        >
        <ImageryLayer imageryProvider={provider} />
        
        {/* Mostrar todos los puntos del gazetteer */}
        {showAllPoints && visiblePoints.map((feature, index) => {
          const position = getFeaturePosition(feature);
          if (!position) {
            return null;
          }

          const isSelected = selectedFeature?.properties.name === feature.properties.name;
          const isHovered = hoveredFeature?.properties.name === feature.properties.name;
          return (
            <Entity
              key={`${currentBody}-${index}`}
              position={Cesium.Cartesian3.fromDegrees(position.lon180, position.lat)}
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
        {(selectedPosition || hoveredPosition) && (() => {
          const labelFeature = selectedFeature ?? hoveredFeature;
          const labelPosition = selectedPosition ?? hoveredPosition;

          if (!labelFeature || !labelPosition) {
            return null;
          }

          return (
            <Entity
              position={Cesium.Cartesian3.fromDegrees(labelPosition.lon180, labelPosition.lat)}
              label={{
                text: labelFeature.properties.name,
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
          );
        })()}
        </Viewer>
      </div>
    </div>
  );
};

export default MapViewer;