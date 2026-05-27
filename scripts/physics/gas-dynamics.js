/**
 * Compressible-flow / gas-dynamics relations.
 * Source: Anderson, "Modern Compressible Flow", 3rd ed., Ch.3-4.
 *
 * All functions are pure; no DOM, no globals.
 */

import { GAMMA_AIR, PR_AIR, R_AIR, MU_AIR_673K } from "./constants.js";

/**
 * Isentropic temperature ratio T/T0.
 * eq:  T / T0 = (1 + (γ-1)/2 · M²)⁻¹
 * ref: Anderson Ch.3, Eq. 3.28
 */
export function staticToTotalTemperature(machNumber, gamma = GAMMA_AIR) {
  return 1 / (1 + ((gamma - 1) / 2) * machNumber * machNumber);
}

/**
 * Isentropic pressure ratio p/p0.
 * eq:  p / p0 = (T / T0)^(γ/(γ-1))
 * ref: Anderson Ch.3, Eq. 3.30
 */
export function staticToTotalPressure(machNumber, gamma = GAMMA_AIR) {
  return staticToTotalTemperature(machNumber, gamma) ** (gamma / (gamma - 1));
}

/**
 * Adiabatic (recovery) wall temperature.
 * eq:  T_aw = T_static · (1 + r · (γ-1)/2 · M²)
 * eq:  r    = Pr^(1/3)   (turbulent boundary layer)
 * ref: Schlichting, "Boundary-Layer Theory", Ch.15
 */
export function adiabaticWallTemperature(machNumber, staticTemperatureK, prandtl = PR_AIR, gamma = GAMMA_AIR) {
  const r = Math.cbrt(prandtl);
  return staticTemperatureK * (1 + r * ((gamma - 1) / 2) * machNumber * machNumber);
}

/**
 * Reynolds number from ideal-gas state + Mach.
 * eq:  Re = ρ · V · D / μ
 *      ρ  = p / (R · T)
 *      V  = M · √(γ R T)
 * ref: Anderson Ch.4; ideal-gas closure.
 *
 * @param machNumber      M [-]
 * @param staticTemperatureK  T [K]
 * @param staticPressurePa    p [Pa]
 * @param hydraulicDiameterM  D_h [m]
 * @param dynamicViscosity    μ [Pa·s] (default: air at 673 K)
 */
export function reynoldsNumber(
  machNumber,
  staticTemperatureK,
  staticPressurePa,
  hydraulicDiameterM,
  dynamicViscosity = MU_AIR_673K,
  gamma = GAMMA_AIR,
  specificGasConstant = R_AIR
) {
  const rho = staticPressurePa / (specificGasConstant * staticTemperatureK);
  const speedOfSound = Math.sqrt(gamma * specificGasConstant * staticTemperatureK);
  const V = machNumber * speedOfSound;
  return (rho * V * hydraulicDiameterM) / dynamicViscosity;
}

/**
 * Stanton number — dimensionless heat-transfer coefficient.
 * eq:  St = h / (ρ · V · cp)
 * ref: Incropera & DeWitt Ch.6.
 */
export function stantonNumber(heatTransferCoeff, density, velocity, cp) {
  return heatTransferCoeff / (density * velocity * cp);
}

/**
 * Bartz-style local heat-transfer coefficient scaling for a converging-
 * diverging nozzle:  h_g / h_g*  ≈ (A_t / A)^0.9.
 * ref: Bartz, NASA TN-19650013685, 1965.
 *
 * This is the simplified area-ratio scaling used in the research lens; the
 * full Bartz equation also includes property corrections we omit here.
 */
export function bartzLocalCoefficient(throatCoefficient, throatRadius, localRadius) {
  return throatCoefficient * Math.pow(throatRadius / localRadius, 1.8);
}

/**
 * Static temperature [K] from stagnation T0 and Mach.
 * Convenience wrapper around staticToTotalTemperature for code that wants the
 * absolute K value rather than the dimensionless ratio.
 */
export function staticTemperatureFromTotal(totalTemperatureK, machNumber, gamma = GAMMA_AIR) {
  return totalTemperatureK * staticToTotalTemperature(machNumber, gamma);
}

/**
 * Static pressure [Pa] from stagnation p0 and Mach.
 */
export function staticPressureFromTotal(totalPressurePa, machNumber, gamma = GAMMA_AIR) {
  return totalPressurePa * staticToTotalPressure(machNumber, gamma);
}
