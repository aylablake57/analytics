'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './primitives/Modal';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from './primitives/ThemeProvider';
import {
  FaCity, FaWrench, FaLeaf, FaHeartbeat, FaTrash,
} from 'react-icons/fa';

// ── ICT total area & conversion helpers ──────────────────────────────────────
const ICT_TOTAL_ACRES = 223_877;           // 906 km² × 247.105
const ACRES_TO_KM2    = 0.00404686;        // 1 acre = 0.00404686 km²
const ACRES_TO_KANALS = 8;                 // 1 acre = 8 Kanals (Pakistan)

const LAND_TYPES = [
  {
    label: 'State Land',    acres: 61_500,  color: '#6366f1',
    note: '25–30% of total',
    pct:    +(61_500  / ICT_TOTAL_ACRES * 100).toFixed(1),
    sqkm:   +(61_500  * ACRES_TO_KM2).toFixed(1),
    kanals:   61_500  * ACRES_TO_KANALS,
  },
  {
    label: 'Military Land', acres: 15_000,  color: '#eab308',   // yellow
    note: 'CDA-notified',
    pct:    +(15_000  / ICT_TOTAL_ACRES * 100).toFixed(1),
    sqkm:   +(15_000  * ACRES_TO_KM2).toFixed(1),
    kanals:   15_000  * ACRES_TO_KANALS,
  },
  {
    label: 'Forest Land',   acres: 18_000,  color: '#34d399',
    note: 'Margalla + others',
    pct:    +(18_000  / ICT_TOTAL_ACRES * 100).toFixed(1),
    sqkm:   +(18_000  * ACRES_TO_KM2).toFixed(1),
    kanals:   18_000  * ACRES_TO_KANALS,
  },
  {
    label: 'Lakes & Dams',  acres: 7_100,   color: '#06b6d4',
    note: 'Rawal, Simly, Khanpur',
    pct:    +(7_100   / ICT_TOTAL_ACRES * 100).toFixed(1),
    sqkm:   +(7_100   * ACRES_TO_KM2).toFixed(1),
    kanals:   7_100   * ACRES_TO_KANALS,
  },
];

const OTHER_ACRES = ICT_TOTAL_ACRES - LAND_TYPES.reduce((s, t) => s + t.acres, 0);
const PIE_DATA = [
  ...LAND_TYPES.map(t => ({ name: t.label, value: t.acres, color: t.color })),
  { name: 'Other Uses', value: OTHER_ACRES, color: '#6b7390' },
];

// ── Infrastructure land distribution (midpoints of given ranges) ──────────────
const mk = (acres: number, color: string, label: string, pctRange: string, acreRange: string, note: string) => ({
  label, color, pctRange, acreRange, note,
  acres,
  sqkm:   +(acres * ACRES_TO_KM2).toFixed(1),
  kanals:   acres * ACRES_TO_KANALS,
  pct:    +(acres / ICT_TOTAL_ACRES * 100).toFixed(1),
});

const INFRA_DIST = [
  mk(39_100, '#6366f1', 'Roads & Transportation',   '15–20%', '33,400–44,800 acres', 'Road + transport network'     ),
  mk(27_950, '#06b6d4', 'Public Utilities',          '10–15%', '22,500–33,400 acres', 'Water, power, telecom'        ),
  mk(16_800, '#34d399', 'Parks & Recreation',        '5–10%',  '11,100–22,500 acres', 'Parks and open spaces'        ),
  mk(19_050, '#f59e0b', 'Commercial & Business',     '7–10%',  '15,600–22,500 acres', 'Blue Area, F-6, etc.'         ),
  mk(78_350, '#a855f7', 'Residential Development',   '30–40%', '67,200–89,500 acres', 'All residential sectors'      ),
  mk(15_650, '#fb923c', 'Institutional Land',        '6–8%',   '13,300–18,000 acres', 'Schools, hospitals, govt'     ),
  mk(27_950, '#ef4444', 'Defense Land',              '10–15%', '22,500–33,400 acres', 'Military installations'       ),
];

const INFRA_PIE = INFRA_DIST.map(d => ({ name: d.label, value: d.acres, color: d.color }));

// ── Types ─────────────────────────────────────────────────────────────────────
interface Metric { name: string; pct: number; figure: string; }
interface Section { title: string; color: string; metrics: Metric[]; }
interface Tab     { id: string; label: string; icon: React.ReactNode; sections: Section[]; }

