import { EX } from './colors';

export const KPI = {
  totalParcels:      2_000_000,
  legalParcels:      1_280_000,
  illegalParcels:      240_000,
  disputed:            400_000,
  unregistered:         80_000,
  encroachments:        12_450,
  activeAlerts:            347,
  forestSqKm:              220,
  waterSqKm:                45,
  slumsCount:                4,
  illegalSocieties:         89,
  approvedSocieties:       156,
  dealerNetworks:          312,
  resolvedThisMonth:     1_840,
};

export const LEGAL_STATUS = [
  { name: 'Legal Title',   value: 1_280_000, color: EX.legal,        pct: 64 },
  { name: 'Disputed',      value:   400_000, color: EX.disputed,     pct: 20 },
  { name: 'Illegal',       value:   240_000, color: EX.illegal,      pct: 12 },
  { name: 'Unregistered',  value:    80_000, color: EX.unregistered, pct:  4 },
];

export const ZONE_STATS = [
  { zone: 'Zone I',   label: 'Urban Core',       parcels: 450_000, legal: 78, illegal: 8,  disputed: 14, area: 180, encroachments: 3_200 },
  { zone: 'Zone II',  label: 'Residential Belt', parcels: 820_000, legal: 62, illegal: 14, disputed: 24, area: 420, encroachments: 5_800 },
  { zone: 'Zone III', label: 'Peri-Urban',       parcels: 730_000, legal: 58, illegal: 13, disputed: 22, area: 306, encroachments: 3_450 },
];

export const ENCROACHMENT_TREND = [
  { month: 'Jan 24', detected: 890,  resolved: 620  },
  { month: 'Feb 24', detected: 1020, resolved: 580  },
  { month: 'Mar 24', detected: 760,  resolved: 710  },
  { month: 'Apr 24', detected: 1140, resolved: 490  },
  { month: 'May 24', detected: 980,  resolved: 820  },
  { month: 'Jun 24', detected: 850,  resolved: 900  },
  { month: 'Jul 24', detected: 1230, resolved: 670  },
  { month: 'Aug 24', detected: 1100, resolved: 750  },
  { month: 'Sep 24', detected: 940,  resolved: 880  },
  { month: 'Oct 24', detected: 1380, resolved: 920  },
  { month: 'Nov 24', detected: 1260, resolved: 1040 },
  { month: 'Dec 24', detected: 1450, resolved: 1180 },
];

export const SLUMS = [
  { id: 1, name: 'France Colony', area: 2.8, households: 1_240, population: 8_680,  zone: 'Zone I',   status: 'High Priority', lat: 33.7215, lng: 73.0433, established: 1985, amenities: 'Partial' },
  { id: 2, name: 'Dhoke Gujrat',  area: 3.2, households: 1_560, population: 10_920, zone: 'Zone II',  status: 'Medium',        lat: 33.6890, lng: 73.0720, established: 1991, amenities: 'Partial' },
  { id: 3, name: 'Bhara Kahu',    area: 4.1, households: 2_100, population: 14_700, zone: 'Zone III', status: 'Medium',        lat: 33.6456, lng: 73.2210, established: 1978, amenities: 'None'    },
  { id: 4, name: 'Tarlai Kalan',  area: 1.7, households:   890, population: 6_230,  zone: 'Zone II',  status: 'Low',           lat: 33.6654, lng: 72.9876, established: 2002, amenities: 'Partial' },
];

export const NATURAL_ASSETS = [
  { id: 1, name: 'Margalla Hills National Park', type: 'Forest',    areaSqKm: 157.0, status: 'Protected',   risk: 'Low'    },
  { id: 2, name: 'Rawal Lake',                   type: 'Water',     areaSqKm:   8.8, status: 'Protected',   risk: 'Medium' },
  { id: 3, name: 'Simly Dam Reserve',            type: 'Water',     areaSqKm:  33.4, status: 'Protected',   risk: 'Low'    },
  { id: 4, name: 'Khanpur Forest',               type: 'Forest',    areaSqKm:  63.0, status: 'Partial',     risk: 'High'   },
  { id: 5, name: 'Shahdara Valley',              type: 'Protected', areaSqKm:  12.5, status: 'Unprotected', risk: 'High'   },
];

export const TP18_PHASES = [
  { phase: 'Phase I',   startYear: 2018, endYear: 2019, parcels: 45_000,  surveyed: 45_000,  digitized: 45_000,  status: 'completed'   },
  { phase: 'Phase II',  startYear: 2019, endYear: 2021, parcels: 120_000, surveyed: 120_000, digitized: 120_000, status: 'completed'   },
  { phase: 'Phase III', startYear: 2021, endYear: 2023, parcels: 380_000, surveyed: 380_000, digitized: 375_000, status: 'completed'   },
  { phase: 'Phase IV',  startYear: 2024, endYear: 2025, parcels: 650_000, surveyed: 420_000, digitized: 310_000, status: 'in-progress' },
  { phase: 'Phase V',   startYear: 2025, endYear: 2026, parcels: 805_000, surveyed: 0,       digitized: 0,       status: 'planned'     },
];

