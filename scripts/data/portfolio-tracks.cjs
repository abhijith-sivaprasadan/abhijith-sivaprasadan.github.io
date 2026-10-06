// Stable, shareable application tracks. Curated selections reference public
// records; they do not change a project's status, results or validation claims.
const thermal = 'cfd-heat-transfer', test = 'test-instrumentation', energy = 'energy-systems';
const software = 'data-software', optimisation = 'optimisation', industrial = 'industrial-energy';
const research = 'research', mechanical = 'cad-fea';
const siemens = 'test-engineer-master-thesis-student', alleima = 'energy-efficiency-intern';
const qburst = 'engineer-backend-developer-typescript-nestjs', kth = 'student-intern-pyrolysis';
const modellingCV = { url: 'downloads/Abhijith_Sivaprasadan_CV_Generic_Modelling.pdf', label: 'Modelling CV (PDF)' };
const thermalCV = { url: 'downloads/Abhijith_Sivaprasadan_CV_Generic_Thermal_Process.pdf', label: 'Thermal & process CV (PDF)' };
const researchCV = { url: 'downloads/Abhijith_Sivaprasadan_CV_Generic_Research.pdf', label: 'Research CV (PDF)' };
const thesis = { url: 'https://urn.kb.se/resolve?urn=urn:nbn:se:kth:diva-381965', label: 'Published KTH thesis ↗' };

