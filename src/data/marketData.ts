import { Specialization } from '../types/staff';
import { Driver, StaffMember } from '../types/f1';

// ============================================================================
// 1. MERCADO DE PILOTOS: FÓRMULA 1 (20 PILOTOS REAIS - TEMPORADA 2026)
// ============================================================================
export const F1_DRIVERS_REAL: Driver[] = [
  {
    id: 'driver_verstappen',
    name: 'Max Verstappen',
    shortCode: 'VER',
    number: 1,
    nationality: 'Holanda',
    teamId: 'redbull',
    series: 'F1',
    requiredReputation: 85,
    ovr: 97,
    salary: 55000000,
    contractYearsRemaining: 3,
    buyoutClause: 120000000,
    marketability: 96,
    mentality: 98,
    potential: 98,
    age: 28,
    avatarColor: '#0B1936',
    attributes: {
      pace: 98,
      cornering: 97,
      braking: 98,
      consistency: 96,
      smoothness: 92,
      overtaking: 98,
      defending: 99,
      wetWeather: 98,
      tireManagement: 95,
      reactionTime: 99,
      composure: 94,
      feedback: 92,
      stamina: 96
    }
  },
  {
    id: 'driver_leclerc',
    name: 'Charles Leclerc',
    shortCode: 'LEC',
    number: 16,
    nationality: 'Mônaco',
    teamId: 'ferrari',
    series: 'F1',
    requiredReputation: 80,
    ovr: 94,
    salary: 35000000,
    contractYearsRemaining: 4,
    buyoutClause: 90000000,
    marketability: 94,
    mentality: 92,
    potential: 96,
    age: 28,
    avatarColor: '#DC0000',
    attributes: {
      pace: 97,
      cornering: 95,
      braking: 93,
      consistency: 89,
      smoothness: 91,
      overtaking: 94,
      defending: 90,
      wetWeather: 90,
      tireManagement: 91,
      reactionTime: 97,
      composure: 88,
      feedback: 91,
      stamina: 93
    }
  },
  {
    id: 'driver_hamilton',
    name: 'Lewis Hamilton',
    shortCode: 'HAM',
    number: 44,
    nationality: 'Reino Unido',
    teamId: 'ferrari',
    series: 'F1',
    requiredReputation: 85,
    ovr: 95,
    salary: 45000000,
    contractYearsRemaining: 2,
    buyoutClause: 80000000,
    marketability: 99,
    mentality: 96,
    potential: 95,
    age: 41,
    avatarColor: '#DC0000',
    attributes: {
      pace: 94,
      cornering: 95,
      braking: 96,
      consistency: 97,
      smoothness: 96,
      overtaking: 95,
      defending: 96,
      wetWeather: 97,
      tireManagement: 98,
      reactionTime: 92,
      composure: 98,
      feedback: 97,
      stamina: 91
    }
  },
  {
    id: 'driver_norris',
    name: 'Lando Norris',
    shortCode: 'NOR',
    number: 4,
    nationality: 'Reino Unido',
    teamId: 'mclaren',
    series: 'F1',
    requiredReputation: 80,
    ovr: 93,
    salary: 30000000,
    contractYearsRemaining: 3,
    buyoutClause: 85000000,
    marketability: 95,
    mentality: 90,
    potential: 95,
    age: 26,
    avatarColor: '#FF8000',
    attributes: {
      pace: 95,
      cornering: 94,
      braking: 93,
      consistency: 91,
      smoothness: 92,
      overtaking: 93,
      defending: 91,
      wetWeather: 91,
      tireManagement: 93,
      reactionTime: 95,
      composure: 89,
      feedback: 90,
      stamina: 94
    }
  },
  {
    id: 'driver_piastri',
    name: 'Oscar Piastri',
    shortCode: 'PIA',
    number: 81,
    nationality: 'Austrália',
    teamId: 'mclaren',
    series: 'F1',
    requiredReputation: 75,
    ovr: 90,
    salary: 15000000,
    contractYearsRemaining: 2,
    buyoutClause: 60000000,
    marketability: 89,
    mentality: 95,
    potential: 96,
    age: 24,
    avatarColor: '#FF8000',
    attributes: {
      pace: 91,
      cornering: 90,
      braking: 91,
      consistency: 92,
      smoothness: 90,
      overtaking: 91,
      defending: 92,
      wetWeather: 89,
      tireManagement: 89,
      reactionTime: 93,
      composure: 97,
      feedback: 88,
      stamina: 92
    }
  },
  {
    id: 'driver_russell',
    name: 'George Russell',
    shortCode: 'RUS',
    number: 63,
    nationality: 'Reino Unido',
    teamId: 'mercedes',
    series: 'F1',
    requiredReputation: 75,
    ovr: 91,
    salary: 20000000,
    contractYearsRemaining: 2,
    buyoutClause: 65000000,
    marketability: 88,
    mentality: 91,
    potential: 93,
    age: 28,
    avatarColor: '#00A19B',
    attributes: {
      pace: 92,
      cornering: 92,
      braking: 93,
      consistency: 91,
      smoothness: 90,
      overtaking: 90,
      defending: 93,
      wetWeather: 92,
      tireManagement: 89,
      reactionTime: 94,
      composure: 90,
      feedback: 93,
      stamina: 92
    }
  },
  {
    id: 'driver_antonelli',
    name: 'Kimi Antonelli',
    shortCode: 'ANT',
    number: 12,
    nationality: 'Itália',
    teamId: 'mercedes',
    series: 'F1',
    requiredReputation: 65,
    ovr: 82,
    salary: 5000000,
    contractYearsRemaining: 2,
    buyoutClause: 35000000,
    marketability: 91,
    mentality: 85,
    potential: 97,
    age: 19,
    avatarColor: '#00A19B',
    attributes: {
      pace: 86,
      cornering: 85,
      braking: 83,
      consistency: 79,
      smoothness: 81,
      overtaking: 84,
      defending: 80,
      wetWeather: 83,
      tireManagement: 80,
      reactionTime: 92,
      composure: 81,
      feedback: 79,
      stamina: 87
    }
  },
  {
    id: 'driver_alonso',
    name: 'Fernando Alonso',
    shortCode: 'ALO',
    number: 14,
    nationality: 'Espanha',
    teamId: 'astonmartin',
    series: 'F1',
    requiredReputation: 80,
    ovr: 92,
    salary: 25000000,
    contractYearsRemaining: 1,
    buyoutClause: 40000000,
    marketability: 96,
    mentality: 97,
    potential: 92,
    age: 44,
    avatarColor: '#00594F',
    attributes: {
      pace: 91,
      cornering: 93,
      braking: 95,
      consistency: 95,
      smoothness: 93,
      overtaking: 96,
      defending: 98,
      wetWeather: 95,
      tireManagement: 95,
      reactionTime: 93,
      composure: 96,
      feedback: 98,
      stamina: 89
    }
  },
  {
    id: 'driver_stroll',
    name: 'Lance Stroll',
    shortCode: 'STR',
    number: 18,
    nationality: 'Canadá',
    teamId: 'astonmartin',
    series: 'F1',
    requiredReputation: 50,
    ovr: 79,
    salary: 10000000,
    contractYearsRemaining: 2,
    buyoutClause: 15000000,
    marketability: 75,
    mentality: 78,
    potential: 80,
    age: 27,
    avatarColor: '#00594F',
    attributes: {
      pace: 80,
      cornering: 79,
      braking: 81,
      consistency: 76,
      smoothness: 78,
      overtaking: 82,
      defending: 78,
      wetWeather: 86,
      tireManagement: 79,
      reactionTime: 82,
      composure: 75,
      feedback: 78,
      stamina: 82
    }
  },
  {
    id: 'driver_albon',
    name: 'Alexander Albon',
    shortCode: 'ALB',
    number: 23,
    nationality: 'Tailândia',
    teamId: 'williams',
    series: 'F1',
    requiredReputation: 65,
    ovr: 85,
    salary: 12000000,
    contractYearsRemaining: 3,
    buyoutClause: 30000000,
    marketability: 86,
    mentality: 88,
    potential: 88,
    age: 29,
    avatarColor: '#00A0DE',
    attributes: {
      pace: 86,
      cornering: 86,
      braking: 85,
      consistency: 87,
      smoothness: 86,
      overtaking: 86,
      defending: 88,
      wetWeather: 85,
      tireManagement: 87,
      reactionTime: 88,
      composure: 87,
      feedback: 88,
      stamina: 88
    }
  },
  {
    id: 'driver_sainz',
    name: 'Carlos Sainz',
    shortCode: 'SAI',
    number: 55,
    nationality: 'Espanha',
    teamId: 'williams',
    series: 'F1',
    requiredReputation: 75,
    ovr: 90,
    salary: 20000000,
    contractYearsRemaining: 2,
    buyoutClause: 55000000,
    marketability: 92,
    mentality: 93,
    potential: 91,
    age: 31,
    avatarColor: '#00A0DE',
    attributes: {
      pace: 89,
      cornering: 90,
      braking: 91,
      consistency: 93,
      smoothness: 91,
      overtaking: 90,
      defending: 92,
      wetWeather: 90,
      tireManagement: 93,
      reactionTime: 90,
      composure: 94,
      feedback: 96,
      stamina: 91
    }
  },
  {
    id: 'driver_gasly',
    name: 'Pierre Gasly',
    shortCode: 'GAS',
    number: 10,
    nationality: 'França',
    teamId: 'alpine',
    series: 'F1',
    requiredReputation: 65,
    ovr: 85,
    salary: 12000000,
    contractYearsRemaining: 2,
    buyoutClause: 32000000,
    marketability: 86,
    mentality: 86,
    potential: 87,
    age: 30,
    avatarColor: '#0090FF',
    attributes: {
      pace: 86,
      cornering: 85,
      braking: 86,
      consistency: 85,
      smoothness: 84,
      overtaking: 87,
      defending: 86,
      wetWeather: 87,
      tireManagement: 84,
      reactionTime: 89,
      composure: 83,
      feedback: 86,
      stamina: 87
    }
  },
  {
    id: 'driver_colapinto',
    name: 'Franco Colapinto',
    shortCode: 'COL',
    number: 43,
    nationality: 'Argentina',
    teamId: 'alpine',
    series: 'F1',
    requiredReputation: 55,
    ovr: 81,
    salary: 4500000,
    contractYearsRemaining: 2,
    buyoutClause: 18000000,
    marketability: 92,
    mentality: 87,
    potential: 90,
    age: 23,
    avatarColor: '#007BFF',
    attributes: {
      pace: 84,
      cornering: 83,
      braking: 84,
      consistency: 80,
      smoothness: 82,
      overtaking: 86,
      defending: 81,
      wetWeather: 84,
      tireManagement: 82,
      reactionTime: 88,
      composure: 81,
      feedback: 84,
      stamina: 87
    }
  },
  {
    id: 'driver_doohan',
    name: 'Jack Doohan',
    shortCode: 'DOO',
    number: 7,
    nationality: 'Austrália',
    teamId: 'alpine',
    series: 'F1',
    isAffiliate: true,
    requiredReputation: 50,
    ovr: 78,
    salary: 3000000,
    contractYearsRemaining: 1,
    buyoutClause: 12000000,
    marketability: 77,
    mentality: 82,
    potential: 86,
    age: 23,
    avatarColor: '#007BFF',
    attributes: {
      pace: 80,
      cornering: 79,
      braking: 78,
      consistency: 77,
      smoothness: 78,
      overtaking: 81,
      defending: 78,
      wetWeather: 80,
      tireManagement: 78,
      reactionTime: 85,
      composure: 77,
      feedback: 78,
      stamina: 84
    }
  },
  {
    id: 'driver_hulkenberg',
    name: 'Nico Hülkenberg',
    shortCode: 'HUL',
    number: 27,
    nationality: 'Alemanha',
    teamId: 'audi',
    series: 'F1',
    requiredReputation: 60,
    ovr: 84,
    salary: 8000000,
    contractYearsRemaining: 2,
    buyoutClause: 18000000,
    marketability: 83,
    mentality: 88,
    potential: 84,
    age: 38,
    avatarColor: '#E0001B',
    attributes: {
      pace: 85,
      cornering: 85,
      braking: 86,
      consistency: 87,
      smoothness: 85,
      overtaking: 83,
      defending: 86,
      wetWeather: 86,
      tireManagement: 83,
      reactionTime: 87,
      composure: 88,
      feedback: 90,
      stamina: 85
    }
  },
  {
    id: 'driver_bortoleto',
    name: 'Gabriel Bortoleto',
    shortCode: 'BOR',
    number: 5,
    nationality: 'Brasil',
    teamId: 'audi',
    series: 'F1',
    requiredReputation: 55,
    ovr: 81,
    salary: 4000000,
    contractYearsRemaining: 2,
    buyoutClause: 25000000,
    marketability: 92,
    mentality: 89,
    potential: 94,
    age: 21,
    avatarColor: '#E0001B',
    attributes: {
      pace: 83,
      cornering: 82,
      braking: 82,
      consistency: 84,
      smoothness: 83,
      overtaking: 86,
      defending: 82,
      wetWeather: 84,
      tireManagement: 85,
      reactionTime: 88,
      composure: 86,
      feedback: 83,
      stamina: 88
    }
  },
  {
    id: 'driver_ocon',
    name: 'Esteban Ocon',
    shortCode: 'OCO',
    number: 31,
    nationality: 'França',
    teamId: 'haas',
    series: 'F1',
    requiredReputation: 60,
    ovr: 84,
    salary: 9000000,
    contractYearsRemaining: 2,
    buyoutClause: 20000000,
    marketability: 80,
    mentality: 85,
    potential: 85,
    age: 29,
    avatarColor: '#B6BABD',
    attributes: {
      pace: 85,
      cornering: 84,
      braking: 85,
      consistency: 86,
      smoothness: 83,
      overtaking: 86,
      defending: 91,
      wetWeather: 87,
      tireManagement: 84,
      reactionTime: 87,
      composure: 82,
      feedback: 85,
      stamina: 87
    }
  },
  {
    id: 'driver_bearman',
    name: 'Oliver Bearman',
    shortCode: 'BEA',
    number: 87,
    nationality: 'Reino Unido',
    teamId: 'haas',
    series: 'F1',
    requiredReputation: 55,
    ovr: 80,
    salary: 4000000,
    contractYearsRemaining: 2,
    buyoutClause: 24000000,
    marketability: 87,
    mentality: 86,
    potential: 93,
    age: 20,
    avatarColor: '#B6BABD',
    attributes: {
      pace: 82,
      cornering: 81,
      braking: 82,
      consistency: 79,
      smoothness: 80,
      overtaking: 84,
      defending: 81,
      wetWeather: 82,
      tireManagement: 81,
      reactionTime: 89,
      composure: 83,
      feedback: 80,
      stamina: 86
    }
  },
  {
    id: 'driver_lawson',
    name: 'Liam Lawson',
    shortCode: 'LAW',
    number: 30,
    nationality: 'Nova Zelândia',
    teamId: 'rb',
    series: 'F1',
    requiredReputation: 55,
    ovr: 83,
    salary: 5000000,
    contractYearsRemaining: 1,
    buyoutClause: 16000000,
    marketability: 81,
    mentality: 86,
    potential: 88,
    age: 24,
    avatarColor: '#1634CB',
    attributes: {
      pace: 84,
      cornering: 84,
      braking: 83,
      consistency: 85,
      smoothness: 83,
      overtaking: 85,
      defending: 86,
      wetWeather: 87,
      tireManagement: 84,
      reactionTime: 86,
      composure: 85,
      feedback: 83,
      stamina: 87
    }
  },
  {
    id: 'driver_hadjar',
    name: 'Isack Hadjar',
    shortCode: 'HAD',
    number: 6,
    nationality: 'França',
    teamId: 'redbull',
    series: 'F1',
    requiredReputation: 55,
    ovr: 81,
    salary: 4500000,
    contractYearsRemaining: 2,
    buyoutClause: 18000000,
    marketability: 82,
    mentality: 85,
    potential: 91,
    age: 21,
    avatarColor: '#0B1936',
    attributes: {
      pace: 84,
      cornering: 82,
      braking: 82,
      consistency: 80,
      smoothness: 81,
      overtaking: 85,
      defending: 81,
      wetWeather: 83,
      tireManagement: 80,
      reactionTime: 89,
      composure: 81,
      feedback: 81,
      stamina: 86
    }
  },
  {
    id: 'driver_lindblad',
    name: 'Arvid Lindblad',
    shortCode: 'LIN',
    number: 41,
    nationality: 'Reino Unido',
    teamId: 'rb',
    series: 'F1',
    requiredReputation: 45,
    ovr: 78,
    salary: 2200000,
    contractYearsRemaining: 2,
    buyoutClause: 12000000,
    marketability: 81,
    mentality: 86,
    potential: 94,
    age: 18,
    avatarColor: '#F1F3F6',
    attributes: {
      pace: 81,
      cornering: 80,
      braking: 79,
      consistency: 77,
      smoothness: 78,
      overtaking: 82,
      defending: 78,
      wetWeather: 80,
      tireManagement: 77,
      reactionTime: 88,
      composure: 80,
      feedback: 78,
      stamina: 84
    }
  },
  {
    id: 'driver_perez',
    name: 'Sergio Pérez',
    shortCode: 'PER',
    number: 11,
    nationality: 'México',
    teamId: 'cadillac',
    series: 'F1',
    requiredReputation: 65,
    ovr: 83,
    salary: 10000000,
    contractYearsRemaining: 2,
    buyoutClause: 22000000,
    marketability: 93,
    mentality: 87,
    potential: 83,
    age: 36,
    avatarColor: '#C59B38',
    attributes: {
      pace: 83,
      cornering: 83,
      braking: 84,
      consistency: 84,
      smoothness: 88,
      overtaking: 87,
      defending: 89,
      wetWeather: 85,
      tireManagement: 94,
      reactionTime: 84,
      composure: 85,
      feedback: 88,
      stamina: 86
    }
  },
  {
    id: 'driver_bottas',
    name: 'Valtteri Bottas',
    shortCode: 'BOT',
    number: 77,
    nationality: 'Finlândia',
    teamId: 'cadillac',
    series: 'F1',
    requiredReputation: 65,
    ovr: 83,
    salary: 8500000,
    contractYearsRemaining: 2,
    buyoutClause: 20000000,
    marketability: 88,
    mentality: 88,
    potential: 83,
    age: 36,
    avatarColor: '#C59B38',
    attributes: {
      pace: 84,
      cornering: 84,
      braking: 85,
      consistency: 87,
      smoothness: 86,
      overtaking: 82,
      defending: 85,
      wetWeather: 85,
      tireManagement: 86,
      reactionTime: 87,
      composure: 89,
      feedback: 91,
      stamina: 85
    }
  }
];

