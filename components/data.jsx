/* global React */
/* Bilingual content + shared data */

const CONTENT = {
  en: {
    nav: {
      about: 'About',
      sim: 'Thesis Simulation',
      experience: 'Experience',
      courses: 'Courses',
      writings: 'Writings',
      contact: 'Contact',
    },
    hero: {
      tagline: 'Sustainable Energy · Smart Grid · Optimisation',
      name: 'Ardian Candra\nPratama',
      subtitle: 'M.Sc. candidate in Sustainable Energy Engineering at KTH Royal Institute of Technology. Thirteen years in SCADA, telecommunication, and distribution planning at PT PLN — now designing optimised PV + battery systems for decarbonised ports.',
      ctaPrimary: 'Open thesis simulation',
      ctaGhost: 'See experience',
    },
    about: {
      tag: 'About',
      title: 'From island microgrids to Oskarshamn\u2019s shoreline.',
      body: [
        'I plan, model, and optimise power systems. For more than a decade at PT PLN (Persero) I led SCADA, radio-backbone, and distribution-planning programs across the Indonesian archipelago — from 24-hour microgrids on 87 islands to a submarine cable that brought firm power to Batam\u2013Sambu.',
        'At KTH I translate that field experience into quantitative models: MILP dispatch, NSGA-II sizing, and techno-economic analysis of LFP, Sodium-ion, and H\u2011Br flow batteries. My master\u2019s thesis sizes the new terminal building at Sm\u00e5landshamn AB (Oskarshamn Harbour) with rooftop PV + BESS under shore-power (OPS) loads.',
      ],
      facts: [
        ['13+ yrs', 'Power systems @ PT PLN'],
        ['87', 'Islands with hybrid PV roadmap'],
        ['3.45 MW', 'Batam\u2013Sambu cable (commissioned 2024)'],
        ['2', 'GA/MILP frameworks in Python (published)'],
      ],
    },
    sim: {
      tag: 'Thesis Simulation',
      title: 'Play with the model.',
      subtitle: 'A simplified, interactive version of the MILP + NSGA-II framework I built for Sm\u00e5landshamn AB. Real cost curves, real Pareto solutions, live recomputation.',
      tabs: ['Sizing', 'Chemistry', '24-hour dispatch', 'Pareto frontier'],
    },
    experience: {
      tag: 'Experience',
      title: 'Where I\u2019ve built.',
    },
    courses: {
      tag: 'Coursework & Projects',
      title: 'What I\u2019ve studied and shipped at KTH.',
    },
    writings: {
      tag: 'Writings',
      title: 'Projects and essays, in full.',
    },
    contact: {
      tag: 'Contact',
      title: 'Let\u2019s talk energy.',
      body: 'Open to thesis collaborations, technical reviews, and quiet conversations about how we re-wire ports, islands and industrial campuses.',
    },
  },
  id: {
    nav: {
      about: 'Tentang',
      sim: 'Simulasi Tesis',
      experience: 'Pengalaman',
      courses: 'Kuliah',
      writings: 'Karya Tulis',
      contact: 'Kontak',
    },
    hero: {
      tagline: 'Energi Berkelanjutan · Smart Grid · Optimisasi',
      name: 'Ardian Candra\nPratama',
      subtitle: 'Kandidat M.Sc. Sustainable Energy Engineering di KTH Royal Institute of Technology. Tiga belas tahun di SCADA, telekomunikasi, dan perencanaan distribusi di PT PLN — kini merancang sistem PV + baterai yang dioptimalkan untuk pelabuhan rendah karbon.',
      ctaPrimary: 'Buka simulasi tesis',
      ctaGhost: 'Lihat pengalaman',
    },
    about: {
      tag: 'Tentang',
      title: 'Dari microgrid pulau-pulau ke pantai Oskarshamn.',
      body: [
        'Saya merencanakan, memodelkan, dan mengoptimalkan sistem tenaga. Lebih dari satu dekade di PT PLN (Persero) saya memimpin program SCADA, radio-backbone, dan perencanaan distribusi di nusantara — dari microgrid 24-jam di 87 pulau hingga kabel laut yang membawa daya andal ke Batam\u2013Sambu.',
        'Di KTH pengalaman lapangan itu saya terjemahkan menjadi model kuantitatif: MILP dispatch, sizing NSGA-II, dan analisis tekno-ekonomi baterai LFP, Natrium-ion, dan H\u2011Br flow. Tesis master saya menentukan ukuran sistem PV rooftop + BESS untuk terminal baru Sm\u00e5landshamn AB (Pelabuhan Oskarshamn) dengan beban shore-power (OPS).',
      ],
      facts: [
        ['13+ thn', 'Power systems @ PT PLN'],
        ['87', 'Pulau dalam roadmap PV hybrid'],
        ['3,45 MW', 'Kabel Batam\u2013Sambu (komisioning 2024)'],
        ['2', 'Framework GA/MILP di Python'],
      ],
    },
    sim: {
      tag: 'Simulasi Tesis',
      title: 'Coba modelnya langsung.',
      subtitle: 'Versi sederhana dan interaktif dari framework MILP + NSGA-II yang saya bangun untuk Sm\u00e5landshamn AB. Kurva biaya nyata, solusi Pareto nyata, perhitungan langsung.',
      tabs: ['Sizing', 'Kimia baterai', 'Dispatch 24 jam', 'Frontier Pareto'],
    },
    experience: {
      tag: 'Pengalaman',
      title: 'Tempat saya membangun.',
    },
    courses: {
      tag: 'Kuliah & Proyek',
      title: 'Yang saya pelajari dan kerjakan di KTH.',
    },
    writings: {
      tag: 'Karya Tulis',
      title: 'Proyek dan esai, lengkap.',
    },
    contact: {
      tag: 'Kontak',
      title: 'Mari bicara soal energi.',
      body: 'Terbuka untuk kolaborasi tesis, review teknis, dan obrolan santai tentang bagaimana kita menata ulang pelabuhan, pulau, dan kawasan industri.',
    },
  },
};