// ── Tab data ──────────────────────────────────────────────────────────────────
const TABS: Tab[] = [
  {
    id: 'urban', label: 'Urban Planning', icon: <FaCity />,
    sections: [
      {
        title: 'Land Use Planning', color: '#6366f1',
        metrics: [
          { name: 'Zoning compliance',             pct: 78, figure: '2,800 km² zoned'     },
          { name: 'Park & green space allocation',  pct: 65, figure: '220 km²'             },
          { name: 'Commercial zone allocation',     pct: 71, figure: '48 km²'              },
          { name: 'Public amenities land',          pct: 68, figure: '39 km²'              },
        ],
      },
      {
        title: 'Infrastructure Development', color: '#06b6d4',
        metrics: [
          { name: 'Road network completion',        pct: 82, figure: '1,240 km'            },
          { name: 'Water supply coverage',          pct: 79, figure: '906 km² served'      },
          { name: 'Sewerage network',               pct: 74, figure: '720 km covered'      },
          { name: 'Electricity coverage',           pct: 91, figure: '98% households'      },
          { name: 'Telecom infrastructure',         pct: 84, figure: '4G city-wide'        },
        ],
      },
      {
        title: 'Housing Development', color: '#a855f7',
        metrics: [
          { name: 'Govt residential projects',      pct: 58, figure: '12,400 units'        },
          { name: 'Private sector projects',        pct: 72, figure: '48,000 units'        },
          { name: 'Affordable housing initiatives', pct: 45, figure: '8,600 units'         },
          { name: 'Urban renewal zones',            pct: 39, figure: '14 active zones'     },
        ],
      },
      {
        title: 'Transport Planning', color: '#f59e0b',
        metrics: [
          { name: 'Public bus route coverage',      pct: 63, figure: '48 routes'           },
          { name: 'Mass transit planning',          pct: 41, figure: 'Metro Phase 1'       },
          { name: 'Traffic signal network',         pct: 72, figure: '340 junctions'       },
          { name: 'Pedestrian pathways',            pct: 67, figure: '380 km'              },
          { name: 'Cycling infrastructure',         pct: 28, figure: '42 km lanes'         },
        ],
      },
      {
        title: 'Environmental Management', color: '#34d399',
        metrics: [
          { name: 'Green space ratio',              pct: 84, figure: '24% of total area'   },
          { name: 'Sustainable drainage systems',   pct: 56, figure: '180 km covered'      },
          { name: 'Pollution monitoring stations',  pct: 71, figure: '32 stations'         },
          { name: 'Air quality compliance',         pct: 68, figure: 'AQI monitored'       },
        ],
      },
      {
        title: 'Community Services', color: '#fb923c',
        metrics: [
          { name: 'School access (within 2 km)',    pct: 76, figure: '280 schools'         },
          { name: 'Hospital access (within 5 km)',  pct: 68, figure: '47 hospitals'        },
          { name: 'Community centers',              pct: 62, figure: '120 centers'         },
          { name: 'Emergency service stations',     pct: 79, figure: '24 stations'         },
          { name: 'Recreational facilities',        pct: 54, figure: '84 facilities'       },
        ],
      },
      {
        title: 'Economic Development', color: '#f472b6',
        metrics: [
          { name: 'Business district development',  pct: 54, figure: 'Blue Area + F-6'     },
          { name: 'SME incentive programs',         pct: 72, figure: '1,240 businesses'    },
          { name: 'Job creation strategies',        pct: 48, figure: '22,400 jobs'         },
          { name: 'Tech park development',          pct: 61, figure: '3 tech parks'        },
        ],
      },
      {
        title: 'Public Safety & Security', color: '#fb7185',
        metrics: [
          { name: 'Safe City CCTV coverage',        pct: 79, figure: '2,400+ cameras'      },
          { name: 'CPTED implementation',           pct: 67, figure: '340 projects'        },
          { name: 'Disaster management plans',      pct: 84, figure: 'All zones covered'   },
          { name: 'Emergency response readiness',   pct: 88, figure: 'Avg 8 min response'  },
        ],
      },
      {
        title: 'Sustainability Initiatives', color: '#34d399',
        metrics: [
          { name: 'Energy-efficient buildings',     pct: 62, figure: '820 buildings'       },
          { name: 'Waste reduction programs',       pct: 71, figure: '48 active programs'  },
          { name: 'Renewable energy installed',     pct: 34, figure: '12 MW capacity'      },
          { name: 'Green building certification',   pct: 28, figure: '41 buildings'        },
        ],
      },
      {
        title: 'Policy & Regulations', color: '#6366f1',
        metrics: [
          { name: 'Development compliance',         pct: 88, figure: '1,240 projects'      },
          { name: 'Policy adherence rate',          pct: 75, figure: '98% of sectors'      },
          { name: 'Project monitoring coverage',    pct: 82, figure: 'All zones'           },
          { name: 'Environmental compliance',       pct: 79, figure: '84% of sites'        },
        ],
      },
    ],
  },

  {
    id: 'infra', label: 'Infrastructure', icon: <FaWrench />,
    sections: [
      {
        title: 'Road Maintenance', color: '#6366f1',
        metrics: [
          { name: 'Roads in good condition',        pct: 71, figure: '880 km'              },
          { name: 'Pothole repairs completed',      pct: 84, figure: '12,400 repairs / yr' },
          { name: 'Road markings maintained',       pct: 68, figure: '720 km marked'       },
          { name: 'Traffic signals operational',    pct: 91, figure: '340 signals'         },
        ],
      },
      {
        title: 'Bridges & Overpasses', color: '#06b6d4',
        metrics: [
          { name: 'Structural integrity rating',    pct: 85, figure: '124 bridges'         },
          { name: 'Safety barriers maintained',     pct: 78, figure: 'All major bridges'   },
          { name: 'Inspections up to date',         pct: 92, figure: 'Last: 2024'          },
        ],
      },
      {
        title: 'Public Transportation Systems', color: '#a855f7',
        metrics: [
          { name: 'Bus stops maintained',           pct: 68, figure: '480 stops'           },
          { name: 'Fleet maintenance rate',         pct: 74, figure: '320 vehicles'        },
          { name: 'Transit route monitoring',       pct: 81, figure: '48 routes active'    },
        ],
      },
      {
        title: 'Utilities Infrastructure', color: '#f59e0b',
        metrics: [
          { name: 'Water supply pipes in service',  pct: 79, figure: '2,400 km network'    },
          { name: 'Sewerage system cleared',        pct: 74, figure: '1,840 km inspected'  },
          { name: 'Electricity grid uptime',        pct: 91, figure: '99.2% uptime'        },
          { name: 'Gas network integrity',          pct: 84, figure: '1,240 km lines'      },
        ],
      },
      {
        title: 'Parks & Green Spaces', color: '#34d399',
        metrics: [
          { name: 'Landscape maintained',           pct: 82, figure: '220 km²'             },
          { name: 'Playground upkeep',              pct: 74, figure: '180 facilities'      },
          { name: 'Tree health assessments',        pct: 68, figure: '84,000 trees'        },
        ],
      },
      {
        title: 'Public Buildings', color: '#fb923c',
        metrics: [
          { name: 'Buildings regularly inspected',  pct: 76, figure: '280 buildings'       },
          { name: 'Safety systems operational',     pct: 88, figure: 'Fire alarms + exits' },
          { name: 'Structural integrity checks',    pct: 84, figure: 'All govt buildings'  },
        ],
      },
      {
        title: 'Street Lighting', color: '#fbbf24',
        metrics: [
          { name: 'Street lights operational',      pct: 91, figure: '48,000 lights'       },
          { name: 'LED upgrades completed',         pct: 74, figure: '35,520 LEDs'         },
          { name: 'Repair response (< 24 hrs)',     pct: 88, figure: 'Avg same-day'        },
        ],
      },
      {
        title: 'Sidewalks & Pathways', color: '#f472b6',
        metrics: [
          { name: 'Accessible condition',           pct: 67, figure: '380 km pavements'    },
          { name: 'Ramps installed',                pct: 52, figure: '1,240 ramps'         },
          { name: 'Tactile paving coverage',        pct: 44, figure: 'Partial rollout'     },
        ],
      },
      {
        title: 'Waste Management Systems', color: '#fb7185',
        metrics: [
          { name: 'Collection depots operational',  pct: 84, figure: '24 depots'           },
          { name: 'Recycling centers active',       pct: 68, figure: '12 centers'          },
          { name: 'Street cleaning coverage',       pct: 91, figure: 'All sectors daily'   },
        ],
      },
      {
        title: 'Communication Infrastructure', color: '#6366f1',
        metrics: [
          { name: 'Telecom network uptime',         pct: 88, figure: '99.1% uptime'        },
          { name: 'Fiber optic coverage',           pct: 72, figure: '720 km fiber'        },
          { name: 'ISP service coordination',       pct: 79, figure: '8 providers'         },
        ],
      },
    ],
  },

  {
    id: 'health', label: 'Public Health', icon: <FaHeartbeat />,
    sections: [
      {
        title: 'Healthcare Access', color: '#fb7185',
        metrics: [
          { name: 'Hospital access (5 km radius)', pct: 68, figure: '47 hospitals'         },
          { name: 'Primary health units (BHUs)',   pct: 74, figure: '280 BHUs'             },
          { name: 'Specialist facility access',    pct: 54, figure: '22 specialist centers' },
        ],
      },
      {
        title: 'Preventive Health', color: '#f59e0b',
        metrics: [
          { name: 'Child vaccination coverage',    pct: 89, figure: 'EPI programme'        },
          { name: 'Health awareness programmes',   pct: 76, figure: 'All zones covered'    },
          { name: 'Disease surveillance reports',  pct: 82, figure: 'Weekly reporting'     },
        ],
      },
      {
        title: 'Environmental Health', color: '#34d399',
        metrics: [
          { name: 'Safe drinking water access',    pct: 74, figure: 'Tested supply'        },
          { name: 'Sanitation coverage',           pct: 71, figure: 'Proper disposal'      },
          { name: 'Food safety compliance',        pct: 68, figure: '1,240 outlets'        },
        ],
      },
      {
        title: 'Mental Health Services', color: '#a78bfa',
        metrics: [
          { name: 'Mental health centres',         pct: 41, figure: '12 centres'           },
          { name: 'Community counselling',         pct: 38, figure: 'Community-based'      },
          { name: 'Awareness programmes',          pct: 62, figure: 'Schools & offices'    },
        ],
      },
      {
        title: 'Emergency Medical', color: '#fb7185',
        metrics: [
          { name: 'Ambulance response (< 10 min)', pct: 84, figure: 'Avg 10 min'          },
          { name: 'Emergency bed availability',    pct: 72, figure: '1,840 beds'           },
          { name: 'Trauma centre coverage',        pct: 68, figure: '8 facilities'         },
        ],
      },
    ],
  },

  {
    id: 'env', label: 'Environmental', icon: <FaLeaf />,
    sections: [
      {
        title: 'Air Quality', color: '#34d399',
        metrics: [
          { name: 'AQI monitoring coverage',        pct: 72, figure: '32 stations'         },
          { name: 'Industrial emission compliance', pct: 64, figure: '84 industries'       },
          { name: 'Vehicle emission checks',        pct: 71, figure: 'Annual inspections'  },
        ],
      },
      {
        title: 'Water Bodies', color: '#06b6d4',
        metrics: [
          { name: 'River water quality (Soan)',     pct: 68, figure: 'Fair — monitored'    },
          { name: 'Reservoir protection (Rawal)',   pct: 82, figure: 'Protected'           },
          { name: 'Groundwater monitoring',         pct: 74, figure: '180 wells tracked'   },
        ],
      },
      {
        title: 'Forest & Biodiversity', color: '#34d399',
        metrics: [
          { name: 'Forest cover maintained',        pct: 88, figure: '220 km²'             },
          { name: 'Wildlife corridor protection',   pct: 76, figure: 'Margalla Hills'      },
          { name: 'Invasive species control',       pct: 62, figure: 'Ongoing programme'   },
        ],
      },
      {
        title: 'Pollution Control', color: '#fb923c',
        metrics: [
          { name: 'Industrial effluent treatment',  pct: 63, figure: '84 sites treated'    },
          { name: 'Solid waste pollution control',  pct: 71, figure: 'Controlled disposal' },
          { name: 'Noise pollution compliance',     pct: 58, figure: 'Urban zone limits'   },
        ],
      },
      {
        title: 'Protected Areas', color: '#a855f7',
        metrics: [
          { name: 'National park integrity',        pct: 91, figure: 'Margalla Hills NP'   },
          { name: 'Buffer zone compliance',         pct: 74, figure: 'Restricted zones'    },
          { name: 'Eco-zone enforcement',           pct: 68, figure: '5 green zones'       },
        ],
      },
    ],
  },

  {
    id: 'waste', label: 'Waste Management', icon: <FaTrash />,
    sections: [
      {
        title: 'Collection & Disposal', color: '#6366f1',
        metrics: [
          { name: 'Household collection rate',     pct: 88, figure: 'All residential sectors' },
          { name: 'Commercial waste pickup',        pct: 82, figure: 'Daily service'        },
          { name: 'Construction waste regulation',  pct: 64, figure: 'Regulated sites'      },
        ],
      },
      {
        title: 'Recycling', color: '#34d399',
        metrics: [
          { name: 'Overall recycling rate',         pct: 34, figure: 'Target: 50% by 2026'  },
          { name: 'Active recycling centres',       pct: 68, figure: '12 centres'           },
          { name: 'E-waste collection points',      pct: 42, figure: '2 collection hubs'   },
        ],
      },
      {
        title: 'Landfill Management', color: '#fb923c',
        metrics: [
          { name: 'Current capacity utilisation',   pct: 67, figure: 'Margalla Road site'   },
          { name: 'Leachate treatment',             pct: 74, figure: 'System operational'   },
          { name: 'Methane capture system',         pct: 48, figure: 'Partial — Phase 1'    },
        ],
      },
      {
        title: 'Hazardous Waste', color: '#fb7185',
        metrics: [
          { name: 'Medical waste incineration',     pct: 79, figure: 'Licensed facilities'  },
          { name: 'Industrial hazardous disposal',  pct: 71, figure: 'Authorised sites'     },
          { name: 'Chemical waste monitoring',      pct: 68, figure: 'Registered sources'   },
        ],
      },
      {
        title: 'Street Cleaning', color: '#06b6d4',
        metrics: [
          { name: 'Daily road cleaning coverage',   pct: 91, figure: 'All main roads'       },
          { name: 'Drain cleaning frequency',       pct: 78, figure: 'Monthly schedule'     },
          { name: 'Public space maintenance',       pct: 84, figure: 'Parks & plazas'       },
        ],
      },
    ],
  },
];

