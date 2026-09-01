// Curated relationships, not proficiency ratings. Record copy comes from the
// public portfolio indexes; only the relationship and skill framing live here.
const skills = [
  {
    id: 'cfd-heat-transfer', short: 'CFD & heat transfer',
    detail: 'Flow, thermal modelling & numerical methods',
    summary: 'From geometry and boundary conditions to numerical checks and physical interpretation: compressible flow, conjugate heat transfer and thermal systems.',
    scope: 'The Siemens thesis is a numerical investigation with measurement-chain commissioning. Heater failure limited sustained high-temperature comparison; the work does not establish full experimental validation. Independent thermal models retain their own verification limits.',
    tools: ['ANSYS Fluent', 'SpaceClaim', 'k-omega SST', 'Python', 'Fortran'],
    courses: ['MJ2515', 'MJ232X', 'MJ2426', 'MJ2405', 'ME409', 'ME203', 'ME206', 'ME302', 'ME204', 'ME205', 'ME405', 'MA102', 'MA202'],
    education: ['kth', 'btech'],
  },
  {
    id: 'test-instrumentation', short: 'Testing & instrumentation',
    detail: 'Measurement chains, lab work & diagnostics',
    summary: 'Measurement-chain commissioning, thermal and battery laboratory work, signal processing and structured troubleshooting, with the distinction between readiness and validated performance kept explicit.',
    scope: 'Commissioning and laboratory interpretation are not equivalent to accredited calibration. The Siemens campaign was limited by a heater failure; low-cost vibration work is not certified condition monitoring.',
    tools: ['NI-DAQ', 'LabVIEW', 'Thermocouples', 'Pressure sensors', 'Python / FFT'],
    courses: ['MJ232X', 'MJ2386', 'MJ2426', 'ME312', 'ME407', 'EE311', 'ME304', 'ME376'],
    education: ['kth', 'btech'],
  },
  {
    id: 'energy-systems', short: 'Energy systems',
    detail: 'Buildings, heat, power & storage',
    summary: 'Energy-system modelling across buildings, district heat, electricity networks, storage and hydrogen, connecting demand and technology assumptions to cost, emissions and operational trade-offs.',
    scope: 'Course studies and independent screening tools are identified separately. OpenSteamOpt and GB-FLEXABM are synthetic and uncalibrated; PyPSA-NL uses a synthetic topology. None is a validated operational or national-system model. Local applications run outside GitHub Pages.',
    tools: ['IDA ICE', 'HOMER Pro', 'LEAP', 'SAM', 'PyPSA', 'Pyomo'],
    courses: ['MJ2438', 'MJ2509', 'MJ2508', 'MJ2503', 'MJ2405', 'MJ2411', 'MJ2426', 'MJ2386', 'MJ2505', 'MJ2507', 'MJ2511', 'AAE-E3121', 'ME403', 'ME405', 'ME205', 'BE103', 'CE482'],
    education: ['kth', 'aalto', 'btech'],
  },
  {
    id: 'optimisation', short: 'Optimisation & decisions',
    detail: 'Dispatch, scenarios & techno-economics',
    summary: 'Turning engineering choices into objectives, constraints and comparable scenarios: heat dispatch, grid flexibility, hydrogen production, investment modelling and techno-economic assessment.',
    scope: 'Mathematical optimisation, scenario comparison and business concepts are different kinds of evidence. Results depend on the documented inputs and constraints; they are not operational guarantees or investment advice.',
    tools: ['PuLP', 'Pyomo', 'HiGHS', 'Linopy', 'Python', 'Excel'],
    courses: ['MJ2505', 'MJ2438', 'MJ2507', 'MJ2508', 'MJ2511', 'MJ2503', 'ME2072', 'MA201', 'MA202', 'ME404'],
    education: ['kth', 'btech'],
  },
  {
    id: 'data-software', short: 'Data & engineering software',
    detail: 'Analysis, forecasting & reproducible tools',
    summary: 'Production-oriented backend experience alongside scientific and engineering software: data preparation, forecasting, numerical methods, automated checks and inspectable reporting workflows.',
    scope: 'QBurst is professional software experience; the engineering tools are separately documented portfolio or course work. Streamlit and native desktop interfaces are local applications unless a case study explicitly provides a hosted demo.',
    tools: ['Python', 'pandas / NumPy', 'scikit-learn', 'Streamlit / Plotly', 'TypeScript / NestJS', 'PostgreSQL', 'Git'],
    courses: ['MJ2507', 'MJ2515', 'MJ2505', 'MA101', 'MA102', 'MA201', 'MA202', 'ME407', 'EE311'],
    education: ['kth', 'btech'],
  },
  {
    id: 'industrial-energy', short: 'Industrial energy & EnPI',
    detail: 'Performance mapping & decarbonisation',
    summary: 'Industrial energy-performance methodology, load-driver analysis, metering readiness and decision-support tools for examining energy use, emissions and improvement options.',
    scope: 'Alleima work was desk-based method development, not implementation of plant savings. Proprietary site detail is excluded. Demonstration emissions factors and KPI alerts are not compliance advice or root-cause diagnoses.',
    tools: ['KPI / EnPI design', 'ISO 50001 context', 'Python', 'Excel', 'Streamlit'],
    courses: ['MJ2511', 'MJ2508', 'MJ2426', 'MJ2405', 'MJ2411', 'AAE-E3121', 'ME403', 'ME404', 'ME376', 'CE482', 'BE103'],
    education: ['kth', 'aalto', 'btech'],
  },
  {
    id: 'cad-fea', short: 'CAD & structural analysis',
    detail: 'Geometry, mechanical design & FEA',
    summary: 'Mechanical design from geometry preparation and CAD/PLM workflows to student vehicle projects, prototype integration and documented finite-element screening.',
    scope: 'The reactor-internals pilot is preliminary linear-elastic screening, not a certified nuclear or pressure-boundary calculation. Student design competitions and prototype projects are not industrial product qualifications.',
    tools: ['Siemens NX', 'Teamcenter', 'SolidWorks', 'ANSYS Mechanical', 'SpaceClaim'],
    courses: ['ME308', 'ME202', 'ME201', 'ME401', 'ME402', 'BE110', 'BE100', 'ME304', 'ME301', 'ME210', 'ME306', 'ME303', 'ME220', 'ME463', 'ME407'],
    education: ['btech', 'kth'],
  },
  {
    id: 'research', short: 'Research & technical communication',
    detail: 'Methods, publications & critical interpretation',
    summary: 'Research framing, literature synthesis, published student work and reproducible scientific software, with assumptions, verification and open questions documented alongside the results.',
    scope: 'A thesis, student publication, course assignment and independent research tool carry different levels of review. Research interests are directions for future work, not claims of completed experiments or institutional endorsement.',
    tools: ['Literature synthesis', 'Numerical verification', 'Reproducibility', 'Technical reporting'],
    courses: ['MJ2510', 'MJ232X', 'MJ2515', 'MJ2507', 'MJ2508', 'MJ2438', 'ME2072', 'MA202'],
    education: ['kth', 'btech'],
  },
];

