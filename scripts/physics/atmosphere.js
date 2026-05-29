/**
 * Standard atmosphere + rocket-nozzle altitude-adaptation physics.
 *
 * Powers the Research lens "flight mode": as the engine climbs, ambient
 * pressure drops and the exhaust plume morphs through the three classical
 * expansion regimes. Everything here is textbook compressible-flow /
 * propulsion theory.
 *
 * Sources:
 *   - U.S. Standard Atmosphere 1976 (troposphere power law + stratosphere
 *     isothermal layer).
 *   - Sutton & Biblarz, "Rocket Propulsion Elements" 9e, Ch.3 (thrust
 *     equation, expansion regimes).
 *   - Summerfield, Forster & Swan, "Flow separation in overexpanded
 *     supersonic exhaust nozzles", Jet Propulsion 24 (1954): separation
 *     when p_e/p_amb falls below ~0.35-0.40.
 */

const P0_SEA = 101_325;     // Pa     sea-level pressure
const T0_SEA = 288.15;      // K      sea-level temperature
const LAPSE  = 0.0065;      // K/m    tropospheric lapse rate
const G0     = 9.80665;     // m/s²
const R_AIR  = 287.05;      // J/kg·K
const P_TROPOPAUSE = 22_632; // Pa    pressure at 11 km
const T_TROPOPAUSE = 216.65; // K     isothermal stratosphere temp

/**
 * Ambient pressure (Pa) from geometric altitude (m), ISA 1976.
 * eq (≤11 km):  p = p0·(1 − L·h/T0)^(g/(R·L))
 * eq (>11 km):  p = p_11·exp(−(h−11000)/H),  H = R·T_tropopause/g
 */
export function ambientPressure(altitudeM) {
  const h = Math.max(0, altitudeM);
  if (h <= 11_000) {
    return P0_SEA * Math.pow(1 - (LAPSE * h) / T0_SEA, G0 / (R_AIR * LAPSE));
  }
  const H = (R_AIR * T_TROPOPAUSE) / G0;     // ≈ 6341 m scale height
  return P_TROPOPAUSE * Math.exp(-(h - 11_000) / H);
}

/** ISA layer label for a given altitude (km). */
export function atmosphereLayer(altitudeKm) {
  if (altitudeKm < 11) return "Troposphere";
  if (altitudeKm < 50) return "Stratosphere";
  return "Mesosphere";
}

// Summerfield separation criterion: flow detaches from the nozzle wall
// when the exit-to-ambient pressure ratio drops below this value.
export const SEPARATION_RATIO = 0.40;

/**
 * Classify nozzle expansion regime from exit static pressure vs ambient.
 *
 * Returns:
 *   ratio       p_e / p_amb
 *   label       human-readable regime
 *   regime      "over" | "perfect" | "under"
 *   separated   true when strongly overexpanded (Summerfield)
 *   flare       plume-width multiplier for the renderer (necks <1, balloons >1)
 *   machDisk    0-1 strength of the normal-shock Mach disk
 */
export function expansionState(p_e, p_amb) {
  const ratio = p_amb > 1e-6 ? p_e / p_amb : 50;     // vacuum → very underexpanded
  let label, regime;
  let separated = false;
  if (ratio < SEPARATION_RATIO) {
    label = "Overexpanded · separated"; regime = "over"; separated = true;
  } else if (ratio < 0.95) {
    label = "Overexpanded"; regime = "over";
  } else if (ratio <= 1.05) {
    label = "Perfectly expanded"; regime = "perfect";
  } else {
    label = "Underexpanded"; regime = "under";
  }
  // Plume flare: ratio^0.28 maps 0.1→0.51, 1→1.0, 10→1.9, 50→2.9 (clamped).
  const flare = Math.max(0.45, Math.min(2.6, Math.pow(ratio, 0.28)));
  // Mach-disk strength scales with how far from perfectly-expanded we are.
  const machDisk = Math.min(1, Math.abs(Math.log(Math.max(1e-3, ratio))) / 2.2);
  return { ratio, label, regime, separated, flare, machDisk };
}

/**
 * Thrust (N) from the rocket thrust equation:
 *   F = ṁ·V_e + (p_e − p_amb)·A_e
 * ref: Sutton & Biblarz Eq. 3-29.
 */
export function thrust(mDot, V_e, p_e, p_amb, A_e) {
  return mDot * V_e + (p_e - p_amb) * A_e;
}

/** Specific impulse (s):  Isp = F / (ṁ·g0). */
export function specificImpulse(F, mDot) {
  return mDot > 0 ? F / (mDot * G0) : 0;
}