// ============================================================================
// 2. MERCADO DE PILOTOS: FÓRMULA 2 (22 PILOTOS OFICIAIS - TEMPORADA 2026)
// ============================================================================
export const F2_DRIVERS_REAL: Driver[] = [
  // 1. Invicta Racing
  {
    id: 'f2_camara',
    name: 'Rafael Câmara',
    shortCode: 'CAM',
    number: 1,
    nationality: 'Brasil',
    teamId: 'f2_invicta',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 35,
    ovr: 76,
    salary: 850000,
    contractYearsRemaining: 1,
    buyoutClause: 3500000,
    marketability: 91,
    mentality: 87,
    potential: 94,
    age: 20,
    avatarColor: '#009B3A',
    attributes: { pace: 80, cornering: 79, braking: 78, consistency: 77, smoothness: 78, overtaking: 82, defending: 78, wetWeather: 82, tireManagement: 77, reactionTime: 86, composure: 79, feedback: 77, stamina: 83 }
  },
  {
    id: 'f2_durksen',
    name: 'Joshua Dürksen',
    shortCode: 'DUR',
    number: 2,
    nationality: 'Paraguai',
    teamId: 'f2_invicta',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 74,
    salary: 650000,
    contractYearsRemaining: 1,
    buyoutClause: 1800000,
    marketability: 77,
    mentality: 82,
    potential: 87,
    age: 22,
    avatarColor: '#D52B1E',
    attributes: { pace: 76, cornering: 75, braking: 75, consistency: 73, smoothness: 74, overtaking: 78, defending: 75, wetWeather: 76, tireManagement: 74, reactionTime: 83, composure: 76, feedback: 74, stamina: 80 }
  },

  // 2. Hitech TGR
  {
    id: 'f2_herta',
    name: 'Colton Herta',
    shortCode: 'HER',
    number: 3,
    nationality: 'Estados Unidos',
    teamId: 'f2_hitech',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 50,
    ovr: 80,
    salary: 2500000,
    contractYearsRemaining: 1,
    buyoutClause: 12000000,
    marketability: 89,
    mentality: 85,
    potential: 89,
    age: 25,
    avatarColor: '#C59B38',
    attributes: { pace: 83, cornering: 82, braking: 81, consistency: 78, smoothness: 79, overtaking: 85, defending: 80, wetWeather: 80, tireManagement: 79, reactionTime: 89, composure: 81, feedback: 80, stamina: 87 }
  },
  {
    id: 'f2_miyata',
    name: 'Ritomo Miyata',
    shortCode: 'MIY',
    number: 4,
    nationality: 'Japão',
    teamId: 'f2_hitech',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 700000,
    contractYearsRemaining: 1,
    buyoutClause: 1900000,
    marketability: 79,
    mentality: 80,
    potential: 84,
    age: 26,
    avatarColor: '#BC002D',
    attributes: { pace: 77, cornering: 76, braking: 76, consistency: 77, smoothness: 77, overtaking: 76, defending: 76, wetWeather: 77, tireManagement: 78, reactionTime: 81, composure: 78, feedback: 79, stamina: 80 }
  },

  // 3. Campos Racing
  {
    id: 'f2_leon',
    name: 'Noel León',
    shortCode: 'LEO',
    number: 5,
    nationality: 'México',
    teamId: 'f2_campos',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 74,
    salary: 650000,
    contractYearsRemaining: 1,
    buyoutClause: 1800000,
    marketability: 78,
    mentality: 81,
    potential: 88,
    age: 21,
    avatarColor: '#006847',
    attributes: { pace: 76, cornering: 75, braking: 74, consistency: 74, smoothness: 74, overtaking: 77, defending: 75, wetWeather: 76, tireManagement: 74, reactionTime: 83, composure: 76, feedback: 74, stamina: 80 }
  },
  {
    id: 'f2_tsolov',
    name: 'Nikola Tsolov',
    shortCode: 'TSO',
    number: 6,
    nationality: 'Bulgária',
    teamId: 'f2_campos',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 700000,
    contractYearsRemaining: 1,
    buyoutClause: 2200000,
    marketability: 79,
    mentality: 83,
    potential: 91,
    age: 19,
    avatarColor: '#00966E',
    attributes: { pace: 78, cornering: 77, braking: 76, consistency: 74, smoothness: 75, overtaking: 80, defending: 76, wetWeather: 78, tireManagement: 74, reactionTime: 85, composure: 76, feedback: 74, stamina: 81 }
  },

  // 4. DAMS Lucas Oil
  {
    id: 'f2_beganovic',
    name: 'Dino Beganovic',
    shortCode: 'BEG',
    number: 7,
    nationality: 'Suécia',
    teamId: 'f2_dams',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 35,
    ovr: 76,
    salary: 800000,
    contractYearsRemaining: 1,
    buyoutClause: 2600000,
    marketability: 80,
    mentality: 85,
    potential: 90,
    age: 22,
    avatarColor: '#FECC00',
    attributes: { pace: 78, cornering: 78, braking: 77, consistency: 77, smoothness: 77, overtaking: 79, defending: 78, wetWeather: 80, tireManagement: 77, reactionTime: 84, composure: 80, feedback: 78, stamina: 82 }
  },
  {
    id: 'f2_bilinski',
    name: 'Roman Bilinski',
    shortCode: 'BIL',
    number: 8,
    nationality: 'Polônia',
    teamId: 'f2_dams',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 73,
    salary: 600000,
    contractYearsRemaining: 1,
    buyoutClause: 1500000,
    marketability: 74,
    mentality: 80,
    potential: 86,
    age: 21,
    avatarColor: '#DC143C',
    attributes: { pace: 75, cornering: 74, braking: 73, consistency: 74, smoothness: 73, overtaking: 75, defending: 73, wetWeather: 75, tireManagement: 74, reactionTime: 81, composure: 75, feedback: 73, stamina: 79 }
  },

  // 5. MP Motorsport
  {
    id: 'f2_mini',
    name: 'Gabriele Minì',
    shortCode: 'MIN',
    number: 9,
    nationality: 'Itália',
    teamId: 'f2_mp',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 35,
    ovr: 76,
    salary: 800000,
    contractYearsRemaining: 1,
    buyoutClause: 2800000,
    marketability: 82,
    mentality: 86,
    potential: 92,
    age: 20,
    avatarColor: '#008C45',
    attributes: { pace: 79, cornering: 78, braking: 77, consistency: 77, smoothness: 77, overtaking: 80, defending: 78, wetWeather: 80, tireManagement: 77, reactionTime: 86, composure: 79, feedback: 77, stamina: 82 }
  },
  {
    id: 'f2_goethe',
    name: 'Oliver Goethe',
    shortCode: 'GOE',
    number: 10,
    nationality: 'Alemanha',
    teamId: 'f2_mp',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 700000,
    contractYearsRemaining: 1,
    buyoutClause: 2000000,
    marketability: 76,
    mentality: 83,
    potential: 89,
    age: 21,
    avatarColor: '#DD0000',
    attributes: { pace: 77, cornering: 76, braking: 76, consistency: 75, smoothness: 75, overtaking: 78, defending: 76, wetWeather: 78, tireManagement: 75, reactionTime: 84, composure: 77, feedback: 75, stamina: 80 }
  },

  // 6. PREMA Racing
  {
    id: 'f2_montoya',
    name: 'Sebastián Montoya',
    shortCode: 'MOY',
    number: 11,
    nationality: 'Colômbia',
    teamId: 'f2_prema',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 74,
    salary: 650000,
    contractYearsRemaining: 1,
    buyoutClause: 1900000,
    marketability: 83,
    mentality: 82,
    potential: 88,
    age: 20,
    avatarColor: '#FCD116',
    attributes: { pace: 77, cornering: 76, braking: 74, consistency: 72, smoothness: 73, overtaking: 79, defending: 75, wetWeather: 77, tireManagement: 73, reactionTime: 84, composure: 74, feedback: 74, stamina: 80 }
  },
  {
    id: 'f2_boya',
    name: 'Mari Boya',
    shortCode: 'BOY',
    number: 12,
    nationality: 'Espanha',
    teamId: 'f2_prema',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 74,
    salary: 650000,
    contractYearsRemaining: 1,
    buyoutClause: 1800000,
    marketability: 76,
    mentality: 81,
    potential: 87,
    age: 21,
    avatarColor: '#AA151B',
    attributes: { pace: 76, cornering: 75, braking: 75, consistency: 74, smoothness: 74, overtaking: 77, defending: 75, wetWeather: 76, tireManagement: 74, reactionTime: 83, composure: 76, feedback: 74, stamina: 80 }
  },

  // 7. Rodin Motorsport
  {
    id: 'f2_stenshorne',
    name: 'Martinius Stenshorne',
    shortCode: 'STE',
    number: 14,
    nationality: 'Noruega',
    teamId: 'f2_rodin',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 700000,
    contractYearsRemaining: 1,
    buyoutClause: 2100000,
    marketability: 76,
    mentality: 83,
    potential: 90,
    age: 20,
    avatarColor: '#00205B',
    attributes: { pace: 77, cornering: 77, braking: 75, consistency: 74, smoothness: 75, overtaking: 79, defending: 75, wetWeather: 79, tireManagement: 75, reactionTime: 85, composure: 77, feedback: 75, stamina: 81 }
  },
  {
    id: 'f2_dunne',
    name: 'Alex Dunne',
    shortCode: 'DUN',
    number: 15,
    nationality: 'Irlanda',
    teamId: 'f2_rodin',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 700000,
    contractYearsRemaining: 1,
    buyoutClause: 2100000,
    marketability: 77,
    mentality: 83,
    potential: 90,
    age: 20,
    avatarColor: '#169B62',
    attributes: { pace: 78, cornering: 76, braking: 75, consistency: 74, smoothness: 74, overtaking: 80, defending: 75, wetWeather: 78, tireManagement: 74, reactionTime: 85, composure: 76, feedback: 74, stamina: 81 }
  },

  // 8. ART Grand Prix
  {
    id: 'f2_maini',
    name: 'Kush Maini',
    shortCode: 'MAI',
    number: 16,
    nationality: 'Índia',
    teamId: 'f2_art',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 700000,
    contractYearsRemaining: 1,
    buyoutClause: 2000000,
    marketability: 85,
    mentality: 81,
    potential: 85,
    age: 25,
    avatarColor: '#FF9933',
    attributes: { pace: 77, cornering: 76, braking: 76, consistency: 76, smoothness: 75, overtaking: 77, defending: 77, wetWeather: 77, tireManagement: 76, reactionTime: 82, composure: 78, feedback: 76, stamina: 80 }
  },
  {
    id: 'f2_inthraphuvasak',
    name: 'Tasanapol Inthraphuvasak',
    shortCode: 'INT',
    number: 17,
    nationality: 'Tailândia',
    teamId: 'f2_art',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 72,
    salary: 550000,
    contractYearsRemaining: 1,
    buyoutClause: 1400000,
    marketability: 74,
    mentality: 79,
    potential: 85,
    age: 20,
    avatarColor: '#A51931',
    attributes: { pace: 74, cornering: 73, braking: 72, consistency: 72, smoothness: 73, overtaking: 74, defending: 72, wetWeather: 74, tireManagement: 72, reactionTime: 81, composure: 74, feedback: 72, stamina: 78 }
  },

  // 9. AIX Racing
  {
    id: 'f2_fittipaldi_jr',
    name: 'Emerson Fittipaldi Jr.',
    shortCode: 'EFJ',
    number: 20,
    nationality: 'Brasil',
    teamId: 'f2_aix',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 73,
    salary: 600000,
    contractYearsRemaining: 1,
    buyoutClause: 1800000,
    marketability: 88,
    mentality: 84,
    potential: 89,
    age: 19,
    avatarColor: '#009B3A',
    attributes: { pace: 76, cornering: 75, braking: 74, consistency: 73, smoothness: 74, overtaking: 77, defending: 74, wetWeather: 76, tireManagement: 74, reactionTime: 84, composure: 75, feedback: 74, stamina: 80 }
  },
  {
    id: 'f2_shields',
    name: 'Cian Shields',
    shortCode: 'SHI',
    number: 21,
    nationality: 'Reino Unido',
    teamId: 'f2_aix',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 71,
    salary: 500000,
    contractYearsRemaining: 1,
    buyoutClause: 1200000,
    marketability: 71,
    mentality: 77,
    potential: 82,
    age: 20,
    avatarColor: '#012169',
    attributes: { pace: 73, cornering: 72, braking: 71, consistency: 71, smoothness: 72, overtaking: 73, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 80, composure: 72, feedback: 71, stamina: 77 }
  },

  // 10. Van Amersfoort Racing
  {
    id: 'f2_varrone',
    name: 'Nicolás Varrone',
    shortCode: 'VAR',
    number: 22,
    nationality: 'Argentina',
    teamId: 'f2_var',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 700000,
    contractYearsRemaining: 1,
    buyoutClause: 2000000,
    marketability: 82,
    mentality: 84,
    potential: 86,
    age: 25,
    avatarColor: '#74ACDF',
    attributes: { pace: 77, cornering: 76, braking: 77, consistency: 77, smoothness: 76, overtaking: 78, defending: 77, wetWeather: 78, tireManagement: 78, reactionTime: 83, composure: 79, feedback: 78, stamina: 82 }
  },
  {
    id: 'f2_villagomez',
    name: 'Rafael Villagómez',
    shortCode: 'VIL',
    number: 23,
    nationality: 'México',
    teamId: 'f2_var',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 72,
    salary: 580000,
    contractYearsRemaining: 1,
    buyoutClause: 1500000,
    marketability: 76,
    mentality: 79,
    potential: 82,
    age: 24,
    avatarColor: '#006847',
    attributes: { pace: 73, cornering: 73, braking: 72, consistency: 73, smoothness: 72, overtaking: 74, defending: 73, wetWeather: 74, tireManagement: 73, reactionTime: 80, composure: 74, feedback: 73, stamina: 78 }
  },

  // 11. Trident
  {
    id: 'f2_van_hoepen',
    name: 'Laurens van Hoepen',
    shortCode: 'HOE',
    number: 24,
    nationality: 'Holanda',
    teamId: 'f2_trident',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 74,
    salary: 650000,
    contractYearsRemaining: 1,
    buyoutClause: 1900000,
    marketability: 76,
    mentality: 82,
    potential: 88,
    age: 20,
    avatarColor: '#21468B',
    attributes: { pace: 76, cornering: 75, braking: 75, consistency: 74, smoothness: 75, overtaking: 77, defending: 75, wetWeather: 77, tireManagement: 74, reactionTime: 83, composure: 76, feedback: 74, stamina: 80 }
  },
  {
    id: 'f2_bennett',
    name: 'John Bennett',
    shortCode: 'BEN',
    number: 25,
    nationality: 'Reino Unido',
    teamId: 'f2_trident',
    series: 'F2',
    isAffiliate: true,
    requiredReputation: 30,
    ovr: 73,
    salary: 600000,
    contractYearsRemaining: 1,
    buyoutClause: 1600000,
    marketability: 74,
    mentality: 80,
    potential: 86,
    age: 21,
    avatarColor: '#012169',
    attributes: { pace: 75, cornering: 74, braking: 74, consistency: 73, smoothness: 73, overtaking: 75, defending: 73, wetWeather: 76, tireManagement: 73, reactionTime: 82, composure: 75, feedback: 73, stamina: 79 }
  }
];