// ── Colour helpers ────────────────────────────────────────────────────────────
function statusColor(pct: number) {
  if (pct >= 75) return '#34d399';
  if (pct >= 50) return '#fbbf24';
  return '#fb7185';
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ICTModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const d = theme === 'dark';
  const tileBg   = d ? '#18243a' : '#f0f3fb';
  const border   = d ? 'rgba(255,255,255,0.09)' : 'rgba(10,15,30,0.10)';
  const text1    = d ? '#f4f7fc' : '#0a0f1e';
  const text2    = d ? '#a4abc1' : '#4a5468';
  const text3    = d ? '#6b7390' : '#8090b0';
  const barBg    = d ? 'rgba(255,255,255,0.07)' : 'rgba(10,15,30,0.07)';

  const [activeTab, setActiveTab] = useState(0);

  if (typeof document === 'undefined') return null;

  const tab = TABS[activeTab];

  return (
    <Modal
      title="ICT Services Dashboard"
      eyebrow="Islamabad Capital Territory · CDA Overview"
      onClose={onClose}
      maxWidth={920}
      bodyScroll={false}
      tabs={TABS.map(t => ({ id: t.id, label: (<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{t.icon}{t.label}</span>) }))}
      activeTab={tab.id}
      onTabChange={(id) => setActiveTab(TABS.findIndex(t => t.id === id))}
    >
          {/* ── Tab content ────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* Land type distribution — Urban Planning tab only */}
                {tab.id === 'urban' && (
                  <LandTypeSection tileBg={tileBg} border={border} text1={text1} text2={text2} text3={text3} barBg={barBg} />
                )}

                {/* Infrastructure distribution — Infrastructure tab only */}
                {tab.id === 'infra' && (
                  <InfraDistributionSection tileBg={tileBg} border={border} text1={text1} text2={text2} text3={text3} barBg={barBg} />
                )}

                {/* Health facilities summary — Public Health tab only */}
                {tab.id === 'health' && (
                  <HealthFacilitiesSection tileBg={tileBg} border={border} text1={text1} text2={text2} text3={text3} barBg={barBg} />
                )}

                {/* Summary bar for active tab */}
                <div style={{
                  display: 'flex', gap: 10, marginBottom: 20,
                  padding: '12px 16px',
                  background: tileBg, borderRadius: 12,
                  border: `1px solid ${border}`,
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '1.2rem', color: '#00d4ff' }}>{tab.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: text1 }}>{tab.label}</div>
                    <div style={{ fontSize: '0.68rem', color: text3 }}>
                      {tab.sections.length} categories ·&nbsp;
                      {tab.sections.reduce((s, sec) => s + sec.metrics.length, 0)} metrics
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                    <SummaryPill color="#34d399" label="Good" count={tab.sections.flatMap(s => s.metrics).filter(m => m.pct >= 75).length} />
                    <SummaryPill color="#fbbf24" label="Fair" count={tab.sections.flatMap(s => s.metrics).filter(m => m.pct >= 50 && m.pct < 75).length} />
                    <SummaryPill color="#fb7185" label="Needs Attention" count={tab.sections.flatMap(s => s.metrics).filter(m => m.pct < 50).length} />
                  </div>
                </div>

                {/* Section grid — 2 columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {tab.sections.map((sec, si) => (
                    <motion.div
                      key={sec.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: si * 0.05, duration: 0.35 }}
                      style={{
                        background: tileBg, border: `1px solid ${border}`,
                        borderTop: `2px solid ${sec.color}`,
                        borderRadius: 12, padding: '14px 16px',
                      }}
                    >
                      {/* Section header */}
                      <div style={{
                        fontSize: '0.72rem', fontWeight: 700, color: sec.color,
                        letterSpacing: '0.04em', marginBottom: 12,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span>{sec.title}</span>
                        <span style={{ fontSize: '0.62rem', color: text3, fontFamily: 'monospace', fontWeight: 500 }}>
                          {sec.metrics.length} metrics
                        </span>
                      </div>

                      {/* Metrics */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sec.metrics.map((m, mi) => {
                          const sc = statusColor(m.pct);
                          return (
                            <motion.div
                              key={m.name}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              transition={{ delay: si * 0.05 + mi * 0.04 }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: text1, fontWeight: 500, lineHeight: 1.2 }}>{m.name}</div>
                                  <div style={{ fontSize: '0.6rem', color: text3, fontFamily: 'monospace', marginTop: 1 }}>{m.figure}</div>
                                </div>
                                <div style={{
                                  fontSize: '0.88rem', fontWeight: 700, color: sc,
                                  fontFamily: 'monospace', letterSpacing: '-0.01em', flexShrink: 0, marginLeft: 8,
                                }}>
                                  {m.pct}%
                                </div>
                              </div>
                              <div style={{ height: 5, background: barBg, borderRadius: 3, overflow: 'hidden' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${m.pct}%` }}
                                  transition={{ delay: si * 0.05 + mi * 0.04 + 0.1, duration: 0.7, ease: 'easeOut' }}
                                  style={{
                                    height: '100%', borderRadius: 3,
                                    background: `linear-gradient(90deg, ${sc}, ${sc}cc)`,
                                    boxShadow: `0 0 6px ${sc}50`,
                                  }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  marginTop: 20, paddingTop: 14, borderTop: `1px solid ${border}`,
                  fontSize: '0.62rem', color: text3, fontFamily: 'monospace',
                  textAlign: 'center', letterSpacing: '0.03em',
                }}>
                  ICT Digital Twin · CDA Data Portal · Figures as of 2024
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
    </Modal>
  );
}

// ── Health Facilities Summary (Public Health tab header) ─────────────────────
const HEALTH_DATA = {
  totalClinics:    89,
  govClinics:      16,
  pvtClinics:      73,
  hospitals:       80,   // 15 govt + 65 pvt
  govHospitals:    15,
  pvtHospitals:    65,
  get totalFacilities() { return this.totalClinics + this.hospitals; },
};

const HEALTH_BAR_DATA = [
  { name: 'Govt. Clinics',    value: HEALTH_DATA.govClinics,    color: '#34d399' },
  { name: 'Pvt. Clinics',     value: HEALTH_DATA.pvtClinics,    color: '#6366f1' },
  { name: 'Govt. Hospitals',  value: HEALTH_DATA.govHospitals,  color: '#f59e0b' },
  { name: 'Pvt. Hospitals',   value: HEALTH_DATA.pvtHospitals,  color: '#fb7185' },
];

function HealthFacilitiesSection({
  tileBg, border, text1, text2, text3, barBg,
}: {
  tileBg: string; border: string; text1: string;
  text2: string; text3: string; barBg: string;
}) {
  const max = Math.max(...HEALTH_BAR_DATA.map(d => d.value));

  interface BTooltipPayload { name: string; value: number; fill: string }
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: BTooltipPayload[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: tileBg, border: `1px solid ${border}`,
        borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem', color: text1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 3 }}>{label}</div>
        <div style={{ color: payload[0].fill, fontWeight: 600 }}>{payload[0].value} facilities</div>
        <div style={{ color: text2, marginTop: 2 }}>
          {((payload[0].value / HEALTH_DATA.totalFacilities) * 100).toFixed(1)}% of total
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: tileBg, border: `1px solid ${border}`,
        borderRadius: 14, padding: '18px 20px', marginBottom: 18,
      }}
    >
      {/* Panel header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.13em',
            textTransform: 'uppercase', color: text2, fontFamily: 'monospace', marginBottom: 4,
          }}>
            ICT Health Facilities
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: text1 }}>
            Total Registered Facilities: {HEALTH_DATA.totalFacilities}
          </div>
        </div>
        <div style={{ fontSize: '0.68rem', color: text3, textAlign: 'right' }}>
          <div>Source: CDA / Health Dept · 2024</div>
        </div>
      </div>

      {/* Two-column: metric cards left, bar chart right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left — 2 tiles: Health Clinics (with sub-breakdown) + Hospitals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* ── Tile 1: Health Clinics with govt/pvt breakdown ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            style={{
              background: '#6366f10e', border: '1px solid #6366f130',
              borderTop: '2px solid #6366f1', borderRadius: 10, padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 8 }}>
              Health Clinics
            </div>

            {/* Primary count */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 700, color: text1, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {HEALTH_DATA.totalClinics}
              </span>
              <span style={{ fontSize: '0.72rem', color: text2, fontWeight: 500 }}>total</span>
            </div>

            {/* Govt + Pvt sub-rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Govt.', value: HEALTH_DATA.govClinics, color: '#34d399' },
                { label: 'Pvt.',  value: HEALTH_DATA.pvtClinics, color: '#7dd3fc' },
              ].map(sub => (
                <div key={sub.label} style={{
                  background: `${sub.color}12`,
                  border: `1px solid ${sub.color}30`,
                  borderRadius: 7, padding: '7px 10px',
                }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: sub.color, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                    {sub.label}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 700, color: text1, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {sub.value}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: text3, fontFamily: 'monospace', marginTop: 2 }}>
                    {((sub.value / HEALTH_DATA.totalClinics) * 100).toFixed(0)}% of clinics
                  </div>
                </div>
              ))}
            </div>

            {/* Share bar (clinics vs total) */}
            <div style={{ height: 4, background: barBg, borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(HEALTH_DATA.totalClinics / HEALTH_DATA.totalFacilities) * 100}%` }}
                transition={{ delay: 0.22, duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #6366f1, #6366f199)', boxShadow: '0 0 6px #6366f150' }}
              />
            </div>
            <div style={{ fontSize: '0.62rem', color: text3, fontFamily: 'monospace', textAlign: 'right' }}>
              {((HEALTH_DATA.totalClinics / HEALTH_DATA.totalFacilities) * 100).toFixed(1)}% of all facilities
            </div>
          </motion.div>

          {/* ── Tile 2: Hospitals with govt/pvt breakdown ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.4 }}
            style={{
              background: '#fb718510', border: '1px solid #fb718530',
              borderTop: '2px solid #fb7185', borderRadius: 10, padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fb7185', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 8 }}>
              Hospitals
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 700, color: text1, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {HEALTH_DATA.hospitals}
              </span>
              <span style={{ fontSize: '0.72rem', color: text2, fontWeight: 500 }}>total</span>
            </div>

            {/* Govt + Pvt sub-tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Govt.', value: HEALTH_DATA.govHospitals, color: '#f59e0b' },
                { label: 'Pvt.',  value: HEALTH_DATA.pvtHospitals, color: '#fb7185' },
              ].map(sub => (
                <div key={sub.label} style={{
                  background: `${sub.color}12`,
                  border: `1px solid ${sub.color}30`,
                  borderRadius: 7, padding: '7px 10px',
                }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: sub.color, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                    {sub.label}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 700, color: text1, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {sub.value}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: text3, fontFamily: 'monospace', marginTop: 2 }}>
                    {((sub.value / HEALTH_DATA.hospitals) * 100).toFixed(0)}% of hospitals
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 4, background: barBg, borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(HEALTH_DATA.hospitals / HEALTH_DATA.totalFacilities) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #fb7185, #fb718599)', boxShadow: '0 0 6px #fb718550' }}
              />
            </div>
            <div style={{ fontSize: '0.62rem', color: text3, fontFamily: 'monospace', textAlign: 'right' }}>
              {((HEALTH_DATA.hospitals / HEALTH_DATA.totalFacilities) * 100).toFixed(1)}% of all facilities
            </div>
          </motion.div>

        </div>

        {/* Right — bar chart */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Facility Distribution
            </span>
          </div>

          {/* Stacked horizontal bars — 2 rows, govt+pvt inside each */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                label: 'Health Clinics', total: HEALTH_DATA.totalClinics,
                segments: [
                  { name: 'Govt.', value: HEALTH_DATA.govClinics,  color: '#34d399' },
                  { name: 'Pvt.',  value: HEALTH_DATA.pvtClinics,  color: '#6366f1' },
                ],
              },
              {
                label: 'Hospitals', total: HEALTH_DATA.hospitals,
                segments: [
                  { name: 'Govt.', value: HEALTH_DATA.govHospitals, color: '#f59e0b' },
                  { name: 'Pvt.',  value: HEALTH_DATA.pvtHospitals, color: '#fb7185' },
                ],
              },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.45 }}
              >
                {/* Row header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: text1 }}>{row.label}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: text1, fontFamily: 'monospace' }}>
                    {row.total}
                  </span>
                </div>

                {/* Stacked bar */}
                <div style={{ height: 28, background: barBg, borderRadius: 7, overflow: 'hidden', display: 'flex' }}>
                  {row.segments.map((seg, si) => {
                    const pct = (seg.value / row.total) * 100;
                    return (
                      <motion.div
                        key={seg.name}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.38 + i * 0.12 + si * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, ${seg.color}ee, ${seg.color}bb)`,
                          boxShadow: si === 0 ? `inset -1px 0 0 rgba(0,0,0,0.2)` : undefined,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', minWidth: 0,
                        }}
                      >
                        <span style={{
                          fontSize: '0.66rem', fontWeight: 700, color: '#fff',
                          whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                        }}>
                          {pct >= 14 ? `${seg.name} ${pct.toFixed(0)}%` : pct >= 8 ? `${pct.toFixed(0)}%` : ''}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Segment legend */}
                <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
                  {row.segments.map(seg => (
                    <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.66rem', color: text2 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                      <span>{seg.name}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: seg.color }}>{seg.value}</span>
                      <span style={{ color: text3 }}>({((seg.value / row.total) * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Total */}
            <div style={{
              marginTop: 6, paddingTop: 12, borderTop: `1px solid ${border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: text2 }}>Total Facilities</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: text1, fontFamily: 'monospace' }}>
                {HEALTH_DATA.totalFacilities}
              </span>
            </div>

            {/* Summary note — both groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                padding: '7px 12px',
                background: '#6366f114', border: '1px solid #6366f130',
                borderRadius: 8, fontSize: '0.7rem', color: text2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>
                  <span style={{ fontWeight: 700, color: '#6366f1' }}>Clinics ({HEALTH_DATA.totalClinics})</span>
                  {'  ·  '}Govt {HEALTH_DATA.govClinics} · Pvt {HEALTH_DATA.pvtClinics}
                </span>
                <span style={{ color: text3, fontFamily: 'monospace', fontSize: '0.64rem' }}>
                  {((HEALTH_DATA.govClinics / HEALTH_DATA.totalClinics) * 100).toFixed(0)}% / {((HEALTH_DATA.pvtClinics / HEALTH_DATA.totalClinics) * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{
                padding: '7px 12px',
                background: '#fb718514', border: '1px solid #fb718530',
                borderRadius: 8, fontSize: '0.7rem', color: text2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>
                  <span style={{ fontWeight: 700, color: '#fb7185' }}>Hospitals ({HEALTH_DATA.hospitals})</span>
                  {'  ·  '}Govt {HEALTH_DATA.govHospitals} · Pvt {HEALTH_DATA.pvtHospitals}
                </span>
                <span style={{ color: text3, fontFamily: 'monospace', fontSize: '0.64rem' }}>
                  {((HEALTH_DATA.govHospitals / HEALTH_DATA.hospitals) * 100).toFixed(0)}% / {((HEALTH_DATA.pvtHospitals / HEALTH_DATA.hospitals) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Infrastructure Land Distribution (Infrastructure tab header) ─────────────
function InfraDistributionSection({
  tileBg, border, text1, text2, text3, barBg,
}: {
  tileBg: string; border: string; text1: string;
  text2: string; text3: string; barBg: string;
}) {
  interface PiePayload { name: string; value: number; payload: { color: string } }
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: PiePayload[] }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const pct = (p.value / ICT_TOTAL_ACRES * 100).toFixed(1);
    return (
      <div style={{
        background: tileBg, border: `1px solid ${border}`,
        borderRadius: 10, padding: '8px 12px', fontSize: '0.72rem', color: text1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 3 }}>{p.name}</div>
        <div style={{ color: text2 }}>{p.value.toLocaleString()} acres</div>
        <div style={{ color: p.payload.color, fontWeight: 600, marginTop: 2 }}>{pct}%</div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: tileBg, border: `1px solid ${border}`,
        borderRadius: 14, padding: '18px 20px', marginBottom: 18,
      }}
    >
      {/* Panel header */}
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.13em',
            textTransform: 'uppercase', color: text2, fontFamily: 'monospace', marginBottom: 4,
          }}>
            ICT Infrastructure Land Distribution
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: text1 }}>
            Total Territory: {ICT_TOTAL_ACRES.toLocaleString()} acres
          </div>
        </div>
        <div style={{ fontSize: '0.68rem', color: text3, textAlign: 'right' }}>
          <div>Midpoint values of given ranges</div>
          <div style={{ marginTop: 2 }}>Source: CDA Master Plan · 2024</div>
        </div>
      </div>

      {/* Two-column: tiles left, pie right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, alignItems: 'start' }}>

        {/* Left — 2-column tile grid (7 items) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {INFRA_DIST.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}
              style={{
                background: `${t.color}0e`,
                border: `1px solid ${t.color}30`,
                borderTop: `2px solid ${t.color}`,
                borderRadius: 9, padding: '10px 12px',
                // last item full-width if odd total
                gridColumn: i === INFRA_DIST.length - 1 && INFRA_DIST.length % 2 !== 0 ? '1 / -1' : undefined,
              }}
            >
              {/* Label */}
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, color: t.color,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                fontFamily: 'monospace', marginBottom: 8,
              }}>
                {t.label}
              </div>

              {/* sq km | Kanals | Acres — single row */}
              <ThreeUnitRow
                sqkm={t.sqkm.toLocaleString()}
                kanals={t.kanals.toLocaleString()}
                acres={t.acres.toLocaleString()}
                text1={text1} text2={text2}
              />

              {/* Range + % */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div>
                  <div style={{ fontSize: '0.66rem', color: text2, fontFamily: 'monospace', fontWeight: 500 }}>{t.pctRange} of total</div>
                  <div style={{ fontSize: '0.62rem', color: text3, fontFamily: 'monospace' }}>{t.acreRange}</div>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: t.color, fontFamily: 'monospace' }}>
                  {t.pct}%
                </span>
              </div>

              {/* Bar */}
              <div style={{ height: 4, background: barBg, borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, t.pct / 40 * 100)}%` }}
                  transition={{ delay: 0.18 + i * 0.06, duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${t.color}, ${t.color}99)`,
                    boxShadow: `0 0 6px ${t.color}50`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right — Pie chart */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              % Share by Use
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={INFRA_PIE}
                cx="50%" cy="50%"
                innerRadius={56} outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {INFRA_PIE.map((entry, i) => (
                  <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 5px ${entry.color}50)` }} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
            {INFRA_PIE.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.7rem', color: text1 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 500 }}>{d.name}</span>
                <span style={{ color: d.color, fontWeight: 700, fontFamily: 'monospace' }}>
                  {(d.value / ICT_TOTAL_ACRES * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Land Type Distribution section (Urban Planning tab header) ────────────────
function LandTypeSection({
  tileBg, border, text1, text2, text3, barBg,
}: {
  tileBg: string; border: string; text1: string;
  text2: string; text3: string; barBg: string;
}) {
  interface PiePayload { name: string; value: number; payload: { color: string; pct?: number } }
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: PiePayload[] }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div style={{
        background: tileBg, border: `1px solid ${border}`,
        borderRadius: 10, padding: '8px 12px', fontSize: '0.72rem', color: text1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 3 }}>{p.name}</div>
        <div style={{ color: text2 }}>{p.value.toLocaleString()} acres</div>
        <div style={{ color: p.payload.color, fontWeight: 600, marginTop: 2 }}>
          {(p.value / ICT_TOTAL_ACRES * 100).toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: tileBg, border: `1px solid ${border}`,
        borderRadius: 14, padding: '18px 20px',
        marginBottom: 18,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.13em',
            textTransform: 'uppercase', color: text2, fontFamily: 'monospace', marginBottom: 4,
          }}>
            ICT Land Type Distribution
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: text1 }}>
            Total Territory: {ICT_TOTAL_ACRES.toLocaleString()} acres
          </div>
        </div>
        <div style={{ fontSize: '0.68rem', color: text3, textAlign: 'right' }}>
          <div>906 km² · 2,040,740 Kanals</div>
          <div style={{ marginTop: 2 }}>Source: CDA · 2024</div>
        </div>
      </div>

      {/* Two-column: tiles left, pie right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20, alignItems: 'center' }}>
        {/* Left — metric tiles (2×2 grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {LAND_TYPES.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
              style={{
                background: `${t.color}0e`,
                border: `1px solid ${t.color}30`,
                borderTop: `2px solid ${t.color}`,
                borderRadius: 10, padding: '12px 14px',
              }}
            >
              {/* Label — +2pt, darker */}
              <div style={{
                fontSize: '0.74rem', fontWeight: 700, color: t.color,
                letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 10,
              }}>
                {t.label}
              </div>

              {/* sq km | Kanals | Acres — single row */}
              <ThreeUnitRow
                sqkm={t.sqkm.toLocaleString()}
                kanals={t.kanals.toLocaleString()}
                acres={t.acres.toLocaleString()}
                text1={text1} text2={text2}
              />

              {/* Note + percentage (+2pt) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.72rem', color: text2, fontFamily: 'monospace', fontWeight: 500 }}>{t.note}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: t.color, fontFamily: 'monospace' }}>
                  {t.pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, background: barBg, borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, t.pct / 30 * 100)}%` }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${t.color}, ${t.color}99)`,
                    boxShadow: `0 0 6px ${t.color}50`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right — Pie chart */}
        <div style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              % Share by Type
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%" cy="50%"
                innerRadius={52} outerRadius={82}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {PIE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 5px ${entry.color}50)` }} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend below chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
            {PIE_DATA.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.72rem', color: text1 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 500 }}>{d.name}</span>
                <span style={{ color: d.color, fontWeight: 700, fontFamily: 'monospace' }}>
                  {(d.value / ICT_TOTAL_ACRES * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Single compact row — sq km | Kanals | Acres */
function ThreeUnitRow({
  sqkm, kanals, acres, text1, text2,
}: {
  sqkm: string; kanals: string; acres: string;
  text1: string; text2: string;
}) {
  const units = [
    { label: 'km²',    value: sqkm    },
    { label: 'Kanals', value: kanals  },
    { label: 'Acres',  value: acres   },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginBottom: 8 }}>
      {units.map((u, i) => (
        <div key={u.label} style={{
          paddingRight: i < 2 ? 8 : 0,
          borderRight: i < 2 ? '1px solid rgba(128,128,128,0.15)' : 'none',
          paddingLeft: i > 0 ? 8 : 0,
        }}>
          <div style={{ fontSize: '0.6rem', color: text2, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 1 }}>
            {u.label}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: text1, letterSpacing: '-0.01em' }}>
            {u.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryPill({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 6,
      background: `${color}15`, border: `1px solid ${color}30`,
      fontSize: '0.66rem', fontWeight: 600, color,
    }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{count}</span>
      <span style={{ fontWeight: 400, opacity: 0.85 }}>{label}</span>
    </div>
  );
}
