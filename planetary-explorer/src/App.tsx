import React, { useState } from 'react';
import MapViewer from './components/MapViewer';
import { type CelestialBody } from './services/wmts.service';
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
  const [currentPage, setCurrentPage] = useState<'main' | 'feature-detail'>('main');
  const [selectedFeature, setSelectedFeature] = useState<GeologicalFeature | null>(null);

  // Função para voltar à página principal
  const navigateBack = () => {
    setCurrentPage('main');
    setSelectedFeature(null);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          {currentPage === 'feature-detail' && (
            <button
              className="action-button"
              onClick={navigateBack}
              title="Voltar"
            >
              <span className="icon">←</span>
              <span>Voltar</span>
            </button>
          )}
        </div>

        <div className="header-center">
          {currentPage === 'feature-detail' && (
            <div className="feature-header-title">
              <span className="feature-icon">{selectedFeature?.icon}</span>
              <span>{selectedFeature?.name}</span>
            </div>
          )}
        </div>

        <div className="header-right">
          {currentPage === 'feature-detail' && (
            <button
              className="action-button"
              onClick={() => setCurrentPage('main')}
              title="Menu"
            >
              <span className="icon">☰</span>
              <span>Menu</span>
            </button>
          )}
          {currentPage === 'main' && (
            <button
              className={`action-button ${showHelp ? 'active' : ''}`}
              onClick={() => setShowHelp(!showHelp)}
              title="Help & Info"
            >
              <span className="icon">?</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Solar 3D Panel - Only show on main page */}
        {currentPage === 'main' && (
          <aside className="solar-panel">
            <div className="panel-header">
              <h3>Explorador Planetario NASA WMTS</h3>
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
            </div>
            <div className="solar-system-view">
              <div className="sun">☀️</div>
              <div className="orbit moon-orbit">
                <div className={`planet moon ${currentBody === 'moon' ? 'active' : ''}`}>🌙</div>
              </div>
            </div>
            <div className="planet-info">
              <h4>{currentBody.charAt(0).toUpperCase() + currentBody.slice(1)}</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Distance from Sun</span>
                  <span className="value">149.6M km</span>
                </div>
                <div className="info-item">
                  <span className="label">Diameter</span>
                  <span className="value">3,474 km</span>
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