// ============================================================================
// 3. MERCADO DE PILOTOS: FÓRMULA 3 (30 PILOTOS OFICIAIS - TEMPORADA 2026)
// ============================================================================
export const F3_DRIVERS_REAL: Driver[] = [
  // 1. Campos Racing
  {
    id: 'f3_nael',
    name: 'Théophile Naël',
    shortCode: 'NAE',
    number: 1,
    nationality: 'França',
    teamId: 'f3_campos',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 320000,
    contractYearsRemaining: 1,
    buyoutClause: 1200000,
    marketability: 73,
    mentality: 81,
    potential: 88,
    age: 18,
    avatarColor: '#0055A5',
    attributes: { pace: 74, cornering: 73, braking: 72, consistency: 72, smoothness: 72, overtaking: 75, defending: 72, wetWeather: 74, tireManagement: 72, reactionTime: 82, composure: 73, feedback: 71, stamina: 78 }
  },
  {
    id: 'f3_ugochukwu',
    name: 'Ugo Ugochukwu',
    shortCode: 'UGO',
    number: 2,
    nationality: 'Estados Unidos',
    teamId: 'f3_campos',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 73,
    salary: 380000,
    contractYearsRemaining: 1,
    buyoutClause: 1500000,
    marketability: 82,
    mentality: 85,
    potential: 92,
    age: 18,
    avatarColor: '#B22234',
    attributes: { pace: 76, cornering: 75, braking: 74, consistency: 73, smoothness: 74, overtaking: 78, defending: 74, wetWeather: 76, tireManagement: 73, reactionTime: 85, composure: 76, feedback: 73, stamina: 80 }
  },
  {
    id: 'f3_rivera',
    name: 'Ernesto Rivera',
    shortCode: 'RIV',
    number: 3,
    nationality: 'México',
    teamId: 'f3_campos',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1100000,
    marketability: 74,
    mentality: 80,
    potential: 87,
    age: 17,
    avatarColor: '#006847',
    attributes: { pace: 73, cornering: 72, braking: 71, consistency: 71, smoothness: 71, overtaking: 74, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 81, composure: 72, feedback: 70, stamina: 77 }
  },

  // 2. Trident
  {
    id: 'f3_stromsted',
    name: 'Noah Strømsted',
    shortCode: 'STR_N',
    number: 4,
    nationality: 'Dinamarca',
    teamId: 'f3_trident',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 320000,
    contractYearsRemaining: 1,
    buyoutClause: 1200000,
    marketability: 73,
    mentality: 81,
    potential: 88,
    age: 18,
    avatarColor: '#C60C30',
    attributes: { pace: 74, cornering: 73, braking: 73, consistency: 72, smoothness: 72, overtaking: 75, defending: 72, wetWeather: 75, tireManagement: 72, reactionTime: 82, composure: 73, feedback: 72, stamina: 78 }
  },
  {
    id: 'f3_slater',
    name: 'Freddie Slater',
    shortCode: 'SLA',
    number: 5,
    nationality: 'Reino Unido',
    teamId: 'f3_trident',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 73,
    salary: 390000,
    contractYearsRemaining: 1,
    buyoutClause: 1600000,
    marketability: 81,
    mentality: 86,
    potential: 93,
    age: 17,
    avatarColor: '#012169',
    attributes: { pace: 76, cornering: 75, braking: 74, consistency: 74, smoothness: 74, overtaking: 79, defending: 74, wetWeather: 77, tireManagement: 73, reactionTime: 86, composure: 76, feedback: 73, stamina: 80 }
  },
  {
    id: 'f3_depalo',
    name: 'Matteo De Palo',
    shortCode: 'DEP',
    number: 6,
    nationality: 'Itália',
    teamId: 'f3_trident',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1000000,
    marketability: 72,
    mentality: 79,
    potential: 86,
    age: 18,
    avatarColor: '#008C45',
    attributes: { pace: 73, cornering: 72, braking: 71, consistency: 71, smoothness: 71, overtaking: 73, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 81, composure: 72, feedback: 70, stamina: 77 }
  },

  // 3. MP Motorsport
  {
    id: 'f3_colnaghi',
    name: 'Mattia Colnaghi',
    shortCode: 'COL_M',
    number: 7,
    nationality: 'Itália',
    teamId: 'f3_mp',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 340000,
    contractYearsRemaining: 1,
    buyoutClause: 1300000,
    marketability: 76,
    mentality: 83,
    potential: 90,
    age: 18,
    avatarColor: '#008C45',
    attributes: { pace: 75, cornering: 74, braking: 73, consistency: 72, smoothness: 72, overtaking: 76, defending: 72, wetWeather: 75, tireManagement: 72, reactionTime: 83, composure: 74, feedback: 72, stamina: 78 }
  },
  {
    id: 'f3_taponen',
    name: 'Tuukka Taponen',
    shortCode: 'TAP',
    number: 8,
    nationality: 'Finlândia',
    teamId: 'f3_mp',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 73,
    salary: 380000,
    contractYearsRemaining: 1,
    buyoutClause: 1500000,
    marketability: 79,
    mentality: 85,
    potential: 92,
    age: 19,
    avatarColor: '#003580',
    attributes: { pace: 76, cornering: 75, braking: 74, consistency: 74, smoothness: 74, overtaking: 77, defending: 75, wetWeather: 78, tireManagement: 74, reactionTime: 85, composure: 77, feedback: 74, stamina: 80 }
  },
  {
    id: 'f3_giusti',
    name: 'Alessandro Giusti',
    shortCode: 'GIU',
    number: 9,
    nationality: 'França',
    teamId: 'f3_mp',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 330000,
    contractYearsRemaining: 1,
    buyoutClause: 1250000,
    marketability: 75,
    mentality: 82,
    potential: 89,
    age: 19,
    avatarColor: '#0055A5',
    attributes: { pace: 75, cornering: 74, braking: 72, consistency: 72, smoothness: 72, overtaking: 75, defending: 73, wetWeather: 75, tireManagement: 72, reactionTime: 83, composure: 74, feedback: 72, stamina: 78 }
  },

  // 4. ART Grand Prix
  {
    id: 'f3_tramnitz',
    name: 'Tim Tramnitz',
    shortCode: 'TRA',
    number: 10,
    nationality: 'Alemanha',
    teamId: 'f3_art',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 73,
    salary: 360000,
    contractYearsRemaining: 1,
    buyoutClause: 1400000,
    marketability: 77,
    mentality: 83,
    potential: 89,
    age: 21,
    avatarColor: '#DD0000',
    attributes: { pace: 75, cornering: 75, braking: 74, consistency: 74, smoothness: 73, overtaking: 76, defending: 74, wetWeather: 77, tireManagement: 73, reactionTime: 83, composure: 75, feedback: 73, stamina: 79 }
  },
  {
    id: 'f3_le',
    name: 'Kanato Le',
    shortCode: 'LEK',
    number: 11,
    nationality: 'Japão',
    teamId: 'f3_art',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1100000,
    marketability: 75,
    mentality: 80,
    potential: 87,
    age: 18,
    avatarColor: '#BC002D',
    attributes: { pace: 73, cornering: 72, braking: 72, consistency: 71, smoothness: 72, overtaking: 74, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 82, composure: 72, feedback: 71, stamina: 77 }
  },
  {
    id: 'f3_gladysz',
    name: 'Maciej Gładysz',
    shortCode: 'GLA',
    number: 12,
    nationality: 'Polônia',
    teamId: 'f3_art',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1100000,
    marketability: 73,
    mentality: 80,
    potential: 87,
    age: 17,
    avatarColor: '#DC143C',
    attributes: { pace: 73, cornering: 73, braking: 71, consistency: 71, smoothness: 71, overtaking: 74, defending: 71, wetWeather: 74, tireManagement: 71, reactionTime: 81, composure: 72, feedback: 70, stamina: 77 }
  },

  // 5. Van Amersfoort Racing
  {
    id: 'f3_yamakoshi',
    name: 'Hiyu Yamakoshi',
    shortCode: 'YAM',
    number: 14,
    nationality: 'Japão',
    teamId: 'f3_var',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1050000,
    marketability: 74,
    mentality: 79,
    potential: 86,
    age: 18,
    avatarColor: '#BC002D',
    attributes: { pace: 73, cornering: 72, braking: 71, consistency: 71, smoothness: 71, overtaking: 73, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 81, composure: 72, feedback: 71, stamina: 77 }
  },
  {
    id: 'f3_deligny',
    name: 'Enzo Deligny',
    shortCode: 'DEL',
    number: 15,
    nationality: 'França',
    teamId: 'f3_var',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 340000,
    contractYearsRemaining: 1,
    buyoutClause: 1350000,
    marketability: 77,
    mentality: 82,
    potential: 90,
    age: 17,
    avatarColor: '#0055A5',
    attributes: { pace: 75, cornering: 74, braking: 73, consistency: 72, smoothness: 72, overtaking: 76, defending: 72, wetWeather: 75, tireManagement: 72, reactionTime: 84, composure: 74, feedback: 72, stamina: 78 }
  },
  {
    id: 'f3_delpino',
    name: 'Bruno del Pino',
    shortCode: 'PIN_B',
    number: 16,
    nationality: 'Espanha',
    teamId: 'f3_var',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1100000,
    marketability: 74,
    mentality: 80,
    potential: 87,
    age: 18,
    avatarColor: '#AA151B',
    attributes: { pace: 73, cornering: 73, braking: 72, consistency: 71, smoothness: 71, overtaking: 74, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 82, composure: 72, feedback: 71, stamina: 77 }
  },

  // 6. Rodin Motorsport
  {
    id: 'f3_clerot',
    name: 'Pedro Clerot',
    shortCode: 'CLE',
    number: 17,
    nationality: 'Brasil',
    teamId: 'f3_rodin',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 73,
    salary: 360000,
    contractYearsRemaining: 1,
    buyoutClause: 1500000,
    marketability: 84,
    mentality: 84,
    potential: 91,
    age: 19,
    avatarColor: '#009B3A',
    attributes: { pace: 76, cornering: 75, braking: 74, consistency: 73, smoothness: 74, overtaking: 78, defending: 74, wetWeather: 77, tireManagement: 74, reactionTime: 84, composure: 76, feedback: 74, stamina: 79 }
  },
  {
    id: 'f3_badoer',
    name: 'Brando Badoer',
    shortCode: 'BAD',
    number: 18,
    nationality: 'Itália',
    teamId: 'f3_rodin',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 340000,
    contractYearsRemaining: 1,
    buyoutClause: 1350000,
    marketability: 78,
    mentality: 82,
    potential: 90,
    age: 19,
    avatarColor: '#008C45',
    attributes: { pace: 75, cornering: 74, braking: 73, consistency: 72, smoothness: 73, overtaking: 76, defending: 73, wetWeather: 75, tireManagement: 72, reactionTime: 83, composure: 74, feedback: 72, stamina: 78 }
  },
  {
    id: 'f3_ho',
    name: 'Christian Ho',
    shortCode: 'HOC',
    number: 19,
    nationality: 'Cingapura',
    teamId: 'f3_rodin',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 320000,
    contractYearsRemaining: 1,
    buyoutClause: 1250000,
    marketability: 76,
    mentality: 81,
    potential: 88,
    age: 19,
    avatarColor: '#ED2939',
    attributes: { pace: 74, cornering: 74, braking: 73, consistency: 72, smoothness: 72, overtaking: 75, defending: 72, wetWeather: 74, tireManagement: 72, reactionTime: 83, composure: 74, feedback: 72, stamina: 78 }
  },

  // 7. PREMA Racing
  {
    id: 'f3_sharp',
    name: 'Louis Sharp',
    shortCode: 'SHA',
    number: 20,
    nationality: 'Nova Zelândia',
    teamId: 'f3_prema',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 73,
    salary: 370000,
    contractYearsRemaining: 1,
    buyoutClause: 1500000,
    marketability: 79,
    mentality: 85,
    potential: 91,
    age: 18,
    avatarColor: '#CC0000',
    attributes: { pace: 76, cornering: 75, braking: 74, consistency: 74, smoothness: 73, overtaking: 78, defending: 74, wetWeather: 77, tireManagement: 73, reactionTime: 84, composure: 76, feedback: 73, stamina: 79 }
  },
  {
    id: 'f3_wharton',
    name: 'James Wharton',
    shortCode: 'WHA',
    number: 21,
    nationality: 'Austrália',
    teamId: 'f3_prema',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 330000,
    contractYearsRemaining: 1,
    buyoutClause: 1300000,
    marketability: 76,
    mentality: 82,
    potential: 89,
    age: 19,
    avatarColor: '#002B7F',
    attributes: { pace: 75, cornering: 74, braking: 73, consistency: 72, smoothness: 72, overtaking: 75, defending: 73, wetWeather: 75, tireManagement: 72, reactionTime: 83, composure: 74, feedback: 72, stamina: 78 }
  },
  {
    id: 'f3_garfias',
    name: 'José Garfias',
    shortCode: 'GAR',
    number: 22,
    nationality: 'México',
    teamId: 'f3_prema',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 70,
    salary: 280000,
    contractYearsRemaining: 1,
    buyoutClause: 950000,
    marketability: 73,
    mentality: 78,
    potential: 84,
    age: 20,
    avatarColor: '#006847',
    attributes: { pace: 72, cornering: 71, braking: 70, consistency: 70, smoothness: 70, overtaking: 72, defending: 70, wetWeather: 72, tireManagement: 70, reactionTime: 80, composure: 71, feedback: 69, stamina: 76 }
  },

  // 8. Hitech TGR
  {
    id: 'f3_shin',
    name: 'Michael Shin',
    shortCode: 'SHI_M',
    number: 23,
    nationality: 'Coreia do Sul',
    teamId: 'f3_hitech',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1050000,
    marketability: 75,
    mentality: 79,
    potential: 85,
    age: 20,
    avatarColor: '#003478',
    attributes: { pace: 73, cornering: 72, braking: 71, consistency: 71, smoothness: 71, overtaking: 73, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 81, composure: 72, feedback: 70, stamina: 77 }
  },
  {
    id: 'f3_mclaughlin',
    name: 'Fionn McLaughlin',
    shortCode: 'MCL_F',
    number: 24,
    nationality: 'Irlanda',
    teamId: 'f3_hitech',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 72,
    salary: 340000,
    contractYearsRemaining: 1,
    buyoutClause: 1350000,
    marketability: 77,
    mentality: 83,
    potential: 90,
    age: 17,
    avatarColor: '#169B62',
    attributes: { pace: 75, cornering: 74, braking: 73, consistency: 72, smoothness: 72, overtaking: 76, defending: 72, wetWeather: 76, tireManagement: 72, reactionTime: 84, composure: 74, feedback: 72, stamina: 78 }
  },
  {
    id: 'f3_nakamura',
    name: 'Jin Nakamura',
    shortCode: 'NAK',
    number: 25,
    nationality: 'Japão',
    teamId: 'f3_hitech',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1100000,
    marketability: 74,
    mentality: 80,
    potential: 86,
    age: 18,
    avatarColor: '#BC002D',
    attributes: { pace: 73, cornering: 73, braking: 72, consistency: 71, smoothness: 71, overtaking: 74, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 82, composure: 72, feedback: 71, stamina: 77 }
  },

  // 9. AIX Racing
  {
    id: 'f3_benavides',
    name: 'Brad Benavides',
    shortCode: 'BEN_B',
    number: 26,
    nationality: 'Estados Unidos',
    teamId: 'f3_aix',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1000000,
    marketability: 73,
    mentality: 78,
    potential: 83,
    age: 24,
    avatarColor: '#B22234',
    attributes: { pace: 73, cornering: 72, braking: 71, consistency: 71, smoothness: 71, overtaking: 73, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 81, composure: 72, feedback: 70, stamina: 77 }
  },
  {
    id: 'f3_david',
    name: 'Yevan David',
    shortCode: 'DAV',
    number: 27,
    nationality: 'Sri Lanka',
    teamId: 'f3_aix',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 70,
    salary: 280000,
    contractYearsRemaining: 1,
    buyoutClause: 950000,
    marketability: 74,
    mentality: 79,
    potential: 84,
    age: 18,
    avatarColor: '#FFBE29',
    attributes: { pace: 72, cornering: 71, braking: 70, consistency: 70, smoothness: 70, overtaking: 72, defending: 70, wetWeather: 72, tireManagement: 70, reactionTime: 80, composure: 71, feedback: 69, stamina: 76 }
  },
  {
    id: 'f3_barrichello',
    name: 'Fernando Barrichello',
    shortCode: 'BAR_F',
    number: 28,
    nationality: 'Brasil',
    teamId: 'f3_aix',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 310000,
    contractYearsRemaining: 1,
    buyoutClause: 1200000,
    marketability: 85,
    mentality: 82,
    potential: 87,
    age: 20,
    avatarColor: '#009B3A',
    attributes: { pace: 74, cornering: 73, braking: 72, consistency: 71, smoothness: 72, overtaking: 75, defending: 72, wetWeather: 75, tireManagement: 72, reactionTime: 82, composure: 73, feedback: 72, stamina: 78 }
  },

  // 10. DAMS Lucas Oil
  {
    id: 'f3_bhirombhakdi',
    name: 'Nandhavud Bhirombhakdi',
    shortCode: 'BHI',
    number: 29,
    nationality: 'Tailândia',
    teamId: 'f3_dams',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 70,
    salary: 280000,
    contractYearsRemaining: 1,
    buyoutClause: 900000,
    marketability: 74,
    mentality: 78,
    potential: 83,
    age: 19,
    avatarColor: '#A51931',
    attributes: { pace: 72, cornering: 71, braking: 70, consistency: 70, smoothness: 70, overtaking: 72, defending: 70, wetWeather: 72, tireManagement: 70, reactionTime: 80, composure: 71, feedback: 69, stamina: 76 }
  },
  {
    id: 'f3_lacorte',
    name: 'Nicola Lacorte',
    shortCode: 'LAC',
    number: 30,
    nationality: 'Itália',
    teamId: 'f3_dams',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 71,
    salary: 300000,
    contractYearsRemaining: 1,
    buyoutClause: 1100000,
    marketability: 74,
    mentality: 80,
    potential: 86,
    age: 18,
    avatarColor: '#008C45',
    attributes: { pace: 73, cornering: 72, braking: 72, consistency: 71, smoothness: 71, overtaking: 74, defending: 71, wetWeather: 73, tireManagement: 71, reactionTime: 81, composure: 72, feedback: 70, stamina: 77 }
  },
  {
    id: 'f3_xie',
    name: 'Gerrard Xie',
    shortCode: 'XIE',
    number: 31,
    nationality: 'China',
    teamId: 'f3_dams',
    series: 'F3',
    isAffiliate: true,
    requiredReputation: 0,
    ovr: 70,
    salary: 280000,
    contractYearsRemaining: 1,
    buyoutClause: 950000,
    marketability: 76,
    mentality: 79,
    potential: 84,
    age: 19,
    avatarColor: '#DE2910',
    attributes: { pace: 72, cornering: 71, braking: 71, consistency: 70, smoothness: 71, overtaking: 72, defending: 70, wetWeather: 72, tireManagement: 71, reactionTime: 80, composure: 71, feedback: 70, stamina: 76 }
  }
];

// ============================================================================
// 4. AGENTES LIVRES (FREE AGENTS)
// ============================================================================
export const FREE_AGENT_DRIVERS: Driver[] = [
  {
    id: 'fa_drugovich',
    name: 'Felipe Drugovich',
    shortCode: 'DRU',
    number: 34,
    nationality: 'Brasil',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 45,
    ovr: 81,
    salary: 2500000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 88,
    mentality: 87,
    potential: 88,
    age: 25,
    avatarColor: '#009B3A',
    attributes: { pace: 83, cornering: 82, braking: 81, consistency: 85, smoothness: 84, overtaking: 83, defending: 82, wetWeather: 84, tireManagement: 86, reactionTime: 86, composure: 87, feedback: 86, stamina: 85 }
  },
  {
    id: 'fa_schumacher',
    name: 'Mick Schumacher',
    shortCode: 'MSC',
    number: 47,
    nationality: 'Alemanha',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 45,
    ovr: 80,
    salary: 2800000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 93,
    mentality: 84,
    potential: 85,
    age: 26,
    avatarColor: '#DD0000',
    attributes: { pace: 81, cornering: 80, braking: 81, consistency: 80, smoothness: 81, overtaking: 82, defending: 81, wetWeather: 83, tireManagement: 82, reactionTime: 84, composure: 81, feedback: 84, stamina: 85 }
  },
  {
    id: 'fa_oward',
    name: 'Patricio O’Ward',
    shortCode: 'OWA',
    number: 29,
    nationality: 'México',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 50,
    ovr: 80,
    salary: 2800000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 89,
    mentality: 86,
    potential: 88,
    age: 26,
    avatarColor: '#FF7A00',
    attributes: { pace: 82, cornering: 82, braking: 83, consistency: 80, smoothness: 80, overtaking: 85, defending: 81, wetWeather: 82, tireManagement: 80, reactionTime: 87, composure: 83, feedback: 82, stamina: 85 }
  },
  {
    id: 'fa_vandoorne',
    name: 'Stoffel Vandoorne',
    shortCode: 'VAN',
    number: 2,
    nationality: 'Bélgica',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 45,
    ovr: 79,
    salary: 2200000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 82,
    mentality: 85,
    potential: 80,
    age: 33,
    avatarColor: '#00594F',
    attributes: { pace: 80, cornering: 80, braking: 81, consistency: 83, smoothness: 82, overtaking: 78, defending: 81, wetWeather: 82, tireManagement: 82, reactionTime: 83, composure: 85, feedback: 88, stamina: 82 }
  },
  {
    id: 'fa_giovinazzi',
    name: 'Antonio Giovinazzi',
    shortCode: 'GIO',
    number: 99,
    nationality: 'Itália',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 45,
    ovr: 79,
    salary: 2200000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 84,
    mentality: 84,
    potential: 80,
    age: 32,
    avatarColor: '#DC0000',
    attributes: { pace: 80, cornering: 80, braking: 80, consistency: 82, smoothness: 81, overtaking: 79, defending: 80, wetWeather: 81, tireManagement: 81, reactionTime: 84, composure: 84, feedback: 87, stamina: 82 }
  },
  {
    id: 'fa_hirakawa',
    name: 'Ryo Hirakawa',
    shortCode: 'HIR',
    number: 15,
    nationality: 'Japão',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 35,
    ovr: 76,
    salary: 1400000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 78,
    mentality: 82,
    potential: 80,
    age: 31,
    avatarColor: '#ED1B24',
    attributes: { pace: 78, cornering: 77, braking: 78, consistency: 79, smoothness: 79, overtaking: 76, defending: 77, wetWeather: 80, tireManagement: 80, reactionTime: 81, composure: 82, feedback: 82, stamina: 82 }
  },
  {
    id: 'fa_vesti',
    name: 'Frederik Vesti',
    shortCode: 'VES',
    number: 42,
    nationality: 'Dinamarca',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 35,
    ovr: 77,
    salary: 1500000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 77,
    mentality: 83,
    potential: 86,
    age: 24,
    avatarColor: '#00D2BE',
    attributes: { pace: 79, cornering: 78, braking: 78, consistency: 78, smoothness: 78, overtaking: 78, defending: 77, wetWeather: 79, tireManagement: 78, reactionTime: 83, composure: 80, feedback: 81, stamina: 81 }
  },
  {
    id: 'fa_pin',
    name: 'Doriane Pin',
    shortCode: 'PIN',
    number: 28,
    nationality: 'França',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 30,
    ovr: 75,
    salary: 1100000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 89,
    mentality: 86,
    potential: 91,
    age: 22,
    avatarColor: '#00D2BE',
    attributes: { pace: 78, cornering: 77, braking: 76, consistency: 76, smoothness: 77, overtaking: 79, defending: 76, wetWeather: 78, tireManagement: 76, reactionTime: 85, composure: 78, feedback: 77, stamina: 81 }
  },
  {
    id: 'fa_fornaroli',
    name: 'Leonardo Fornaroli',
    shortCode: 'FOR',
    number: 1,
    nationality: 'Itália',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 30,
    ovr: 76,
    salary: 1200000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 79,
    mentality: 84,
    potential: 89,
    age: 21,
    avatarColor: '#FF7A00',
    attributes: { pace: 78, cornering: 78, braking: 77, consistency: 79, smoothness: 78, overtaking: 77, defending: 78, wetWeather: 78, tireManagement: 78, reactionTime: 83, composure: 81, feedback: 79, stamina: 81 }
  },
  {
    id: 'fa_iwasa',
    name: 'Ayumu Iwasa',
    shortCode: 'IWA',
    number: 40,
    nationality: 'Japão',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 35,
    ovr: 77,
    salary: 1500000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 80,
    mentality: 84,
    potential: 86,
    age: 24,
    avatarColor: '#0B1936',
    attributes: { pace: 79, cornering: 79, braking: 78, consistency: 78, smoothness: 78, overtaking: 80, defending: 78, wetWeather: 80, tireManagement: 78, reactionTime: 84, composure: 79, feedback: 80, stamina: 81 }
  },
  {
    id: 'fa_magnussen',
    name: 'Kevin Magnussen',
    shortCode: 'MAG',
    number: 20,
    nationality: 'Dinamarca',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 50,
    ovr: 81,
    salary: 3000000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 82,
    mentality: 87,
    potential: 81,
    age: 33,
    avatarColor: '#C60C30',
    attributes: { pace: 82, cornering: 81, braking: 82, consistency: 80, smoothness: 79, overtaking: 86, defending: 91, wetWeather: 83, tireManagement: 80, reactionTime: 86, composure: 81, feedback: 82, stamina: 84 }
  },
  {
    id: 'fa_ricciardo',
    name: 'Daniel Ricciardo',
    shortCode: 'RIC',
    number: 3,
    nationality: 'Austrália',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 60,
    ovr: 82,
    salary: 4500000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 96,
    mentality: 85,
    potential: 82,
    age: 36,
    avatarColor: '#002B7F',
    attributes: { pace: 83, cornering: 82, braking: 87, consistency: 82, smoothness: 83, overtaking: 88, defending: 83, wetWeather: 84, tireManagement: 84, reactionTime: 85, composure: 86, feedback: 86, stamina: 83 }
  },
  {
    id: 'fa_zhou',
    name: 'Guanyu Zhou',
    shortCode: 'ZHO',
    number: 24,
    nationality: 'China',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 40,
    ovr: 78,
    salary: 2000000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 92,
    mentality: 82,
    potential: 82,
    age: 26,
    avatarColor: '#DE2910',
    attributes: { pace: 79, cornering: 79, braking: 78, consistency: 81, smoothness: 80, overtaking: 78, defending: 80, wetWeather: 79, tireManagement: 81, reactionTime: 83, composure: 82, feedback: 81, stamina: 82 }
  },
  {
    id: 'fa_sargeant',
    name: 'Logan Sargeant',
    shortCode: 'SAR',
    number: 2,
    nationality: 'EUA',
    teamId: 'free_agent',
    isFreeAgent: true,
    requiredReputation: 30,
    ovr: 76,
    salary: 1500000,
    contractYearsRemaining: 0,
    buyoutClause: 0,
    marketability: 84,
    mentality: 77,
    potential: 81,
    age: 25,
    avatarColor: '#3C3B6E',
    attributes: { pace: 78, cornering: 77, braking: 76, consistency: 74, smoothness: 75, overtaking: 77, defending: 76, wetWeather: 75, tireManagement: 76, reactionTime: 82, composure: 74, feedback: 76, stamina: 80 }
  }
];