/* Experience — structured, bilingual where it matters */
const EXPERIENCE = [
  {
    period: 'Aug 2023 — Jul 2024',
    role: 'Head of Planning Department',
    org: 'PT PLN (Persero) — Tanjungpinang Area',
    location: 'Riau Islands, Indonesia',
    bullets: {
      en: [
        'Led planning and development of microgrid generation and distribution networks across isolated island systems in the Riau Islands, improving reliability and expanding electricity access.',
        'Planned and coordinated the development of submarine power cables (commissioned 2024) and inter-island transmission-line towers across 19 islands, enabling 24-hour electricity supply.',
        'Developed a strategic roadmap for hybrid solar plants across 87 small islands, integrating PV with existing diesel generation to reduce fuel dependency.',
        'Initiated a wave-energy pilot at Natuna Island in collaboration with Swedish and Australian WEC developers.',
        'Managed annual planning budget of ~53 billion Rupiah (2023).',
      ],
      id: [
        'Memimpin perencanaan dan pengembangan microgrid generasi serta jaringan distribusi di pulau-pulau terisolasi Kepulauan Riau, meningkatkan keandalan dan memperluas akses listrik.',
        'Merencanakan dan mengoordinasikan pengembangan kabel laut (komisioning 2024) dan tower transmisi antar-pulau di 19 pulau, mewujudkan pasokan listrik 24 jam.',
        'Menyusun peta jalan strategis pembangkit surya hybrid di 87 pulau kecil, mengintegrasikan PV dengan pembangkit diesel eksisting untuk menurunkan ketergantungan bahan bakar.',
        'Memprakarsai pilot wave energy di Pulau Natuna bekerja sama dengan pengembang WEC dari Swedia dan Australia.',
        'Mengelola anggaran perencanaan tahunan ~53 miliar Rupiah (2023).',
      ],
    },
  },
  {
    period: 'Mar 2017 — Jul 2023',
    role: 'Head of SCADA & Telecommunication Department',
    org: 'PT PLN (Persero) — Riau Distribution Control Centre',
    location: 'Pekanbaru, Indonesia',
    bullets: {
      en: [
        'Led Distribution Management System (DMS) rollout and advanced FLISR (Fault Location, Isolation, Service Restoration) for smart feeder automation.',
        'Designed and implemented a digital radio-backbone (Mototrbo) and MDS GE / Ripex-Racom / Satel data-transmission systems for mission-critical grid communications.',
        'Established the SCADA Master Station from scratch — architecture, hardware integration, protocols and cybersecurity coordination.',
        'Completed SCADA deployment for 109 substations and 680 pole-mounted circuit breakers.',
        'Commissioned a Ni-Cd battery backup (20 kW, 8 h autonomy) for the control-centre server infrastructure.',
        'Acted as Works Director for SCADA investment projects (~20 billion Rupiah / yr).',
      ],
      id: [
        'Memimpin implementasi Distribution Management System (DMS) dan FLISR tingkat lanjut untuk otomasi smart feeder.',
        'Merancang dan mengimplementasikan radio-backbone digital (Mototrbo) serta sistem transmisi data MDS GE / Ripex-Racom / Satel untuk komunikasi grid kritis.',
        'Membangun SCADA Master Station dari nol — arsitektur, integrasi perangkat keras, protokol dan koordinasi keamanan siber.',
        'Menyelesaikan deployment SCADA untuk 109 gardu induk dan 680 LBS.',
        'Menjalankan baterai Ni-Cd cadangan (20 kW, 8 jam) untuk server control center.',
        'Menjadi Works Director proyek investasi SCADA (~20 miliar Rupiah/thn).',
      ],
    },
  },
  {
    period: 'Jan 2011 — Feb 2017',
    role: 'SCADA Engineer',
    org: 'PT PLN (Persero)',
    location: 'Pekanbaru, Indonesia',
    bullets: {
      en: [
        'Maintained SCADA equipment and supervised SCADA development projects.',
        'Delivered a 250 kW off-grid solar project — site assessment, system sizing, and commissioning.',
      ],
      id: [
        'Memelihara peralatan SCADA dan mengawasi proyek pengembangan SCADA.',
        'Mengerjakan proyek solar off-grid 250 kW — asesmen lokasi, sizing sistem, dan komisioning.',
      ],
    },
  },
];

