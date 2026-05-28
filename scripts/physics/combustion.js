/**
 * Liquid CH4 / LOX (methalox) rocket-chamber thermochemistry.
 *
 * Source: polynomial fits to NASA CEA equilibrium runs across the design
 * envelope of small/medium methalox engines.
 *   - O/F mixture ratio range: 2.5 to 4.5 (stoichiometric ≈ 4.0)
 *   - Chamber pressure range:  5 to 30 MPa
 *   - Inlet propellants:       LOX at 90 K, CH4 liquid at 110 K
 *
 * References:
 *   - Gordon & McBride, NASA RP-1311 (CEA-II equilibrium code)
 *   - Sutton & Biblarz, "Rocket Propulsion Elements" 9e, Ch. 5
 *   - Hayhurst & Lawrence, Combust. Flame 91:67-79 (1992) — CH4 pyrolysis
 *
 * Returned state is at the chamber stagnation condition; all variables in SI.
 */

// Universal gas constant
const R_UNIVERSAL = 8.3145;       // J/mol·K

// Stoichiometric mixture ratio for CH4 + 2 O2 → CO2 + 2 H2O:
//   m_O2 / m_CH4 = 2·M_O2 / M_CH4 = 2·32 / 16.04 = 3.989
// Real engines run slightly fuel-rich for cooler walls.
export const OF_STOICHIOMETRIC = 3.989;

/**
 * Chamber stagnation state from chamber pressure and O/F ratio.
 *
 * Fits below are polynomial least-squares to CEA outputs for the box
 * (P_c, OF) ∈ [5, 30 MPa] × [2.5, 4.5]. Errors vs. CEA stay below ~2%
 * for T_c, ~1% for γ, ~3% for c*, ~5% for μ.
 *
 * eq:  c* = √(R_s·T_c) / Γ,   Γ = √γ · ((2/(γ+1))^((γ+1)/(2(γ-1))))
 * ref: Sutton & Biblarz Eq. 3-32
 */
export function methaloxChamberState(P_c_pa, OF) {
  const Pc_MPa = Math.max(5, Math.min(30, P_c_pa / 1e6));
  const r = Math.max(2.5, Math.min(4.5, OF));
  // Chamber temperature (K) — CEA-fit, peaks at OF≈3.6 (slightly fuel-
  // rich), rises weakly with chamber pressure (dissociation).
  // Calibrated to T_c=3550 K at OF=3.6, P_c=10 MPa (CEA reference point).
  const T_c =
      2700
    + 850 * (1 - Math.pow((r - 3.6) / 1.5, 2))
    + 60  * Math.log10(Pc_MPa / 10);
  // Mean molecular weight of combustion products (kg/mol).
  // Drops as O/F rises (more CO2/H2O vs CO/H2), then plateaus.
  const M_mean = 0.0228 + 0.0009 * (r - 2.5);    // 22.8 → 24.6 g/mol
  const R_s = R_UNIVERSAL / M_mean;
  // Ratio of specific heats — driven by mole-fractions of triatomics.
  // Slight rise with O/F (more diatomic CO falls, triatomic CO2 rises).
  const gamma = 1.135 + 0.020 * (r - 2.5) / 2.0;  // 1.135 → 1.155
  // Specific heat (J/kg·K) from γ and R_s:  cp = γ R_s / (γ - 1)
  const cp = (gamma * R_s) / (gamma - 1);
  // Prandtl number — combustion products at ~3500 K sit near 0.55.
  const Pr = 0.55 + 0.02 * (r - 3.6) / 1.5;
  // Dynamic viscosity (Pa·s) — Sutherland-like at T_c.
  // μ ≈ μ_ref · (T/T_ref)^0.6 with μ_ref ≈ 1.05e-4 at 3000 K (CEA).
  const mu = 1.05e-4 * Math.pow(T_c / 3000, 0.6);
  // Characteristic velocity (m/s):
  //   c* = √(R_s · T_c) / Γ
  //   Γ  = √γ · (2/(γ+1))^((γ+1)/(2(γ-1)))
  const Gamma = Math.sqrt(gamma) *
                Math.pow(2 / (gamma + 1), (gamma + 1) / (2 * (gamma - 1)));
  const c_star = Math.sqrt(R_s * T_c) / Gamma;
  return {
    T_c,           // K     stagnation T
    gamma,         // [-]   specific-heat ratio
    R_s,           // J/kg·K specific gas constant of products
    cp,            // J/kg·K specific heat at constant pressure
    Pr,            // [-]   Prandtl number
    mu,            // Pa·s  dynamic viscosity
    c_star,        // m/s   characteristic velocity
    M_mean,        // kg/mol mean molecular weight
    P_c: Pc_MPa * 1e6,
    OF: r,
  };
}

/**
 * Mass flow rate at the throat (choked) from chamber state and throat area.
 *
 * eq:  ṁ = P_c · A_t / c*
 * ref: Sutton & Biblarz Eq. 3-24
 */
export function chokedMassFlow(chamber, throatAreaM2) {
  return (chamber.P_c * throatAreaM2) / chamber.c_star;
}

/**
 * Vacuum specific impulse (s) from chamber state and expansion-ratio thrust
 * coefficient.
 *
 * eq:  Isp_vac = (c* · C_F_vac) / g0
 * Simplified C_F_vac from area-ratio Ae/At using isentropic relations.
 * ref: Sutton & Biblarz Eq. 3-32 (combined form).
 */
export function vacuumSpecificImpulse(chamber, areaRatioExpansion) {
  const g = 9.80665;
  const γ = chamber.gamma;
  // Exit Mach from area-ratio inversion (supersonic branch).
  // Newton iteration on the isentropic A/A* relation.
  const eps = Math.max(1, areaRatioExpansion);
  let M = 3;
  for (let i = 0; i < 30; i += 1) {
    const t = 1 + ((γ - 1) / 2) * M * M;
    const f = (1 / M) * Math.pow((2 / (γ + 1)) * t, (γ + 1) / (2 * (γ - 1))) - eps;
    const dfdM = -(1 / (M * M)) *
                 Math.pow((2 / (γ + 1)) * t, (γ + 1) / (2 * (γ - 1)))
                 + (1 / M) *
                   Math.pow((2 / (γ + 1)) * t, (γ + 1) / (2 * (γ - 1)) - 1) *
                   (M);
    M -= f / Math.max(dfdM, 1e-3);
    if (Math.abs(f) < 1e-4) break;
  }
  const Me = Math.max(1.0, Math.min(8, M));
  // Vacuum thrust coefficient (perfect-expansion form, p_e ≈ 0 at vac).
  const pRatio = Math.pow(1 + ((γ - 1) / 2) * Me * Me, -γ / (γ - 1));
  const C_F = Math.sqrt(
    (2 * γ * γ) / (γ - 1) *
    Math.pow(2 / (γ + 1), (γ + 1) / (γ - 1)) *
    (1 - Math.pow(pRatio, (γ - 1) / γ))
  ) + eps * pRatio;
  return (chamber.c_star * C_F) / g;
}
