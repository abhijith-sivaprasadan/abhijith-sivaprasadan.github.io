// Qualitative editorial assessments, not measured proficiency or external ratings.
// Ordered to match matrix labels. Weight sustained practice and method depth,
// not repository count. Focused strength remains bounded to the stated evidence.
// Expert is unclaimed. Independent models are not validated plant deployments.
module.exports = {
  stages: ['Exposure', 'Applied', 'Established practice', 'Focused strength', 'Expert'],
  tracks: {
    general: [4, 3, 4, 3, 3],
    thermal: [4, 4, 3, 3, 4],
    'energy-modelling': [3, 3, 3, 3, 4],
    software: [4, 4, 4, 3, 3],
    research: [3, 4, 4, 3, 4],
  },
  rationale: {
    general: [
      'Focused Siemens thesis practice in compressible CFD/CHT, mesh independence and physical interpretation; final CFD was not experimentally validated.',
      'Repeated academic and independent work across power, heat, storage and optimisation; system models retain screening and calibration limits.',
      'Approximately 21 months of professional backend engineering at QBurst, complemented by separately documented scientific software.',
      'Measurement-chain commissioning and team thermal/battery laboratories; the planned Siemens high-temperature campaign did not run.',
      'Mechanical degree, CAD/PLM exposure, team design competitions and educational FEA; not certified component design.',
    ],
    thermal: [
      'Focused compressible CFD thesis with SST k-omega, three operating cases and mesh-independence studies.',
      'Thesis depth in coupled solid-fluid heat transfer, Biot analysis and insulation-reference interpretation; numerical findings only.',
      'Repeated thermal-process application through storage models, PCM laboratory work and energy coursework.',
      'NI-DAQ/LabVIEW commissioning plus team laboratory measurements; no completed high-temperature validation campaign.',
      'Thesis mesh checks, Grade A numerical heat-transfer coursework and documented analytical/cross-model checks in independent tools.',
    ],
    'energy-modelling': [
      'Repeated dispatch and optimisation workflows across coursework and independent tools; not operational deployment.',
      'Kerala resilience research and grid studies provide repeated network/flexibility practice; hourly calibration remains incomplete.',
      'Dynamic thermal-storage work and district-heating coursework connect physical behaviour to dispatch; no measured-plant validation.',
      'Course and independent scenario comparisons cover investment, emissions and energy economics; conclusions remain input-dependent.',
      'Audited public-data workflows, weather-sensitive forecasting, diagnostics and reproducible analysis form a recurring portfolio strength.',
    ],
    software: [
      'Repeated scientific Python workflows for data, optimisation, forecasting and reporting. Several independent tools use substantial AI-assisted implementation.',
      'Approximately 21 months at QBurst: Go followed by JavaScript/TypeScript and NestJS, production APIs, Git and Docker; not a senior architecture claim.',
      'Professional automated/negative-path endpoint testing plus documented numerical and regression checks in independent tools.',
      'Applied and repeated Modern Fortran, Modelica/FMI and solver integration; educational software, not commercial-engine validation.',
      'Multiple inspectable local GUIs, exports and reports; not evidence of production-hosted services or large-scale product adoption.',
    ],
    research: [
      'Published thesis and ongoing independent investigations demonstrate question framing and scope discipline; not an established academic research career.',
      'Focused thesis numerical work and Grade A numerical-methods coursework, extended through dynamic and optimisation tools.',
      'Mesh studies, analytical references, sensitivity work and cross-model checks are recurring strengths; verification is not experimental validation.',
      'Industrial measurement-chain commissioning and team laboratories support experimental context, not completed thesis validation.',
      'Published thesis, technical reports, documented assumptions and public evidence provide sustained technical communication practice.',
    ],
  },
};