/* Courses / projects at KTH */
const COURSES = [
  {
    title: 'Optimising Wind + A-CAES — Gotland',
    tags: ['Python', 'Techno-economic', 'LDES'],
    desc: {
      en: 'Integrated wind\u2013A-CAES system model built in Python. Techno-economic evaluation of adiabatic compressed-air storage as a long-duration companion to offshore wind. Source on GitHub.',
      id: 'Model sistem angin\u2013A-CAES terintegrasi di Python. Evaluasi tekno-ekonomi compressed-air storage adiabatik sebagai pendamping angin lepas pantai. Kode di GitHub.',
    },
  },
  {
    title: 'Smart & Sustainable Kigali 2030',
    tags: ['HOMER Pro', 'Urban energy', 'Best Proposal'],
    desc: {
      en: 'Simulated Kigali\u2019s 2030 energy system in HOMER Pro. Selected as Best Proposal and presented at the 2nd Nordic-Baltic Forum in Rwanda.',
      id: 'Simulasi sistem energi Kigali 2030 di HOMER Pro. Terpilih sebagai Best Proposal dan dipresentasikan di 2nd Nordic-Baltic Forum, Rwanda.',
    },
  },
  {
    title: 'EV Freight Depot on MV Networks',
    tags: ['Pyomo', 'MILP', 'Load-flow'],
    desc: {
      en: 'Python simulation framework using pandapower + Pyomo for optimal EV charging dispatch in medium-voltage networks.',
      id: 'Framework simulasi Python dengan pandapower + Pyomo untuk dispatch optimal pengisian EV di jaringan tegangan menengah.',
    },
  },
  {
    title: 'Hotel TES for Peak Shaving',
    tags: ['Pyomo', 'MILP', 'DEAP'],
    desc: {
      en: 'Thermal energy-storage model in Python using Pyomo for dispatch and DEAP (GA) for optimisation of design and operation.',
      id: 'Model thermal energy storage di Python: Pyomo untuk dispatch dan DEAP (GA) untuk optimasi desain dan operasi.',
    },
  },
  {
    title: 'PPA for Hybrid CSP\u2013PV with TES, Spain',
    tags: ['PySAM', 'Pyomo', 'DEAP'],
    desc: {
      en: 'Hybrid CSP\u2013PV + TES model combining PySAM, Pyomo (MILP), and DEAP (GA) to price a PPA and co-optimise design + dispatch.',
      id: 'Model hybrid CSP\u2013PV + TES menggabungkan PySAM, Pyomo (MILP), dan DEAP (GA) untuk harga PPA serta co-optimasi desain + dispatch.',
    },
  },
  {
    title: 'PV Output Forecasting (SNN / DNN)',
    tags: ['Machine learning', 'Forecasting'],
    desc: {
      en: 'Shallow and deep neural networks to forecast PV generation from weather and irradiance inputs.',
      id: 'Shallow dan deep neural network untuk meramal produksi PV dari input cuaca dan iradiasi.',
    },
  },
];

