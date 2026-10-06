// Each axis links these explicit work examples; record counts are not proficiency.
// IDs are checked against the canonical published portfolio during generation.
const thesis = 'siemens-thesis', tes = 'tes-discharge-screen', twin = 'thermotwin-f';
const grid = 'kerala2040', steam = 'opensteamopt', market = 'gb-flexabm';
const heat = 'numerical-heat-transfer', radiation = 'non-gray-radiation-modeling';
const lab = 'mtes-pcm-thermal-lab', battery = 'battery-cell-discharge-lab';
const vibration = 'rotating-machinery-vibration-minilab', fea = 'structural-fea-reactor-internals';
const nl = 'pypsa-nl-grid-flexibility', hydrogen = 'pynexus-green-hydrogen';
const district = 'district-heating-optimisation', forecast = 'heating-demand-forecasting';
const kpi = 'industrial-energy-kpi-toolkit', alleima = 'alleima-energy-efficiency';
const qburst = 'experience:engineer-backend-developer-typescript-nestjs';
module.exports = {
  general: [[thesis, tes, twin, heat, radiation], [grid, tes, steam, nl, hydrogen, district], [qburst, grid, tes, steam, market, twin, kpi], [thesis, lab, battery, vibration], [fea, thesis, 'bicycle-design-competition', 'baja-sae-2019', 'robotic-frame-locomotion']],
  thermal: [[thesis, twin], [thesis, twin, heat], [tes, lab, 'peltier-refrigerator', district], [thesis, lab, battery, vibration], [thesis, heat, radiation, twin]],
  'energy-modelling': [[tes, steam, nl, hydrogen, district], [grid, nl, 'distribution-grid-study', market], [tes, district, lab, 'tes-peak-shaving'], [hydrogen, 'residential-heating-technoeconomics', 'germany-energy-economy-analysis', 'eu-ets-exposure-calculator'], [grid, forecast, kpi, market]],
  software: [[grid, tes, steam, market, kpi, forecast], [qburst], [qburst, tes, steam, market, twin], [twin, steam, heat, radiation], [tes, steam, market, kpi, forecast]],
  research: [[thesis, grid, tes, market], [thesis, tes, steam, twin, radiation, heat], [thesis, tes, steam, twin, radiation], [thesis, lab, battery, vibration], [thesis, 'robotic-frame-locomotion', grid, tes, market]],
};
