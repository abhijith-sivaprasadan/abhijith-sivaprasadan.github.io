// Conservative, qualitative portfolio assessments, not measured proficiency.
// Ordered to match each track's five matrix labels. Never derive from repo count.
// Foundational: coursework/initial exposure. Applied: bounded project practice.
// Practised: sustained professional or focused thesis practice, still early-career.
// Advanced/Expert are intentionally unclaimed; independent tools are not deployments.
module.exports = {
  stages: ['Foundational', 'Applied', 'Practised', 'Advanced', 'Expert'],
  tracks: {
    general: [3, 2, 3, 2, 2],
    thermal: [3, 3, 2, 2, 2],
    'energy-modelling': [2, 2, 2, 2, 2],
    software: [2, 3, 3, 2, 2],
    research: [2, 3, 2, 2, 3],
  },
};