/* Writings — including the thesis as featured */
const WRITINGS = [
  {
    kind: 'featured',
    kicker: 'Master\u2019s Thesis · 2025',
    status: 'Current',
    title: 'Sustainable Energy System Design for Oskarshamn Harbour',
    body: {
      en: 'Techno-economic study for Sm\u00e5landshamnar AB — electrical demand characterisation, rooftop PV simulation (HelioScope, PVsyst), and BESS dispatch optimisation (MILP + NSGA-II). Standalone PV is financially feasible (~9-year payback). PV + BESS is not yet viable under SE3 spot prices but delivers measurable peak-shaving and CO\u2082 avoidance.',
      id: 'Studi tekno-ekonomi untuk Sm\u00e5landshamnar AB — karakterisasi beban listrik, simulasi PV rooftop (HelioScope, PVsyst), dan optimasi dispatch BESS (MILP + NSGA-II). PV mandiri layak finansial (payback ~9 tahun). PV + BESS belum viable pada harga spot SE3 tetapi memberi peak-shaving dan penghematan CO\u2082 yang terukur.',
    },
    tags: ['Python', 'Pyomo', 'MILP', 'HelioScope', 'LFP · SIB · VRFB', 'ENTSO-E'],
  },
  {
    kind: 'impact',
    kicker: 'Impact Story · 2025',
    status: 'Deployed',
    title: 'Batam\u2013Sambu Submarine Cable',
    body: {
      en: 'Planned at PLN Tanjungpinang. Went live April 2025 — 3.45 MW replacing diesel with gas-based grid power on a remote island.',
      id: 'Direncanakan di PLN Tanjungpinang. Energize April 2025 — 3,45 MW menggantikan diesel dengan daya grid berbasis gas di pulau terpencil.',
    },
    tags: ['Grid Planning', 'Submarine Cable', 'Techno-Economic'],
  },
  {
    kind: 'research',
    kicker: 'Research · KTH',
    status: 'Coursework',
    title: 'Smart Kigali',
    body: {
      en: 'Urban energy planning for Rwanda\u2019s capital — smart-grid concepts, demand-side management, renewable integration.',
      id: 'Perencanaan energi urban untuk ibukota Rwanda — konsep smart grid, manajemen sisi permintaan, integrasi terbarukan.',
    },
    tags: ['Urban Energy', 'Smart Grid'],
  },
  {
    kind: 'research',
    kicker: 'Research · KTH',
    status: 'Coursework',
    title: 'A-CAES: Adiabatic Compressed Air Storage',
    body: {
      en: 'Technical evaluation — thermodynamic modelling, efficiency analysis, comparison to other long-duration storage options.',
      id: 'Evaluasi teknis — pemodelan termodinamika, analisis efisiensi, perbandingan dengan pilihan penyimpanan jangka panjang lain.',
    },
    tags: ['Thermodynamics', 'LDES'],
  },
  {
    kind: 'research',
    kicker: 'Research · KTH',
    status: 'Coursework',
    title: 'Amazon River Basin Energy Study',
    body: {
      en: 'Energy access, hydropower potential, and sustainability trade-offs — balancing electrification with ecological stewardship.',
      id: 'Akses energi, potensi hidro, dan trade-off keberlanjutan — menyeimbangkan elektrifikasi dengan penjagaan ekologi.',
    },
    tags: ['Hydropower', 'Sustainability'],
  },
];