module.exports = [
  {
    id: 'general', label: 'General', title: 'Engineering, connected.',
    detail: 'A cross-disciplinary overview',
    description: 'Thermal engineering, energy systems and software: a broad view of Abhijith Sivaprasadan’s projects, professional experience and education.',
    intro: 'I connect thermal-fluid engineering, energy-system modelling and research software. My background spans a Siemens Energy CFD/CHT thesis, Kerala2040 power-system resilience research, dynamic thermal-storage modelling, industrial energy methodology at Alleima and professional backend development at QBurst.',
    audience: 'Cross-disciplinary engineering and general applications',
    focus: [
      ['Engineering analysis', 'CFD, heat transfer and measurement-chain commissioning.'],
      ['Energy decisions', 'System modelling, optimisation and industrial energy performance.'],
      ['Software practice', 'Backend APIs, reproducible analysis and open-source tools.'],
    ],
    matrix: [
      ['Thermal-fluid analysis', 'CFD, heat transfer and thermal systems'],
      ['Energy systems', 'Power, heat, storage and optimisation'],
      ['Engineering software', 'Python, TypeScript, Fortran and Modelica'],
      ['Experimental methods', 'Instrumentation, laboratories and diagnostics'],
      ['Mechanical engineering', 'CAD, structural analysis and design'],
    ],
    projects: ['kerala2040', 'siemens-thesis', 'tes-discharge-screen', 'opensteamopt', 'gb-flexabm', 'thermotwin-f', 'alleima-energy-efficiency', 'industrial-energy-kpi-toolkit'],
    experiences: [siemens, alleima, qburst, kth],
    skills: [thermal, test, energy, optimisation, software, industrial, mechanical, research],
    education: ['kth', 'btech', 'aalto'],
    resources: [modellingCV, thermalCV, researchCV],
    primary: modellingCV,
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
    matrix: [
      ['Compressible CFD', 'ANSYS Fluent, turbulence models and mesh studies'],
      ['Conjugate heat transfer', 'Solid-fluid coupling and thermal resistance'],
      ['Thermal processes', 'Storage, refrigeration and energy balances'],
      ['Test instrumentation', 'NI-DAQ, LabVIEW, PT100 and thermocouples'],
      ['Numerical verification', 'Analytical checks and independent solvers'],
    ],
    projects: ['siemens-thesis', 'tes-discharge-screen', 'thermotwin-f', 'non-gray-radiation-modeling', 'numerical-heat-transfer', 'mtes-pcm-thermal-lab', 'structural-fea-reactor-internals'],
    experiences: [siemens, kth],
    skills: [thermal, test, mechanical, research],
    education: ['kth', 'btech'],
    resources: [thermalCV, thesis],
    primary: thermalCV,
    scope: 'The Siemens thesis is a numerical investigation with measurement-chain commissioning; heater failure occurred before high-temperature testing could begin, so no experimental validation campaign was completed. Independent thermal models retain their verification limits. The structural-FEA pilot is preliminary screening, not a certified nuclear or pressure-boundary calculation.',
  },
  {
    id: 'energy-modelling', label: 'Energy Modelling', title: 'Modelling energy. Informing decisions.',
    detail: 'Power, heat, storage & optimisation',
    description: 'Energy systems modelling portfolio of Abhijith Sivaprasadan: electricity investment, grid flexibility, heat dispatch, hydrogen and industrial energy analysis.',
    intro: 'I build and analyse models of heat, power, storage and industrial energy use. Recent work ranges from Kerala2040 power-system resilience and hydropower/network screening to dynamically informed thermal-storage optimisation, alongside dispatch, market and hydrogen models.',
    audience: 'Energy-system modelling, optimisation and energy-analysis roles',
    focus: [
      ['Power & flexibility', 'Electricity investment, network constraints and storage dispatch.'],
      ['Heat & sector coupling', 'District heating, building demand and wind-to-hydrogen systems.'],
      ['Industrial energy', 'EnPI design, load-driver analysis and metering-readiness assessment.'],
    ],
    matrix: [
      ['System optimisation', 'Pyomo, HiGHS and dispatch models'],
      ['Power-system analysis', 'Networks, flexibility and resilience'],
      ['Heat & storage', 'District heat and dynamic thermal storage'],
      ['Techno-economics', 'Investment, emissions and scenario analysis'],
      ['Data workflows', 'Public datasets, forecasting and diagnostics'],
    ],
    projects: ['kerala2040', 'tes-discharge-screen', 'opensteamopt', 'gb-flexabm', 'pypsa-nl-grid-flexibility', 'pynexus-green-hydrogen', 'district-heating-optimisation', 'heating-demand-forecasting'],
    experiences: [alleima, kth],
    skills: [energy, optimisation, industrial, software],
    education: ['kth', 'aalto', 'btech'],
    resources: [modellingCV, { url: 'energy-systems.html', label: 'Energy systems profile' }, { url: 'industrial-rd.html', label: 'Industrial methodology' }],
    primary: modellingCV,
    scope: 'Kerala2040 is diagnosis-first public-data research with screening models, not a calibrated operational planning model. TES Discharge Screen is verified against internal physics and an FMU cross-check but has no measured-storage validation. OpenSteamOpt is synthetic educational software, GB-FLEXABM is synthetic and uncalibrated, and PyPSA-NL uses a synthetic topology. Python applications run locally unless a case study explicitly links a hosted interface.',
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
    matrix: [
      ['Scientific Python', 'Analysis, optimisation and engineering tools'],
      ['Backend systems', 'TypeScript, NestJS, APIs and PostgreSQL'],
      ['Testing discipline', 'Regression, known-answer and negative-path tests'],
      ['Simulation software', 'Modern Fortran, Modelica and FMI'],
      ['Research interfaces', 'Inspectable local GUIs, exports and reports'],
    ],
    projects: ['kerala2040', 'tes-discharge-screen', 'opensteamopt', 'gb-flexabm', 'thermotwin-f', 'industrial-energy-kpi-toolkit', 'non-gray-radiation-modeling', 'eu-ets-exposure-calculator'],
    experiences: [qburst, alleima],
    skills: [software, optimisation, thermal, research],
    education: ['kth', 'btech'],
    resources: [modellingCV, { url: 'experience/qburst.html', label: 'QBurst backend experience' }, { url: 'skills/data-software.html#learning', label: 'Software training & certifications' }],
    primary: modellingCV,
    scope: 'QBurst is professional software experience; the public engineering repositories are separate independent or academic work, not QBurst client code. Streamlit and desktop interfaces run locally unless a case study explicitly links a hosted demo. Passing software checks does not establish physical-model validation.',
  },
  {
    id: 'research', label: 'Research / PhD', title: 'Questions first. Evidence throughout.',
    detail: 'Research interests, thesis & publications',
    description: 'Research and PhD portfolio of Abhijith Sivaprasadan: high-temperature heat transfer, thermal storage, power-system resilience, emerging nuclear-energy applications, published thesis and reproducible scientific software.',
    intro: 'I’m interested in research-engineer and doctoral work across thermal-fluid engineering, energy-system resilience and nuclear-energy applications. My work combines a published KTH master’s thesis with open scientific software, dynamic thermal-storage modelling and evidence-first power-system research.',
    audience: 'Doctoral applications and research collaborations',
    focus: [
      ['High-temperature heat transfer', 'Geometry, thermal resistance, radiation and transient CHT.'],
      ['Experimental–numerical methods', 'Measurement readiness, numerical checks and bounded comparison.'],
      ['Energy-system questions', 'Flexibility, hydropower, networks, storage and reproducible scenario experiments.'],
      ['Nuclear transition', 'Thermal-hydraulics and reactor systems as an emerging research direction, not a claimed specialisation.'],
    ],
    matrix: [
      ['Research design', 'Questions, assumptions and bounded conclusions'],
      ['Numerical methods', 'CFD, optimisation and dynamic simulation'],
      ['Verification', 'Mesh studies, analytical checks and cross-model tests'],
      ['Experimental context', 'Measurement readiness and laboratory methods'],
      ['Technical communication', 'Published thesis, reports and open evidence'],
    ],
    projects: ['siemens-thesis', 'kerala2040', 'tes-discharge-screen', 'opensteamopt', 'non-gray-radiation-modeling', 'gb-flexabm', 'thermotwin-f'],
    experiences: [siemens, kth, alleima],
    skills: [research, thermal, energy, software],
    education: ['kth', 'btech', 'aalto'],
    resources: [researchCV, thesis, { url: 'research.html', label: 'Full research statement' }, { url: 'projects/robotic-frame-locomotion.html', label: 'Undergraduate publications' }, { url: 'https://orcid.org/0009-0009-8429-1266', label: 'ORCID ↗' }],
    primary: researchCV,
    scope: 'Research interests describe future directions, not completed experiments or institutional endorsement. Nuclear energy is an emerging direction; it is not presented as an existing qualification. The thesis is a numerical investigation with measurement-chain commissioning; heater failure occurred before high-temperature testing could begin, so it does not establish experimental validation. Kerala2040 and TES Discharge Screen publish explicit screening, verification and validation boundaries; independent models are not operational forecasts.',
  },
];
