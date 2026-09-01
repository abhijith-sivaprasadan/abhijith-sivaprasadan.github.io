// Stable, shareable application tracks. Curated selections reference public
// records; they do not change a project's status, results or validation claims.
const thermal = 'cfd-heat-transfer', test = 'test-instrumentation', energy = 'energy-systems';
const software = 'data-software', optimisation = 'optimisation', industrial = 'industrial-energy';
const research = 'research', mechanical = 'cad-fea';
const siemens = 'test-engineer-master-thesis-student', alleima = 'energy-efficiency-intern';
const qburst = 'engineer-backend-developer-typescript-nestjs', kth = 'student-intern-pyrolysis';
const academicCV = { url: 'downloads/Abhijith_CV_PhD_Academic.pdf', label: 'Academic CV (PDF)' };
const thermalCV = { url: 'downloads/Abhijith_CV_GasTurbine_HeatTransfer.pdf', label: 'Thermal / CFD CV (PDF)' };
const energyCV = { url: 'downloads/Abhijith_CV_EnergyCoordinator.pdf', label: 'Energy / R&D CV (PDF)' };
const thesis = { url: 'https://urn.kb.se/resolve?urn=urn:nbn:se:kth:diva-381965', label: 'Published KTH thesis ↗' };

module.exports = [
  {
    id: 'general', label: 'General', title: 'Engineering, connected.',
    detail: 'A cross-disciplinary overview',
    description: 'Thermal engineering, energy systems and software: a broad view of Abhijith Sivaprasadan’s projects, professional experience and education.',
    intro: 'I connect mechanical engineering, energy-system modelling and software development. My background spans thermal-fluid research at Siemens Energy, industrial energy methodology at Alleima and backend development at QBurst.',
    audience: 'Cross-disciplinary engineering and general applications',
    focus: [
      ['Engineering analysis', 'CFD, heat transfer and measurement-chain commissioning.'],
      ['Energy decisions', 'System modelling, optimisation and industrial energy performance.'],
      ['Software practice', 'Backend APIs, reproducible analysis and open-source tools.'],
    ],
    projects: ['opensteamopt', 'siemens-thesis', 'gb-flexabm', 'alleima-energy-efficiency', 'thermotwin-f', 'industrial-energy-kpi-toolkit', 'robotic-frame-locomotion'],
    experiences: [siemens, alleima, qburst, kth],
    skills: [thermal, test, energy, optimisation, software, industrial, mechanical, research],
    education: ['kth', 'btech', 'aalto'],
    resources: [academicCV, thermalCV, energyCV],
    primary: { url: '#projects', label: 'Explore selected work' },
    scope: 'This is a cross-disciplinary selection, not a claim of equal depth in every area. Professional roles, academic projects and independent tools are labelled separately. The thesis had experimental limitations; industrial work does not establish plant savings, and exploratory models are not validated system forecasts.',
  },
  {
    id: 'thermal', label: 'Thermal Engineering', title: 'From heat transfer to physical insight.',
    detail: 'CFD, thermal systems & testing',
    description: 'Thermal engineering portfolio of Abhijith Sivaprasadan: compressible CFD, conjugate heat transfer, instrumentation, numerical methods and related education.',
    intro: 'My thermal work combines compressible CFD and conjugate heat transfer with instrumentation and numerical checks. At Siemens Energy, my master’s thesis investigated a high-temperature pressure-sensor calibration rig and its thermal behaviour.',
    audience: 'Thermal, CFD, heat-transfer and test-engineering roles',
    focus: [
      ['Thermal-fluid simulation', 'ANSYS Fluent, k-omega SST, mesh independence and thermal resistance.'],
      ['Experimental methods', 'NI-DAQ commissioning, LabVIEW, thermocouples and failure analysis.'],
      ['Numerical foundations', 'Heat-transfer solvers, radiation models and analytical checks.'],
    ],
    projects: ['siemens-thesis', 'non-gray-radiation-modeling', 'numerical-heat-transfer', 'thermotwin-f', 'mtes-pcm-thermal-lab', 'structural-fea-reactor-internals'],
    experiences: [siemens, kth],
    skills: [thermal, test, mechanical, research],
    education: ['kth', 'btech'],
    resources: [thermalCV, { url: 'downloads/Abhijith_CV_TestEngineer.pdf', label: 'Test engineering CV (PDF)' }, thesis],
    primary: thermalCV,
    scope: 'The Siemens thesis is a numerical investigation with measurement-chain commissioning; heater failure limited sustained experimental comparison. Independent thermal models retain their verification limits. The structural-FEA pilot is preliminary screening, not a certified nuclear or pressure-boundary calculation.',
  },
  {
    id: 'energy-modelling', label: 'Energy Modelling', title: 'Modelling energy. Informing decisions.',
    detail: 'Power, heat, storage & optimisation',
    description: 'Energy systems modelling portfolio of Abhijith Sivaprasadan: electricity investment, grid flexibility, heat dispatch, hydrogen and industrial energy analysis.',
    intro: 'I build and analyse models of heat, power, storage and industrial energy use. My work connects technology assumptions, network constraints and operating decisions through optimisation, scenario analysis and transparent reporting.',
    audience: 'Energy-system modelling, optimisation and energy-analysis roles',
    focus: [
      ['Power & flexibility', 'Electricity investment, network constraints and storage dispatch.'],
      ['Heat & sector coupling', 'District heating, building demand and wind-to-hydrogen systems.'],
      ['Industrial energy', 'EnPI design, load-driver analysis and metering-readiness assessment.'],
    ],
    projects: ['opensteamopt', 'gb-flexabm', 'pypsa-nl-grid-flexibility', 'pynexus-green-hydrogen', 'district-heating-optimisation', 'heating-demand-forecasting', 'alleima-energy-efficiency'],
    experiences: [alleima, kth],
    skills: [energy, optimisation, industrial, software],
    education: ['kth', 'aalto', 'btech'],
    resources: [energyCV, { url: 'energy-systems.html', label: 'Energy systems profile' }, { url: 'industrial-rd.html', label: 'Industrial methodology' }],
    primary: { url: '#projects', label: 'Explore the models' },
    scope: 'OpenSteamOpt is a synthetic educational steam/power twin, not live control or an ABB product. GB-FLEXABM is synthetic and uncalibrated; PyPSA-NL uses a synthetic topology. None is a validated operational or national-system model. PyNEXUS has a synthetic 168-hour reference, not an annual-run claim. Alleima work was desk-based methodology, not implemented plant savings. Python applications run locally, not on GitHub Pages.',
  },
  {
    id: 'software', label: 'Software', title: 'Software with engineering depth.',
    detail: 'Backend APIs & scientific software',
    description: 'Software portfolio of Abhijith Sivaprasadan: TypeScript/NestJS backend experience at QBurst, Python engineering tools, numerical software and reproducible workflows.',
    intro: 'I bring professional TypeScript/NestJS backend experience together with scientific and engineering software. At QBurst, I implemented API endpoints, reliability fixes and endpoint tests. My public projects apply that software discipline to models, data and engineering analysis.',
    audience: 'Backend, Python, data-tooling and research-software roles',
    focus: [
      ['Professional backend work', 'TypeScript, NestJS, PostgreSQL, REST APIs and Postman automation.'],
      ['Engineering tools', 'Python analysis, local interfaces, inspectable exports and reporting.'],
      ['Reproducibility & checks', 'Known-answer tests, numerical regression and documented assumptions.'],
    ],
    projects: ['opensteamopt', 'industrial-energy-kpi-toolkit', 'gb-flexabm', 'thermotwin-f', 'non-gray-radiation-modeling', 'eu-ets-exposure-calculator', 'heating-demand-forecasting'],
    experiences: [qburst, alleima],
    skills: [software, optimisation, thermal, research],
    education: ['kth', 'btech'],
    resources: [{ url: 'experience/qburst.html', label: 'QBurst backend experience' }, { url: 'skills/data-software.html#learning', label: 'Software training & certifications' }],
    primary: { url: 'https://github.com/abhijith-sivaprasadan', label: 'Explore GitHub ↗' },
    scope: 'QBurst is professional software experience; the public engineering repositories are separate independent or academic work, not QBurst client code. Streamlit and desktop interfaces run locally unless a case study explicitly links a hosted demo. Passing software checks does not establish physical-model validation.',
  },
  {
    id: 'research', label: 'Research / PhD', title: 'Questions first. Evidence throughout.',
    detail: 'Research interests, thesis & publications',
    description: 'Research and PhD portfolio of Abhijith Sivaprasadan: high-temperature heat transfer, experimental–numerical methods, energy systems, published thesis and reproducible software.',
    intro: 'I’m interested in doctoral research in high-temperature heat transfer, experimental–numerical methods and energy systems. My work combines a published KTH master’s thesis, research internships and open scientific software, with assumptions and limitations documented alongside results.',
    audience: 'Doctoral applications and research collaborations',
    focus: [
      ['High-temperature heat transfer', 'Geometry, thermal resistance, radiation and transient CHT.'],
      ['Experimental–numerical methods', 'Measurement readiness, numerical checks and bounded comparison.'],
      ['Energy-system questions', 'Flexibility, investment and reproducible scenario experiments.'],
    ],
    projects: ['siemens-thesis', 'opensteamopt', 'non-gray-radiation-modeling', 'gb-flexabm', 'numerical-heat-transfer', 'heating-demand-forecasting', 'robotic-frame-locomotion'],
    experiences: [siemens, kth, alleima],
    skills: [research, thermal, energy, software],
    education: ['kth', 'btech', 'aalto'],
    resources: [academicCV, thesis, { url: 'research.html', label: 'Full research statement' }, { url: 'projects/robotic-frame-locomotion.html', label: 'Undergraduate publications' }, { url: 'https://orcid.org/0009-0009-8429-1266', label: 'ORCID ↗' }],
    primary: { url: 'research.html', label: 'Read the research statement' },
    scope: 'Research interests describe future directions, not completed experiments or institutional endorsement. The thesis is a numerical investigation with limited sustained experimental comparison. A thesis, student publication, coursework and independent software carry different levels of review; exploratory energy models remain uncalibrated.',
  },
];