/* Real NSGA-II Pareto solutions from your thesis */
const PARETO = [
  { cap: 1719.2, pwr: 840.6, cRate: 0.489, duration: 2.045, co2: 160.3, peak: 704.4, lcoe: 154.4, npv: 301373, capex: 1247630 },
  { cap: 1146.1, pwr: 1010.0, cRate: 0.881, duration: 1.135, co2: 121.6, peak: 704.4, lcoe: 134.8, npv: 293442, capex: 1091038 },
  { cap: 1719.6, pwr: 650.2, cRate: 0.378, duration: 2.645, co2: 150.5, peak: 650.2, lcoe: 150.3, npv: 249274, capex: 1221525 },
  { cap: 2423.5, pwr: 916.7, cRate: 0.378, duration: 2.644, co2: 187.4, peak: 652.5, lcoe: 180.9, npv: 63991, capex: 1467167 },
  { cap: 574.1, pwr: 554.0, cRate: 0.965, duration: 1.036, co2: 66.2, peak: 420.4, lcoe: 104.7, npv: 45408, capex: 852403 },
  { cap: 1179.7, pwr: 294.9, cRate: 0.250, duration: 4.000, co2: 100.4, peak: 294.9, lcoe: 123.1, npv: -83934, capex: 1003923 },
  { cap: 456.9, pwr: 203.5, cRate: 0.445, duration: 2.245, co2: 49.3, peak: 203.5, lcoe: 94.2, npv: -137296, capex: 766773 },
  { cap: 257.4, pwr: 257.4, cRate: 1.000, duration: 1.000, co2: 31.5, peak: 209.9, lcoe: 86.8, npv: -167681, capex: 708319 },
  { cap: 101.8, pwr: 101.8, cRate: 1.000, duration: 1.000, co2: 13.0, peak: 101.8, lcoe: 77.2, npv: -283333, capex: 632214 },
  { cap: 3906.7, pwr: 2698.4, cRate: 0.691, duration: 1.448, co2: 219.0, peak: 679.6, lcoe: 257.2, npv: -675908, capex: 2111851 },
];

/* Battery chemistries from your thesis */
const CHEMISTRIES = [
  {
    key: 'lfp',
    name: 'LFP',
    full: 'Lithium Iron Phosphate',
    color: 'var(--forest)',
    rte: 91,
    cycles: 14666,
    calFade: 1.5,
    cRate: '0.25 – 1.00',
    duration: '1 – 4 h',
    capex: 341,     /* USD/kWh */
    opex: 7430,
    eol: 60,
    replaceFrac: 65,
    calLife: 16,
    notes: {
      en: 'Mainstream grid-scale chemistry. High RTE, long cycle life, well-priced at scale. Some thermal runaway considerations.',
      id: 'Kimia grid-scale arus utama. RTE tinggi, umur siklus panjang, harga kompetitif. Perlu perhatian thermal runaway.',
    },
  },
  {
    key: 'naion',
    name: 'Na-Ion',
    full: 'Sodium-Ion',
    color: 'var(--ochre)',
    rte: 80,
    cycles: 6000,
    calFade: 1.5,
    cRate: '0.25 – 1.00',
    duration: '1 – 4 h',
    capex: 332,
    opex: 4280,
    eol: 60,
    replaceFrac: 65,
    calLife: 15,
    notes: {
      en: 'Cobalt-free, wider temperature range, abundant feedstock. Lower energy density and RTE than LFP; commercial maturity still developing.',
      id: 'Bebas kobalt, rentang suhu lebih luas, bahan baku melimpah. Densitas dan RTE lebih rendah dari LFP; kematangan komersial masih berkembang.',
    },
  },
  {
    key: 'hbr',
    name: 'H\u2011Br Flow',
    full: 'Hydrogen-Bromine Flow',
    color: 'var(--slate)',
    rte: 70,
    cycles: 5250,
    calFade: 0,
    cRate: '0.125 – 0.50',
    duration: '2 – 8 h',
    capex: 549,
    opex: 19740,
    eol: 80,
    replaceFrac: 6.4,
    calLife: 12,
    notes: {
      en: 'Decoupled power and energy — independently scaled. Zero calendar fade on electrolyte. Stack replacement every ~10 y. Best for long-duration.',
      id: 'Daya dan energi terpisah — skala independen. Electrolyte tanpa calendar fade. Stack diganti ~10 tahun. Cocok untuk durasi panjang.',
    },
  },
];

window.CONTENT = CONTENT;
window.EXPERIENCE = EXPERIENCE;
window.COURSES = COURSES;
window.WRITINGS = WRITINGS;
window.PARETO = PARETO;
window.CHEMISTRIES = CHEMISTRIES;
