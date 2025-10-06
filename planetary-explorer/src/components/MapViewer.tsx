import React, { useEffect, useRef, useState } from 'react';
import { Viewer, Entity, ImageryLayer } from 'resium';
import * as Cesium from 'cesium';
import { type CelestialBody, getProviderForBody } from '../services/wmts.service';
import { 
  type GazetteerFeature, 
  loadGazetteerData, 
  convertLonTo180,
  searchFeaturesByName,
  getPolygonPath,
  type ApolloTour
} from '../services/gazetteer.service';
import { 
  type TourStep, 
  generateTourSequence, 
  getMissionDetails 
} from '../services/apollo-tour.service';

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

interface MapViewerProps {
  currentBody: CelestialBody;
  is3DMode: boolean;
  currentPage: 'main' | 'feature-detail' | 'moon-data' | 'apollo-sites' | 'moon-tour' | 'moon-tour-map';
  selectedFeature: GeologicalFeature | null;
  selectedGazetteerFeature?: GazetteerFeature | null;
  onNavigateToMoonData: () => void;
  onNavigateToMain: () => void;
  onNavigateToApolloSites: () => void;
  onNavigateToMoonTour?: () => void;
  selectedTour: ApolloTour | null;
  featuresToShow: GazetteerFeature[];
  tourSteps?: TourStep[];
  currentStepIndex?: number;
  isPlaying?: boolean;
  onTourStepComplete?: () => void;
  onFeatureSelect?: (feature: GazetteerFeature | null) => void;
  onApolloSiteClick?: (missionNumber: number) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ 
  currentBody, 
  is3DMode, 
  currentPage, 
  selectedFeature, 
  selectedGazetteerFeature: externalSelectedGazetteerFeature,
  onNavigateToMoonData,
  onNavigateToApolloSites,
  onNavigateToMoonTour,
  selectedTour,
  featuresToShow,
  onFeatureSelect,
  onApolloSiteClick
}) => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [provider, setProvider] = useState(() => getProviderForBody(currentBody));
  const [gazetteerData, setGazetteerData] = useState<GazetteerFeature[]>([]);
  const [internalSelectedGazetteerFeature, setInternalSelectedGazetteerFeature] = useState<GazetteerFeature | null>(null);
  
  // Usar o estado externo se disponível, senão usar o interno
  const selectedGazetteerFeature = externalSelectedGazetteerFeature !== undefined ? externalSelectedGazetteerFeature : internalSelectedGazetteerFeature;
  
  const setSelectedGazetteerFeature = (feature: GazetteerFeature | null) => {
    if (onFeatureSelect) {
      onFeatureSelect(feature);
    } else {
      setInternalSelectedGazetteerFeature(feature);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GazetteerFeature[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showAllPoints, setShowAllPoints] = useState(true);
  const [visiblePoints, setVisiblePoints] = useState<GazetteerFeature[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<GazetteerFeature | null>(null);
  const [currentCameraPosition, setCurrentCameraPosition] = useState<{lat: number, lon: number} | null>(null);
  const [cameraHeight, setCameraHeight] = useState<number>(0);
  const [polygonDataSources, setPolygonDataSources] = useState<Map<string, Cesium.GeoJsonDataSource>>(new Map());
  const [tourDataSource, setTourDataSource] = useState<Cesium.GeoJsonDataSource | null>(null);
  const [polygonLabels, setPolygonLabels] = useState<Map<string, Cesium.Entity>>(new Map());

  // Estados para o tour Apollo
  const [tourSequence, setTourSequence] = useState<TourStep[]>([]);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const [isTourPlaying, setIsTourPlaying] = useState<boolean>(false);
  const [tourTimeout, setTourTimeout] = useState<number | null>(null);
  const [currentTourInfo, setCurrentTourInfo] = useState<{
    title: string;
    description: string;
    mission: string;
    step: 'reference' | 'landing';
    missionDetails?: any;
  } | null>(null);
  const [showTourCompletedNotification, setShowTourCompletedNotification] = useState<boolean>(false);

  // Função para voar para uma coordenada específica
  const flyToCoordinates = (lat: number, lon: number, height: number = 500000) => {
    console.log(`Flying to coordinates: lat=${lat}, lon=${lon}, height=${height}`);
    
    if (!viewerRef.current) {
      console.log('Viewer not ready yet');
      return;
    }

    const viewer = viewerRef.current;
    console.log('Flying to destination...');
    
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      duration: 2.0,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });
    
    console.log('FlyTo command sent');
  };

  // Função para iniciar o tour
  const startTour = () => {
    console.log('Starting Apollo tour...');
    const sequence = generateTourSequence();
    console.log('Tour sequence received:', sequence.length, 'steps');
    
    setTourSequence(sequence);
    setCurrentTourStep(0);
    setIsTourPlaying(true);
    setCurrentTourInfo(null);
    
    // Limpar timeout anterior se existir
    if (tourTimeout) {
      clearTimeout(tourTimeout);
    }
    
    // Iniciar primeiro passo
    playNextTourStep(sequence, 0);
  };

  // Função para pausar o tour
  const pauseTour = () => {
    setIsTourPlaying(false);
    if (tourTimeout) {
      clearTimeout(tourTimeout);
      setTourTimeout(null);
    }
  };

  // Função para continuar o tour
  const resumeTour = () => {
    if (tourSequence.length > 0) {
      setIsTourPlaying(true);
      playNextTourStep(tourSequence, currentTourStep);
    }
  };

  // Função para ir para o próximo passo do tour
  const playNextTourStep = (sequence: TourStep[], stepIndex: number) => {
    console.log(`Playing tour step ${stepIndex + 1}/${sequence.length}`);
    
    if (stepIndex >= sequence.length) {
      // Tour terminou
      console.log('Tour completed!');
      setIsTourPlaying(false);
      setCurrentTourInfo(null);
      setShowTourCompletedNotification(true);
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowTourCompletedNotification(false);
      }, 5000);
      return;
    }

    const step = sequence[stepIndex];
    console.log(`Step ${stepIndex + 1}: ${step.title} (${step.step})`);
    console.log(`Coordinates: lat=${step.coordinates.lat}, lon=${step.coordinates.lon}`);
    
    setCurrentTourStep(stepIndex);
    
    // Voar para as coordenadas
    flyToCoordinates(step.coordinates.lat, step.coordinates.lon);
    
    // Atualizar informações do tour
    const missionDetails = getMissionDetails(step.mission.mission);
    console.log('Mission details for', step.mission.mission, ':', missionDetails ? 'Found' : 'Not found');
    
    setCurrentTourInfo({
      title: step.title,
      description: step.description,
      mission: step.mission.mission,
      step: step.step,
      missionDetails: missionDetails
    });

    // Agendar próximo passo
    const timeout = setTimeout(() => {
      playNextTourStep(sequence, stepIndex + 1);
    }, step.duration * 1000);
    
    setTourTimeout(timeout);
  };

  // Função para pular para o próximo passo
  const nextTourStep = () => {
    if (tourTimeout) {
      clearTimeout(tourTimeout);
    }
    if (tourSequence.length > 0 && currentTourStep < tourSequence.length - 1) {
      playNextTourStep(tourSequence, currentTourStep + 1);
    }
  };

  // Função para voltar ao passo anterior
  const previousTourStep = () => {
    if (tourTimeout) {
      clearTimeout(tourTimeout);
    }
    if (tourSequence.length > 0 && currentTourStep > 0) {
      playNextTourStep(tourSequence, currentTourStep - 1);
    }
  };

  // Limpar timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (tourTimeout) {
        clearTimeout(tourTimeout);
      }
    };
  }, [tourTimeout]);


  // Cargar polígonos de features seleccionadas
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;

    // Función para limpiar todos los dataSources
    const cleanupDataSources = () => {
      // Limpiar polígonos anteriores
      polygonDataSources.forEach(dataSource => {
        try {
          viewer.dataSources.remove(dataSource, true);
        } catch (e) {
          console.error('Error removing dataSource:', e);
        }
      });
      // Limpiar etiquetas de polígonos
      polygonLabels.forEach(label => {
        try {
          viewer.entities.remove(label);
        } catch (e) {
          console.error('Error removing label:', e);
        }
      });
      setPolygonLabels(new Map());
      // Limpiar tour anterior si existe
      if (tourDataSource) {
        try {
          viewer.dataSources.remove(tourDataSource, true);
        } catch (e) {
          console.error('Error removing tour dataSource:', e);
        }
        setTourDataSource(null);
      }
    };

    cleanupDataSources();
    setPolygonDataSources(new Map());

    if (featuresToShow.length > 0) {
      const newSources = new Map<string, Cesium.GeoJsonDataSource>();
      const newLabels = new Map<string, Cesium.Entity>();
      const promises = featuresToShow.map(async feature => {
        if (feature.properties.has_polygon) {
          const path = await getPolygonPath(feature.properties.name);
          if (path) {
            try {
              const dataSource = await Cesium.GeoJsonDataSource.load(path, {
                stroke: Cesium.Color.CYAN,
                fill: Cesium.Color.TRANSPARENT,
                strokeWidth: 3,
              });
              viewer.dataSources.add(dataSource);
              newSources.set(feature.properties.name, dataSource);
              
              // Agregar etiqueta para el polígono
              const entities = dataSource.entities.values;
              if (entities.length > 0) {
                const polygon = entities[0];
                if (polygon.polygon) {
                  // Calcular el centro del polígono
                  const positions = polygon.polygon.hierarchy?.getValue().positions;
                  if (!positions) return;
                  const center = Cesium.BoundingSphere.fromPoints(positions).center;
                  const cartographic = Cesium.Cartographic.fromCartesian(center);
                  
                  const label = viewer.entities.add({
                    position: Cesium.Cartesian3.fromRadians(
                      cartographic.longitude,
                      cartographic.latitude,
                      cartographic.height
                    ),
                    label: {
                      text: feature.properties.name,
                      font: '16pt sans-serif',
                      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                      fillColor: Cesium.Color.WHITE,
                      outlineColor: Cesium.Color.BLACK,
                      outlineWidth: 3,
                      pixelOffset: new Cesium.Cartesian2(0, 0),
                      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                      disableDepthTestDistance: Number.POSITIVE_INFINITY,
                      show: true
                    }
                  });
                  newLabels.set(feature.properties.name, label);
                }
              }
            } catch (e) {
              console.error('Error loading polygon:', path, e);
            }
          }
        }
      });

      Promise.all(promises).then(() => {
        setPolygonDataSources(newSources);
        setPolygonLabels(newLabels);
        if (newSources.size > 0) {
          const entities = Array.from(newSources.values()).flatMap(ds => ds.entities.values);
          viewer.flyTo(entities, {
            duration: 2.0,
            offset: new Cesium.HeadingPitchRange(0, -Math.PI / 4, 0)
          });
        }
      });
    }
  }, [featuresToShow]);

  // Effect para limpiar cuando se deselecciona un tour
  useEffect(() => {
    // Ya no necesitamos hacer nada aquí porque los polígonos se cargan
    // a través del useEffect de featuresToShow
    // Este useEffect puede ser removido completamente o dejado vacío
    // para futuras funcionalidades específicas del tour
  }, [selectedTour]);





  // Função para lidar com clique em uma feature específica
  const handleFeatureClick = async (feature: GazetteerFeature) => {
    // Check if it's an Apollo landing site and we're on apollo-sites page
    if (currentPage === 'apollo-sites' && onApolloSiteClick) {
      const apolloMatch = feature.properties.name.match(/Apollo[\s-]*(\d+)/i);
      if (apolloMatch) {
        const missionNumber = parseInt(apolloMatch[1]);
        if ([11, 12, 14, 15, 16, 17].includes(missionNumber)) {
          onApolloSiteClick(missionNumber);
          return;
        }
      }
    }
    
    // Navegar para a feature selecionada
    flyToLocation(feature);
    
    // Atualizar estados do Search Locations
    setSearchResults([feature]);
    // No es necesario cambiar los polígonos visibles aquí, se maneja desde App.tsx
  };



  // Geological features data by celestial body - Temporarily disabled
  /*
  const getGeologicalFeatures = (body: CelestialBody) => {
    switch (body) {
      case 'earth':
        return [
          { 
            name: 'Mount Everest', 
            icon: '🏔️', 
            type: 'mountain', 
            description: 'Highest peak on Earth', 
            coordinates: '27.9881°N, 86.9250°E',
            detailedDescription: 'Pico mais alto da Terra, localizado na cordilheira do Himalaia. Sua formação é resultado da colisão entre as placas tectônicas indiana e eurasiana há milhões de anos.',
            data: [
              { label: 'Altitude', value: '8.848 m' },
              { label: 'Idade', value: '60 milhões de anos' },
              { label: 'Primeira Ascensão', value: '29 de maio de 1953' }
            ]
          },
          { 
            name: 'Mount Kilimanjaro', 
            icon: '🌋', 
            type: 'volcano', 
            description: 'Highest volcano in Africa', 
            coordinates: '3.0674°S, 37.3556°E',
            detailedDescription: 'Vulcão adormecido na Tanzânia, formado por três cones vulcânicos. Sua geleira está desaparecendo devido às mudanças climáticas.',
            data: [
              { label: 'Altitude', value: '5.895 m' },
              { label: 'Última Erupção', value: '150.000 anos atrás' },
              { label: 'Tipo', value: 'Estratovulcão' }
            ]
          },
          { 
            name: 'Grand Canyon', 
            icon: '🏔️', 
            type: 'valley', 
            description: 'Famous steep-sided canyon', 
            coordinates: '36.1069°N, 112.1129°W',
            detailedDescription: 'Cânion esculpido pelo rio Colorado ao longo de milhões de anos, revelando camadas geológicas antigas.',
            data: [
              { label: 'Profundidade', value: '1.857 m' },
              { label: 'Comprimento', value: '446 km' },
              { label: 'Idade', value: '6 milhões de anos' }
            ]
          }
        ];
      case 'moon':
        return [
          { 
            name: 'Tycho Crater', 
            icon: '🌙', 
            type: 'crater', 
            description: 'Prominent lunar impact crater', 
            coordinates: '43.3°S, 11.2°W',
            detailedDescription: 'Cratera de impacto formada há milhões de anos. Sua estrutura circular e bordes elevados são características típicas dos crateres lunares mais antigos.',
            data: [
              { label: 'Diâmetro', value: '93 km' },
              { label: 'Profundidade', value: '3.6 km' },
              { label: 'Idade', value: '3.85 bilhões de anos' }
            ]
          },
          { 
            name: 'Copernicus Crater', 
            icon: '🌙', 
            type: 'crater', 
            description: 'Large lunar impact crater', 
            coordinates: '9.6°N, 20.1°W',
            detailedDescription: 'Uma das crateras mais jovens e bem preservadas da Lua, com sistema de raios brilhantes que se estendem por centenas de quilômetros.',
            data: [
              { label: 'Diâmetro', value: '96 km' },
              { label: 'Profundidade', value: '3.8 km' },
              { label: 'Idade', value: '800 milhões de anos' }
            ]
          },
          { 
            name: 'Mare Tranquillitatis', 
            icon: '🌙', 
            type: 'mare', 
            description: 'Sea of Tranquility', 
            coordinates: '8.5°N, 31.4°E',
            detailedDescription: 'Mar lunar onde a Apollo 11 pousou em 1969. Formado por lava basáltica que preencheu uma bacia de impacto gigante.',
            data: [
              { label: 'Diâmetro', value: '873 km' },
              { label: 'Profundidade', value: '1.8 km' },
              { label: 'Idade', value: '3.8 bilhões de anos' }
            ]
          }
        ];
      case 'mars':
        return [
          { 
            name: 'Olympus Mons', 
            icon: '🌋', 
            type: 'volcano', 
            description: 'Largest volcano in the solar system', 
            coordinates: '18.4°N, 226.0°E',
            detailedDescription: 'O maior vulcão conhecido no sistema solar, três vezes mais alto que o Monte Everest. Sua base se estende por centenas de quilômetros.',
            data: [
              { label: 'Altitude', value: '21.9 km' },
              { label: 'Diâmetro da Base', value: '624 km' },
              { label: 'Última Atividade', value: '25 milhões de anos' }
            ]
          },
          { 
            name: 'Gale Crater', 
            icon: '🌙', 
            type: 'crater', 
            description: 'Impact crater explored by Curiosity', 
            coordinates: '5.4°S, 137.8°E',
            detailedDescription: 'Cratera de impacto explorada pelo rover Curiosity desde 2012. Contém evidências de um antigo ambiente aquático.',
            data: [
              { label: 'Diâmetro', value: '154 km' },
              { label: 'Profundidade', value: '3.7 km' },
              { label: 'Idade', value: '3.8 bilhões de anos' }
            ]
          },
          { 
            name: 'Valles Marineris', 
            icon: '🏔️', 
            type: 'valley', 
            description: 'Largest canyon system on Mars', 
            coordinates: '13.9°S, 59.2°W',
            detailedDescription: 'Sistema de cânions gigantesco que se estende por milhares de quilômetros, muito maior que o Grand Canyon da Terra.',
            data: [
              { label: 'Comprimento', value: '4.000 km' },
              { label: 'Profundidade', value: '7 km' },
              { label: 'Largura', value: '200 km' }
            ]
          }
        ];
      default:
        return [];
    }
  };
  */

  // Funções removidas temporariamente - características geológicas em desenvolvimento

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
    console.log('MapViewer: Loading gazetteer data for:', currentBody);
    loadGazetteerData(currentBody).then(data => {
      console.log('MapViewer: Gazetteer data loaded:', data.features.length, 'features');
      const validFeatures = data.features.filter(isValidFeature);

      setGazetteerData(validFeatures);
      // Limitar puntos visibles para no sobrecargar el renderizado
      // Para la Luna hay ~9000 puntos, mostramos solo una muestra
      const maxPoints = currentBody === 'earth' ? 500 : 1000;
      setVisiblePoints(validFeatures.slice(0, maxPoints));
      setSelectedGazetteerFeature(null);
      setSearchTerm('');
      setSearchResults([]);
    });

    // Actualizar provider
    console.log('MapViewer: Setting provider for:', currentBody);
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

  // Rastrear posição da câmera para o mini-mapa
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    
    const updateCameraPosition = () => {
      try {
        const camera = viewer.camera;
        const position = camera.positionCartographic;
        
        if (position && position.latitude && position.longitude) {
          const lat = Cesium.Math.toDegrees(position.latitude);
          const lon = Cesium.Math.toDegrees(position.longitude);
          const height = camera.positionCartographic.height;
          
          setCurrentCameraPosition({ lat, lon });
          setCameraHeight(height);
          console.log('Camera position updated:', { lat, lon, height });
          console.log('Mini-map should show:', (height > 0 && height < 10000000) ? 'YES' : 'NO');
        }
      } catch (error) {
        console.log('Error updating camera position:', error);
      }
    };

    // Atualizar posição quando a câmera se move
    viewer.camera.moveEnd.addEventListener(updateCameraPosition);
    
    // Atualizar posição inicial após um pequeno delay
    setTimeout(updateCameraPosition, 1000);

    return () => {
      viewer.camera.moveEnd.removeEventListener(updateCameraPosition);
    };
  }, [currentBody, viewerRef.current]);

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
    setSelectedGazetteerFeature(feature);

    // Siempre volar a la ubicación, independientemente de si tiene polígono
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(position.lon180, position.lat, 500000),
      duration: 2.0,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      }
    });
  };

  // Escutar mudanças na prop onFeatureSelect para voar para a feature
  useEffect(() => {
    // Esta função será chamada quando uma feature for selecionada externamente
    const handleExternalFeatureSelect = (feature: GazetteerFeature) => {
      handleFeatureClick(feature);
    };
    
    // Expor as funções globalmente para uso externo
    (window as any).flyToFeature = handleExternalFeatureSelect;
    (window as any).startTour = startTour;
    (window as any).pauseTour = pauseTour;
    (window as any).resumeTour = resumeTour;
    (window as any).nextTourStep = nextTourStep;
    (window as any).previousTourStep = previousTourStep;
  }, [tourSequence, currentTourStep, tourTimeout]);

  const selectedPosition = selectedGazetteerFeature ? getFeaturePosition(selectedGazetteerFeature) : null;
  const hoveredPosition = hoveredFeature ? getFeaturePosition(hoveredFeature) : null;

  return (
    <div className="map-viewer-container">
      {/* Cesium Viewer */}
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
        
        {/* Mostrar pontos do gazetteer - solo en ciertas páginas */}
        {(currentPage === 'main' || currentPage === 'moon-data') && showAllPoints && visiblePoints.map((feature, index) => {
          const position = getFeaturePosition(feature);
          if (!position) {
            return null;
          }

          const isSelected = selectedGazetteerFeature?.properties.name === feature.properties.name;
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
                setSelectedGazetteerFeature(feature);
                handleFeatureClick(feature);
              }}
            />
          );
        })}

        {/* Etiqueta para o ponto selecionado ou hover */}
        {(selectedPosition || hoveredPosition) && (() => {
          const labelFeature = selectedGazetteerFeature ?? hoveredFeature;
          const labelPosition = selectedPosition ?? hoveredPosition;

          if (!labelFeature || !labelPosition) {
            return null;
          }

          return (
            <Entity
              position={Cesium.Cartesian3.fromDegrees(labelPosition.lon180, labelPosition.lat)}
              label={{
                text: labelFeature.properties.name,
                font: selectedGazetteerFeature ? '14pt sans-serif' : '12pt sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                fillColor: selectedGazetteerFeature ? Cesium.Color.WHITE : Cesium.Color.YELLOW,
                outlineColor: selectedGazetteerFeature ? Cesium.Color.BLACK : Cesium.Color.RED.withAlpha(0.8),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
            />
          );
        })()}
      </Viewer>

      {/* Botón de centrar vista - Siempre visible */}
      <button 
        className="center-view-button"
        onClick={() => {
          if (viewerRef.current) {
            viewerRef.current.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
              duration: 2.0,
              orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-90),
                roll: 0
              }
            });
          }
        }}
        title="Center Moon View"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-7 7H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm10 6h4c1.1 0 2-.9 2-2v-4h-2v4h-4v2zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>

      {/* System Menu - Only show on main page */}
      {currentPage === 'main' && (
      <div className="system-menu">
        <div className="menu-header">
          <div className="menu-title-section">
          <h2 className="menu-title">{currentBody.charAt(0).toUpperCase() + currentBody.slice(1)} Menu</h2>
          <div className="menu-section">General</div>
          </div>
        </div>
        <div className="menu-items">
          {/* Home button hidden as requested */}
          <button 
            className="menu-item"
            onClick={() => {
              // Navegar para a página Apollo Landing Sites
              if (onNavigateToApolloSites) {
                onNavigateToApolloSites();
              }
            }}
          >
            <div className="menu-item-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="menu-item-content">
            <span className="menu-text">Visit Apollo Landing Sites</span>
              <span className="menu-description">Apollo missions</span>
                        </div>
          </button>
          
          <button 
            className="menu-item"
            onClick={() => {
              // Navegar para a página Moon Tour Map
              if (onNavigateToMoonTour) {
                onNavigateToMoonTour();
              }
            }}
          >
            <div className="menu-item-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="menu-item-content">
            <span className="menu-text">Moon Tour</span>
              <span className="menu-description">Guided tour</span>
            </div>
          </button>
          
          <div className="menu-item-container">
            <button 
              className="menu-item"
              onClick={() => {
                onNavigateToMoonData();
              }}
            >
              <div className="menu-item-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
                    </div>
              <div className="menu-item-content">
              <span className="menu-text">Moon Data</span>
                <span className="menu-description">Geological features</span>
                </div>
                      </button>
                  </div>
                </div>
                  </div>
                      )}
                      
      {/* Feature Information Panel - Removed from main page */}

      {/* Search Panel - Only show on main page */}
      {currentPage === 'main' && (
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
            placeholder="Search places on Moon..."
            className="search-input"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedGazetteerFeature(null);
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
                  onClick={() => handleFeatureClick(feature)}
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
        {selectedGazetteerFeature && (
          <div className="feature-info">
            <div className="feature-header">
              <h4>{selectedGazetteerFeature.properties.name}</h4>
              <button 
                onClick={() => setSelectedGazetteerFeature(null)}
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
              {selectedGazetteerFeature.properties.feature_type && (
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{selectedGazetteerFeature.properties.feature_type}</span>
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
          {hoveredFeature && !selectedGazetteerFeature && (
            <div className="hover-info">
              <span className="hover-label">Hovering:</span>
              <span className="hover-name">{hoveredFeature.properties.name}</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Feature Detail Panel - Only show on feature-detail page */}
      {currentPage === 'feature-detail' && selectedFeature && (
        <div className="feature-detail-panel">
          <div className="feature-detail-header">
            <h2 className="feature-detail-title">Descripción</h2>
          </div>
          
          <div className="feature-detail-content">
            <div className="feature-detail-description">
              <p>{selectedFeature.detailedDescription}</p>
            </div>
            
            <div className="feature-detail-separator"></div>
            
            <div className="feature-detail-data">
              {selectedFeature.data.map((item, index) => (
                <div key={index} className="feature-detail-data-item">
                  <span className="feature-detail-label">{item.label}:</span>
                  <span className="feature-detail-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Tour Information Panel - Only show during tour */}
      {currentTourInfo && currentPage === 'moon-tour-map' && (
        <div className="tour-info-panel">
          <div className="tour-info-header">
            <div className="tour-info-title">
              <span className="tour-info-icon">
                {currentTourInfo.step === 'reference' ? '📍' : '🚀'}
              </span>
              <span className="tour-info-name">{currentTourInfo.title}</span>
            </div>
            <div className="tour-info-mission">{currentTourInfo.mission}</div>
          </div>
          
          <div className="tour-info-content">
            <div className="tour-info-description">
              <p>{currentTourInfo.description}</p>
            </div>
            
            {/* Mostrar detalhes da missão apenas no passo de pouso */}
            {currentTourInfo.step === 'landing' && currentTourInfo.missionDetails && (
              <div className="tour-mission-details">
                <div className="mission-detail-item">
                  <span className="detail-label">Astronauts:</span>
                  <span className="detail-value">{currentTourInfo.missionDetails.astronauts}</span>
                </div>
                <div className="mission-detail-item">
                  <span className="detail-label">Landing Date:</span>
                  <span className="detail-value">{currentTourInfo.missionDetails.landing_date}</span>
                </div>
                <div className="mission-detail-item">
                  <span className="detail-label">Time on Moon:</span>
                  <span className="detail-value">{currentTourInfo.missionDetails.duration_on_moon}</span>
                </div>
                <div className="mission-detail-item">
                  <span className="detail-label">Samples:</span>
                  <span className="detail-value">{currentTourInfo.missionDetails.samples_collected}</span>
                </div>
                
                {/* Informações históricas adicionais */}
                <div className="mission-historical-info">
                  <h5>Historical Significance</h5>
                  <p>{currentTourInfo.missionDetails.historical_significance}</p>
                </div>
                
                <div className="mission-scientific-info">
                  <h5>Scientific Value</h5>
                  <p>{currentTourInfo.missionDetails.scientific_value}</p>
                </div>
              </div>
            )}
            
            <div className="tour-info-progress">
              <div className="tour-progress-bar">
                <div 
                  className="tour-progress-fill"
                  style={{ width: `${((currentTourStep + 1) / tourSequence.length) * 100}%` }}
                ></div>
              </div>
              <div className="tour-progress-text">
                Step {currentTourStep + 1} of {tourSequence.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tour Controls - Only show during tour */}
      {isTourPlaying && currentPage === 'moon-tour-map' && (
        <div className="tour-controls-panel">
          <div className="tour-controls-buttons">
            <button
              className="tour-control-btn"
              onClick={previousTourStep}
              disabled={currentTourStep === 0}
              title="Previous Step"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            
            <button
              className="tour-control-btn"
              onClick={pauseTour}
              title="Pause Tour"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            
            <button
              className="tour-control-btn"
              onClick={nextTourStep}
              disabled={currentTourStep >= tourSequence.length - 1}
              title="Next Step"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mini-map de localização - só aparece com zoom alto */}
      {currentPage === 'main' && cameraHeight > 0 && cameraHeight < 10000000 && (
        <div className="mini-map">
          <div className="mini-map-content">
            <div className="mini-map-circle">
              {currentCameraPosition ? (
                <div 
                  className="mini-map-dot"
                  style={{
                    left: `${50 + (currentCameraPosition.lon / 180) * 45}%`,
                    top: `${50 - (currentCameraPosition.lat / 90) * 45}%`
                  }}
                ></div>
              ) : (
                <div className="mini-map-dot" style={{ left: '50%', top: '50%' }}></div>
              )}
            </div>
          </div>
        </div>
      )}

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
        
        {/* Mostrar todos los puntos del gazetteer - solo en la página principal */}
        {showAllPoints && currentPage === 'main' && visiblePoints.map((feature, index) => {
          const position = getFeaturePosition(feature);
          if (!position) {
            return null;
          }

          const isSelected = selectedGazetteerFeature?.properties.name === feature.properties.name;
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
                setSelectedGazetteerFeature(feature);
                handleFeatureClick(feature);
              }}
            />
          );
        })}

        {/* Etiqueta para el punto seleccionado o hover */}
        {(selectedPosition || hoveredPosition) && (() => {
          const labelFeature = selectedGazetteerFeature ?? hoveredFeature;
          const labelPosition = selectedPosition ?? hoveredPosition;

          if (!labelFeature || !labelPosition) {
            return null;
          }

          return (
            <Entity
              position={Cesium.Cartesian3.fromDegrees(labelPosition.lon180, labelPosition.lat)}
              label={{
                text: labelFeature.properties.name,
                font: selectedGazetteerFeature ? '14pt sans-serif' : '12pt sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                fillColor: selectedGazetteerFeature ? Cesium.Color.WHITE : Cesium.Color.YELLOW,
                outlineColor: selectedGazetteerFeature ? Cesium.Color.BLACK : Cesium.Color.RED.withAlpha(0.8),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
            />
          );
        })()}
        </Viewer>
      </div>

      {/* Tour Completed Notification */}
      {showTourCompletedNotification && (
        <div className="tour-completed-notification">
          <div className="notification-content">
            <div className="notification-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="notification-text">
              <h3>Tour Concluído!</h3>
              <p>Você completou o tour das missões Apollo na Lua.</p>
            </div>
            <button 
              className="notification-close"
              onClick={() => setShowTourCompletedNotification(false)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapViewer;