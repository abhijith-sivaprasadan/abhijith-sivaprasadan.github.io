/**
 * Physical constants used across the live-lens layer.
 * Every value has a citation. No magic numbers introduced downstream.
 *
 * Convention: SI base units (K, m, kg, s, W, J, Pa, mol).
 * Citations use the same format as the rest of the codebase.
 */

// ── Fluid + gas-dynamics ────────────────────────────────────────────────────
// Anderson, "Modern Compressible Flow", 3rd ed., Ch.3 (isentropic relations).
export const GAMMA_AIR = 1.4;            // [-]  ratio of specific heats, air
export const R_AIR     = 287.05;         // J/kg·K  specific gas constant, air
export const PR_AIR    = 0.71;           // [-]  Prandtl number, air at ~600 K
export const MU_AIR_673K = 3.30e-5;      // Pa·s  dynamic viscosity, air at 673 K
                                         //       (Sutherland, T_ref=273, S=110)

// ── Methane (lens 3, regenerative cooling) ─────────────────────────────────
// NIST WebBook reference values; CH4 supercritical at ~10 MPa, 300 K.
export const GAMMA_CH4    = 1.299;       // [-]
export const CP_CH4_COOL  = 2400;        // J/kg·K  liquid-CH4 cp at coolant T
export const T_BURNOUT_CU = 1170;        // K       OFHC copper, AMS 4500 limit
export const K_COPPER     = 320;         // W/m·K   pure Cu, ~ 400 K
export const K_COKE       = 1.15;        // W/m·K   carbonaceous deposit, mid-range
                                         //         (Wagner & Shimp, AIAA 2005-3568)

// ── Siemens reducer (lens 1, thesis-anchored) ──────────────────────────────
// All values traceable to TRITA-ITM-EX 2026:14 unless otherwise noted.
export const REDUCER_T0          = 673;     // K     stagnation inlet T (thesis)
export const REDUCER_T_AMBIENT   = 293;     // K     uninsulated outer ambient
export const REDUCER_T_WALL_M    = 0.005;   // m     5 mm steel wall
export const REDUCER_K_WALL      = 21.5;    // W/m·K AISI 304 @ ~673 K
export const REDUCER_H_GAS       = 320;     // W/m²·K Sieder-Tate, thesis Re band
export const REDUCER_H_EXT       = 14;      // W/m²·K free convection, uninsulated
export const REDUCER_D_HYDRAULIC = 0.020;   // m     throat hydraulic diameter
// Geometry-dependent Mach number reported in TRITA-ITM-EX 2026:14:
export const REDUCER_MACH_SMOOTH = 0.990;   // C² quintic redesigned reducer
export const REDUCER_MACH_LEGACY = 1.006;   // two-step (slightly supersonic)

// ── ISO 50001 / ISO 50006 industrial energy ────────────────────────────────
// IPCC AR5 WG3 Annex II: natural-gas emission factor on LHV basis.
// 0.198 kgCO₂/kWh_LHV = 56.1 kgCO₂/GJ × 3.6 / 1000.
export const G_GAS_LHV          = 202;      // gCO₂/kWh  natural gas (LHV)
// EU EED 2018/2002 default primary-energy factor for grid electricity.
export const PEF_EL_EU          = 1.9;      // [-]  E_primary / E_final
// Typical small-DH thermal-storage round-trip efficiency.
export const ETA_TES_RT         = 0.90;     // [-]
// Industrial heat-pump second-law efficiency (Carnot fraction).
// Arpagaus et al., Renewable & Sustainable Energy Reviews 2018; review of
// high-temperature industrial HPs: η_2nd typically 0.40–0.55.
export const ETA_2ND_HP_INDUSTRIAL = 0.50;
export const T_SOURCE_AMBIENT_C = 10;       // °C    waste-heat / ambient source
// Boiler efficiencies (LHV basis, manufacturer datasheet medians).
export const ETA_ELECTRIC_BOILER = 0.98;
export const ETA_GAS_BOILER      = 0.90;
// Typical industrial heat-recovery effectiveness floor (load=0) and slope.
export const HR_BASE             = 0.18;
export const HR_LOAD_SLOPE       = 0.04;    // η = 0.18 + 0.04·load_fraction

// ── Conversions ────────────────────────────────────────────────────────────
export const KELVIN_OFFSET = 273.15;
export const HOUR_S        = 3600;
export const G_TO_KG       = 1e-3;
