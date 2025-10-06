import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';

interface ApolloSite {
  mission: number;
  name: string;
  lat: number;
  lon: number;
  description: string;
  astronauts: string;
  landingDate: string;
  duration: string;
  samples: string;
}

// Apollo landing sites data with enhanced information
export const apolloSites: Record<number, ApolloSite> = {
  11: {
    mission: 11,
    name: "Mare Tranquillitatis",
    lat: 0.67416,
    lon: 23.47314,
    description: "First human landing on the Moon",
    astronauts: "Neil Armstrong, Buzz Aldrin, Michael Collins",
    landingDate: "July 20, 1969",
    duration: "21h 36m on surface",
    samples: "21.5 kg of lunar samples"
  },
  12: {
    mission: 12,
    name: "Oceanus Procellarum", 
    lat: -3.01239,
    lon: -23.42157,
    description: "Precision landing demonstration",
    astronauts: "Pete Conrad, Alan Bean, Richard Gordon",
    landingDate: "November 19, 1969",
    duration: "31h 31m on surface",
    samples: "34.3 kg of lunar samples"
  },
  14: {
    mission: 14,
    name: "Fra Mauro",
    lat: -3.64530,
    lon: -17.47136,
    description: "Fra Mauro formation exploration",
    astronauts: "Alan Shepard, Edgar Mitchell, Stuart Roosa",
    landingDate: "February 5, 1971",
    duration: "33h 31m on surface",
    samples: "42.3 kg of lunar samples"
  },
  15: {
    mission: 15,
    name: "Hadley Rille",
    lat: 26.13222,
    lon: 3.63386,
    description: "First J mission with lunar rover",
    astronauts: "David Scott, James Irwin, Alfred Worden",
    landingDate: "July 30, 1971",
    duration: "66h 55m on surface",
    samples: "77.3 kg of lunar samples"
  },
  16: {
    mission: 16,
    name: "Descartes Highlands",
    lat: -8.99994,
    lon: 15.50019,
    description: "Lunar highlands exploration",
    astronauts: "John Young, Charles Duke, Ken Mattingly",
    landingDate: "April 21, 1972",
    duration: "71h 2m on surface",
    samples: "95.7 kg of lunar samples"
  },
  17: {
    mission: 17,
    name: "Taurus-Littrow",
    lat: 20.19080,
    lon: 30.77168,
    description: "Last Apollo mission to the Moon",
    astronauts: "Eugene Cernan, Harrison Schmitt, Ronald Evans",
    landingDate: "December 11, 1972",
    duration: "75h on surface",
    samples: "110.5 kg of lunar samples"
  }
};

interface LROCDetailViewProps {
  apolloMission: number;
  onClose: () => void;
  isVisible: boolean;
}

