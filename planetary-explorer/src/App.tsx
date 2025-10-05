import React, { useState, useEffect } from 'react';
import MapViewer from './components/MapViewer';
import { type CelestialBody } from './services/wmts.service';
import { 
  type GazetteerFeature, 
  loadGazetteerData, 
  convertLonTo180,
  searchFeaturesByName 
} from './services/gazetteer.service';
import './App.css';

// Interface para características geológicas
interface GeologicalFeature {
  name: string;
  icon: string;
  type: string;
  description: string;
  coordinates: string;
  detailedDescription: string;
  data: Array<{ label: string; value: string }>;
}

const App: React.FC = () => {
  const [currentBody] = useState<CelestialBody>('moon');
  const [is3DMode, setIs3DMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'feature-detail' | 'moon-data'>('main');
  const [selectedFeature, setSelectedFeature] = useState<GeologicalFeature | null>(null);
  
  // Estados para filtros da página Moon Data
  const [gazetteerData, setGazetteerData] = useState<GazetteerFeature[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [categoryResults, setCategoryResults] = useState<GazetteerFeature[]>([]);
  const [selectedGazetteerFeature, setSelectedGazetteerFeature] = useState<GazetteerFeature | null>(null);

  // Função para voltar à página principal
  const navigateBack = () => {
    setCurrentPage('main');
    setSelectedFeature(null);
  };

  // Carregar dados do gazetteer quando a página Moon Data for acessada
  useEffect(() => {
    if (currentPage === 'moon-data') {
      console.log('Loading gazetteer data for:', currentBody);
      loadGazetteerData(currentBody).then(data => {
        console.log('Gazetteer data loaded:', data.features.length, 'features');
        console.log('First few features:', data.features.slice(0, 3).map(f => f.properties.name));
        setGazetteerData(data.features);
      }).catch(error => {
        console.error('Error loading gazetteer data:', error);
      });
    }
  }, [currentPage, currentBody]);

  // Aplicar filtros quando os dados forem carregados
  useEffect(() => {
    if (gazetteerData.length > 0 && selectedFilters.length > 0) {
      console.log('Re-applying filters after data load');
      applySmartFilters(selectedFilters);
    }
  }, [gazetteerData]);

  // Função para aplicar filtros inteligentes
  const applySmartFilters = (filters: string[]) => {
    console.log('applySmartFilters called with:', filters);
    console.log('Current gazetteerData length:', gazetteerData.length);
    
    if (filters.length === 0) {
      setCategoryResults([]);
      return;
    }

    if (gazetteerData.length === 0) {
      console.log('No gazetteer data available yet');
      return;
    }

    const filteredFeatures = gazetteerData.filter(feature => {
      const featureName = feature.properties.name?.toLowerCase() || '';
      const featureType = feature.properties.feature_type?.toLowerCase() || '';
      
      // Se múltiplos filtros estão selecionados, usar OR logic
      return filters.some(filterKey => {
        let matches = false;
        switch (filterKey) {
          case 'craters':
            // Lógica mais robusta para crateras
            const isCrater = featureName.includes('crater') || featureType.includes('crater') || 
                            featureName.includes('impact') || featureType.includes('impact');
            
            // Para Lua: Descartes e Fra Mauro são crateras conhecidas
            const isLunarCrater = currentBody === 'moon' && 
                                 (featureName.includes('descartes') || featureName.includes('fra mauro'));
            
            matches = isCrater || isLunarCrater;
            break;
          case 'maria':
            matches = featureName.includes('mare') || featureType.includes('mare') ||
                     featureName.includes('sea') || featureType.includes('sea');
            break;
          case 'rilles':
            matches = featureName.includes('rille') || featureType.includes('rille') ||
                     featureName.includes('rima') || featureType.includes('rima');
            break;
          default:
            matches = false;
        }
        
        return matches;
      });
    });
    
    console.log('Filtered features:', filteredFeatures.length);
    if (filteredFeatures.length > 0) {
      console.log('First features found:', filteredFeatures.slice(0, 3).map(f => f.properties.name));
    }
    
    setCategoryResults(filteredFeatures);
  };

  // Função para obter opções de filtro
  const getFilteredDataOptions = () => {
    return [
      { key: 'craters', label: 'Craters', description: 'Impact craters', icon: '🌙' },
      { key: 'maria', label: 'Lunar Maria', description: 'Basaltic lava plains', icon: '🌊' },
      { key: 'rilles', label: 'Rilles & Valleys', description: 'Lunar rilles and valleys', icon: '🌊' }
    ];
  };

  // Função para lidar com clique em uma feature específica
  const handleFeatureClick = (feature: GazetteerFeature) => {
    console.log('Feature clicked:', feature.properties.name);
    setSelectedGazetteerFeature(feature);
    // Chamar a função para voar para a feature no mapa
    if ((window as any).flyToFeature) {
      (window as any).flyToFeature(feature);
    }
  };

  // Função para fechar o painel de informações
  const closeFeatureInfo = () => {
    setSelectedGazetteerFeature(null);
  };

  // Função para obter informações detalhadas de uma feature
  const getFeatureDetails = (featureName: string, body: CelestialBody): any => {
    const featureDetails: { [key: string]: any } = {
      'earth': {
        'Mount Everest': {
          description: 'Highest peak on Earth',
          detailedDescription: 'Highest peak on Earth, located in the Himalayas. Its formation is the result of the collision between the Indian and Eurasian tectonic plates millions of years ago.',
          data: [
            { label: 'Altitude', value: '8,848 m' },
            { label: 'Age', value: '60 million years' },
            { label: 'First Ascent', value: 'May 29, 1953' }
          ]
        },
        'Mount Kilimanjaro': {
          description: 'Highest volcano in Africa',
          detailedDescription: 'Dormant volcano in Tanzania, formed by three volcanic cones. Its glacier is disappearing due to climate change.',
          data: [
            { label: 'Altitude', value: '5,895 m' },
            { label: 'Last Eruption', value: '150,000 years ago' },
            { label: 'Type', value: 'Stratovolcano' }
          ]
        },
        'Grand Canyon': {
          description: 'Famous steep-sided canyon',
          detailedDescription: 'Canyon carved by the Colorado River over millions of years, revealing ancient geological layers.',
          data: [
            { label: 'Depth', value: '1,857 m' },
            { label: 'Length', value: '446 km' },
            { label: 'Age', value: '6 million years' }
          ]
        }
      },
      'moon': {
        'Tycho Crater': {
          description: 'Prominent lunar impact crater',
          detailedDescription: 'Impact crater formed millions of years ago. Its circular structure and elevated edges are typical characteristics of the oldest lunar craters.',
          data: [
            { label: 'Diameter', value: '93 km' },
            { label: 'Depth', value: '3.6 km' },
            { label: 'Age', value: '3.85 billion years' }
          ]
        },
        'Copernicus Crater': {
          description: 'Large lunar impact crater',
          detailedDescription: 'One of the youngest and best-preserved craters on the Moon, with a bright ray system extending hundreds of kilometers.',
          data: [
            { label: 'Diameter', value: '96 km' },
            { label: 'Depth', value: '3.8 km' },
            { label: 'Age', value: '800 million years' }
          ]
        },
        'Mare Tranquillitatis': {
          description: 'Sea of Tranquility',
          detailedDescription: 'Lunar sea where Apollo 11 landed in 1969. Formed by basaltic lava that filled a giant impact basin.',
          data: [
            { label: 'Diameter', value: '873 km' },
            { label: 'Depth', value: '1.8 km' },
            { label: 'Age', value: '3.8 billion years' }
          ]
        }
      },
      'mars': {
        'Olympus Mons': {
          description: 'Largest volcano in the solar system',
          detailedDescription: 'The largest known volcano in the solar system, three times taller than Mount Everest. Its base extends hundreds of kilometers.',
          data: [
            { label: 'Altitude', value: '21.9 km' },
            { label: 'Base Diameter', value: '624 km' },
            { label: 'Last Activity', value: '25 million years' }
          ]
        },
        'Gale Crater': {
          description: 'Impact crater explored by Curiosity',
          detailedDescription: 'Impact crater explored by the Curiosity rover since 2012. Contains evidence of an ancient aquatic environment.',
          data: [
            { label: 'Diameter', value: '154 km' },
            { label: 'Depth', value: '3.7 km' },
            { label: 'Age', value: '3.8 billion years' }
          ]
        },
        'Valles Marineris': {
          description: 'Largest canyon system on Mars',
          detailedDescription: 'Giant canyon system extending thousands of kilometers, much larger than Earth\'s Grand Canyon.',
          data: [
            { label: 'Length', value: '4,000 km' },
            { label: 'Depth', value: '7 km' },
            { label: 'Width', value: '200 km' }
          ]
        }
      }
    };

    return featureDetails[body]?.[featureName] || null;
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          
          {(currentPage === 'feature-detail' || currentPage === 'moon-data') && (
            <button
              className="action-button"
              onClick={navigateBack}
              title="Voltar"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              <span>Voltar</span>
            </button>
          )}
        </div>

        <div className="header-center">
          {currentPage === 'feature-detail' && selectedFeature && (
            <div className="feature-header-title">
              <span className="feature-icon">{selectedFeature.icon}</span>
              <span>{selectedFeature.name}</span>
            </div>
          )}
          {currentPage === 'moon-data' && (
            <div className="page-title">
              <span className="page-icon">📊</span>
              <span>Moon Data</span>
            </div>
          )}
        </div>

        <div className="header-right">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${is3DMode ? 'active' : ''}`}
              onClick={() => setIs3DMode(true)}
            >
              3D
            </button>
            <button 
              className={`toggle-btn ${is3DMode ? '' : 'active'}`}
              onClick={() => setIs3DMode(false)}
            >
              2D
            </button>
          </div>
          
          {(currentPage === 'feature-detail' || currentPage === 'moon-data') && (
            <button
              className="action-button"
              onClick={() => setCurrentPage('main')}
              title="Menu"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
              <span>Menu</span>
            </button>
          )}
            <button
              className={`action-button ${showHelp ? 'active' : ''}`}
              onClick={() => setShowHelp(!showHelp)}
              title="Help & Info"
            >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            <span>Help</span>
            </button>
        </div>
      </header>

      {/* Moon Data Page */}
      {currentPage === 'moon-data' && (
        <div className="moon-data-page">
          <div className="moon-data-content">
            <div className="moon-data-left">
              {/* Cesium Viewer - mesma Lua da home */}
              <div className="cesium-container">
                <MapViewer 
                  currentBody={currentBody} 
                  is3DMode={is3DMode}
                  currentPage={currentPage}
                  selectedFeature={selectedFeature}
                  onNavigateToMoonData={() => setCurrentPage('moon-data')}
                  onNavigateToMain={() => setCurrentPage('main')}
                />
              </div>

              {/* Painel de informações da feature selecionada - só aparece no Moon Data */}
              {selectedGazetteerFeature && currentPage === 'moon-data' && (
                <div className="feature-info-panel-left">
                  <div className="feature-info-header">
                    <div className="feature-info-title">
                      <span className="feature-info-icon">📍</span>
                      <span className="feature-info-name">{selectedGazetteerFeature.properties.name}</span>
                    </div>
                    <button 
                      className="feature-info-close"
                      onClick={closeFeatureInfo}
                      title="Close"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="feature-info-subtitle">
                    Gazetteer location on moon
                  </div>
                  
                  <div className="feature-info-content">
                    {(() => {
                      const featureName = selectedGazetteerFeature.properties.name;
                      const featureDetails = getFeatureDetails(featureName, currentBody);
                      
                      if (featureDetails) {
                        return (
                          <>
                            <div className="feature-description">
                              <p><strong>{featureDetails.description}</strong></p>
                              <p>{featureDetails.detailedDescription}</p>
                            </div>
                            
                            <div className="feature-data">
                              {featureDetails.data.map((item: any, index: number) => (
                                <div key={index} className="data-item">
                                  <span className="data-label">{item.label}:</span>
                                  <span className="data-value">{item.value}</span>
                                </div>
                              ))}
                              
                              <div className="data-item">
                                <span className="data-label">Latitude:</span>
                                <span className="data-value">{selectedGazetteerFeature.properties.lat.toFixed(4)}°</span>
                              </div>
                              <div className="data-item">
                                <span className="data-label">Longitude:</span>
                                <span className="data-value">
                                  {selectedGazetteerFeature.properties.lon_east_0_360 
                                    ? selectedGazetteerFeature.properties.lon_east_0_360.toFixed(4) + '°'
                                    : selectedGazetteerFeature.properties.lon_westneg_180 
                                    ? selectedGazetteerFeature.properties.lon_westneg_180.toFixed(4) + '°'
                                    : 'N/A'
                                  }
                                </span>
                              </div>
                              {selectedGazetteerFeature.properties.feature_type && (
                                <div className="data-item">
                                  <span className="data-label">Type:</span>
                                  <span className="data-value">{selectedGazetteerFeature.properties.feature_type}</span>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <div className="feature-description">
                              <p>Gazetteer location on {currentBody}</p>
                            </div>
                            
                            <div className="feature-data">
                              <div className="data-item">
                                <span className="data-label">Latitude:</span>
                                <span className="data-value">{selectedGazetteerFeature.properties.lat.toFixed(4)}°</span>
                              </div>
                              <div className="data-item">
                                <span className="data-label">Longitude:</span>
                                <span className="data-value">
                                  {selectedGazetteerFeature.properties.lon_east_0_360 
                                    ? selectedGazetteerFeature.properties.lon_east_0_360.toFixed(4) + '°'
                                    : selectedGazetteerFeature.properties.lon_westneg_180 
                                    ? selectedGazetteerFeature.properties.lon_westneg_180.toFixed(4) + '°'
                                    : 'N/A'
                                  }
                                </span>
                              </div>
                              {selectedGazetteerFeature.properties.feature_type && (
                                <div className="data-item">
                                  <span className="data-label">Type:</span>
                                  <span className="data-value">{selectedGazetteerFeature.properties.feature_type}</span>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
            
            <div className="moon-data-right">
              <div className="moon-data-menu">
                <h2 className="moon-data-title">Lunar Data</h2>
                
                {/* Smart Filters */}
                <div className="filters-section">
                  <div className="filters-title">Select Features</div>
                  
                  {gazetteerData.length === 0 ? (
                    <div className="loading-indicator">
                      <span>Loading lunar data...</span>
                    </div>
                  ) : (
                    <>
                      <div className="filters-chips">
                        {getFilteredDataOptions().map((option, index) => (
                          <button
                            key={index} 
                            className={`filter-chip ${selectedFilters.includes(option.key) ? 'active' : ''}`}
                            onClick={() => {
                              const newFilters = selectedFilters.includes(option.key)
                                ? selectedFilters.filter(f => f !== option.key)
                                : [...selectedFilters, option.key];
                              setSelectedFilters(newFilters);
                              applySmartFilters(newFilters);
                            }}
                          >
                            <span className="filter-chip-icon">{option.icon}</span>
                            <span className="filter-chip-text">{option.label}</span>
                          </button>
                        ))}
                      </div>

                      {selectedFilters.length > 0 && (
                        <div className="filters-actions">
                          <button
                            className="filter-action-btn"
                            onClick={() => {
                              setSelectedFilters([]);
                              setCategoryResults([]);
                            }}
                          >
                            Clear Filters
                          </button>
                          <span className="filter-count">
                            {categoryResults.length} result{categoryResults.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Lista de resultados quando filtros estão ativos */}
                {selectedFilters.length > 0 && (
                  <div className="filtered-results">
                    <div className="results-title">Results Found</div>
                    {categoryResults.slice(0, 10).map((feature, index) => (
                      <button
                        key={index} 
                        className="moon-data-option"
                        onClick={() => handleFeatureClick(feature)}
                      >
                        <span className="option-text">{feature.properties.name}</span>
                        <span className="option-arrow">›</span>
                      </button>
                    ))}
                    
                    {categoryResults.length > 10 && (
                      <div className="results-more">
                        +{categoryResults.length - 10} more results
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Solar 3D Panel - Only show on main page */}
        {currentPage === 'main' && (
          <aside className="solar-panel">
            <div className="panel-header">
              <div className="panel-title-section">
                <h3 className="panel-main-title">Explorador Planetario</h3>
                <span className="panel-subtitle">NASA WMTS</span>
              </div>
            </div>
            
            <div className="celestial-body-display">
              <div className="body-icon-container">
                <div className="body-icon">
                  {currentBody === 'moon' && <span className="moon-icon">🌙</span>}
                  {currentBody === 'earth' && <span className="earth-icon">🌍</span>}
                  {currentBody === 'mars' && <span className="mars-icon">🔴</span>}
                </div>
                <div className="body-glow"></div>
              </div>
            </div>
            
            <div className="planet-info">
              <h4 className="planet-name">{currentBody.charAt(0).toUpperCase() + currentBody.slice(1)}</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Distance from Sun</span>
                  <span className="value">149.6M km</span>
                </div>
                <div className="info-item">
                  <span className="label">Diameter</span>
                  <span className="value">3,474 km</span>
                </div>
                <div className="info-item">
                  <span className="label">Gravity</span>
                  <span className="value">1.62 m/s²</span>
                </div>
                <div className="info-item">
                  <span className="label">Orbital Period</span>
                  <span className="value">27.3 days</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Map Viewer */}
        <main className="map-container">
          <MapViewer 
            currentBody={currentBody} 
            is3DMode={is3DMode}
            currentPage={currentPage}
            selectedFeature={selectedFeature}
            onNavigateToMoonData={() => setCurrentPage('moon-data')}
            onNavigateToMain={() => setCurrentPage('main')}
          />
        </main>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Planetary Explorer Help</h2>
              <button className="close-btn" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>Navigation</h3>
              <ul>
                <li><strong>Mouse:</strong> Pan, zoom, and rotate the view</li>
                <li><strong>Scroll:</strong> Zoom in/out</li>
                <li><strong>Right-click + drag:</strong> Rotate view</li>
              </ul>
              <h3>Features</h3>
              <ul>
                <li><strong>Search:</strong> Find locations by name</li>
                <li><strong>Moon Exploration:</strong> Explore lunar features and locations</li>
                <li><strong>3D Mode:</strong> Toggle between 2D and 3D views</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