export const ALL_MARKET_DRIVERS: Driver[] = [
  ...F1_DRIVERS_REAL,
  ...F2_DRIVERS_REAL,
  ...F3_DRIVERS_REAL,
  ...FREE_AGENT_DRIVERS
];

// ============================================================================


// =============================================================================
// 5. MERCADO DE CORPO TÉCNICO (STAFF COMPLETO F1, F2, F3 & AGENTES LIVRES)
// =============================================================================

export interface StaffAttributes {
  tecnica: number;
  criatividade: number;
  rigorValidacao: number;
  lideranca: number;
  comunicacao: number;
  gestaoPrazo: number;
  adaptacao: number;
  resiliencia?: number;
  visaoEstrategica?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'head_aero' | 'head_pu' | 'head_management' | 'head_mechanics' | 'race_engineer' | 'sporting_director' | 'chief_mechanic';
  rating: number;
  specialty: string;
  designDna: Specialization;
  staffPhilosophyTag: 'INOVADOR' | 'CONSERVADOR' | 'ESPECIALISTA' | string;
  salary: number;
  buyoutClause: number;
  currentTeam: string;
  isFictional: boolean;
  attributes: StaffAttributes;
  mentality?: number;
  age?: number;
  teamOrigin?: string;
  preferredCarPhilosophy?: any;
}