const LROCDetailView: React.FC<LROCDetailViewProps> = ({ apolloMission, onClose, isVisible }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [showDetails, setShowDetails] = React.useState(true);

  useEffect(() => {
    if (!mapRef.current || !isVisible) return;

    const site = apolloSites[apolloMission];
    if (!site) return;

    // Clear previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }

    // Create OpenLayers map
    const map = new Map({
      target: mapRef.current,
      layers: [
        // WAC base layer
        new TileLayer({
          source: new TileWMS({
            urls: [
              'https://wms1.im-ldi.com/',
              'https://wms2.im-ldi.com/',
              'https://wms3.im-ldi.com/',
              'https://wms4.im-ldi.com/',
              'https://wms5.im-ldi.com/',
              'https://wms6.im-ldi.com/',
              'https://wms7.im-ldi.com/',
              'https://wms8.im-ldi.com/'
            ],
            params: {
              'LAYERS': 'luna_wac_global',
              'FORMAT': 'image/png',
              'TRANSPARENT': 'false',
              'SERVICE': 'WMS',
              'VERSION': '1.1.1',
              'REQUEST': 'GetMap',
              'STYLES': '',
              'SRS': 'EPSG:4326',
              'WIDTH': 512,
              'HEIGHT': 512
            },
            serverType: 'mapserver',
            crossOrigin: 'anonymous'
          }),
          opacity: 1
        }),
        // NAC high resolution layer for Apollo sites
        new TileLayer({
          source: new TileWMS({
            urls: [
              'https://wms1.im-ldi.com/',
              'https://wms2.im-ldi.com/',
              'https://wms3.im-ldi.com/',
              'https://wms4.im-ldi.com/',
              'https://wms5.im-ldi.com/',
              'https://wms6.im-ldi.com/',
              'https://wms7.im-ldi.com/',
              'https://wms8.im-ldi.com/'
            ],
            params: {
              'LAYERS': `luna_apollo_${apolloMission}_roi,luna_apollo_${apolloMission}_high_resolution_nac_mosaic`,
              'FORMAT': 'image/png',
              'TRANSPARENT': 'true',
              'SERVICE': 'WMS',
              'VERSION': '1.1.1',
              'REQUEST': 'GetMap',
              'STYLES': '',
              'SRS': 'EPSG:4326',
              'WIDTH': 512,
              'HEIGHT': 512
            },
            serverType: 'mapserver',
            crossOrigin: 'anonymous'
          }),
          opacity: 1
        })
      ],
      view: new View({
        center: fromLonLat([site.lon, site.lat]),
        zoom: 14,
        maxZoom: 20,
        minZoom: 8
      })
    });

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [apolloMission, isVisible]);

  const site = apolloSites[apolloMission];
  if (!site) return null;

  // Add loading state for smooth transition and reset details panel
  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      // Force map to update size after animation completes
      setTimeout(() => {
        mapInstanceRef.current?.updateSize();
      }, 600);
    }
    // Reset details panel visibility when mission changes
    setShowDetails(true);
  }, [isVisible, apolloMission]);

  return (
    <div className={`lroc-detail-view ${isVisible ? 'visible' : ''}`}>
      {/* Header */}
      <div className="lroc-header">
        <div className="lroc-header-content">
          <div className="lroc-mission-badge">
            <span className="mission-number">Apollo {apolloMission}</span>
            <span className="mission-icon">🚀</span>
          </div>
          <div className="lroc-mission-info">
            <h2 className="lroc-title">{site.name}</h2>
            <p className="lroc-subtitle">{site.description}</p>
            <div className="lroc-coordinates">
              <span className="coord-badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {site.lat.toFixed(4)}°, {site.lon.toFixed(4)}°
              </span>
              <span className="resolution-badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M21 16.5c0 .38-.21.71-.53.88l-7 4c-.29.17-.65.17-.94 0l-7-4A.996.996 0 0 1 5 16.5V7.5c0-.38.21-.71.53-.88l7-4c.29-.17.65-.17.94 0l7 4c.32.17.53.5.53.88v9z"/>
                </svg>
                LROC NAC: 0.5-2 m/pixel
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lroc-close-button"
            title="Return to Cesium View"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span>Return</span>
          </button>
        </div>
      </div>
      
      {/* OpenLayers Map */}
      <div ref={mapRef} className="lroc-map" />
      
      {/* Mission Details Panel */}
      <div className={`lroc-details-panel ${showDetails ? 'visible' : 'hidden'}`}>
        <button
          className="details-close-button"
          onClick={() => setShowDetails(false)}
          title="Hide Mission Details"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <div className="lroc-details-content">
          <div className="detail-section">
            <h4>Mission Details</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Crew</span>
                <span className="detail-value">{site.astronauts}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Landing Date</span>
                <span className="detail-value">{site.landingDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Surface Time</span>
                <span className="detail-value">{site.duration}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Samples Collected</span>
                <span className="detail-value">{site.samples}</span>
              </div>
            </div>
          </div>
          <div className="lroc-controls">
            <p className="control-hint">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Use mouse wheel to zoom • Click and drag to pan • 8 parallel WMS servers for optimal performance
            </p>
          </div>
        </div>
      </div>
      
      {/* Button to show details when hidden */}
      {!showDetails && (
        <button
          className="details-show-button"
          onClick={() => setShowDetails(true)}
          title="Show Mission Details"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default LROCDetailView;