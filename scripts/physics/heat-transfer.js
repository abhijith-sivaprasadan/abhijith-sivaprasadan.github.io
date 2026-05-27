/**
 * Heat-transfer formulas — 1-D resistance networks, Biot number,
 * regenerative-cooling closure.
 *
 * Source: Incropera & DeWitt, "Fundamentals of Heat and Mass Transfer", 7e;
 * Anderson Ch.11 for high-speed wall heating.
 */

/**
 * Biot number — measures internal vs surface resistance.
 * eq:  Bi = h · L_c / k
 * Bi << 1 ⇒ lumped-capacitance valid (the thesis interpretation).
 */
export function biotNumber(heatTransferCoeff, characteristicLengthM, conductivity) {
  return (heatTransferCoeff * characteristicLengthM) / conductivity;
}

/**
 * 1-D series thermal-resistance network.
 *
 * eq:  R_gas  = 1 / h_gas         (convection)
 * eq:  R_wall = t / k             (conduction)
 * eq:  R_ext  = 1 / h_ext         (convection)
 * eq:  q      = (T_hot - T_cold) / R_total
 * eq:  T_inner = T_hot - q · R_gas
 * eq:  T_outer = T_inner - q · R_wall
 *
 * Returns all intermediate quantities so callers can render either the bars
 * or the temperature drops directly.
 */
export function thermalResistanceCircuit({
  T_hot,
  T_cold,
  h_internal,
  wallThicknessM,
  wallConductivity,
  h_external,
}) {
  const R_gas  = 1 / h_internal;
  const R_wall = wallThicknessM / wallConductivity;
  const R_ext  = 1 / h_external;
  const R_total = R_gas + R_wall + R_ext;
  const q = (T_hot - T_cold) / R_total;       // W/m²
  const T_inner = T_hot - q * R_gas;
  const T_outer = T_inner - q * R_wall;
  return {
    R_gas, R_wall, R_ext, R_total,
    q,
    T_inner, T_outer,
    // Fractional shares of total resistance — useful for bar plots.
    f_gas:  R_gas  / R_total,
    f_wall: R_wall / R_total,
    f_ext:  R_ext  / R_total,
  };
}

/**
 * Regenerative-cooling coolant ΔT closure.
 * eq:  Q = ṁ · cp · ΔT_coolant   ⇒   ΔT = q'' · A_wall / (ṁ · cp)
 *
 * Coolant rises by ΔT after absorbing heat flux q'' over wall area A.
 * Closes the loop: the same heat that punishes the hot side warms the
 * cold side, and ΔT_coolant is what an instrumentation chain actually
 * measures in test campaigns.
 */
export function coolantTemperatureRise({
  heatFluxWPerM2,
  wallAreaM2,
  coolantMassFlowKgs,
  coolantCpJperKgK,
}) {
  if (coolantMassFlowKgs <= 0 || coolantCpJperKgK <= 0) return 0;
  return (heatFluxWPerM2 * wallAreaM2) / (coolantMassFlowKgs * coolantCpJperKgK);
}

/**
 * Burnout margin: how close the hot-side wall is to the material limit.
 *
 *  ratio  = T_w / T_burnout    (< 1.0 = safe; → 1.0 = approaching limit)
 *
 * Returns both the ratio and the margin in K. Negative margin = past limit.
 */
export function burnoutMargin(wallTemperatureK, burnoutTemperatureK) {
  return {
    ratio: wallTemperatureK / burnoutTemperatureK,
    marginK: burnoutTemperatureK - wallTemperatureK,
  };
}

/**
 * Conductance health ratio — fraction of clean conductance still available.
 * eq:  h/h_clean = R_clean / R_total          (resistance form)
 *
 * 1.0 = clean; values < 1.0 mean a fouling layer has reduced effective
 * thermal conductance. Direct generalisation of the existing healthIndex.
 */
export function conductanceHealthRatio(cleanResistance, totalResistance) {
  if (totalResistance <= 0) return 0;
  return Math.max(0, Math.min(1, cleanResistance / totalResistance));
}

/**
 * Deposit's share of total thermal resistance.
 * eq:  R_dep / R_total          (failure-mode indicator)
 */
export function depositResistanceShare(depositResistance, totalResistance) {
  if (totalResistance <= 0) return 0;
  return depositResistance / totalResistance;
}