export const marketData: StaffMember[] = [
  // ===========================================================================
  // 1. FÓRMULA 1 (2026) - GERENCIAMENTO & CHEFES DE EQUIPE (HEAD_MANAGEMENT)
  // ===========================================================================
  {
    id: 'mgmt_f1_toto', name: 'Toto Wolff', role: 'head_management', rating: 95, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Gestão de Equipe e Política', salary: 12000000, buyoutClause: 25000000, currentTeam: 'Mercedes-AMG', isFictional: false,
    attributes: { tecnica: 80, criatividade: 92, rigorValidacao: 85, lideranca: 99, comunicacao: 95, gestaoPrazo: 90, adaptacao: 95, visaoEstrategica: 98 }
  },
  {
    id: 'mgmt_f1_vasseur', name: 'Frédéric Vasseur', role: 'head_management', rating: 90, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.CRISIS_MANAGER, specialty: 'Gestão de Crise e Foco', salary: 8000000, buyoutClause: 15000000, currentTeam: 'Ferrari', isFictional: false,
    attributes: { tecnica: 85, criatividade: 75, rigorValidacao: 92, lideranca: 90, comunicacao: 85, gestaoPrazo: 95, adaptacao: 80, visaoEstrategica: 88 }
  },
  {
    id: 'mgmt_f1_mekies', name: 'Laurent Mekies', role: 'head_management', rating: 89, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.POLITICIAN, specialty: 'Operações de Paddock e Governança', salary: 6500000, buyoutClause: 12000000, currentTeam: 'Red Bull Racing', isFictional: false,
    attributes: { tecnica: 84, criatividade: 80, rigorValidacao: 89, lideranca: 91, comunicacao: 88, gestaoPrazo: 88, adaptacao: 86, visaoEstrategica: 89 }
  },
  {
    id: 'mgmt_f1_stella', name: 'Andrea Stella', role: 'head_management', rating: 91, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.PUBLIC_RELATIONS, specialty: 'Cultura de Equipe e Motivação', salary: 7500000, buyoutClause: 14000000, currentTeam: 'McLaren', isFictional: false,
    attributes: { tecnica: 88, criatividade: 85, rigorValidacao: 88, lideranca: 95, comunicacao: 92, gestaoPrazo: 85, adaptacao: 90, visaoEstrategica: 90 }
  },
  {
    id: 'mgmt_f1_wheatley', name: 'Jonathan Wheatley', role: 'head_management', rating: 94, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.CRISIS_MANAGER, specialty: 'Operações de Pit & Estratégia', salary: 7000000, buyoutClause: 12000000, currentTeam: 'Audi', isFictional: false,
    attributes: { tecnica: 85, criatividade: 90, rigorValidacao: 95, lideranca: 96, comunicacao: 95, gestaoPrazo: 94, adaptacao: 92, visaoEstrategica: 90 }
  },
  {
    id: 'mgmt_f1_briatore', name: 'Flavio Briatore', role: 'head_management', rating: 87, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.POLITICIAN, specialty: 'Negociações Comerciais e Liderança Executiva', salary: 6000000, buyoutClause: 10000000, currentTeam: 'Alpine', isFictional: false,
    attributes: { tecnica: 70, criatividade: 88, rigorValidacao: 78, lideranca: 92, comunicacao: 96, gestaoPrazo: 82, adaptacao: 88, visaoEstrategica: 94 }
  },
  {
    id: 'mgmt_f1_permane', name: 'Alan Permane', role: 'head_management', rating: 84, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.CRISIS_MANAGER, specialty: 'Operações Esportivas e Regulamento', salary: 4200000, buyoutClause: 6500000, currentTeam: 'Racing Bulls', isFictional: false,
    attributes: { tecnica: 82, criatividade: 74, rigorValidacao: 91, lideranca: 86, comunicacao: 84, gestaoPrazo: 89, adaptacao: 80, visaoEstrategica: 85 }
  },
  {
    id: 'mgmt_f1_komatsu', name: 'Ayao Komatsu', role: 'head_management', rating: 84, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.FINANCIAL, specialty: 'Gestão Financeira e Técnica', salary: 4500000, buyoutClause: 7000000, currentTeam: 'Haas F1 Team', isFictional: false,
    attributes: { tecnica: 75, criatividade: 70, rigorValidacao: 92, lideranca: 85, comunicacao: 80, gestaoPrazo: 90, adaptacao: 75, visaoEstrategica: 92 }
  },
  {
    id: 'mgmt_f1_vowles', name: 'James Vowles', role: 'head_management', rating: 86, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Cultura de Engenharia & Estratégia de Longo Prazo', salary: 5000000, buyoutClause: 8500000, currentTeam: 'Williams', isFictional: false,
    attributes: { tecnica: 86, criatividade: 84, rigorValidacao: 88, lideranca: 90, comunicacao: 93, gestaoPrazo: 86, adaptacao: 85, visaoEstrategica: 92 }
  },
  {
    id: 'mgmt_f1_lowdon', name: 'Graeme Lowdon', role: 'head_management', rating: 80, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.FINANCIAL, specialty: 'Coordenação Esportiva e Logística Global', salary: 3200000, buyoutClause: 4500000, currentTeam: 'Cadillac F1', isFictional: false,
    attributes: { tecnica: 72, criatividade: 74, rigorValidacao: 85, lideranca: 82, comunicacao: 84, gestaoPrazo: 86, adaptacao: 78, visaoEstrategica: 84 }
  },

  // ===========================================================================
  // 2. FÓRMULA 1 (2026) - DEPARTAMENTO DE AERODINÂMICA (HEAD_AERO)
  // (SEM CONSERVADORES — APENAS INOVADORES E ESPECIALISTAS)
  // ===========================================================================
  {
    id: 'staff_newey', name: 'Adrian Newey', role: 'head_aero', rating: 99, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.INNOVATOR, specialty: 'Gênio da Aerodinâmica & Efeito Solo', salary: 15000000, buyoutClause: 30000000, currentTeam: 'Aston Martin', isFictional: false,
    attributes: { tecnica: 99, criatividade: 99, rigorValidacao: 95, lideranca: 95, comunicacao: 92, gestaoPrazo: 92, adaptacao: 95 }
  },
  {
    id: 'aero_f1_wache', name: 'Pierre Waché', role: 'head_aero', rating: 90, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.HIGH_DOWNFORCE, specialty: 'Alta Carga Aerodinâmica (High Downforce)', salary: 7500000, buyoutClause: 15000000, currentTeam: 'Red Bull Racing', isFictional: false,
    attributes: { tecnica: 92, criatividade: 88, rigorValidacao: 90, lideranca: 85, comunicacao: 80, gestaoPrazo: 85, adaptacao: 85 }
  },
  {
    id: 'aero_f1_prodromou', name: 'Peter Prodromou', role: 'head_aero', rating: 89, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.AERO_EFFICIENCY, specialty: 'Eficiência Aerodinâmica L/D & Conceito', salary: 6000000, buyoutClause: 10000000, currentTeam: 'McLaren', isFictional: false,
    attributes: { tecnica: 91, criatividade: 86, rigorValidacao: 92, lideranca: 82, comunicacao: 85, gestaoPrazo: 88, adaptacao: 84 }
  },
  {
    id: 'aero_f1_tondi', name: 'Diego Tondi', role: 'head_aero', rating: 84, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.LOW_DRAG, specialty: 'Baixo Arrasto & Velocidade Final', salary: 3800000, buyoutClause: 5000000, currentTeam: 'Ferrari', isFictional: false,
    attributes: { tecnica: 86, criatividade: 75, rigorValidacao: 85, lideranca: 80, comunicacao: 75, gestaoPrazo: 82, adaptacao: 78 }
  },
  {
    id: 'aero_f1_balbo', name: 'Enrico Balbo', role: 'head_aero', rating: 86, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MECHANICAL_GRIP, specialty: 'Interação Aero-Mecânica & Grip de Curva', salary: 4500000, buyoutClause: 8000000, currentTeam: 'Red Bull Racing', isFictional: false,
    attributes: { tecnica: 89, criatividade: 80, rigorValidacao: 88, lideranca: 78, comunicacao: 82, gestaoPrazo: 80, adaptacao: 84 }
  },
  {
    id: 'aero_f1_murphy', name: 'Jarrod Murphy', role: 'head_aero', rating: 88, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.AERO_EFFICIENCY, specialty: 'Eficiência Aerodinâmica (L/D) & CFD Avançado', salary: 5200000, buyoutClause: 9000000, currentTeam: 'Mercedes-AMG', isFictional: false,
    attributes: { tecnica: 90, criatividade: 84, rigorValidacao: 91, lideranca: 84, comunicacao: 82, gestaoPrazo: 86, adaptacao: 83 }
  },
  {
    id: 'aero_f1_salter', name: 'Tony Salter', role: 'head_aero', rating: 80, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.LOW_DRAG, specialty: 'Eficiência Transônica & Carenagem Baixo Arrasto', salary: 2800000, buyoutClause: 3500000, currentTeam: 'Audi', isFictional: false,
    attributes: { tecnica: 82, criatividade: 78, rigorValidacao: 83, lideranca: 76, comunicacao: 75, gestaoPrazo: 80, adaptacao: 76 }
  },
  {
    id: 'aero_f1_debeer', name: 'Dirk de Beer', role: 'head_aero', rating: 82, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.HIGH_DOWNFORCE, specialty: 'Alta Carga de Assoalho & Canais Venturi', salary: 3200000, buyoutClause: 4200000, currentTeam: 'Alpine', isFictional: false,
    attributes: { tecnica: 84, criatividade: 86, rigorValidacao: 78, lideranca: 78, comunicacao: 76, gestaoPrazo: 78, adaptacao: 80 }
  },
  {
    id: 'aero_f1_machin', name: 'Peter Machin', role: 'head_aero', rating: 81, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.STABLE_PLATFORM, specialty: 'Plataforma Estável e Janela de Altura', salary: 3000000, buyoutClause: 3800000, currentTeam: 'Racing Bulls', isFictional: false,
    attributes: { tecnica: 83, criatividade: 80, rigorValidacao: 84, lideranca: 77, comunicacao: 78, gestaoPrazo: 80, adaptacao: 79 }
  },
  {
    id: 'aero_f1_hennel', name: 'Nicolas Hennel', role: 'head_aero', rating: 77, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.STABLE_PLATFORM, specialty: 'Estabilidade Aerodinâmica de Assoalho', salary: 2200000, buyoutClause: 2800000, currentTeam: 'Haas F1 Team', isFictional: false,
    attributes: { tecnica: 79, criatividade: 74, rigorValidacao: 81, lideranca: 74, comunicacao: 72, gestaoPrazo: 78, adaptacao: 75 }
  },
  {
    id: 'aero_f1_molina', name: 'Juan Molina', role: 'head_aero', rating: 76, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MECHANICAL_GRIP, specialty: 'Grip Mecânico & Plataforma de Suspensão', salary: 2100000, buyoutClause: 2500000, currentTeam: 'Williams', isFictional: false,
    attributes: { tecnica: 78, criatividade: 75, rigorValidacao: 79, lideranca: 72, comunicacao: 74, gestaoPrazo: 76, adaptacao: 76 }
  },
  {
    id: 'aero_f1_tomlinson', name: 'Jon Tomlinson', role: 'head_aero', rating: 75, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.BALANCED, specialty: 'Arquitetura Equilibrada & Desenvolvimento Contínuo', salary: 1900000, buyoutClause: 2200000, currentTeam: 'Cadillac F1', isFictional: false,
    attributes: { tecnica: 77, criatividade: 76, rigorValidacao: 78, lideranca: 71, comunicacao: 72, gestaoPrazo: 75, adaptacao: 74 }
  },
  {
    id: 'aero_f1_blandin', name: 'Eric Blandin', role: 'head_aero', rating: 85, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.HIGH_DOWNFORCE, specialty: 'Alta Carga Aerodinâmica & Vórtices Dianteiros', salary: 4200000, buyoutClause: 6000000, currentTeam: 'Aston Martin', isFictional: false,
    attributes: { tecnica: 87, criatividade: 89, rigorValidacao: 80, lideranca: 81, comunicacao: 78, gestaoPrazo: 79, adaptacao: 82 }
  },
  {
    id: 'aero_f1_fallows', name: 'Dan Fallows', role: 'head_aero', rating: 83, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.BALANCED, specialty: 'Filosofia Equilibrada & Otimização Geral', salary: 3500000, buyoutClause: 4000000, currentTeam: 'Racing Bulls', isFictional: false,
    attributes: { tecnica: 85, criatividade: 88, rigorValidacao: 75, lideranca: 76, comunicacao: 78, gestaoPrazo: 74, adaptacao: 80 }
  },

  // ===========================================================================
  // 3. FÓRMULA 1 (2026) - PU & COMPONENTES (HEAD_PU / DIRETORES TÉCNICOS)
  // ===========================================================================
  {
    id: 'pu_f1_allison', name: 'James Allison', role: 'head_pu', rating: 94, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MECHANICAL_GRIP, specialty: 'Mestre de Chassi e Suspensão', salary: 9500000, buyoutClause: 20000000, currentTeam: 'Mercedes-AMG', isFictional: false,
    attributes: { tecnica: 96, criatividade: 92, rigorValidacao: 90, lideranca: 95, comunicacao: 88, gestaoPrazo: 90, adaptacao: 85, resiliencia: 92 }
  },
  {
    id: 'pu_f1_serra', name: 'Loïc Serra', role: 'head_pu', rating: 88, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Dinâmica Veicular & Chassi', salary: 6000000, buyoutClause: 10000000, currentTeam: 'Ferrari', isFictional: false,
    attributes: { tecnica: 90, criatividade: 80, rigorValidacao: 92, lideranca: 82, comunicacao: 80, gestaoPrazo: 88, adaptacao: 80, resiliencia: 88 }
  },
  {
    id: 'pu_f1_gualtieri', name: 'Enrico Gualtieri', role: 'head_pu', rating: 85, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.RELIABILITY, specialty: 'Confiabilidade e Térmica', salary: 5000000, buyoutClause: 8000000, currentTeam: 'Ferrari', isFictional: false,
    attributes: { tecnica: 88, criatividade: 70, rigorValidacao: 95, lideranca: 80, comunicacao: 85, gestaoPrazo: 90, adaptacao: 75, resiliencia: 90 }
  },
  {
    id: 'pu_f1_hodgkinson', name: 'Ben Hodgkinson', role: 'head_pu', rating: 86, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.ICE, specialty: 'Arquitetura ICE & Turbo', salary: 5500000, buyoutClause: 9000000, currentTeam: 'Red Bull Ford', isFictional: false,
    attributes: { tecnica: 89, criatividade: 85, rigorValidacao: 80, lideranca: 82, comunicacao: 75, gestaoPrazo: 85, adaptacao: 78, resiliencia: 85 }
  },
  {
    id: 'pu_f1_thomas', name: 'Hywel Thomas', role: 'head_pu', rating: 92, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.ERS, specialty: 'Sistemas Híbridos Mercedes', salary: 7000000, buyoutClause: 15000000, currentTeam: 'Mercedes-AMG', isFictional: false,
    attributes: { tecnica: 94, criatividade: 85, rigorValidacao: 95, lideranca: 88, comunicacao: 80, gestaoPrazo: 92, adaptacao: 82, resiliencia: 94 }
  },
  {
    id: 'pu_f1_waterhouse', name: 'Ben Waterhouse', role: 'head_pu', rating: 87, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.ICE, specialty: 'Engenharia de Performance & Integração PU', salary: 5200000, buyoutClause: 8500000, currentTeam: 'Red Bull Racing', isFictional: false,
    attributes: { tecnica: 89, criatividade: 87, rigorValidacao: 84, lideranca: 83, comunicacao: 80, gestaoPrazo: 84, adaptacao: 82, resiliencia: 86 }
  },
  {
    id: 'pu_f1_houldey', name: 'Neil Houldey', role: 'head_pu', rating: 85, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Arquitetura Mecânica & Transmissão', salary: 4600000, buyoutClause: 7000000, currentTeam: 'McLaren', isFictional: false,
    attributes: { tecnica: 88, criatividade: 85, rigorValidacao: 82, lideranca: 81, comunicacao: 79, gestaoPrazo: 83, adaptacao: 81, resiliencia: 84 }
  },
  {
    id: 'pu_f1_temple', name: 'Mark Temple', role: 'head_pu', rating: 84, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MECHANICAL_GRIP, specialty: 'Cinemática de Suspensão e Geometria', salary: 4200000, buyoutClause: 6000000, currentTeam: 'McLaren', isFictional: false,
    attributes: { tecnica: 87, criatividade: 79, rigorValidacao: 87, lideranca: 80, comunicacao: 81, gestaoPrazo: 82, adaptacao: 80, resiliencia: 85 }
  },
  {
    id: 'pu_f1_key', name: 'James Key', role: 'head_pu', rating: 83, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.CHASSIS_SUSPENSION, specialty: 'Conceito Integrado de Chassi e Suspensão', salary: 4000000, buyoutClause: 5500000, currentTeam: 'Audi', isFictional: false,
    attributes: { tecnica: 86, criatividade: 85, rigorValidacao: 80, lideranca: 79, comunicacao: 78, gestaoPrazo: 80, adaptacao: 80, resiliencia: 82 }
  },
  {
    id: 'pu_f1_sanchez', name: 'David Sanchez', role: 'head_pu', rating: 83, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.CHASSIS_SUSPENSION, specialty: 'Direção Técnica Executiva & Conceito Geral', salary: 3800000, buyoutClause: 5000000, currentTeam: 'Alpine', isFictional: false,
    attributes: { tecnica: 86, criatividade: 84, rigorValidacao: 81, lideranca: 80, comunicacao: 76, gestaoPrazo: 81, adaptacao: 79, resiliencia: 83 }
  },
  {
    id: 'pu_f1_pilbeam', name: 'Ciaron Pilbeam', role: 'head_pu', rating: 82, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MECHANICAL_GRIP, specialty: 'Engenharia de Performance e Balanço Dinâmico', salary: 3600000, buyoutClause: 4800000, currentTeam: 'Alpine', isFictional: false,
    attributes: { tecnica: 85, criatividade: 79, rigorValidacao: 86, lideranca: 79, comunicacao: 82, gestaoPrazo: 82, adaptacao: 80, resiliencia: 84 }
  },
  {
    id: 'pu_f1_goss', name: 'Tim Goss', role: 'head_pu', rating: 84, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Homologação Regulamentar e Transmissão FIA', salary: 4100000, buyoutClause: 5800000, currentTeam: 'Racing Bulls', isFictional: false,
    attributes: { tecnica: 87, criatividade: 78, rigorValidacao: 90, lideranca: 82, comunicacao: 80, gestaoPrazo: 85, adaptacao: 78, resiliencia: 87 }
  },
  {
    id: 'pu_f1_dezordo', name: 'Andrea de Zordo', role: 'head_pu', rating: 79, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.RELIABILITY, specialty: 'Integração de Monocoque e Confiabilidade', salary: 2800000, buyoutClause: 3500000, currentTeam: 'Haas F1 Team', isFictional: false,
    attributes: { tecnica: 82, criatividade: 72, rigorValidacao: 87, lideranca: 77, comunicacao: 76, gestaoPrazo: 84, adaptacao: 74, resiliencia: 84 }
  },
  {
    id: 'pu_f1_harman', name: 'Matt Harman', role: 'head_pu', rating: 80, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.CHASSIS_SUSPENSION, specialty: 'Otimização Estrutural de Transmissão e Chassi', salary: 3000000, buyoutClause: 4000000, currentTeam: 'Williams', isFictional: false,
    attributes: { tecnica: 83, criatividade: 81, rigorValidacao: 79, lideranca: 78, comunicacao: 76, gestaoPrazo: 78, adaptacao: 77, resiliencia: 81 }
  },
  {
    id: 'pu_f1_fry', name: 'Pat Fry', role: 'head_pu', rating: 85, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.ICE, specialty: 'Integração Global de Motor e Rigidez Torcional', salary: 4800000, buyoutClause: 7000000, currentTeam: 'Williams', isFictional: false,
    attributes: { tecnica: 87, criatividade: 75, rigorValidacao: 91, lideranca: 84, comunicacao: 82, gestaoPrazo: 88, adaptacao: 77, resiliencia: 88 }
  },
  {
    id: 'pu_f1_chester', name: 'Nick Chester', role: 'head_pu', rating: 81, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Empacotamento Traseiro e Refrigeração PU', salary: 3200000, buyoutClause: 4200000, currentTeam: 'Cadillac F1', isFictional: false,
    attributes: { tecnica: 84, criatividade: 78, rigorValidacao: 83, lideranca: 79, comunicacao: 78, gestaoPrazo: 82, adaptacao: 78, resiliencia: 83 }
  },
  {
    id: 'pu_f1_white', name: 'Rob White', role: 'head_pu', rating: 80, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.RELIABILITY, specialty: 'Supervisão de Confiabilidade e Operações de Motor', salary: 3000000, buyoutClause: 3800000, currentTeam: 'Cadillac F1', isFictional: false,
    attributes: { tecnica: 83, criatividade: 72, rigorValidacao: 88, lideranca: 80, comunicacao: 80, gestaoPrazo: 85, adaptacao: 75, resiliencia: 86 }
  },
  {
    id: 'pu_f1_cardile', name: 'Enrico Cardile', role: 'head_pu', rating: 87, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.CHASSIS_SUSPENSION, specialty: 'Arquitetura Integrada Chassi-PU', salary: 5500000, buyoutClause: 9000000, currentTeam: 'Aston Martin', isFictional: false,
    attributes: { tecnica: 89, criatividade: 84, rigorValidacao: 89, lideranca: 84, comunicacao: 81, gestaoPrazo: 86, adaptacao: 82, resiliencia: 88 }
  },

  // ===========================================================================
  // 4. FÓRMULA 1 (2026) - MECÂNICA & ENGENHEIROS DE CORRIDA (HEAD_MECHANICS)
  // ===========================================================================
  {
    id: 'mech_f1_deane', name: 'Matt Deane', role: 'head_mechanics', rating: 85, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Chefe de Mecânicos Mercedes', salary: 3000000, buyoutClause: 5000000, currentTeam: 'Mercedes-AMG', isFictional: false,
    attributes: { tecnica: 88, criatividade: 75, rigorValidacao: 95, lideranca: 85, comunicacao: 80, gestaoPrazo: 90, adaptacao: 75, resiliencia: 88 }
  },
  {
    id: 'staff_mech_calum', name: 'Calum Nicholas', role: 'head_mechanics', rating: 90, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.PIT_STOP_MASTER, specialty: 'Pit Crew Coreografado & Montagem Rápida de Chassis', salary: 2200000, buyoutClause: 1500000, currentTeam: 'Red Bull Racing', isFictional: false,
    attributes: { tecnica: 90, criatividade: 85, rigorValidacao: 92, lideranca: 92, comunicacao: 88, gestaoPrazo: 90, adaptacao: 85, resiliencia: 95 }
  },
  {
    id: 'mech_f1_cherry', name: 'Rob Cherry', role: 'head_mechanics', rating: 79, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Chefe de Mecânicos Alpine', salary: 1400000, buyoutClause: 300000, currentTeam: 'Alpine', isFictional: false,
    attributes: { tecnica: 82, criatividade: 70, rigorValidacao: 88, lideranca: 80, comunicacao: 76, gestaoPrazo: 84, adaptacao: 75, resiliencia: 84 }
  },
  {
    id: 'mech_f1_smedley', name: 'Rob Smedley', role: 'head_mechanics', rating: 88, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.PIT_STOP_MASTER, specialty: 'Treinamento de Pit Stop & Gestão de Garagem', salary: 3500000, buyoutClause: 6000000, currentTeam: 'Agente Livre', isFictional: false,
    attributes: { tecnica: 88, criatividade: 82, rigorValidacao: 92, lideranca: 90, comunicacao: 85, gestaoPrazo: 88, adaptacao: 80, resiliencia: 92 }
  },
  {
    id: 'mech_f1_lambiase', name: 'Gianpiero Lambiase', role: 'head_mechanics', rating: 89, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Engenheiro de Corrida (Rádio) & Ajuste de Balanço', salary: 4000000, buyoutClause: 7000000, currentTeam: 'Red Bull Racing', isFictional: false,
    attributes: { tecnica: 85, criatividade: 90, rigorValidacao: 88, lideranca: 92, comunicacao: 96, gestaoPrazo: 85, adaptacao: 90, resiliencia: 95 }
  },
  {
    id: 'mech_f1_bono', name: 'Peter Bonnington (Bono)', role: 'head_mechanics', rating: 90, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MOTIVATOR, specialty: 'Engenheiro de Corrida & Gestão de Pneus sob Pressão', salary: 4200000, buyoutClause: 7500000, currentTeam: 'Mercedes-AMG', isFictional: false,
    attributes: { tecnica: 88, criatividade: 88, rigorValidacao: 92, lideranca: 93, comunicacao: 97, gestaoPrazo: 90, adaptacao: 88, resiliencia: 94 }
  },
  {
    id: 'mech_f1_dudley', name: 'Marcus Dudley', role: 'head_mechanics', rating: 82, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.DIAGNOSTICS, specialty: 'Telemetria em Tempo Real e Setup Rápido', salary: 1800000, buyoutClause: 500000, currentTeam: 'Mercedes-AMG', isFictional: false,
    attributes: { tecnica: 84, criatividade: 80, rigorValidacao: 86, lideranca: 81, comunicacao: 88, gestaoPrazo: 84, adaptacao: 82, resiliencia: 85 }
  },
  {
    id: 'mech_f1_bozzi', name: 'Bryan Bozzi', role: 'head_mechanics', rating: 83, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.PIT_STOP_MASTER, specialty: 'Estratégia de Janela de Box & Comunicação Frieza', salary: 2000000, buyoutClause: 600000, currentTeam: 'Ferrari', isFictional: false,
    attributes: { tecnica: 85, criatividade: 82, rigorValidacao: 86, lideranca: 82, comunicacao: 90, gestaoPrazo: 85, adaptacao: 84, resiliencia: 86 }
  },
  {
    id: 'mech_f1_joseph', name: 'Will Joseph', role: 'head_mechanics', rating: 85, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Engenharia de Pista e Gestão de Pneus', salary: 2400000, buyoutClause: 800000, currentTeam: 'McLaren', isFictional: false,
    attributes: { tecnica: 87, criatividade: 80, rigorValidacao: 90, lideranca: 85, comunicacao: 91, gestaoPrazo: 88, adaptacao: 82, resiliencia: 88 }
  },
  {
    id: 'mech_f1_stallard', name: 'Tom Stallard', role: 'head_mechanics', rating: 84, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Ajuste Fino de Pilotagem e Comunicação Assertiva', salary: 2200000, buyoutClause: 700000, currentTeam: 'McLaren', isFictional: false,
    attributes: { tecnica: 86, criatividade: 84, rigorValidacao: 86, lideranca: 87, comunicacao: 93, gestaoPrazo: 84, adaptacao: 86, resiliencia: 89 }
  },
  {
    id: 'mech_f1_wood', name: 'Richard Wood', role: 'head_mechanics', rating: 81, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.DIAGNOSTICS, specialty: 'Diagnóstico Hidráulico e Elétrico em Pit Wall', salary: 1600000, buyoutClause: 400000, currentTeam: 'Red Bull Racing', isFictional: false,
    attributes: { tecnica: 83, criatividade: 78, rigorValidacao: 85, lideranca: 79, comunicacao: 84, gestaoPrazo: 83, adaptacao: 80, resiliencia: 84 }
  },
  {
    id: 'mech_f1_muller', name: 'Laura Müller', role: 'head_mechanics', rating: 78, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Comunicação Estratégica e Calma sob Tensão', salary: 1200000, buyoutClause: 250000, currentTeam: 'Haas F1 Team', isFictional: false,
    attributes: { tecnica: 80, criatividade: 82, rigorValidacao: 80, lideranca: 82, comunicacao: 89, gestaoPrazo: 80, adaptacao: 84, resiliencia: 85 }
  },
  {
    id: 'mech_f1_ohare', name: 'Ronan O’Hare', role: 'head_mechanics', rating: 77, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Controle de Tolerâncias de Suspensão em Box', salary: 1100000, buyoutClause: 200000, currentTeam: 'Haas F1 Team', isFictional: false,
    attributes: { tecnica: 81, criatividade: 70, rigorValidacao: 86, lideranca: 76, comunicacao: 78, gestaoPrazo: 83, adaptacao: 74, resiliencia: 82 }
  },
  {
    id: 'mech_f1_urwin', name: 'James Urwin', role: 'head_mechanics', rating: 78, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Otimização de Geometria e Ajuste de Balanço', salary: 1250000, buyoutClause: 250000, currentTeam: 'Williams', isFictional: false,
    attributes: { tecnica: 82, criatividade: 72, rigorValidacao: 86, lideranca: 78, comunicacao: 82, gestaoPrazo: 82, adaptacao: 75, resiliencia: 83 }
  },
  {
    id: 'mech_f1_jago', name: 'Gaëtan Jago', role: 'head_mechanics', rating: 77, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.DIAGNOSTICS, specialty: 'Telemetria de Freios e Calibração ERS', salary: 1150000, buyoutClause: 200000, currentTeam: 'Williams', isFictional: false,
    attributes: { tecnica: 81, criatividade: 75, rigorValidacao: 83, lideranca: 76, comunicacao: 81, gestaoPrazo: 80, adaptacao: 78, resiliencia: 81 }
  },
  {
    id: 'mech_f1_pasetti', name: 'Carlo Pasetti', role: 'head_mechanics', rating: 76, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Montagem Rápida e Procedimentos de Garagem', salary: 1050000, buyoutClause: 180000, currentTeam: 'Cadillac F1', isFictional: false,
    attributes: { tecnica: 80, criatividade: 70, rigorValidacao: 85, lideranca: 75, comunicacao: 76, gestaoPrazo: 82, adaptacao: 74, resiliencia: 81 }
  },
  {
    id: 'mech_f1_howard', name: 'John Howard', role: 'head_mechanics', rating: 75, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.DIAGNOSTICS, specialty: 'Leitura de Falhas Eletrônicas e Chicote Elétrico', salary: 980000, buyoutClause: 150000, currentTeam: 'Cadillac F1', isFictional: false,
    attributes: { tecnica: 79, criatividade: 74, rigorValidacao: 82, lideranca: 74, comunicacao: 78, gestaoPrazo: 79, adaptacao: 76, resiliencia: 80 }
  },
  {
    id: 'mech_f1_vizard', name: 'Andrew Vizard', role: 'head_mechanics', rating: 80, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.DIAGNOSTICS, specialty: 'Análise de Ritmo de Corrida e Degradação Térmica', salary: 1500000, buyoutClause: 350000, currentTeam: 'Aston Martin', isFictional: false,
    attributes: { tecnica: 83, criatividade: 78, rigorValidacao: 85, lideranca: 80, comunicacao: 85, gestaoPrazo: 82, adaptacao: 80, resiliencia: 84 }
  },
  {
    id: 'mech_f1_gannon', name: 'Gary Gannon', role: 'head_mechanics', rating: 83, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Experiência de Paddock e Comunicação Estratégica', salary: 1900000, buyoutClause: 550000, currentTeam: 'Aston Martin', isFictional: false,
    attributes: { tecnica: 85, criatividade: 76, rigorValidacao: 89, lideranca: 84, comunicacao: 90, gestaoPrazo: 86, adaptacao: 80, resiliencia: 87 }
  },

  // ===========================================================================
  // 5. FÓRMULA 2 (2026) - ESTRUTURA OFICIAL
  // ===========================================================================
  {
    id: 'mgmt_f2_robinson', name: 'James Robinson', role: 'head_management', rating: 72, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.FINANCIAL, specialty: 'Chefe de Equipe (Invicta F2)', salary: 800000, buyoutClause: 150000, currentTeam: 'Invicta Racing (F2)', isFictional: false,
    attributes: { tecnica: 65, criatividade: 78, rigorValidacao: 75, lideranca: 72, comunicacao: 80, gestaoPrazo: 70, adaptacao: 75, visaoEstrategica: 82 }
  },
  {
    id: 'mgmt_f2_joyce', name: 'Brad Joyce', role: 'head_management', rating: 71, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Chefe de Equipe (VAR F2)', salary: 750000, buyoutClause: 140000, currentTeam: 'Van Amersfoort (F2)', isFictional: false,
    attributes: { tecnica: 70, criatividade: 68, rigorValidacao: 78, lideranca: 75, comunicacao: 78, gestaoPrazo: 74, adaptacao: 72, visaoEstrategica: 76 }
  },
  {
    id: 'mgmt_f2_dorsman', name: 'Sander Dorsman', role: 'head_management', rating: 73, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.CRISIS_MANAGER, specialty: 'Diretor e Chefe de Equipe (MP F2)', salary: 850000, buyoutClause: 180000, currentTeam: 'MP Motorsport (F2)', isFictional: false,
    attributes: { tecnica: 68, criatividade: 74, rigorValidacao: 80, lideranca: 80, comunicacao: 82, gestaoPrazo: 78, adaptacao: 76, visaoEstrategica: 80 }
  },
  {
    id: 'mgmt_f2_philippe', name: 'Sébastien Philippe', role: 'head_management', rating: 72, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MOTIVATOR, specialty: 'Gestão de Pilotos Jovens & Equipe (ART F2)', salary: 800000, buyoutClause: 160000, currentTeam: 'ART Grand Prix (F2)', isFictional: false,
    attributes: { tecnica: 67, criatividade: 75, rigorValidacao: 77, lideranca: 79, comunicacao: 83, gestaoPrazo: 76, adaptacao: 77, visaoEstrategica: 78 }
  },
  {
    id: 'mgmt_f2_campos', name: 'Adrián Campos Jr.', role: 'head_management', rating: 71, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Chefe de Equipe (Campos Racing F2)', salary: 720000, buyoutClause: 130000, currentTeam: 'Campos Racing (F2)', isFictional: false,
    attributes: { tecnica: 66, criatividade: 79, rigorValidacao: 74, lideranca: 78, comunicacao: 82, gestaoPrazo: 73, adaptacao: 78, visaoEstrategica: 77 }
  },
  {
    id: 'mgmt_f2_rosin', name: 'René Rosin', role: 'head_management', rating: 74, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Liderança Vencedora em Monopostos (Prema F2)', salary: 920000, buyoutClause: 220000, currentTeam: 'Prema Racing (F2)', isFictional: false,
    attributes: { tecnica: 72, criatividade: 82, rigorValidacao: 82, lideranca: 85, comunicacao: 86, gestaoPrazo: 80, adaptacao: 82, visaoEstrategica: 84 }
  },
  {
    id: 'aero_f2_bernard', name: 'Lucas Bernard', role: 'head_aero', rating: 68, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.LOW_DRAG, specialty: 'Conceito Baixo Arrasto (DAMS F2)', salary: 450000, buyoutClause: 50000, currentTeam: 'DAMS (F2)', isFictional: false,
    attributes: { tecnica: 72, criatividade: 85, rigorValidacao: 60, lideranca: 65, comunicacao: 70, gestaoPrazo: 68, adaptacao: 75 }
  },
  {
    id: 'mech_f2_lincoln', name: 'Mark Lincoln', role: 'head_mechanics', rating: 70, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Chefe Mecânico (Invicta F2)', salary: 550000, buyoutClause: 60000, currentTeam: 'Invicta Racing (F2)', isFictional: false,
    attributes: { tecnica: 75, criatividade: 65, rigorValidacao: 80, lideranca: 73, comunicacao: 72, gestaoPrazo: 75, adaptacao: 70, resiliencia: 80 }
  },
  {
    id: 'mech_f2_rivera', name: 'Pau Rivera', role: 'head_mechanics', rating: 69, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Engenheiro de Corrida F2 (Invicta)', salary: 500000, buyoutClause: 50000, currentTeam: 'Invicta Racing (F2)', isFictional: false,
    attributes: { tecnica: 73, criatividade: 77, rigorValidacao: 72, lideranca: 72, comunicacao: 82, gestaoPrazo: 71, adaptacao: 76, resiliencia: 79 }
  },
  {
    id: 'mech_f2_sommerville', name: 'Colin Sommerville', role: 'head_mechanics', rating: 68, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.DIAGNOSTICS, specialty: 'Engenheiro de Pista F2 (Invicta)', salary: 470000, buyoutClause: 45000, currentTeam: 'Invicta Racing (F2)', isFictional: false,
    attributes: { tecnica: 74, criatividade: 64, rigorValidacao: 79, lideranca: 70, comunicacao: 76, gestaoPrazo: 74, adaptacao: 71, resiliencia: 78 }
  },

  // ===========================================================================
  // 6. FÓRMULA 3 (2026) - ESTRUTURA OFICIAL
  // ===========================================================================
  {
    id: 'mgmt_f3_hubert', name: 'Yannick Hubert', role: 'head_management', rating: 66, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.PIT_STOP_MASTER, specialty: 'Chefe de Equipe (DAMS F3)', salary: 380000, buyoutClause: 40000, currentTeam: 'DAMS (F3)', isFictional: false,
    attributes: { tecnica: 68, criatividade: 60, rigorValidacao: 78, lideranca: 70, comunicacao: 75, gestaoPrazo: 72, adaptacao: 65, resiliencia: 75 }
  },
  {
    id: 'mgmt_f3_reinecke', name: 'Morne Reinecke', role: 'head_management', rating: 64, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Chefe de Equipe (AIX Racing F3)', salary: 350000, buyoutClause: 35000, currentTeam: 'AIX Racing (F3)', isFictional: false,
    attributes: { tecnica: 62, criatividade: 72, rigorValidacao: 68, lideranca: 71, comunicacao: 77, gestaoPrazo: 68, adaptacao: 72, resiliencia: 74 }
  },
  {
    id: 'aero_f3_angilella', name: 'Paolo Angilella', role: 'head_aero', rating: 68, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MECHANICAL_GRIP, specialty: 'Diretor Técnico & Grip Mecânico (MP F3)', salary: 450000, buyoutClause: 50000, currentTeam: 'MP Motorsport (F3)', isFictional: false,
    attributes: { tecnica: 72, criatividade: 68, rigorValidacao: 75, lideranca: 65, comunicacao: 70, gestaoPrazo: 72, adaptacao: 70 }
  },
  {
    id: 'aero_f3_watanabe', name: 'Yuki Watanabe', role: 'head_aero', rating: 65, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.STABLE_PLATFORM, specialty: 'Plataforma Estável & Simulação CFD (Prema F3)', salary: 380000, buyoutClause: 30000, currentTeam: 'Prema Racing (F3)', isFictional: false,
    attributes: { tecnica: 70, criatividade: 82, rigorValidacao: 58, lideranca: 60, comunicacao: 65, gestaoPrazo: 62, adaptacao: 70 }
  },
  {
    id: 'mech_f3_penel', name: 'Boris Penel', role: 'head_mechanics', rating: 65, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Chefe Mecânico (DAMS F3)', salary: 360000, buyoutClause: 35000, currentTeam: 'DAMS (F3)', isFictional: false,
    attributes: { tecnica: 72, criatividade: 58, rigorValidacao: 78, lideranca: 67, comunicacao: 68, gestaoPrazo: 71, adaptacao: 65, resiliencia: 76 }
  },
  {
    id: 'mech_f3_waters', name: 'Matt Waters', role: 'head_mechanics', rating: 64, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Chefe Mecânico (AIX F3)', salary: 340000, buyoutClause: 30000, currentTeam: 'AIX Racing (F3)', isFictional: false,
    attributes: { tecnica: 70, criatividade: 59, rigorValidacao: 76, lideranca: 66, comunicacao: 69, gestaoPrazo: 70, adaptacao: 66, resiliencia: 75 }
  },
  {
    id: 'mech_f3_heidemaa', name: 'Aivar Heidemaa', role: 'head_mechanics', rating: 65, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Chefe Mecânico (MP F3)', salary: 360000, buyoutClause: 35000, currentTeam: 'MP Motorsport (F3)', isFictional: false,
    attributes: { tecnica: 71, criatividade: 60, rigorValidacao: 77, lideranca: 68, comunicacao: 70, gestaoPrazo: 71, adaptacao: 67, resiliencia: 77 }
  },
  {
    id: 'mech_f3_sudre', name: 'Clément Sudre', role: 'head_mechanics', rating: 64, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Engenheiro de Corrida F3 (DAMS)', salary: 320000, buyoutClause: 25000, currentTeam: 'DAMS (F3)', isFictional: false,
    attributes: { tecnica: 68, criatividade: 74, rigorValidacao: 68, lideranca: 67, comunicacao: 77, gestaoPrazo: 68, adaptacao: 73, resiliencia: 74 }
  },
  {
    id: 'mech_f3_jimenez', name: 'Jaume Jimenez', role: 'head_mechanics', rating: 62, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.DIAGNOSTICS, specialty: 'Engenheiro de Pista F3 (AIX)', salary: 290000, buyoutClause: 20000, currentTeam: 'AIX Racing (F3)', isFictional: false,
    attributes: { tecnica: 69, criatividade: 67, rigorValidacao: 70, lideranca: 64, comunicacao: 71, gestaoPrazo: 69, adaptacao: 70, resiliencia: 72 }
  },
  {
    id: 'mech_f3_tessore', name: 'Thomas Tessore', role: 'head_mechanics', rating: 63, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MOTIVATOR, specialty: 'Engenheiro de Corrida F3 (MP)', salary: 310000, buyoutClause: 22000, currentTeam: 'MP Motorsport (F3)', isFictional: false,
    attributes: { tecnica: 68, criatividade: 72, rigorValidacao: 69, lideranca: 66, comunicacao: 76, gestaoPrazo: 68, adaptacao: 71, resiliencia: 73 }
  },

  // ===========================================================================
  // 7. PROFISSIONAIS FICTÍCIOS & AGENTES LIVRES (BALANCEAMENTO MULTIDISCIPLINAR)
  // (Deduplicados: nenhum nome ou ID repetido!)
  // ===========================================================================

  // --- Aero Fictícios / Agentes Livres ---
  {
    id: 'aero_fic_vance', name: 'Marcus Vance', role: 'head_aero', rating: 88, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.HIGH_DOWNFORCE, specialty: 'Criação de Conceito de Alta Carga (CFD)', salary: 850000, buyoutClause: 1200000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 90, criatividade: 92, rigorValidacao: 75, lideranca: 80, comunicacao: 70, gestaoPrazo: 75, adaptacao: 80 }
  },
  {
    id: 'staff_aero_fic_1', name: 'Liam Sterling', role: 'head_aero', rating: 75, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.AERO_EFFICIENCY, specialty: 'Eficiência L/D & Correlação de Túnel', salary: 1380000, buyoutClause: 100000, currentTeam: 'Cranfield Aerodynamics Lab', isFictional: true,
    attributes: { tecnica: 79, criatividade: 81, rigorValidacao: 77, lideranca: 77, comunicacao: 74, gestaoPrazo: 71, adaptacao: 74 }
  },
  {
    id: 'aero_duct_01', name: 'Fernando Silva', role: 'head_aero', rating: 78, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.AERO_EFFICIENCY, specialty: 'Dutos Aerodinâmicos e Refrigeração de Freios', salary: 1400000, buyoutClause: 200000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 82, criatividade: 76, rigorValidacao: 80, lideranca: 74, comunicacao: 76, gestaoPrazo: 78, adaptacao: 80 }
  },
  {
    id: 'aero_fic_mori', name: 'Hiroshi Mori', role: 'head_aero', rating: 70, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.BALANCED, specialty: 'Conceito Equilibrado & Adaptativo', salary: 750000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 75, criatividade: 68, rigorValidacao: 85, lideranca: 70, comunicacao: 72, gestaoPrazo: 75, adaptacao: 70 }
  },
  {
    id: 'aero_fic_mendes', name: 'Carlos Mendes', role: 'head_aero', rating: 73, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.LOW_DRAG, specialty: 'Baixo Arrasto e Velocidade Terminal', salary: 1130000, buyoutClause: 100000, currentTeam: 'Embraer Motorsport Aero', isFictional: true,
    attributes: { tecnica: 78, criatividade: 74, rigorValidacao: 78, lideranca: 71, comunicacao: 72, gestaoPrazo: 74, adaptacao: 73 }
  },
  {
    id: 'aero_fic_rostova', name: 'Elena Rostova', role: 'head_aero', rating: 74, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.STABLE_PLATFORM, specialty: 'Plataforma Estável & Balanço Aerodinâmico', salary: 1190000, buyoutClause: 200000, currentTeam: 'Tech Formula UK', isFictional: true,
    attributes: { tecnica: 79, criatividade: 76, rigorValidacao: 78, lideranca: 76, comunicacao: 75, gestaoPrazo: 75, adaptacao: 75 }
  },
  {
    id: 'aero_fic_thorne', name: 'Jack Thorne', role: 'head_aero', rating: 67, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.LOW_DRAG, specialty: 'Otimização de Difusores e Baixo Arrasto', salary: 650000, buyoutClause: 80000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 71, criatividade: 82, rigorValidacao: 62, lideranca: 64, comunicacao: 68, gestaoPrazo: 66, adaptacao: 73 }
  },

  // ==================== NOVOS AERODINAMICISTAS — AGENTES LIVRES ====================
  {
    id: 'aero_fic_nakamura', name: 'Yuki Nakamura', role: 'head_aero', rating: 80, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.HIGH_DOWNFORCE, specialty: 'Carga Aerodinâmica Máxima & Curvas Lentas', salary: 2100000, buyoutClause: 300000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 86, criatividade: 76, rigorValidacao: 80, lideranca: 72, comunicacao: 70, gestaoPrazo: 78, adaptacao: 74 }
  },
  {
    id: 'aero_fic_obi', name: 'Emeka Obi', role: 'head_aero', rating: 77, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.AERO_EFFICIENCY, specialty: 'Eficiência L/D & Conceitos de Downwash', salary: 1750000, buyoutClause: 250000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 82, criatividade: 88, rigorValidacao: 70, lideranca: 68, comunicacao: 72, gestaoPrazo: 70, adaptacao: 82 }
  },
  {
    id: 'aero_fic_kowalski', name: 'Piotr Kowalski', role: 'head_aero', rating: 75, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.STABLE_PLATFORM, specialty: 'Plataforma Rígida & Fluxo de Fundo Previsível', salary: 1500000, buyoutClause: 200000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 80, criatividade: 65, rigorValidacao: 86, lideranca: 70, comunicacao: 74, gestaoPrazo: 80, adaptacao: 68 }
  },
  {
    id: 'aero_fic_lima', name: 'Carla Lima', role: 'head_aero', rating: 73, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MECHANICAL_GRIP, specialty: 'Interação Aerodinâmica com Suspensão & Tração', salary: 1300000, buyoutClause: 180000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 84, criatividade: 72, rigorValidacao: 76, lideranca: 66, comunicacao: 76, gestaoPrazo: 76, adaptacao: 72 }
  },
  {
    id: 'aero_fic_hassan', name: 'Tariq Hassan', role: 'head_aero', rating: 71, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.LOW_DRAG, specialty: 'Carroceria Slim & Eficiência de Retas', salary: 1100000, buyoutClause: 140000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 78, criatividade: 84, rigorValidacao: 64, lideranca: 62, comunicacao: 68, gestaoPrazo: 68, adaptacao: 80 }
  },
  {
    id: 'aero_fic_novak', name: 'Jana Novák', role: 'head_aero', rating: 69, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.BALANCED, specialty: 'Conceito Versátil & Equilíbrio Multi-Pista', salary: 980000, buyoutClause: 110000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 76, criatividade: 70, rigorValidacao: 78, lideranca: 65, comunicacao: 72, gestaoPrazo: 76, adaptacao: 78 }
  },
  {
    id: 'aero_fic_greer', name: 'Samuel Greer', role: 'head_aero', rating: 66, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.HIGH_DOWNFORCE, specialty: 'Winglets & Carga Vertical em Complexos de Curvas', salary: 820000, buyoutClause: 80000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 74, criatividade: 68, rigorValidacao: 76, lideranca: 58, comunicacao: 66, gestaoPrazo: 72, adaptacao: 68 }
  },
  {
    id: 'aero_fic_ferraz', name: 'André Ferraz', role: 'head_aero', rating: 64, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.AERO_EFFICIENCY, specialty: 'CFD Experimental & Prototipagem Rápida de Conceitos', salary: 720000, buyoutClause: 60000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 70, criatividade: 86, rigorValidacao: 58, lideranca: 56, comunicacao: 64, gestaoPrazo: 62, adaptacao: 84 }
  },

  // --- PU Fictícios / Agentes Livres ---
  {
    id: 'pu_brake_01', name: 'Luca Bianchi', role: 'head_pu', rating: 82, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.BRAKE_SYSTEMS, specialty: 'Integração Brake-by-Wire e Refrigeração de Freios', salary: 1800000, buyoutClause: 300000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 85, criatividade: 78, rigorValidacao: 86, lideranca: 76, comunicacao: 80, gestaoPrazo: 82, adaptacao: 80, resiliencia: 84 }
  },
  {
    id: 'pu_fic_dreyer', name: 'Stefan Dreyer', role: 'head_pu', rating: 87, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.ERS, specialty: 'Eficiência Híbrida & Térmica', salary: 5500000, buyoutClause: 1000000, currentTeam: 'Sauber Motorsport', isFictional: true,
    attributes: { tecnica: 85, criatividade: 75, rigorValidacao: 92, lideranca: 85, comunicacao: 80, gestaoPrazo: 90, adaptacao: 80, resiliencia: 90 }
  },
  {
    id: 'pu_fic_baker', name: 'Adam Baker', role: 'head_pu', rating: 86, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.ICE, specialty: 'Arquitetura ICE & Turbo', salary: 3800000, buyoutClause: 500000, currentTeam: 'Audi F1 Powertrain', isFictional: true,
    attributes: { tecnica: 89, criatividade: 88, rigorValidacao: 70, lideranca: 75, comunicacao: 75, gestaoPrazo: 70, adaptacao: 75, resiliencia: 85 }
  },
  {
    id: 'pu_fic_santos', name: 'Gabriel Santos', role: 'head_pu', rating: 78, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.ERS, specialty: 'Gerenciamento Térmico e Recuperação 350kW', salary: 1900000, buyoutClause: 300000, currentTeam: 'Mauá Powertrains Lab', isFictional: true,
    attributes: { tecnica: 76, criatividade: 78, rigorValidacao: 79, lideranca: 72, comunicacao: 80, gestaoPrazo: 75, adaptacao: 80, resiliencia: 82 }
  },
  {
    id: 'pu_fic_dupont', name: 'Paul Dupont', role: 'head_pu', rating: 69, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.RELIABILITY, specialty: 'Confiabilidade do Motor e Ciclo Térmico', salary: 975000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 72, criatividade: 60, rigorValidacao: 85, lideranca: 68, comunicacao: 70, gestaoPrazo: 80, adaptacao: 65, resiliencia: 85 }
  },
  {
    id: 'pu_fic_alsaadi', name: 'Omar Al-Saadi', role: 'head_pu', rating: 84, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Transmissão Compacta e Arrefecimento ICE', salary: 4000000, buyoutClause: 400000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 85, criatividade: 80, rigorValidacao: 87, lideranca: 83, comunicacao: 81, gestaoPrazo: 85, adaptacao: 81, resiliencia: 86 }
  },
  {
    id: 'pu_fic_sato', name: 'Shinji Sato', role: 'head_pu', rating: 71, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.ICE, specialty: 'Injeção Direta e Eficiência de Combustão 100% E-Fuel', salary: 950000, buyoutClause: 100000, currentTeam: 'HKS Performance Engineering', isFictional: true,
    attributes: { tecnica: 76, criatividade: 72, rigorValidacao: 79, lideranca: 68, comunicacao: 71, gestaoPrazo: 74, adaptacao: 72, resiliencia: 80 }
  },

  // ==================== NOVOS CHEFES DE PU — AGENTES LIVRES ====================
  {
    id: 'pu_fic_korhonen', name: 'Mikael Korhonen', role: 'head_pu', rating: 80, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.ERS, specialty: 'Arquitetura MGU-H & Recuperação Cinética Agressiva', salary: 2200000, buyoutClause: 300000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 85, criatividade: 88, rigorValidacao: 72, lideranca: 72, comunicacao: 74, gestaoPrazo: 70, adaptacao: 82, resiliencia: 80 }
  },
  {
    id: 'pu_fic_renard', name: 'Élodie Renard', role: 'head_pu', rating: 78, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.RELIABILITY, specialty: 'Protocolos de Durabilidade e Gestão de Modos de Motor', salary: 1950000, buyoutClause: 260000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 82, criatividade: 64, rigorValidacao: 92, lideranca: 70, comunicacao: 76, gestaoPrazo: 86, adaptacao: 68, resiliencia: 92 }
  },
  {
    id: 'pu_fic_volkov', name: 'Dmitri Volkov', role: 'head_pu', rating: 76, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.ICE, specialty: 'Combustão de Alta Compressão & Mapas de Motor E-Fuel', salary: 1750000, buyoutClause: 230000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 88, criatividade: 72, rigorValidacao: 80, lideranca: 66, comunicacao: 68, gestaoPrazo: 76, adaptacao: 70, resiliencia: 82 }
  },
  {
    id: 'pu_fic_andrade', name: 'Marco Andrade', role: 'head_pu', rating: 74, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Transmissão Compacta & Integração Powertrain-Chassi', salary: 1550000, buyoutClause: 200000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 80, criatividade: 80, rigorValidacao: 74, lideranca: 65, comunicacao: 70, gestaoPrazo: 72, adaptacao: 76, resiliencia: 78 }
  },
  {
    id: 'pu_fic_papadopoulos', name: 'Nikos Papadopoulos', role: 'head_pu', rating: 72, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.RELIABILITY, specialty: 'Termomanejo de Radiadores & Zero DNFs por Motor', salary: 1350000, buyoutClause: 170000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 78, criatividade: 60, rigorValidacao: 90, lideranca: 64, comunicacao: 72, gestaoPrazo: 84, adaptacao: 64, resiliencia: 90 }
  },
  {
    id: 'pu_fic_owusu', name: 'Abena Owusu', role: 'head_pu', rating: 70, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.ERS, specialty: 'Deploy ERS Estratégico & Economia de Bateria em Corrida', salary: 1150000, buyoutClause: 140000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 76, criatividade: 76, rigorValidacao: 76, lideranca: 62, comunicacao: 74, gestaoPrazo: 76, adaptacao: 74, resiliencia: 76 }
  },
  {
    id: 'pu_fic_berg', name: 'Kristoffer Berg', role: 'head_pu', rating: 68, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.ICE, specialty: 'Geometria de Câmaras de Combustão & Pre-Chambers', salary: 980000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 80, criatividade: 82, rigorValidacao: 62, lideranca: 58, comunicacao: 66, gestaoPrazo: 64, adaptacao: 80, resiliencia: 72 }
  },
  {
    id: 'pu_fic_coppola', name: 'Giulia Coppola', role: 'head_pu', rating: 65, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.BRAKE_BY_WIRE, specialty: 'Integração Brake-by-Wire & Recuperação de Frenagem', salary: 820000, buyoutClause: 80000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 76, criatividade: 62, rigorValidacao: 84, lideranca: 56, comunicacao: 68, gestaoPrazo: 78, adaptacao: 64, resiliencia: 82 }
  },

  // --- Management Fictícios / Agentes Livres ---
  {
    id: 'mgmt_fic_hernandez', name: 'Victor Hernandez', role: 'head_management', rating: 85, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Gestão de Equipe & Motivação de Paddock', salary: 2500000, buyoutClause: 400000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 60, criatividade: 85, rigorValidacao: 70, lideranca: 92, comunicacao: 90, gestaoPrazo: 75, adaptacao: 85, visaoEstrategica: 75 }
  },
  {
    id: 'mgmt_fic_finch', name: 'Daniel Finch', role: 'head_management', rating: 82, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.FINANCIAL, specialty: 'Gestão Financeira (Cost Cap)', salary: 2200000, buyoutClause: 300000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 65, criatividade: 70, rigorValidacao: 90, lideranca: 70, comunicacao: 75, gestaoPrazo: 85, adaptacao: 65, visaoEstrategica: 95 }
  },
  {
    id: 'mgmt_fic_bouchard', name: 'Clara Bouchard', role: 'head_management', rating: 80, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.POLITICIAN, specialty: 'Relações Regulamentares e Protocolos FIA', salary: 2250000, buyoutClause: 200000, currentTeam: 'FIA Relations', isFictional: true,
    attributes: { tecnica: 68, criatividade: 74, rigorValidacao: 88, lideranca: 80, comunicacao: 89, gestaoPrazo: 84, adaptacao: 79, visaoEstrategica: 88 }
  },
  {
    id: 'mgmt_fic_khan', name: 'Sofia Khan', role: 'head_management', rating: 76, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.CRISIS_MANAGER, specialty: 'Gestão de Crise e Resolução de Conflitos', salary: 1750000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 64, criatividade: 78, rigorValidacao: 82, lideranca: 85, comunicacao: 84, gestaoPrazo: 79, adaptacao: 82, visaoEstrategica: 79 }
  },
  {
    id: 'mgmt_fic_lopez', name: 'Omar López', role: 'head_management', rating: 73, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.PUBLIC_RELATIONS, specialty: 'Comunicação Externa e Blindagem de Crise', salary: 1400000, buyoutClause: 100000, currentTeam: 'Global Media Group', isFictional: true,
    attributes: { tecnica: 60, criatividade: 79, rigorValidacao: 75, lideranca: 77, comunicacao: 92, gestaoPrazo: 76, adaptacao: 81, visaoEstrategica: 76 }
  },
  {
    id: 'staff_sport_fic_2', name: 'Colin Stewart', role: 'head_management', rating: 80, staffPhilosophyTag: 'CONSERVADOR', specialty: 'Controle de Custos e Relações Institucionais', salary: 1800000, buyoutClause: 200000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 70, criatividade: 65, rigorValidacao: 90, lideranca: 80, comunicacao: 85, gestaoPrazo: 90, adaptacao: 75, visaoEstrategica: 85 }
  },
  {
    id: 'mgmt_fic_nguyen', name: 'Marta Nguyen', role: 'head_management', rating: 68, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Formação de Novos Talentos Operacionais', salary: 900000, buyoutClause: 100000, currentTeam: 'Asia Racing Academy', isFictional: true,
    attributes: { tecnica: 62, criatividade: 70, rigorValidacao: 76, lideranca: 74, comunicacao: 78, gestaoPrazo: 75, adaptacao: 70, visaoEstrategica: 72 }
  },

  // --- Mechanics Fictícios / Agentes Livres ---
  {
    id: 'mech_fic_mendoza', name: 'Alex Mendoza', role: 'head_mechanics', rating: 86, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.PIT_STOP_MASTER, specialty: 'Operações de Pit Stop e Treinamento de Pistolas', salary: 1800000, buyoutClause: 250000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 80, criatividade: 85, rigorValidacao: 80, lideranca: 85, comunicacao: 75, gestaoPrazo: 80, adaptacao: 75, resiliencia: 90 }
  },
  {
    id: 'mech_fic_wei', name: 'Lina Wei', role: 'head_mechanics', rating: 83, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Montagem de Precisão e Manutenção Preditiva', salary: 1500000, buyoutClause: 200000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 85, criatividade: 60, rigorValidacao: 92, lideranca: 75, comunicacao: 70, gestaoPrazo: 85, adaptacao: 70, resiliencia: 85 }
  },
  {
    id: 'mech_fic_silva', name: 'Jorge Silva', role: 'head_mechanics', rating: 79, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.DIAGNOSTICS, specialty: 'Diagnóstico e Conserto Rápido de Garagem', salary: 1300000, buyoutClause: 150000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 88, criatividade: 75, rigorValidacao: 82, lideranca: 70, comunicacao: 75, gestaoPrazo: 80, adaptacao: 78, resiliencia: 92 }
  },
  {
    id: 'staff_mech_fic_3', name: 'Rookie Mechanic', role: 'head_mechanics', rating: 68, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Ajuste de Garagem e Apoio ao Box', salary: 500000, buyoutClause: 50000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 68, criatividade: 60, rigorValidacao: 72, lideranca: 65, comunicacao: 70, gestaoPrazo: 68, adaptacao: 65, resiliencia: 70 }
  },
  {
    id: 'mech_fic_kovac', name: 'Nina Kovač', role: 'head_mechanics', rating: 77, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.PIT_STOP_MASTER, specialty: 'Treinador de Pit Stop & Troca de Bico', salary: 1200000, buyoutClause: 100000, currentTeam: 'Balkan Racing', isFictional: true,
    attributes: { tecnica: 75, criatividade: 80, rigorValidacao: 85, lideranca: 82, comunicacao: 78, gestaoPrazo: 75, adaptacao: 72, resiliencia: 88 }
  },
  {
    id: 'mech_fic_rossi', name: 'Pietro Rossi', role: 'head_mechanics', rating: 74, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Especialista em Câmbio e Diferencial', salary: 1050000, buyoutClause: 100000, currentTeam: 'Moto Guzzi R&D', isFictional: true,
    attributes: { tecnica: 86, criatividade: 65, rigorValidacao: 88, lideranca: 68, comunicacao: 70, gestaoPrazo: 82, adaptacao: 70, resiliencia: 85 }
  },
  {
    id: 'mech_brake_01', name: 'Sarah Jenkins', role: 'head_mechanics', rating: 80, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.BRAKE_THERMAL, specialty: 'Gestão Térmica de Freios & Mantas Térmicas', salary: 1300000, buyoutClause: 150000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 84, criatividade: 75, rigorValidacao: 86, lideranca: 78, comunicacao: 76, gestaoPrazo: 82, adaptacao: 78, resiliencia: 86 }
  },
  {
    id: 'mech_fic_kim', name: 'Hana Kim', role: 'head_mechanics', rating: 71, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Ajuste Fino de Suspensão e Feedback', salary: 950000, buyoutClause: 100000, currentTeam: 'Seoul Dynamics', isFictional: true,
    attributes: { tecnica: 82, criatividade: 70, rigorValidacao: 86, lideranca: 65, comunicacao: 85, gestaoPrazo: 75, adaptacao: 78, resiliencia: 80 }
  },

  // ==================== NOVOS MECÂNICOS — AGENTES LIVRES ====================
  {
    id: 'mech_fic_okafor', name: 'Chidi Okafor', role: 'head_mechanics', rating: 78, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.PIT_STOP_MASTER, specialty: 'Especialista em Pit Stops Rápidos & Procedimentos de Troca', salary: 1150000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 85, criatividade: 80, rigorValidacao: 76, lideranca: 72, comunicacao: 86, gestaoPrazo: 84, adaptacao: 82, resiliencia: 88 }
  },
  {
    id: 'mech_fic_santos', name: 'Rafael Santos', role: 'head_mechanics', rating: 75, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.RELIABILITY, specialty: 'Confiabilidade de Componentes & Protocolos de Manutenção', salary: 1050000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 84, criatividade: 65, rigorValidacao: 90, lideranca: 70, comunicacao: 76, gestaoPrazo: 86, adaptacao: 70, resiliencia: 90 }
  },
  {
    id: 'mech_fic_diallo', name: 'Aminata Diallo', role: 'head_mechanics', rating: 73, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.BRAKE_THERMAL, specialty: 'Gestão Térmica de Freios em Condições Extremas', salary: 980000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 88, criatividade: 68, rigorValidacao: 88, lideranca: 64, comunicacao: 72, gestaoPrazo: 80, adaptacao: 74, resiliencia: 85 }
  },
  {
    id: 'mech_fic_varga', name: 'Tamás Varga', role: 'head_mechanics', rating: 70, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.TRANSMISSION_MECHANICS, specialty: 'Câmbio Semi-Automático & Diferencial Ativo', salary: 900000, buyoutClause: 80000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 85, criatividade: 60, rigorValidacao: 85, lideranca: 60, comunicacao: 70, gestaoPrazo: 82, adaptacao: 68, resiliencia: 82 }
  },
  {
    id: 'mech_fic_chen', name: 'Wei Chen', role: 'head_mechanics', rating: 69, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOUNTING_ENGINEER, specialty: 'Ajuste de Geometria & Sistemas de Suspensão Ativos', salary: 880000, buyoutClause: 80000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 80, criatividade: 76, rigorValidacao: 80, lideranca: 60, comunicacao: 74, gestaoPrazo: 78, adaptacao: 80, resiliencia: 78 }
  },
  {
    id: 'mech_fic_muller', name: 'Greta Müller', role: 'head_mechanics', rating: 67, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.RELIABILITY, specialty: 'Protocolos de Inspeção & Zero Falhas na Largada', salary: 820000, buyoutClause: 70000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 78, criatividade: 62, rigorValidacao: 90, lideranca: 58, comunicacao: 70, gestaoPrazo: 80, adaptacao: 66, resiliencia: 86 }
  },

  // ==================== NOVOS GERENTES — AGENTES LIVRES ====================
  {
    id: 'mgmt_fic_osei', name: 'Kwame Osei', role: 'head_management', rating: 79, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Liderança Dinâmica & Cultura de Alta Performance', salary: 1600000, buyoutClause: 200000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 68, criatividade: 85, rigorValidacao: 72, lideranca: 90, comunicacao: 92, gestaoPrazo: 76, adaptacao: 86, visaoEstrategica: 82 }
  },
  {
    id: 'mgmt_fic_leconte', name: 'Isabelle Leconte', role: 'head_management', rating: 77, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.FINANCIAL, specialty: 'Controle de Cost Cap & Conformidade FIA', salary: 1450000, buyoutClause: 180000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 72, criatividade: 65, rigorValidacao: 88, lideranca: 76, comunicacao: 80, gestaoPrazo: 90, adaptacao: 70, visaoEstrategica: 80 }
  },
  {
    id: 'mgmt_fic_patel', name: 'Arjun Patel', role: 'head_management', rating: 75, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.POLITICIAN, specialty: 'Negociação com FIA & Alianças no Paddock', salary: 1300000, buyoutClause: 160000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 65, criatividade: 76, rigorValidacao: 80, lideranca: 82, comunicacao: 90, gestaoPrazo: 76, adaptacao: 80, visaoEstrategica: 86 }
  },
  {
    id: 'mgmt_fic_eriksen', name: 'Lars Eriksen', role: 'head_management', rating: 73, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.CRISIS_MANAGER, specialty: 'Gestão de Incidentes em Corrida & Safety Car', salary: 1200000, buyoutClause: 140000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 70, criatividade: 78, rigorValidacao: 76, lideranca: 80, comunicacao: 82, gestaoPrazo: 84, adaptacao: 90, visaoEstrategica: 76 }
  },
  {
    id: 'mgmt_fic_ferreira', name: 'Beatriz Ferreira', role: 'head_management', rating: 71, staffPhilosophyTag: 'CONSERVADOR', designDna: Specialization.PUBLIC_RELATIONS, specialty: 'Relações com Mídia & Imagem da Equipe', salary: 1100000, buyoutClause: 120000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 60, criatividade: 80, rigorValidacao: 72, lideranca: 74, comunicacao: 96, gestaoPrazo: 72, adaptacao: 82, visaoEstrategica: 72 }
  },
  {
    id: 'mgmt_fic_yanagida', name: 'Kenji Yanagida', role: 'head_management', rating: 69, staffPhilosophyTag: 'ESPECIALISTA', designDna: Specialization.FINANCIAL, specialty: 'Orçamento de P&D & Alocação de Recursos de Fábrica', salary: 1000000, buyoutClause: 100000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 65, criatividade: 68, rigorValidacao: 86, lideranca: 68, comunicacao: 76, gestaoPrazo: 92, adaptacao: 70, visaoEstrategica: 78 }
  },
  {
    id: 'mgmt_fic_adeyemi', name: 'Tunde Adeyemi', role: 'head_management', rating: 66, staffPhilosophyTag: 'INOVADOR', designDna: Specialization.MOTIVATOR, specialty: 'Desenvolvimento de Pilotos Jovens & Coesão de Equipe', salary: 900000, buyoutClause: 80000, currentTeam: 'Agente Livre', isFictional: true,
    attributes: { tecnica: 58, criatividade: 82, rigorValidacao: 65, lideranca: 86, comunicacao: 88, gestaoPrazo: 68, adaptacao: 84, visaoEstrategica: 70 }
  }
];

