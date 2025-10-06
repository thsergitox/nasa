import React, { useState, useEffect } from 'react';
import { 
  type GazetteerFeature, 
  type ApolloMission, 
  type ApolloTour 
} from '../services/gazetteer.service';

interface ApolloInfo {
  mission: string;
  year: number;
  description: string;
  sites: Array<{
    name: string;
    description: string;
    importance: string;
    link: string;
  }>;
}

interface MoonToursAccordionProps {
  apolloMissions: ApolloMission[];
  gazetteerData: GazetteerFeature[];
  onFeatureClick: (feature: GazetteerFeature) => void;
  onTourClick: (tour: ApolloTour) => void;
  onMissionClick: (mission: ApolloMission) => void;
  onFeatureToggle?: (feature: GazetteerFeature, isChecked: boolean) => void;
  selectedTour: ApolloTour | null;
  featuresToShow: GazetteerFeature[];
  onApolloSiteSelect?: (missionNumber: number) => void;
}

const MoonToursAccordion: React.FC<MoonToursAccordionProps> = ({
  apolloMissions,
  gazetteerData,
  onFeatureClick,
  onTourClick,
  onMissionClick,
  onFeatureToggle,
  selectedTour,
  featuresToShow,
  onApolloSiteSelect
}) => {
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [apolloInfo, setApolloInfo] = useState<{ [key: string]: ApolloInfo } | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());

  // Cargar información de las misiones Apollo
  useEffect(() => {
    fetch('/data/apollo/apollos_info/info_tour1.json')
      .then(res => res.json())
      .then(data => {
        const formattedData: { [key: string]: ApolloInfo } = {};
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          const missionName = key.replace('_', ' ');
          formattedData[missionName] = value;
        });
        setApolloInfo(formattedData);
      })
      .catch(error => console.error('Error loading Apollo info:', error));
  }, []);

  // Actualizar las features seleccionadas cuando cambien
  useEffect(() => {
    const selectedSet = new Set(featuresToShow.map(f => f.properties.name));
    setSelectedFeatures(selectedSet);
  }, [featuresToShow]);

  const toggleMission = (missionName: string) => {
    setExpandedMission(expandedMission === missionName ? null : missionName);
  };

  const handleFeatureToggle = (feature: GazetteerFeature, isChecked: boolean) => {
    // Crear nuevo array de features para mostrar
    const currentFeatures = [...featuresToShow];
    
    if (isChecked) {
      // Agregar si no existe
      if (!currentFeatures.find(f => f.properties.name === feature.properties.name)) {
        currentFeatures.push(feature);
      }
    } else {
      // Remover si existe
      const index = currentFeatures.findIndex(f => f.properties.name === feature.properties.name);
      if (index !== -1) {
        currentFeatures.splice(index, 1);
      }
    }
    
    // Actualizar el estado en el padre mediante una función que maneje el cambio completo
    // Esto se manejará directamente en App.tsx
  };

  const getMissionInfo = (missionName: string | undefined): ApolloInfo | null => {
    if (!apolloInfo || !missionName) return null;
    const key = missionName.replace(' ', '_');
    return apolloInfo[key] || apolloInfo[missionName] || null;
  };

  const getFeatureInfo = (featureName: string, missionName: string) => {
    const missionInfo = getMissionInfo(missionName);
    if (!missionInfo) return null;
    return missionInfo.sites.find(site => site.name === featureName);
  };

  return (
    <div className="moon-tours-accordion">
      {apolloMissions.map(mission => {
        const missionInfo = getMissionInfo(mission.name);
        const isExpanded = expandedMission === mission.name;

        return (
          <div key={mission.name} className="accordion-item">
            <button 
              className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleMission(mission.name)}
            >
              <div className="accordion-header-content">
                <div className="mission-title-section">
                  <span className="mission-icon">🚀</span>
                  <span className="mission-name">{mission.name}</span>
                  {missionInfo && (
                    <span className="mission-year">{missionInfo.year}</span>
                  )}
                </div>
                <svg 
                  className={`accordion-arrow ${isExpanded ? 'rotated' : ''}`}
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="accordion-content">
                {missionInfo && (
                  <div className="mission-description">
                    <p>{missionInfo.description}</p>
                  </div>
                )}

                <div className="mission-actions">
                  <button
                    className="select-all-btn"
                    onClick={() => onMissionClick(mission)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Show All Sites
                  </button>
                </div>

                <div className="mission-sites">
                  <h4 className="sites-header">Landing Sites</h4>
                  {mission.features.map(feature => {
                    const gazetteerFeature = gazetteerData.find(
                      f => f.properties.name === feature.name
                    );
                    if (!gazetteerFeature) return null;

                    const featureInfo = getFeatureInfo(feature.name, mission.name);
                    const isSelected = featuresToShow.some(f => f.properties.name === feature.name);

                    return (
                      <div key={feature.name} className="site-item">
                        <input
                          type="checkbox"
                          id={`${mission.name}-${feature.name}`}
                          checked={isSelected}
                          onChange={(e) => {
                            if (onFeatureToggle) {
                              onFeatureToggle(gazetteerFeature, e.target.checked);
                            } else {
                              handleFeatureToggle(gazetteerFeature, e.target.checked);
                            }
                          }}
                          className="site-checkbox"
                        />
                        <label 
                          htmlFor={`${mission.name}-${feature.name}`}
                          className="site-label"
                        >
                          <div className="site-info">
                            <span className="site-name">{feature.name}</span>
                            {featureInfo && (
                              <span className="site-description">{featureInfo.description}</span>
                            )}
                          </div>
                        </label>
                        <button
                          className="site-goto-btn"
                          onClick={() => {
                            // Extract mission number from mission name (e.g., "Apollo 11" -> 11)
                            const missionNumber = parseInt(mission.name.replace('Apollo ', ''));
                            if (onApolloSiteSelect && [11, 12, 14, 15, 16, 17].includes(missionNumber)) {
                              onApolloSiteSelect(missionNumber);
                            } else {
                              onFeatureClick(gazetteerFeature);
                            }
                          }}
                          title="View in LROC High Resolution"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {mission.tours && mission.tours.length > 0 && (
                  <div className="mission-tours">
                    <h4 className="tours-header">Available Tours</h4>
                    {mission.tours.map(tour => (
                      <button
                        key={tour.name}
                        className={`tour-item ${selectedTour?.name === tour.name ? 'selected' : ''}`}
                        onClick={() => onTourClick(tour)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.7-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
                        </svg>
                        <span className="tour-name">{tour.name}</span>
                        <span className="tour-arrow">→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MoonToursAccordion;