const C = 'cfd-heat-transfer', T = 'test-instrumentation', E = 'energy-systems';
const O = 'optimisation', D = 'data-software', I = 'industrial-energy', M = 'cad-fea', R = 'research';

// Keys are canonical case-study basenames (or the external project ID).
// Duplicate imported project records therefore resolve to one evidence item.
const projectSkills = {
  'opensteamopt': [E, O, D, I, R],
  'siemens-thesis': [C, T, M, R],
  'thermotwin-f': [C, E, D, R],
  'non-gray-radiation-modeling': [C, D, R],
  'numerical-heat-transfer': [C, D, R],
  'mtes-pcm-thermal-lab': [C, T, E, D],
  'peltier-refrigerator': [C, T, E, M],
  'tes-peak-shaving': [C, E, O, D],
  'gb-flexabm': [E, O, D, R],
  'pypsa-nl-grid-flexibility': [E, O, D],
  'pynexus-green-hydrogen': [E, O, D, I],
  'district-heating-optimisation': [E, O, D, I],
  'distribution-grid-study': [E, D],
  'heating-demand-forecasting': [E, O, D, R],
  'hylkysaari-sustainable-tourism': [E, O, I, R],
  'residential-heating-technoeconomics': [E, O, I],
  'germany-energy-economy-analysis': [E, O, I, R],
  'built-environment-ida-ice-simulation': [E, I],
  'philippines-emergency-energy-module': [E, O, R],
  'battery-cell-discharge-lab': [T, E, D],
  'waste-to-energy-india': [E, I, R],
  'gridflex-energy-optimizer': [E, O],
  'alleima-energy-efficiency': [E, D, I, R],
  'industrial-energy-kpi-toolkit': [D, I],
  'eu-ets-exposure-calculator': [D, I],
  'rotating-machinery-vibration-minilab': [T, D],
  'structural-fea-reactor-internals': [M, D, R],
  'bicycle-design-competition': [M],
  'tractor-design-competition': [M],
  'baja-sae-2019': [M],
  'robotic-frame-locomotion': [M, D, R],
  'automatic-sanitizer-dispenser': [M, D],
  'wireless-charging-technology': [E, R],
};