// =============================================================================
// EXPORTS FILTRADOS POR ROLE
// =============================================================================
export const AERO_STAFF_MEMBERS    = marketData.filter(m => m.role === 'head_aero');
export const PU_STAFF_MEMBERS      = marketData.filter(m => m.role === 'head_pu');
export const SPORTING_STAFF_MEMBERS = marketData.filter(m => m.role === 'head_management' || (m.role as string) === 'sporting_director');
export const CHIEF_MECHANIC_STAFF_MEMBERS = marketData.filter(m => m.role === 'head_mechanics' || (m.role as string) === 'chief_mechanic');

export const RACE_ENGINEER_MEMBERS: StaffMember[] = [
  {
    id: 'staff_re_lambiase',
    name: 'Gianpiero Lambiase',
    role: 'race_engineer',
    rating: 95,
    age: 45,
    mentality: 95,
    salary: 3500000,
    buyoutClause: 6000000,
    currentTeam: 'Oracle Red Bull Racing',
    specialty: 'Rádio Cirúrgico sob Pressão & Ajuste Fino de Balanço em Corrida',
    staffPhilosophyTag: 'PRECISIONISTA',
    preferredCarPhilosophy: 'stable_platform',
    teamOrigin: 'Milton Keynes Pit Wall',
    isFictional: false
  },
  {
    id: 'staff_re_bono',
    name: 'Peter Bonnington (Bono)',
    role: 'race_engineer',
    rating: 94,
    age: 50,
    mentality: 94,
    salary: 3200000,
    buyoutClause: 5500000,
    currentTeam: 'Mercedes-AMG PETRONAS',
    specialty: 'Gestão Emocional de Campeões & Janela Térmica de Pneus',
    staffPhilosophyTag: 'CONSERVADOR',
    preferredCarPhilosophy: 'aero_efficiency',
    teamOrigin: 'Brackley Engineering',
    isFictional: false
  },
  {
    id: 'staff_re_joseph',
    name: 'Will Joseph',
    role: 'race_engineer',
    rating: 92,
    age: 39,
    mentality: 92,
    salary: 2800000,
    buyoutClause: 4800000,
    currentTeam: 'McLaren F1 Team',
    specialty: 'Telemetria de Ritmo de Stint & Comunicação de Estratégia',
    staffPhilosophyTag: 'ANALÍTICO',
    preferredCarPhilosophy: 'aero_efficiency',
    teamOrigin: 'Woking Pit Wall',
    isFictional: false
  },
  {
    id: 'staff_re_bozzi',
    name: 'Bryan Bozzi',
    role: 'race_engineer',
    rating: 90,
    age: 35,
    mentality: 90,
    salary: 2400000,
    buyoutClause: 3800000,
    currentTeam: 'Scuderia Ferrari HP',
    specialty: 'Leitura de Degradação & Mapeamento de ERS em Tempo Real',
    staffPhilosophyTag: 'INOVADOR',
    preferredCarPhilosophy: 'high_downforce',
    teamOrigin: 'Maranello Trackside',
    isFictional: false
  },
  {
    id: 'staff_re_adami',
    name: 'Riccardo Adami',
    role: 'race_engineer',
    rating: 90,
    age: 52,
    mentality: 90,
    salary: 2400000,
    buyoutClause: 3800000,
    currentTeam: 'Scuderia Ferrari HP',
    specialty: 'Feedback Mecânico de Frenagem & Protocolos de Safety Car',
    staffPhilosophyTag: 'CONSERVADOR',
    preferredCarPhilosophy: 'mechanical_grip',
    teamOrigin: 'Faenza / Maranello',
    isFictional: false
  },
  {
    id: 'staff_re_stallard',
    name: 'Tom Stallard',
    role: 'race_engineer',
    rating: 89,
    age: 47,
    mentality: 91,
    salary: 2200000,
    buyoutClause: 3400000,
    currentTeam: 'McLaren F1 Team',
    specialty: 'Calma Olímpica no Rádio & Calibração de Asa Dianteira',
    staffPhilosophyTag: 'EQUILIBRADO',
    preferredCarPhilosophy: 'balanced_adaptive',
    teamOrigin: 'Woking Trackside',
    isFictional: false
  },
  {
    id: 'staff_re_jego',
    name: 'Gaetan Jego',
    role: 'race_engineer',
    rating: 88,
    age: 42,
    mentality: 89,
    salary: 2100000,
    buyoutClause: 3200000,
    currentTeam: 'Williams Racing',
    specialty: 'Comunicação Direta com Piloto Latino & Calibração de Frenagem',
    staffPhilosophyTag: 'ANALÍTICO',
    preferredCarPhilosophy: 'balanced_adaptive',
    teamOrigin: 'Williams Grove Pit Wall',
    isFictional: false
  },
  {
    id: 'staff_re_dudley',
    name: 'Marcus Dudley',
    role: 'race_engineer',
    rating: 87,
    age: 40,
    mentality: 88,
    salary: 2000000,
    buyoutClause: 3000000,
    currentTeam: 'Mercedes-AMG PETRONAS',
    specialty: 'Mapeamento de Sobreviragem & Transição de Chuva',
    staffPhilosophyTag: 'PRECISIONISTA',
    preferredCarPhilosophy: 'low_drag',
    teamOrigin: 'Mercedes Brackley',
    isFictional: false
  },
  {
    id: 'staff_re_bird',
    name: 'Hugh Bird',
    role: 'race_engineer',
    rating: 86,
    age: 41,
    mentality: 87,
    salary: 1900000,
    buyoutClause: 2700000,
    currentTeam: 'Oracle Red Bull Racing',
    specialty: 'Gestão de Tráfego de Qualificação & Ritmo de Ar Limpo',
    staffPhilosophyTag: 'EQUILIBRADO',
    preferredCarPhilosophy: 'stable_platform',
    teamOrigin: 'Red Bull Milton Keynes',
    isFictional: false
  },
  {
    id: 'staff_re_peckett',
    name: 'Josh Peckett',
    role: 'race_engineer',
    rating: 85,
    age: 38,
    mentality: 86,
    salary: 1750000,
    buyoutClause: 2400000,
    currentTeam: 'MoneyGram Haas F1 Team',
    specialty: 'Ajuste de Cargas Laterais & Comunicação Assertiva',
    staffPhilosophyTag: 'PRAGMÁTICO',
    preferredCarPhilosophy: 'high_downforce',
    teamOrigin: 'Haas Banbury',
    isFictional: false
  },
  {
    id: 'staff_re_fic_1',
    name: 'Lucas Ferreira',
    role: 'race_engineer',
    rating: 75,
    age: 33,
    mentality: 85,
    salary: 750000,
    buyoutClause: 120000,
    currentTeam: 'Prema F2 Engineering',
    specialty: 'Telemetria de Aquecimento de Pneus & Setup de Classificação',
    staffPhilosophyTag: 'INOVADOR',
    preferredCarPhilosophy: 'low_drag',
    teamOrigin: 'FIA F2 Telemetry Lab',
    isFictional: true
  },
  {
    id: 'staff_re_fic_2',
    name: 'Clara Hoffman',
    role: 'race_engineer',
    rating: 74,
    age: 31,
    mentality: 84,
    salary: 700000,
    buyoutClause: 100000,
    currentTeam: 'Agente Livre',
    specialty: 'Gestão de Energia ERS 350kW & Rádio Direto Sem Ruído',
    staffPhilosophyTag: 'ANALÍTICO',
    preferredCarPhilosophy: 'aero_efficiency',
    teamOrigin: 'Porsche Motorsport Endurance',
    isFictional: true
  },
  {
    id: 'staff_re_fic_3',
    name: 'Samir Patel',
    role: 'race_engineer',
    rating: 71,
    age: 36,
    mentality: 82,
    salary: 580000,
    buyoutClause: 0,
    currentTeam: 'Agente Livre',
    specialty: 'Prevenção de Graining & Calibração de Diferencial em Chuva',
    staffPhilosophyTag: 'MECHANICAL GRIP',
    preferredCarPhilosophy: 'mechanical_grip',
    teamOrigin: 'Silverstone GT3 Trackside',
    isFictional: true
  },
  {
    id: 'staff_re_fic_4',
    name: 'Matteo Conti',
    role: 'race_engineer',
    rating: 68,
    age: 29,
    mentality: 80,
    salary: 480000,
    buyoutClause: 0,
    currentTeam: 'Agente Livre',
    specialty: 'Leitura de Sensores de Altura & Gestão de Crise em Largada',
    staffPhilosophyTag: 'CONSERVADOR',
    preferredCarPhilosophy: 'stable_platform',
    teamOrigin: 'Trident F3 Engineering',
    isFictional: true
  }
];

