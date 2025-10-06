import React from 'react';

interface MoonTourProps {
  apolloMissions: any[];
  currentTourStep: number;
  isTourPlaying: boolean;
  selectedApolloMission: any;
  setCurrentTourStep: (step: number) => void;
  setIsTourPlaying: (playing: boolean) => void;
  setSelectedApolloMission: (mission: any) => void;
}

const MoonTour: React.FC<MoonTourProps> = ({
  apolloMissions,
  currentTourStep,
  isTourPlaying,
  selectedApolloMission,
  setCurrentTourStep,
  setIsTourPlaying,
  setSelectedApolloMission
}) => {
  return (
    <>
      {/* Painel de informações da missão Apollo selecionada */}
      {selectedApolloMission && (
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
    </>
  );
};

export default MoonTour;