const experienceSkills = {
  'test-engineer-master-thesis-student': [C, T, M, R],
  'energy-efficiency-intern': [E, D, I, R],
  'student-intern-pyrolysis': [C, E, O, I, R],
  'engineer-backend-developer-typescript-nestjs': [D],
  'project-team-lead-captain': [M, R],
  'student-intern-automotive-intern-case-study': [M],
  'student-intern-automation-hydraulics-pneumatics': [C, T, M],
  'secretary-minutes-student-convention': [R],
};

const experienceUrls = {
  'student-intern-pyrolysis': 'experience/kth-pyrolysis.html',
  'project-team-lead-captain': 'projects/bicycle-design-competition.html',
};

const education = {
  kth: { title: 'M.Sc. Sustainable Energy Engineering', institution: 'KTH Royal Institute of Technology', period: '2023–2026', summary: 'Master’s programme in heat and power, energy systems and numerical methods. Thesis completed; 115 hp recorded in the May 2026 transcript.', url: 'about.html#kth-coursework' },
  btech: { title: 'B.Tech Mechanical Engineering', institution: 'College of Engineering Perumon / APJ Abdul Kalam Technological University', period: '2017–2021', summary: 'Mechanical engineering foundation with coursework, design competitions and the final-year interactive robot project.', url: 'courses.html' },
  aalto: { title: 'Circular Economy for Energy Storage', institution: 'Aalto University / Unite! Virtual Exchange', period: '2024', summary: 'Credited exchange elective covering lifecycle and circular-economy perspectives on energy storage; not a separate degree.', url: 'about.html#kth-coursework' },
};

const certificationSkills = {
  'Noise, Vibration & Harshness (NVH) Testing': [T],
  'Damping Strategies for NVH': [T, M],
  'Engineering and Product Design Processes': [M],
  'SSG Entre Siemens Energy AB': [T, I],
  "Assessing a Commercial Product's Sustainability": [I, E],
  'AWS Machine Learning Foundations': [D],
  'AI for India': [D],
  'Python for Data Science': [D],
  'Python 101 for Data Science': [D],
  '3D Printing': [M],
  'Coding Fundamentals': [D],
  'Breaking Free from Legacy Databases': [D],
  'Introduction to Git and GitHub': [D],
  "The Data Scientist's Toolbox": [D, R],
  'Git for Developers Using Github': [D],
  'Introduction to Enterprise Computing': [D],
  'Roadmap to Success in Digital Manufacturing & Design': [M],
  'Introduction to Augmented Reality and ARCore': [D],
  'Succeeding in Web Development: Full Stack and Front End': [D],
  'Working and Collaborating Online': [D],
  'Working with Computers and Devices': [D],
  'Baseline: Data, ML, AI': [D],
  'Google Cloud Essentials': [D],
  'Digital Manufacturing & Design Technology Specialization': [M],
  'MBSE: Model-Based Systems Engineering': [M],
  'Cyber Security in Manufacturing': [D, M],
  'Advanced Manufacturing Enterprise': [M],
  'Intelligent Machining': [M],
  'Digital Thread: Implementation': [M, D],
  'Advanced Manufacturing Process Analysis': [M],
  'Digital Thread: Components': [M, D],
  'Digital Manufacturing & Design': [M],
  'Introduction to Artificial Intelligence (AI)': [D],
  'Introduction to Mechanical Engineering Design and Manufacturing with Fusion 360': [M],
  'AWS Fundamentals: Going Cloud-Native': [D],
};