export const ALL_STAFF_MEMBERS: StaffMember[] = [
  ...AERO_STAFF_MEMBERS,
  ...PU_STAFF_MEMBERS,
  ...SPORTING_STAFF_MEMBERS,
  ...CHIEF_MECHANIC_STAFF_MEMBERS,
  ...RACE_ENGINEER_MEMBERS
];


// 6. DOSSIÊ COMPLETO DE EQUIPES RIVAIS (TEMPORADA 2026)
// ============================================================================
export interface RivalTeamDossier {
  teamId: string;
  name: string;
  shortName: string;
  color: string;
  teamPrincipal: string;
  driver1Name: string;
  driver1Number: number;
  driver1Nat: string;
  driver2Name: string;
  driver2Number: number;
  driver2Nat: string;
  headOfAero: string;
  headOfPowerUnit: string;
  sportingDirector: string;
  engineSupplier: string;
  factoryHq: string;
  carRating: number;
  budgetCapSpend: string;
}

export const RIVAL_TEAMS_DOSSIER: Record<string, RivalTeamDossier> = {
  ferrari: {
    teamId: 'ferrari',
    name: 'Scuderia Ferrari HP',
    shortName: 'FER',
    color: '#DC0000',
    teamPrincipal: 'Frédéric Vasseur',
    driver1Name: 'Charles Leclerc',
    driver1Number: 16,
    driver1Nat: 'Mônaco',
    driver2Name: 'Lewis Hamilton',
    driver2Number: 44,
    driver2Nat: 'Reino Unido',
    headOfAero: 'Diego Tondi',
    headOfPowerUnit: 'Enrico Gualtieri',
    sportingDirector: 'Diego Ioverno',
    engineSupplier: 'Ferrari 066/13 V6 Turbo',
    factoryHq: 'Maranello, Itália',
    carRating: 92,
    budgetCapSpend: '$135.0M (Teto Máximo)'
  },
  mclaren: {
    teamId: 'mclaren',
    name: 'McLaren Formula 1 Team',
    shortName: 'MCL',
    color: '#FF8000',
    teamPrincipal: 'Andrea Stella',
    driver1Name: 'Lando Norris',
    driver1Number: 4,
    driver1Nat: 'Reino Unido',
    driver2Name: 'Oscar Piastri',
    driver2Number: 81,
    driver2Nat: 'Austrália',
    headOfAero: 'Peter Prodromou',
    headOfPowerUnit: 'Rob Marshall (Integração Mercedes HPP)',
    sportingDirector: 'Randeep Singh',
    engineSupplier: 'Mercedes-AMG M17 E-Power',
    factoryHq: 'Woking, Reino Unido',
    carRating: 91,
    budgetCapSpend: '$135.0M (Teto Máximo)'
  },
  redbull: {
    teamId: 'redbull',
    name: 'Oracle Red Bull Racing',
    shortName: 'RBR',
    color: '#0B1936',
    teamPrincipal: 'Christian Horner',
    driver1Name: 'Max Verstappen',
    driver1Number: 3,
    driver1Nat: 'Holanda',
    driver2Name: 'Isack Hadjar',
    driver2Number: 6,
    driver2Nat: 'França',
    headOfAero: 'Pierre Waché / Enrico Balbo',
    headOfPowerUnit: 'Ben Hodgkinson (RBPT-Ford)',
    sportingDirector: 'Jonathan Wheatley / Calum Nicholas',
    engineSupplier: 'Red Bull Ford Powertrains Spec-1',
    factoryHq: 'Milton Keynes, Reino Unido',
    carRating: 90,
    budgetCapSpend: '$135.0M (Teto Máximo)'
  },
  mercedes: {
    teamId: 'mercedes',
    name: 'Mercedes-AMG PETRONAS F1 Team',
    shortName: 'MER',
    color: '#11141A',
    teamPrincipal: 'Toto Wolff',
    driver1Name: 'George Russell',
    driver1Number: 63,
    driver1Nat: 'Reino Unido',
    driver2Name: 'Kimi Antonelli',
    driver2Number: 12,
    driver2Nat: 'Itália',
    headOfAero: 'James Allison / Simone Resta',
    headOfPowerUnit: 'Hywel Thomas',
    sportingDirector: 'Ron Meadows',
    engineSupplier: 'Mercedes-AMG F1 M17 Performance',
    factoryHq: 'Brackley & Brixworth, Reino Unido',
    carRating: 88,
    budgetCapSpend: '$135.0M (Teto Máximo)'
  },
  astonmartin: {
    teamId: 'astonmartin',
    name: 'Aston Martin Aramco F1 Team',
    shortName: 'AMR',
    color: '#00594F',
    teamPrincipal: 'Mike Krack (Andy Cowell Group CEO)',
    driver1Name: 'Fernando Alonso',
    driver1Number: 14,
    driver1Nat: 'Espanha',
    driver2Name: 'Lance Stroll',
    driver2Number: 18,
    driver2Nat: 'Canadá',
    headOfAero: 'Adrian Newey / Dan Fallows',
    headOfPowerUnit: 'Koji Watanabe (Honda HRC Factory)',
    sportingDirector: 'Andy Cowell',
    engineSupplier: 'Honda HRC RA626H',
    factoryHq: 'Silverstone, Reino Unido & Sakura, Japão',
    carRating: 85,
    budgetCapSpend: '$135.0M (Teto Máximo)'
  },
  williams: {
    teamId: 'williams',
    name: 'Williams Racing',
    shortName: 'WIL',
    color: '#0047AB',
    teamPrincipal: 'James Vowles',
    driver1Name: 'Carlos Sainz',
    driver1Number: 55,
    driver1Nat: 'Espanha',
    driver2Name: 'Alexander Albon',
    driver2Number: 23,
    driver2Nat: 'Tailândia',
    headOfAero: 'Pat Fry',
    headOfPowerUnit: 'Hywel Thomas (Mercedes HPP Cliente)',
    sportingDirector: 'Sven Smeets',
    engineSupplier: 'Mercedes-AMG M17 Cliente',
    factoryHq: 'Grove, Oxfordshire, Reino Unido',
    carRating: 80,
    budgetCapSpend: '$128.5M'
  },
  alpine: {
    teamId: 'alpine',
    name: 'BWT Alpine F1 Team',
    shortName: 'ALP',
    color: '#007BFF',
    teamPrincipal: 'Oliver Oakes (Flavio Briatore Advisor)',
    driver1Name: 'Pierre Gasly',
    driver1Number: 10,
    driver1Nat: 'França',
    driver2Name: 'Franco Colapinto',
    driver2Number: 43,
    driver2Nat: 'Argentina',
    headOfAero: 'David Sanchez',
    headOfPowerUnit: 'Hywel Thomas (Mercedes HPP Cliente)',
    sportingDirector: 'Julian Rouse',
    engineSupplier: 'Mercedes-AMG M17 Cliente',
    factoryHq: 'Enstone, Reino Unido',
    carRating: 79,
    budgetCapSpend: '$125.0M'
  },
  audi: {
    teamId: 'audi',
    name: 'Audi Revolut F1 Team',
    shortName: 'AUD',
    color: '#8E95A0',
    teamPrincipal: 'Mattia Binotto',
    driver1Name: 'Nico Hülkenberg',
    driver1Number: 27,
    driver1Nat: 'Alemanha',
    driver2Name: 'Gabriel Bortoleto',
    driver2Number: 5,
    driver2Nat: 'Brasil',
    headOfAero: 'James Key',
    headOfPowerUnit: 'Stefan Dreyer (Audi F1 Neuburg)',
    sportingDirector: 'Beat Zehnder / Jonathan Wheatley',
    engineSupplier: 'Audi F1 Hybrid V6 Turbo',
    factoryHq: 'Hinwil, Suíça & Neuburg, Alemanha',
    carRating: 78,
    budgetCapSpend: '$135.0M (Projeto de Fábrica)'
  },
  haas: {
    teamId: 'haas',
    name: 'MoneyGram Haas F1 Team',
    shortName: 'HAA',
    color: '#F2F4F7',
    teamPrincipal: 'Ayao Komatsu',
    driver1Name: 'Esteban Ocon',
    driver1Number: 31,
    driver1Nat: 'França',
    driver2Name: 'Oliver Bearman',
    driver2Number: 87,
    driver2Nat: 'Reino Unido',
    headOfAero: 'Andrea De Zordo',
    headOfPowerUnit: 'Enrico Gualtieri (Ferrari Cliente)',
    sportingDirector: 'Peter Crolla',
    engineSupplier: 'Ferrari 067 Cliente',
    factoryHq: 'Kannapolis, EUA & Banbury, Reino Unido',
    carRating: 76,
    budgetCapSpend: '$118.0M'
  },
  rb: {
    teamId: 'rb',
    name: 'Visa Cash App Racing Bulls',
    shortName: 'VCARB',
    color: '#F1F3F6',
    teamPrincipal: 'Laurent Mekies',
    driver1Name: 'Liam Lawson',
    driver1Number: 30,
    driver1Nat: 'Nova Zelândia',
    driver2Name: 'Arvid Lindblad',
    driver2Number: 41,
    driver2Nat: 'Reino Unido',
    headOfAero: 'Jody Egginton',
    headOfPowerUnit: 'Ben Hodgkinson (RBPT-Ford Cliente)',
    sportingDirector: 'Alan Permane',
    engineSupplier: 'Red Bull Ford Powertrains Spec-1',
    factoryHq: 'Faenza, Itália & Milton Keynes, Reino Unido',
    carRating: 80,
    budgetCapSpend: '$126.0M'
  },
  cadillac: {
    teamId: 'cadillac',
    name: 'Cadillac Formula 1 Team',
    shortName: 'CAD',
    color: '#16171D',
    teamPrincipal: 'Graeme Lowdon (Mario Andretti Advisor)',
    driver1Name: 'Sergio Pérez',
    driver1Number: 11,
    driver1Nat: 'México',
    driver2Name: 'Colton Herta',
    driver2Number: 26,
    driver2Nat: 'EUA',
    headOfAero: 'Nick Chester',
    headOfPowerUnit: 'Enrico Gualtieri (Ferrari Cliente)',
    sportingDirector: 'Rob White',
    engineSupplier: 'Ferrari 067 Cliente (Transição GM)',
    factoryHq: 'Fishers, Indiana, EUA & Silverstone, Reino Unido',
    carRating: 75,
    budgetCapSpend: '$120.0M'
  }
};

