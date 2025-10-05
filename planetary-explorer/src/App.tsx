import React, { useState, useEffect } from 'react';
import MapViewer from './components/MapViewer';
import { type CelestialBody } from './services/wmts.service';
import { 
  type GazetteerFeature, 
  loadGazetteerData
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
  const [currentPage, setCurrentPage] = useState<'main' | 'feature-detail' | 'moon-data' | 'moon-tour' | 'moon-tour-map'>('main');
  const [selectedFeature, setSelectedFeature] = useState<GeologicalFeature | null>(null);
  
  // Estados para filtros da página Moon Data
  const [gazetteerData, setGazetteerData] = useState<GazetteerFeature[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [categoryResults, setCategoryResults] = useState<GazetteerFeature[]>([]);
  const [selectedGazetteerFeature, setSelectedGazetteerFeature] = useState<GazetteerFeature | null>(null);

  // Estados para Moon Tour
  const [apolloMissions, setApolloMissions] = useState<any[]>([]);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const [isTourPlaying, setIsTourPlaying] = useState<boolean>(false);
  const [selectedApolloMission, setSelectedApolloMission] = useState<any>(null);

  // Função para voltar à página principal
  const navigateBack = () => {
    setCurrentPage('main');
    setSelectedFeature(null);
    setSelectedApolloMission(null);
    setIsTourPlaying(false);
    setCurrentTourStep(0);
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

  // Carregar dados das missões Apollo quando a página Moon Tour for acessada
  useEffect(() => {
    if (currentPage === 'moon-tour') {
      console.log('Loading Apollo missions data');
      fetch('/data/info_tour.json')
        .then(response => response.json())
        .then(data => {
          console.log('Apollo missions data loaded:', data.length, 'missions');
          setApolloMissions(data);
        })
        .catch(error => {
          console.error('Error loading Apollo missions data:', error);
        });
    }
  }, [currentPage]);

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
        'Mare Tranquillitatis': {
          description: 'Sea of Tranquility',
          detailedDescription: 'Lunar sea where Apollo 11 landed in 1969. Formed by basaltic lava that filled a giant impact basin.',
          featureType: 'Mare, maria',
          approvalDate: '1935',
          ethnicity: 'Latin',
          origin: '"Sea of Tranquility."',
          reference: '[66] - Named Lunar Formations, by Mary A. Blagg and K. Müller: Percy Lund, Humphries and Co. Ltd., London, 1935.',
          url: 'https://planetarynames.wr.usgs.gov/Feature/3691',
          flag: 'On February 20, 1965, the Ranger 8 spacecraft was deliberately crashed into the Mare Tranquillitatis at 2.6377°N 24.7881°E after successfully transmitting 7,137 close-range photographs of the Moon in the final 23 minutes of its mission.',
          data: [
            { label: 'Diameter', value: '873 km' },
            { label: 'Depth', value: '1.8 km' },
            { label: 'Age', value: '3.8 billion years' }
          ]
        },
        'Rima Hadley': {
          description: 'Lunar rille near Apollo 15 landing site',
          detailedDescription: 'A sinuous channel about 80 km long formed by lava flows — a clear example of ancient volcanic activity on the Moon.',
          featureType: 'Rima, rimae',
          approvalDate: '1964',
          ethnicity: 'Great Britain',
          origin: 'Named from nearby Mountain (Mons Hadley).',
          reference: '[67] - The System of Lunar Craters, Quadrants I, II, III, IV: by D. W. G. Arthur and others: Communications of the Lunar and Planetary Laboratory, vol. 2, no. 30, 1963: vol. 3, no. 40, 1964: vol. 3, no. 50, 1965: vol. 5, no. 70, 1966.',
          url: 'https://planetarynames.wr.usgs.gov/Feature/5064',
          flag: 'Rima Hadley typically ranges in depth between 600 and 900 feet (180 and 270 m), but is approximately 1,200 feet (370 m) deep at the Apollo 15 landing site',
          data: [
            { label: 'Length', value: '80 km' },
            { label: 'Depth', value: '180-370 m' },
            { label: 'Type', value: 'Sinuous rille' }
          ]
        },
        'Descartes': {
          description: 'Lunar crater near Apollo 16 landing site',
          detailedDescription: 'About 50 kilometers to the north of this crater was the landing site of Apollo 16. The uneven region about the landing area is sometimes called the Descartes Highlands or the Descartes Mountains.',
          featureType: 'Crater, craters',
          approvalDate: '1935',
          ethnicity: 'France',
          origin: 'René; French mathematician, philosopher (1596-1650).',
          reference: '[68] - World Who\'s Who in Science, edited by Allen G. Debus: Western Publishing Company, Hannibal, Mo., 1968: New York, 1973.',
          url: 'https://planetarynames.wr.usgs.gov/Feature/1498',
          flag: 'About 50 kilometers to the north of this crater was the landing site of Apollo 16. The uneven region about the landing area is sometimes called the Descartes Highlands or the Descartes Mountains.',
          data: [
            { label: 'Diameter', value: '48 km' },
            { label: 'Depth', value: '1.5 km' },
            { label: 'Age', value: '3.2 billion years' }
          ]
        },
        'Fra Mauro': {
          description: 'Lunar crater near Apollo 14 landing site',
          detailedDescription: 'The area north of Fra Mauro crater was the intended landing site of the ill-fated Apollo 13 mission, which was aborted after an oxygen tank aboard the spacecraft exploded.',
          featureType: 'Crater, craters',
          approvalDate: '1935',
          ethnicity: 'Italian',
          origin: 'Italian geographer (unkn-1459).',
          reference: '[66] - Named Lunar Formations, by Mary A. Blagg and K. Müller: Percy Lund, Humphries and Co. Ltd., London, 1935.',
          url: 'https://planetarynames.wr.usgs.gov/Feature/2007',
          flag: 'The area north of Fra Mauro crater was the intended landing site of the ill-fated Apollo 13 mission, which was aborted after an oxygen tank aboard the spacecraft exploded.',
          data: [
            { label: 'Diameter', value: '95 km' },
            { label: 'Depth', value: '0.8 km' },
            { label: 'Age', value: '3.9 billion years' }
          ]
        },
        'Taurus-Littrow Valley': {
          description: 'Apollo 17 landing site valley',
          detailedDescription: 'It served as the landing site for the American Apollo 17 mission in December 1972, the last crewed mission to the Moon.',
          featureType: 'Astronaut-named features',
          approvalDate: '1973',
          ethnicity: 'American',
          origin: 'Astronaut-named feature, Apollo 17 site.',
          reference: '[59] - The New Encyclopaedia Britannica: Encyclopaedia Britannica Inc., Chicago, 1974, 1993.',
          url: 'https://planetarynames.wr.usgs.gov/Feature/5881',
          flag: 'It served as the landing site for the American Apollo 17 mission in December 1972, the last crewed mission to the Moon.',
          data: [
            { label: 'Length', value: '35 km' },
            { label: 'Width', value: '15 km' },
            { label: 'Mission', value: 'Apollo 17' }
          ]
        },
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
          
          {(currentPage === 'feature-detail' || currentPage === 'moon-data' || currentPage === 'moon-tour' || currentPage === 'moon-tour-map') && (
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
          {currentPage === 'moon-tour' && (
            <div className="page-title">
              <span className="page-icon">🚀</span>
              <span>Moon Tour</span>
            </div>
          )}
          {currentPage === 'moon-tour-map' && (
            <div className="page-title">
              <span className="page-icon">🌙</span>
              <span>Moon Tour</span>
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
          
          {(currentPage === 'feature-detail' || currentPage === 'moon-data' || currentPage === 'moon-tour' || currentPage === 'moon-tour-map') && (
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
                  selectedGazetteerFeature={selectedGazetteerFeature}
                  onNavigateToMoonData={() => setCurrentPage('moon-data')}
                  onNavigateToMain={() => setCurrentPage('main')}
                  onNavigateToMoonTour={() => setCurrentPage('moon-tour-map')}
                  onFeatureSelect={setSelectedGazetteerFeature}
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
                            
                            {/* Informações Geológicas */}
                            <div className="feature-data">
                              {featureDetails.data.map((item: any, index: number) => (
                                <div key={index} className="data-item">
                                  <span className="data-label">{item.label}:</span>
                                  <span className="data-value">{item.value}</span>
                                </div>
                              ))}
                            </div>

                            {/* Informações Oficiais do Gazetteer */}
                            {(featureDetails.featureType || featureDetails.approvalDate || featureDetails.ethnicity || featureDetails.origin) && (
                              <div className="feature-official-info">
                                <h4 className="official-info-title">Official Information</h4>
                                {featureDetails.featureType && (
                                  <div className="data-item">
                                    <span className="data-label">Feature Type:</span>
                                    <span className="data-value">{featureDetails.featureType}</span>
                                  </div>
                                )}
                                {featureDetails.approvalDate && (
                                  <div className="data-item">
                                    <span className="data-label">Approval Date:</span>
                                    <span className="data-value">{featureDetails.approvalDate}</span>
                                  </div>
                                )}
                                {featureDetails.ethnicity && (
                                  <div className="data-item">
                                    <span className="data-label">Ethnicity:</span>
                                    <span className="data-value">{featureDetails.ethnicity}</span>
                                  </div>
                                )}
                                {featureDetails.origin && (
                                  <div className="data-item">
                                    <span className="data-label">Origin:</span>
                                    <span className="data-value">{featureDetails.origin}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Referência e URL */}
                            {(featureDetails.reference || featureDetails.url) && (
                              <div className="feature-reference-info">
                                <h4 className="reference-info-title">Reference</h4>
                                {featureDetails.reference && (
                                  <div className="reference-item">
                                    <span className="reference-text">{featureDetails.reference}</span>
                                  </div>
                                )}
                                {featureDetails.url && (
                                  <div className="reference-url">
                                    <a href={featureDetails.url} target="_blank" rel="noopener noreferrer" className="reference-link">
                                      View on USGS Gazetteer →
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Informação Histórica/Flag */}
                            {featureDetails.flag && (
                              <div className="feature-flag-info">
                                <h4 className="flag-info-title">Historical Note</h4>
                                <div className="flag-content">
                                  <p>{featureDetails.flag}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Coordenadas */}
                            <div className="feature-coordinates">
                              <h4 className="coordinates-title">Coordinates</h4>
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
                                    : 'Data not available'
                                  }
                                </span>
                              </div>
                              {selectedGazetteerFeature.properties.feature_type && (
                                <div className="data-item">
                                  <span className="data-label">Gazetteer Type:</span>
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
                            
                            <div className="feature-coordinates">
                              <h4 className="coordinates-title">Coordinates</h4>
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
                                    : 'Data not available'
                                  }
                                </span>
                              </div>
                              {selectedGazetteerFeature.properties.feature_type && (
                                <div className="data-item">
                                  <span className="data-label">Gazetteer Type:</span>
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

      {/* Moon Tour Page */}
      {currentPage === 'moon-tour' && (
        <div className="moon-tour-page">
          <div className="moon-tour-content">
            <div className="moon-tour-left">
              {/* Cesium Viewer - mesma Lua da home */}
              <div className="cesium-container">
                <MapViewer 
                  currentBody={currentBody} 
                  is3DMode={is3DMode}
                  currentPage={currentPage}
                  selectedFeature={selectedFeature}
                  onNavigateToMoonData={() => setCurrentPage('moon-data')}
                  onNavigateToMain={() => setCurrentPage('main')}
                  onNavigateToMoonTour={() => setCurrentPage('moon-tour-map')}
                />
              </div>

              {/* Painel de informações da missão Apollo selecionada */}
              {selectedApolloMission && currentPage === 'moon-tour' && (
                <div className="apollo-info-panel-left">
                  <div className="apollo-info-header">
                    <div className="apollo-info-title">
                      <span className="apollo-info-icon">🚀</span>
                      <span className="apollo-info-name">{selectedApolloMission.title}</span>
                    </div>
                    <button 
                      className="apollo-info-close"
                      onClick={() => setSelectedApolloMission(null)}
                      title="Close"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="apollo-info-subtitle">
                    Apollo Mission Landing Site
                  </div>
                  
                  <div className="apollo-info-content">
                    <div className="apollo-description">
                      <h4>Historical Significance</h4>
                      <p>{selectedApolloMission.historical_significance}</p>
                    </div>
                    
                    <div className="apollo-description">
                      <h4>Scientific Value</h4>
                      <p>{selectedApolloMission.scientific_value}</p>
                    </div>
                    
                    {selectedApolloMission.reference_points && selectedApolloMission.reference_points.length > 0 && (
                      <div className="apollo-reference-points">
                        <h4>Reference Points</h4>
                        {selectedApolloMission.reference_points.map((point: any, index: number) => (
                          <div key={index} className="reference-point">
                            <div className="reference-point-name">{point.name}</div>
                            <div className="reference-point-description">{point.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedApolloMission.reference && (
                      <div className="apollo-reference">
                        <h4>Reference</h4>
                        <p>{selectedApolloMission.reference}</p>
                        {selectedApolloMission.link && (
                          <a href={selectedApolloMission.link} target="_blank" rel="noopener noreferrer" className="apollo-link">
                            Learn More →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="moon-tour-right">
              <div className="moon-tour-menu">
                <h2 className="moon-tour-title">Apollo Missions Tour</h2>
                
                {/* Tour Controls */}
                <div className="tour-controls">
                  <div className="tour-controls-header">
                    <span className="tour-controls-title">Mission Timeline</span>
                    <div className="tour-controls-buttons">
                      <button
                        className={`tour-control-btn ${isTourPlaying ? 'playing' : ''}`}
                        onClick={() => setIsTourPlaying(!isTourPlaying)}
                        disabled={apolloMissions.length === 0}
                      >
                        {isTourPlaying ? '⏸️' : '▶️'}
                        <span>{isTourPlaying ? 'Pause' : 'Play'}</span>
                      </button>
                      <button
                        className="tour-control-btn"
                        onClick={() => {
                          setCurrentTourStep(0);
                          setIsTourPlaying(false);
                        }}
                        disabled={apolloMissions.length === 0}
                      >
                        ⏹️
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                  
                  {apolloMissions.length > 0 && (
                    <div className="tour-progress">
                      <div className="tour-progress-bar">
                        <div 
                          className="tour-progress-fill"
                          style={{ width: `${(currentTourStep / apolloMissions.length) * 100}%` }}
                        ></div>
                      </div>
                      <div className="tour-progress-text">
                        {currentTourStep + 1} of {apolloMissions.length} missions
                      </div>
                    </div>
                  )}
                </div>

                {/* Apollo Missions List */}
                <div className="apollo-missions-section">
                  <div className="missions-title">Apollo Landing Sites</div>
                  
                  {apolloMissions.length === 0 ? (
                    <div className="loading-indicator">
                      <span>Loading Apollo missions...</span>
                    </div>
                  ) : (
                    <>
                      <div className="missions-list">
                        {apolloMissions.map((mission, index) => (
                          <button
                            key={index}
                            className={`mission-item ${selectedApolloMission?.title === mission.title ? 'active' : ''} ${index === currentTourStep ? 'current' : ''}`}
                            onClick={() => {
                              setSelectedApolloMission(mission);
                              setCurrentTourStep(index);
                              // Chamar a função para voar para o local da missão
                              if ((window as any).flyToApolloMission) {
                                (window as any).flyToApolloMission(mission);
                              }
                            }}
                          >
                            <div className="mission-item-content">
                              <div className="mission-number">Apollo {mission.title.split(' ')[1]}</div>
                              <div className="mission-year">
                                {mission.title === 'Apollo 11' ? '1969' : 
                                 mission.title === 'Apollo 14' ? '1971' :
                                 mission.title === 'Apollo 15' ? '1971' :
                                 mission.title === 'Apollo 16' ? '1972' :
                                 mission.title === 'Apollo 17' ? '1972' : 'N/A'}
                              </div>
                            </div>
                            <div className="mission-item-arrow">›</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Tour Instructions */}
                <div className="tour-instructions">
                  <h4>How to Use the Tour</h4>
                  <ul>
                    <li>Click on any mission to explore its landing site</li>
                    <li>Use Play/Pause to follow the chronological timeline</li>
                    <li>Each mission shows historical context and scientific discoveries</li>
                    <li>Reference points highlight key geological features</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moon Tour Map Page */}
      {currentPage === 'moon-tour-map' && (
        <div className="moon-tour-map-page">
          <div className="moon-tour-map-content">
            <div className="moon-tour-map-left">
              {/* Cesium Viewer - Lua com pontos do tour */}
              <div className="cesium-container">
                <MapViewer 
                  currentBody={currentBody} 
                  is3DMode={is3DMode}
                  currentPage={currentPage}
                  selectedFeature={selectedFeature}
                  onNavigateToMoonData={() => setCurrentPage('moon-data')}
                  onNavigateToMain={() => setCurrentPage('main')}
                  onNavigateToMoonTour={() => setCurrentPage('moon-tour-map')}
                />
              </div>
            </div>
            
            <div className="moon-tour-map-right">
              <div className="moon-tour-map-menu">
                <h2 className="moon-tour-map-title">Moon Tour</h2>
                
                {/* Tour Start Button */}
                <div className="tour-start-section">
                  <button
                    className="tour-start-button"
                    onClick={() => {
                      // Iniciar o tour automático
                      if ((window as any).startTour) {
                        (window as any).startTour();
                      }
                    }}
                  >
                    <div className="tour-start-content">
                      <span className="tour-start-text">Start</span>
                      <div className="tour-start-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Tour Instructions */}
                <div className="tour-instructions">
                  <h4>Tour Instructions</h4>
                  <ul>
                    <li>Click "Start" to begin the automatic tour</li>
                    <li>The tour will take you through Apollo mission landing sites</li>
                    <li>Each mission includes historical and scientific information</li>
                    <li>You can pause or restart the tour at any time</li>
                  </ul>
                </div>

                {/* Mission Overview */}
                <div className="mission-overview">
                  <h4>Apollo Missions</h4>
                  <div className="mission-list-preview">
                    {apolloMissions.slice(0, 3).map((mission, index) => (
                      <div key={index} className="mission-preview-item">
                        <span className="mission-preview-number">Apollo {mission.title.split(' ')[1]}</span>
                        <span className="mission-preview-year">
                          {mission.title === 'Apollo 11' ? '1969' : 
                           mission.title === 'Apollo 14' ? '1971' :
                           mission.title === 'Apollo 15' ? '1971' :
                           mission.title === 'Apollo 16' ? '1972' :
                           mission.title === 'Apollo 17' ? '1972' : 'N/A'}
                        </span>
                      </div>
                    ))}
                    {apolloMissions.length > 3 && (
                      <div className="mission-preview-more">
                        +{apolloMissions.length - 3} more missions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show on main page */}
      {currentPage === 'main' && (
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
            onNavigateToMoonTour={() => setCurrentPage('moon-tour-map')}
          />
        </main>
      </div>
      )}

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