const resources = [
  { title: 'Published KTH thesis', context: 'TRITA-ITM-EX 2026:14', summary: 'Numerical investigation of the high-temperature reducer, with the documented experimental limitations.', url: 'https://urn.kb.se/resolve?urn=urn:nbn:se:kth:diva-381965', skills: [C, T, M, R] },
  { title: 'Research statement', context: 'Research direction', summary: 'Experimental–numerical questions, methods and proposed directions; not completed research claims.', url: 'research.html', skills: [C, T, R] },
  { title: 'Robot project publications and design evidence', context: 'Undergraduate published work', summary: 'Control-system integration, frame and locomotion design, with supporting manuscript evidence in the case study.', url: 'projects/robotic-frame-locomotion.html', skills: [M, D, R] },
  { title: 'Energy systems profile', context: 'Cross-project synthesis', summary: 'How building, heat, grid and optimisation work connect across the portfolio.', url: 'energy-systems.html', skills: [E, O] },
  { title: 'Industrial R&D profile', context: 'Methodology and scope', summary: 'Public methodology, decision-support framing and boundaries around proprietary industrial work.', url: 'industrial-rd.html', skills: [I] },
];

// Lead with the most directly relevant work, then retain the complete record.
const projectOrder = {
  [C]: ['siemens-thesis', 'non-gray-radiation-modeling', 'numerical-heat-transfer', 'thermotwin-f'],
  [T]: ['siemens-thesis', 'mtes-pcm-thermal-lab', 'battery-cell-discharge-lab', 'rotating-machinery-vibration-minilab'],
  [E]: ['opensteamopt', 'gb-flexabm', 'pypsa-nl-grid-flexibility', 'pynexus-green-hydrogen'],
  [O]: ['opensteamopt', 'district-heating-optimisation', 'gb-flexabm', 'pynexus-green-hydrogen'],
  [D]: ['opensteamopt', 'gb-flexabm', 'industrial-energy-kpi-toolkit', 'heating-demand-forecasting'],
  [I]: ['opensteamopt', 'alleima-energy-efficiency', 'industrial-energy-kpi-toolkit', 'eu-ets-exposure-calculator'],
  [M]: ['structural-fea-reactor-internals', 'siemens-thesis', 'robotic-frame-locomotion', 'bicycle-design-competition'],
  [R]: ['siemens-thesis', 'opensteamopt', 'gb-flexabm', 'non-gray-radiation-modeling'],
};

// This public case study predates its inclusion in the JSON project index.
const additionalProjects = [{
  id: 'structural-fea-reactor-internals', title: 'Structural FEA Reactor Internals Pilot Study',
  caseStudyUrl: 'projects/structural-fea-reactor-internals.html', status: 'published',
  associatedWith: 'Independent engineering pilot',
  summary: 'ANSYS Mechanical load cases, mesh and reaction checks, and reproducible Python result tables. Preliminary linear-elastic screening; not a certified nuclear or pressure-boundary calculation.',
  tools: ['ANSYS Mechanical', 'SpaceClaim', 'Python'],
}];

module.exports = { skills, projectSkills, projectOrder, experienceSkills, experienceUrls, education, certificationSkills, resources, additionalProjects };