// ============================================================================
// 7. GERADOR DE NOVOS PILOTOS (YOUTH INTAKE - ANO 1 PARA ANO 2)
// ============================================================================
const FIRST_NAMES_BY_COUNTRY: Record<string, string[]> = {
  Brasil: ['Matheus', 'Lucas', 'Felipe', 'Pedro', 'Gabriel', 'Rafael', 'Thiago', 'Guilherme', 'Enzo', 'Leonardo'],
  'Reino Unido': ['Harry', 'Archie', 'Oliver', 'George', 'Lewis', 'Alfie', 'Freddie', 'Finlay', 'Arthur', 'Leo'],
  Alemanha: ['Jonas', 'Lukas', 'Niklas', 'Felix', 'Tim', 'Max', 'Leon', 'Paul', 'Julian', 'Moritz'],
  Itália: ['Marco', 'Lorenzo', 'Matteo', 'Giovanni', 'Alessandro', 'Luca', 'Andrea', 'Davide', 'Federico', 'Simone'],
  Japão: ['Ren', 'Daiki', 'Kaito', 'Ryota', 'Kenji', 'Sora', 'Haruto', 'Yuto', 'Shin', 'Taiki']
};

const LAST_NAMES_BY_COUNTRY: Record<string, string[]> = {
  Brasil: ['Faria', 'Barreto', 'Ramos', 'Diniz', 'Carvalho', 'Azevedo', 'Macedo', 'Silveira', 'Fontes', 'Moraes'],
  'Reino Unido': ['Crawford', 'Bell', 'Wright', 'Miller', 'Foster', 'Palmer', 'Hughes', 'Bennett', 'Chapman', 'Dixon'],
  Alemanha: ['Becker', 'Fischer', 'Hoffmann', 'Wagner', 'Richter', 'Schäfer', 'Bauer', 'Zimmermann', 'Hartmann', 'Vogel'],
  Itália: ['Ferri', 'Conti', 'Rinaldi', 'De Luca', 'Moretti', 'Galli', 'Fontana', 'Marchetti', 'Santoro', 'Caruso'],
  Japão: ['Tanaka', 'Suzuki', 'Takahashi', 'Sato', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato']
};

const COUNTRIES = ['Brasil', 'Reino Unido', 'Alemanha', 'Itália', 'Japão'];

export function generateNewDrivers(existingDriversCount: number = 50): Driver[] {
  const newDrivers: Driver[] = [];
  const selectedNumbers = new Set<number>();

  for (let i = 0; i < 5; i++) {
    const country = COUNTRIES[i % COUNTRIES.length];
    const firstList = FIRST_NAMES_BY_COUNTRY[country];
    const lastList = LAST_NAMES_BY_COUNTRY[country];

    const firstName = firstList[Math.floor(Math.random() * firstList.length)];
    const lastName = lastList[Math.floor(Math.random() * lastList.length)];
    const fullName = `${firstName} ${lastName}`;
    const shortCode = (lastName.slice(0, 3)).toUpperCase();

    let driverNumber = Math.floor(Math.random() * 80) + 15;
    while (selectedNumbers.has(driverNumber)) {
      driverNumber = Math.floor(Math.random() * 80) + 15;
    }
    selectedNumbers.add(driverNumber);

    const age = Math.floor(Math.random() * 3) + 16; // 16 - 18 anos
    const baseOvr = 55 + Math.floor(Math.random() * 4); // 55 - 58
    const potential = 75 + Math.floor(Math.random() * 18); // 75 - 92

    const pace = baseOvr + (Math.floor(Math.random() * 5) - 2);
    const cornering = baseOvr + (Math.floor(Math.random() * 5) - 2);
    const braking = baseOvr + (Math.floor(Math.random() * 5) - 2);
    const consistency = baseOvr + (Math.floor(Math.random() * 5) - 2);
    const smoothness = baseOvr + (Math.floor(Math.random() * 5) - 2);
    const composure = baseOvr + (Math.floor(Math.random() * 5) - 2);
    const reactionTime = baseOvr + (Math.floor(Math.random() * 8));

    newDrivers.push({
      id: `driver_youth_f3_${existingDriversCount + i + 1}_${Date.now()}`,
      name: fullName,
      shortCode,
      number: driverNumber,
      nationality: country,
      teamId: 'free_agent',
      series: 'F3',
      isAffiliate: true,
      requiredReputation: 0,
      ovr: baseOvr,
      salary: 180000 + Math.floor(Math.random() * 80000),
      contractYearsRemaining: 1,
      buyoutClause: 500000,
      marketability: 60 + Math.floor(Math.random() * 20),
      mentality: 80 + Math.floor(Math.random() * 15),
      potential,
      age,
      avatarColor: country === 'Brasil' ? '#009B3A' : country === 'Reino Unido' ? '#00247D' : country === 'Alemanha' ? '#DD0000' : country === 'Itália' ? '#008C45' : '#BC002D',
      attributes: {
        pace,
        cornering,
        braking,
        consistency,
        smoothness,
        overtaking: baseOvr,
        defending: baseOvr,
        wetWeather: baseOvr,
        tireManagement: baseOvr,
        reactionTime,
        composure,
        feedback: baseOvr,
        stamina: baseOvr + 4
      }
    });
  }

  return newDrivers;
}