export const LAND_USE = [
  { type: 'Residential',   sqkm: 312.4, color: EX.residential  },
  { type: 'Commercial',    sqkm:  48.6, color: EX.commercial   },
  { type: 'Industrial',    sqkm:  72.1, color: EX.industrial   },
  { type: 'Forest',        sqkm: 220.0, color: EX.forest       },
  { type: 'Water',         sqkm:  45.0, color: EX.water        },
  { type: 'Institutional', sqkm:  38.9, color: '#0891b2'       },
  { type: 'Open/Vacant',   sqkm: 169.0, color: EX.unregistered },
];

export const ALERTS = [
  { id: 1, severity: 'critical', title: 'Mass encroachment detected',        zone: 'Zone II',  sector: 'I-14', time: '2h ago',  parcels: 340 },
  { id: 2, severity: 'critical', title: 'Illegal construction — forest edge', zone: 'Zone III', sector: 'F-16', time: '4h ago',  parcels: 12  },
  { id: 3, severity: 'high',     title: 'Ownership forgery suspected',        zone: 'Zone I',   sector: 'G-6',  time: '6h ago',  parcels: 5   },
  { id: 4, severity: 'high',     title: 'Nullah obstruction reported',         zone: 'Zone II',  sector: 'E-11', time: '8h ago',  parcels: 28  },
  { id: 5, severity: 'medium',   title: 'Unapproved subdivision filed',        zone: 'Zone I',   sector: 'F-7',  time: '12h ago', parcels: 3   },
  { id: 6, severity: 'medium',   title: 'Disputed boundary — adjacent plots',  zone: 'Zone III', sector: 'H-15', time: '1d ago',  parcels: 7   },
  { id: 7, severity: 'low',      title: 'Unregistered dealer network flagged',  zone: 'Zone II',  sector: 'G-10', time: '2d ago',  parcels: 0   },
];

const owners = ['Muhammad Ali','Fatima Khan','Ahmed Raza','Sara Malik','Tariq Hussain','Amna Bashir','Usman Shah','Zara Ahmed'];
const sectors = ['G-6','G-7','F-8','H-10','I-11','E-9','F-10','G-10'];
const zones   = ['Zone I','Zone II','Zone III'];
const statuses= ['Legal','Legal','Legal','Legal','Illegal','Disputed','Unregistered','Legal'];
const uses    = ['Residential','Commercial','Residential','Industrial','Residential','Institutional','Commercial','Residential'];
const phases  = ['Phase III','Phase IV','Phase IV','Phase III','Phase II'];

export const SAMPLE_PARCELS = Array.from({ length: 200 }, (_, i) => ({
  id:          `ICT-${String(10000 + i).padStart(6, '0')}`,
  sector:      sectors[i % sectors.length],
  zone:        zones[i % zones.length],
  owner:       owners[i % owners.length],
  area:        Math.round(100 + (i * 23.7 + 50) % 4900),
  status:      statuses[i % statuses.length],
  landUse:     uses[i % uses.length],
  lastUpdated: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  dealerId:    i % 7 === 0 ? `DLR-${100 + (i % 30)}` : null,
  phase:       phases[i % phases.length],
  encroached:  i % 13 === 0,
  lat:         33.55 + (i * 0.0012) % 0.25,
  lng:         72.95 + (i * 0.0017) % 0.35,
}));

export const FOREST_TREND = [
  { year: '2019', cover: 228 }, { year: '2020', cover: 225 }, { year: '2021', cover: 222 },
  { year: '2022', cover: 220 }, { year: '2023', cover: 218 }, { year: '2024', cover: 220 },
];

export const WATER_TREND = [
  { month: 'Jan', rawal: 82, simly: 71 }, { month: 'Feb', rawal: 79, simly: 68 },
  { month: 'Mar', rawal: 74, simly: 65 }, { month: 'Apr', rawal: 70, simly: 62 },
  { month: 'May', rawal: 68, simly: 60 }, { month: 'Jun', rawal: 78, simly: 71 },
  { month: 'Jul', rawal: 91, simly: 84 }, { month: 'Aug', rawal: 96, simly: 89 },
  { month: 'Sep', rawal: 94, simly: 87 }, { month: 'Oct', rawal: 90, simly: 83 },
  { month: 'Nov', rawal: 87, simly: 80 }, { month: 'Dec', rawal: 85, simly: 77 },
];

export const ZONE_RADAR = [
  { metric: 'Legal %',      zone1: 78, zone2: 62, zone3: 58 },
  { metric: 'Response',     zone1: 82, zone2: 71, zone3: 65 },
  { metric: 'Coverage',     zone1: 91, zone2: 76, zone3: 68 },
  { metric: 'Amenities',    zone1: 88, zone2: 64, zone3: 42 },
  { metric: 'Safety',       zone1: 85, zone2: 69, zone3: 55 },
];
