import { useState } from 'react';
import MapViewer from './components/MapViewer';
import { type CelestialBody } from './services/wmts.service';

function App() {
  const [currentBody, setCurrentBody] = useState<CelestialBody>('moon');

  return (
    <div className="w-full h-screen relative">
      {/* Selector de cuerpos celestes */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-gray-900/90 backdrop-blur rounded-lg p-2 shadow-lg flex gap-2">
          <button
            onClick={() => setCurrentBody('earth')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              currentBody === 'earth'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🌍 Tierra
          </button>
          <button
            onClick={() => setCurrentBody('moon')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              currentBody === 'moon'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🌙 Luna
          </button>
          <button
            onClick={() => setCurrentBody('mars')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              currentBody === 'mars'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🔴 Marte
          </button>
        </div>
      </div>

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-gray-900/90 backdrop-blur rounded-lg p-4 shadow-lg max-w-md">
          <h2 className="text-white font-bold text-lg mb-2">
            Explorador Planetario NASA WMTS
          </h2>
          <p className="text-gray-300 text-sm">
            Explorando: <span className="font-bold text-blue-400">
              {currentBody === 'earth' ? 'Tierra' : currentBody === 'moon' ? 'Luna' : 'Marte'}
            </span>
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Usa la barra de búsqueda para encontrar lugares específicos. 
            Click en un resultado para volar ahí y ver el marcador rojo.
          </p>
        </div>
      </div>

      {/* Visor de mapas */}
      <MapViewer currentBody={currentBody} />
    </div>
  );
}

export default App
