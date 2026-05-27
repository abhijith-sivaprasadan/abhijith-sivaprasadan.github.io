/**
 * Shared physics layer for the live-lens panels.
 *
 * One module per domain:
 *   constants.js       — every physical constant with a citation
 *   gas-dynamics.js    — Anderson Ch.3-4: isentropic relations, Bartz, Re, St
 *   heat-transfer.js   — Incropera & DeWitt: 1-D resistance, Biot, regen ΔT
 *   energy-systems.js  — ISO 50001/50006, IPCC AR5, EU EED, Carnot HP, MAC
 *
 * Callers either import from this barrel or from the specific module.
 */

export * from "./constants.js";
export * from "./gas-dynamics.js";
export * from "./heat-transfer.js";
export * from "./energy-systems.js";
