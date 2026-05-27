/**
 * Energy-systems / industrial-decarbonisation formulas.
 *
 * Sources cited inline:
 *   ISO 50001 / 50006:2014 — EnPI definition.
 *   IPCC AR5 WG3 Annex II — emission factors.
 *   EU EED 2018/2002      — primary-energy factors.
 *   Arpagaus et al., RSER 2018 — high-temperature industrial HP COP.
 */

import {
  ETA_2ND_HP_INDUSTRIAL,
  T_SOURCE_AMBIENT_C,
  KELVIN_OFFSET,
  G_GAS_LHV,
  PEF_EL_EU,
  HR_BASE,
  HR_LOAD_SLOPE,
  ETA_TES_RT,
} from "./constants.js";

/**
 * Heat-pump COP from Carnot sink/source lift with second-law efficiency.
 * eq:  COP_Carnot  = T_sink / (T_sink - T_source)
 * eq:  COP_real    = η_2nd · COP_Carnot
 * ref: Cengel & Boles, "Thermodynamics", Ch.11; Arpagaus et al., RSER 2018.
 *
 * Temperatures in °C for ergonomics; conversion to K happens here.
 */
export function heatPumpCarnotCOP(
  sinkTemperatureC,
  sourceTemperatureC = T_SOURCE_AMBIENT_C,
  secondLawEfficiency = ETA_2ND_HP_INDUSTRIAL
) {
  const T_sink = sinkTemperatureC + KELVIN_OFFSET;
  const T_source = sourceTemperatureC + KELVIN_OFFSET;
  if (T_sink <= T_source) return Infinity;     // ill-posed; caller bound by UI
  const carnot = T_sink / (T_sink - T_source);
  return secondLawEfficiency * carnot;
}

/**
 * Marginal heat price from the electricity price and heat-pump COP.
 * eq:  c_heat = p_el / COP_HP                 [SEK/MWh_th]
 * ref: Standard cost-of-heat derivation for electric heat sources.
 */
export function marginalHeatPriceFromElectricity(electricityPrice, copHeatPump) {
  if (copHeatPump <= 0) return Infinity;
  return electricityPrice / copHeatPump;
}

/**
 * ISO 50006:2014 EnPI — energy performance indicator.
 * eq:  EnPI = E_purchased / production
 * ref: ISO 50006:2014, §5.
 */
export function energyPerformanceIndicator(purchasedEnergy, production) {
  if (production <= 0) return Infinity;
  return purchasedEnergy / production;
}

/**
 * Specific Energy Consumption — ISO 50001 partner KPI to EnPI.
 * eq:  SEC = E_total / production              [kWh/unit]
 * ref: ISO 50001:2018 Annex A.
 */
export function specificEnergyConsumption(totalEnergy, production) {
  if (production <= 0) return Infinity;
  return totalEnergy / production;
}

/**
 * Weighted emissions intensity (per unit of production).
 * eq:  e = (E_elec · g_elec + E_gas · g_gas) / production
 * Units: E in kWh; g_* in gCO₂/kWh; output gCO₂/unit.
 * Caller can divide by 1000 to get kgCO₂/unit if preferred.
 */
export function emissionsIntensity({
  electricityKwh,
  gasKwh,
  production,
  gridEmissionFactor,     // gCO₂/kWh_elec
  gasEmissionFactor = G_GAS_LHV,
}) {
  if (production <= 0) return Infinity;
  return (electricityKwh * gridEmissionFactor + gasKwh * gasEmissionFactor) / production;
}

/**
 * Marginal abatement cost — standard industrial decarbonisation KPI.
 * eq:  MAC = ΔOPEX_annual / ΔCO₂_avoided     [SEK / tCO₂]
 * ref: McKinsey GHG abatement curve methodology.
 *
 * If no abatement (or negative), returns NaN to flag the case.
 */
export function marginalAbatementCost(deltaOpexSek, deltaCO2TonnesAvoided) {
  if (!(deltaCO2TonnesAvoided > 0)) return NaN;
  return deltaOpexSek / deltaCO2TonnesAvoided;
}

/**
 * GHG Protocol Scope 1 (direct, gas combustion) and Scope 2 (purchased
 * electricity) split.
 * Returns both in absolute gCO₂ (caller scales to kg or t).
 */
export function scopeSplit({
  electricityKwh,
  gasKwh,
  gridEmissionFactor,
  gasEmissionFactor = G_GAS_LHV,
}) {
  return {
    scope1: gasKwh * gasEmissionFactor,
    scope2: electricityKwh * gridEmissionFactor,
  };
}

/**
 * Convert final energy to primary energy via EU EED default PEF.
 * eq:  E_primary = E_final · PEF
 * ref: Directive (EU) 2018/2002 Annex IV.
 */
export function toPrimaryEnergy(finalEnergyKwh, pef = PEF_EL_EU) {
  return finalEnergyKwh * pef;
}

/**
 * Heat-recovery effectiveness as a function of load fraction.
 * eq:  η_HR = η_base + slope · load_fraction
 * Empirical floor-and-slope used as a stand-in for a manufacturer curve.
 * Bounded to [0, 0.9] so callers can't get a non-physical recovery.
 */
export function heatRecoveryEffectiveness(loadFraction) {
  const eta = HR_BASE + HR_LOAD_SLOPE * Math.max(0, Math.min(1, loadFraction));
  return Math.max(0, Math.min(0.9, eta));
}

/**
 * Capacity-limited dispatch merit order: heat-pump first up to its capacity,
 * then electric trim boiler, then gas boiler for any balance.
 *
 * All quantities in MW (thermal demand, capacities) → outputs in MW.
 * Each switch enables/disables its corresponding source.
 */
export function dispatchMeritOrder({
  netHeatDemandMW,
  heatPumpEnabled,
  heatPumpCapacityMW,
  electricBoilerEnabled,
  electricBoilerCapacityMW,
  gasBoilerEnabled,
}) {
  let remaining = Math.max(0, netHeatDemandMW);
  const heatPumpHeat = heatPumpEnabled
    ? Math.min(heatPumpCapacityMW, remaining)
    : 0;
  remaining -= heatPumpHeat;
  const electricBoilerHeat = electricBoilerEnabled
    ? Math.min(electricBoilerCapacityMW, remaining)
    : 0;
  remaining -= electricBoilerHeat;
  const gasBoilerHeat = gasBoilerEnabled ? remaining : 0;
  const unmet = gasBoilerEnabled ? 0 : remaining;
  return { heatPumpHeat, electricBoilerHeat, gasBoilerHeat, unmet };
}

/**
 * TES round-trip efficiency — re-export as a function for callers that want
 * to model losses on the discharge cycle.
 * eq:  E_discharged = η_RT · E_charged
 * ref: Stored-energy round-trip efficiency for sensible TES, typical 0.85-0.92.
 */
export function tesRoundTripEfficiency() {
  return ETA_TES_RT;
}
