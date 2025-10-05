import React, { useState } from 'react';
import MapViewer from './components/MapViewer';
import { type CelestialBody } from './services/wmts.service';
import './App.css';

const App: React.FC = () => {
  const [currentBody, setCurrentBody] = useState<CelestialBody>('earth');
  const [is3DMode, setIs3DMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const celestialBodies: { key: CelestialBody; label: string; icon: string }[] = [
    { key: 'earth', label: 'Earth', icon: '🌍' },
    { key: 'moon', label: 'Moon', icon: '🌙' },
    { key: 'mars', label: 'Mars', icon: '🔴' }
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          {/* 3D Mode Toggle - Removed duplicate button */}
        </div>

        <div className="header-center">
          <div className="body-selector">
            {celestialBodies.map((body) => (
              <button
                key={body.key}
                className={`body-button ${currentBody === body.key ? 'active' : ''}`}
                onClick={() => setCurrentBody(body.key)}
                title={`Switch to ${body.label}`}
              >
                <span className="body-icon">{body.icon}</span>
                <span className="body-label">{body.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="header-right">
          <button
            className={`action-button ${showHelp ? 'active' : ''}`}
            onClick={() => setShowHelp(!showHelp)}
            title="Help & Info"
          >
            <span className="icon">?</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Solar 3D Panel */}
        <aside className="solar-panel">
          <div className="panel-header">
            <h3>Solar System</h3>
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
            <div className="orbit earth-orbit">
              <div className={`planet earth ${currentBody === 'earth' ? 'active' : ''}`}>🌍</div>
            </div>
            <div className="orbit moon-orbit">
              <div className={`planet moon ${currentBody === 'moon' ? 'active' : ''}`}>🌙</div>
            </div>
            <div className="orbit mars-orbit">
              <div className={`planet mars ${currentBody === 'mars' ? 'active' : ''}`}>🔴</div>
            </div>
          </div>
          <div className="planet-info">
            <h4>{currentBody.charAt(0).toUpperCase() + currentBody.slice(1)}</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Distance from Sun</span>
                <span className="value">
                  {currentBody === 'earth' ? '149.6M km' : 
                   currentBody === 'moon' ? '149.6M km' : '227.9M km'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Diameter</span>
                <span className="value">
                  {currentBody === 'earth' ? '12,742 km' : 
                   currentBody === 'moon' ? '3,474 km' : '6,779 km'}
            </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Map Viewer */}
        <main className="map-container">
          <MapViewer currentBody={currentBody} is3DMode={is3DMode} />
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
                <li><strong>Body Selection:</strong> Switch between Earth, Moon, and Mars</li>
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
