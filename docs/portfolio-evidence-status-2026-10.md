# Portfolio evidence boundaries (20 October 2026)

This is an internal publication-maintenance note, not a new project or a proof of engineering validation. Source material in the linked case studies and repositories remains authoritative.

| Work | Public, independently inspectable evidence | Not established / reproduction boundary |
|---|---|---|
| Siemens Energy thesis | KTH DiVA thesis TRITA-ITM-EX 2026:14, numerical methodology, plots, explicit measurement-chain and failure account | Proprietary ANSYS meshes, rig boundary data and simulation files are not part of an independently executable public Git repository. A completed experimental validation campaign is not claimed. |
| TES Discharge Screen | Public Python, Modelica/FMU source, Pyomo formulations, synthetic profiles, run manifests, tests and comparisons | No measured plant dataset, equipment qualification, property/degradation calibration or plant-specific installation validation. |
| OpenSteamOpt | Python/Pyomo, Modelica source, committed synthetic reference results, CI and FMU receipt | No actual plant historian, steam-network validation or live control. Optimisation improvement is relative to a custom rule baseline. |
| PyNEXUS | Real 2023 ERA5 wind provenance, source, solver configuration and recorded annual runs | Electricity prices and system demand/capacity assumptions remain illustrative. ENTSO-E acquisition is not wired to the main solve path. |
| Industrial Energy KPI Toolkit | Synthetic CSV and workbook templates, script, Streamlit GUI and CI outputs | No operational site data or IPMVP Option C savings verification. Driver model uses production and/or operating hours; not HDD. |
| GridGuardPINN | Public source, v1.0 tagged release, IEEE-14 ANDES routing benchmarks, frozen model checkpoints and randomized timing ledgers | Research demonstrator only; the 1.57–1.95× result is workload- and runner-specific; unseen fault locations default to reference-simulator fallback. SSR estimates are synthetic and not field validated. |
| Finnish Grid Connection Evidence Screener | Screenshot-rechecked 18-record indicative Fingrid capture, revision-aware evidence storage, code and documented API/Atlas deployments | No guaranteed point connection headroom, operator-confirmed capacity, or completed grid load-flow validation; national energy series are not nodal forecasts. |
| SynthSift | Frozen 538-record OpenAlex candidate corpus, AI-assisted title/abstract first-pass ledger (144 include / 341 exclude / 53 uncertain), 150 unique source-linked recheck flags; 240-record prespecified human sample and 96-record blinded second-review plan | Not a completed systematic review. AI recommendations are not independent human reference labels, possible bibliographic versions are unadjudicated, and 16-record pilot metrics do not establish external accuracy. |
| PyPSA-NL | Synthetic provincial network and assumed corridor ratings, code and diagnostic CSVs | Not a model of TenneT's operational network. N-1 analysis is a proxy, not security compliance. |
| ThermoTwin-F | Fortran and supporting source, scenario tests, hand-check documentation, historical figures | Historical plotted values require current-source regeneration before independent use; no engine-specific field validation. |
| Kerala2040 | Public-data provenance, partial observed daily records, PyPSA/OSeMOSYS screening workflows, numerical checks | Hydro timing and robust overloaded corridors are sensitivities under assumed inputs, not operational attribution or upgrade prescriptions. |
| M-TES PCM group laboratory | Calculations and instrumentation narrative on case page | 0.1% difference between a specified calculated discharge estimate and nominal theoretical PCM capacity does not establish metrological accuracy; source sensor files may not be independently available. |
| District-heating coursework | Case study and 5-step LP scenario narrative | No linked, fully executable public coursework code release; binary on/off MILP commitments are not established. |

## Publication rule

For any new headline number, link the source run, reference table or thesis figure and state whether it is observed, generated on synthetic inputs, model verification, or independently validated physical performance. Do not label a model as commissioned, a code check as experimental validation, or illustrative cost differences as operating-plant savings.

## Reproduction

The engineering repositories supply installation and example-run commands in their README files. CI smoke-test additions for TES Discharge Screen, OpenSteamOpt and Industrial Energy KPI Toolkit are proposed in separate review PRs; PyNEXUS already runs a synthetic solve and independent verifier in hosted CI. The Siemens thesis is a documented academic/industrial report, not an openly executable code project.
