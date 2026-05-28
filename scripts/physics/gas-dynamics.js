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
 * diverging nozzle (SIMPLIFIED area-ratio form):
 *   h_g / h_g*  ≈ (A_t / A)^0.9
 * ref: Bartz, NASA TN-19650013685, 1965.
 *
 * Kept for the simpler legacy path. Prefer `bartzFullCoefficient` for
 * methalox-grade rigor.
 */
export function bartzLocalCoefficient(throatCoefficient, throatRadius, localRadius) {
  return throatCoefficient * Math.pow(throatRadius / localRadius, 1.8);
}

/**
 * FULL Bartz equation with the σ transport-property correction.
 *
 * Throat heat-transfer coefficient:
 *   h_g* = (0.026 / D_t^0.2) · (μ^0.2 · cp / Pr^0.6)
 *          · (P_c · g / c*)^0.8 · (D_t / r_c)^0.1 · σ_throat
 *
 * Local-station correction (multiplies h_g*):
 *   h_g(x) / h_g*  =  (A_t / A(x))^0.9 · (σ(x) / σ_throat)
 *
 * Property-correction factor σ(x):
 *   σ = 1 / [ (½·(T_w/T_c)·(1 + (γ-1)/2·M²) + ½)^0.68
 *            · (1 + (γ-1)/2·M²)^0.12 ]
 *
 * Inputs:
 *   chamber: {T_c, gamma, cp, Pr, mu, c_star, P_c}  (from combustion.js)
 *   D_throat_m : throat diameter [m]
 *   r_curv_m   : throat curvature radius [m] (typically ≈ D_t)
 *   M_local    : local Mach number
 *   T_wall     : local hot-side wall temperature [K]
 *   areaRatio  : A_local / A_throat
 *
 * ref: Bartz, NASA TN D-7973 (consolidated form); Sutton & Biblarz Eq. 8-3.
 */
export function bartzFullCoefficient({
  chamber,
  D_throat_m,
  r_curv_m,
  M_local,
  T_wall,
  areaRatio,
}) {
  const { T_c, gamma, cp, Pr, mu, c_star, P_c } = chamber;
  // Throat reference coefficient (SI form, no g0 — the gravitational
  // constant in the original English-unit Bartz drops out in SI).
  const base = (0.026 / Math.pow(D_throat_m, 0.2))
             * (Math.pow(mu, 0.2) * cp / Math.pow(Pr, 0.6))
             * Math.pow(P_c / c_star, 0.8)
             * Math.pow(D_throat_m / Math.max(r_curv_m, 0.5 * D_throat_m), 0.1);
  // σ at the throat (M=1).
  const sigmaAt = (M, Tw) => {
    const therm = 1 + ((gamma - 1) / 2) * M * M;
    const a = 0.5 * (Tw / T_c) * therm + 0.5;
    return 1 / (Math.pow(a, 0.68) * Math.pow(therm, 0.12));
  };
  const sigma_t = sigmaAt(1.0, T_wall);
  const h_throat = base * sigma_t;
  // Local h via area-ratio + σ ratio.
  const sigma_x = sigmaAt(M_local, T_wall);
  const h_local = h_throat
                * Math.pow(1 / Math.max(0.05, areaRatio), 0.9)
                * (sigma_x / sigma_t);
  return { h_throat, h_local, sigma_throat: sigma_t, sigma_local: sigma_x };
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
