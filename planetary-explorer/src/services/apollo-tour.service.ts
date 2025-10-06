export interface ApolloMission {
  mission: string;
  reference_site: string;
  reference_coordinates: {
    lat: number;
    lon: number;
  };
  landing_coordinates: {
    lat: number;
    lon: number;
  };
}

export interface TourStep {
  mission: ApolloMission;
  step: 'reference' | 'landing';
  title: string;
  description: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  duration: number; // em segundos
}

// Dados das missões Apollo
export const apolloMissions: ApolloMission[] = [
  {
    mission: "Apollo 11",
    reference_site: "Mare Tranquillitatis",
    reference_coordinates: {
      lat: 8.3487,
      lon: 30.8346
    },
    landing_coordinates: {
      lat: 0.67408,
      lon: 23.47297
    }
  },
  {
    mission: "Apollo 14",
    reference_site: "Fra Mauro",
    reference_coordinates: {
      lat: -6.061,
      lon: -16.9738
    },
    landing_coordinates: {
      lat: -3.6453,
      lon: -17.47136
    }
  },
  {
    mission: "Apollo 15",
    reference_site: "Rima Hadley",
    reference_coordinates: {
      lat: 25.7159,
      lon: 3.1467
    },
    landing_coordinates: {
      lat: 26.13222,
      lon: 3.63386
    }
  },
  {
    mission: "Apollo 16",
    reference_site: "Descartes",
    reference_coordinates: {
      lat: -11.7428,
      lon: 15.6667
    },
    landing_coordinates: {
      lat: -8.97301,
      lon: 15.50019
    }
  },
  {
    mission: "Apollo 17",
    reference_site: "Taurus-Littrow Valley",
    reference_coordinates: {
      lat: 20.0702,
      lon: 30.7867
    },
    landing_coordinates: {
      lat: 20.1908,
      lon: 30.77239
    }
  }
];

// Gerar sequência do tour
export const generateTourSequence = (): TourStep[] => {
  const tourSteps: TourStep[] = [];

  console.log('Generating tour sequence with missions:', apolloMissions.length);

  apolloMissions.forEach((mission, index) => {
    console.log(`Mission ${index + 1}: ${mission.mission} - ${mission.reference_site}`);
    
    // Primeiro: mostrar o local de referência
    tourSteps.push({
      mission,
      step: 'reference',
      title: mission.reference_site,
      description: `This is the reference site for ${mission.mission}. Astronauts used this landmark to navigate and orient themselves during their approach to the Moon.`,
      coordinates: mission.reference_coordinates,
      duration: 8 // Aumentado para 8 segundos
    });

    // Segundo: mostrar o local de pouso
    tourSteps.push({
      mission,
      step: 'landing',
      title: `${mission.mission} Landing Site`,
      description: `This is where ${mission.mission} actually landed! Here, astronauts took their historic steps on the lunar surface and conducted scientific experiments.`,
      coordinates: mission.landing_coordinates,
      duration: 12 // Aumentado para 12 segundos
    });
  });

  console.log('Tour sequence generated:', tourSteps.length, 'steps');
  return tourSteps;
};

// Informações detalhadas das missões
export const getMissionDetails = (missionName: string) => {
  console.log('Getting mission details for:', missionName);
  
  const missionDetails: { [key: string]: any } = {
    'Apollo 11': {
      historical_significance: "This is the site where Apollo 11 landed in 1969 — the first manned landing in history. Here, Neil Armstrong took his famous step: 'One small step for man, one giant leap for mankind.'",
      scientific_value: "This mission provided the first lunar soil samples and confirmed the basaltic composition of the lunar maria. It also validated the feasibility of manned travel to the Moon.",
      astronauts: "Neil Armstrong, Buzz Aldrin, Michael Collins",
      landing_date: "July 20, 1969",
      duration_on_moon: "2 hours 31 minutes",
      samples_collected: "21.5 kg of lunar material",
      reference_points: [
        {
          name: "Mare Tranquillitatis",
          description: "A lunar sea formed by ancient solidified lava flows. It was chosen for its flat and safe surface for landing."
        },
        {
          name: "Mount Marilyn",
          description: "A visual reference point used by Apollo 11 astronauts to orient themselves during descent."
        }
      ]
    },
    'Apollo 14': {
      historical_significance: "This mission successfully landed in 1971 after the failed attempt of Apollo 13. It was led by Alan Shepard, who became the first man to play golf on the Moon.",
      scientific_value: "Fra Mauro is a geological formation composed of material ejected by the impact that created Mare Imbrium. The collected samples helped scientists understand the origins of the lunar maria.",
      astronauts: "Alan Shepard, Edgar Mitchell, Stuart Roosa",
      landing_date: "February 5, 1971",
      duration_on_moon: "9 hours 22 minutes",
      samples_collected: "42.3 kg of lunar material",
      reference_points: [
        {
          name: "Fra Mauro",
          description: "A mountainous and fractured area chosen for its age and its relation to the large impacts that shaped the lunar surface."
        }
      ]
    },
    'Apollo 15': {
      historical_significance: "The first Apollo mission with a dedicated scientific focus. In 1971, it introduced the Lunar Rover, allowing astronauts to explore much wider areas.",
      scientific_value: "The Hadley-Rille site combines mountains (Mons Hadley and Hadley Delta) with a sinuous channel formed by ancient lava flows. Rocks collected included anorthosite, one of the oldest lunar materials.",
      astronauts: "David Scott, James Irwin, Alfred Worden",
      landing_date: "July 30, 1971",
      duration_on_moon: "18 hours 33 minutes",
      samples_collected: "77.3 kg of lunar material",
      reference_points: [
        {
          name: "Rima Hadley",
          description: "A sinuous channel about 80 km long formed by lava flows — a clear example of ancient volcanic activity on the Moon."
        },
        {
          name: "Mons Hadley",
          description: "A prominent mountain that provided access to rocks from the Moon's primordial crust."
        }
      ]
    },
    'Apollo 16': {
      historical_significance: "In 1972, Apollo 16 became the first mission to explore the lunar highlands. It was key to understanding the Moon's oldest regions.",
      scientific_value: "Descartes Highlands is a region of hills formed mainly by impact rocks, not volcanic activity. This finding changed the previous geological interpretation of the Moon.",
      astronauts: "John Young, Charles Duke, Thomas Mattingly",
      landing_date: "April 21, 1972",
      duration_on_moon: "20 hours 14 minutes",
      samples_collected: "95.7 kg of lunar material",
      reference_points: [
        {
          name: "Descartes Highlands",
          description: "An elevated terrain composed of impact breccias. It provided evidence that the lunar highlands are not of volcanic origin."
        }
      ]
    },
    'Apollo 17': {
      historical_significance: "The last manned mission to the Moon (1972). It included geologist Harrison Schmitt, the first professional scientist to walk on the lunar surface.",
      scientific_value: "Taurus-Littrow Valley combines ancient highlands with younger basaltic deposits. Samples of orange soil were discovered — evidence of explosive volcanic activity.",
      astronauts: "Eugene Cernan, Harrison Schmitt, Ronald Evans",
      landing_date: "December 11, 1972",
      duration_on_moon: "22 hours 4 minutes",
      samples_collected: "110.5 kg of lunar material",
      reference_points: [
        {
          name: "Taurus-Littrow Valley",
          description: "A mountainous valley that shows the interaction between ancient highlands and more recent basaltic plains."
        }
      ]
    }
  };

  const result = missionDetails[missionName] || null;
  console.log('Mission details result:', result ? 'Found' : 'Not found');
  return result;
};
