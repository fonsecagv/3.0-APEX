import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import { type GateResult, evaluateGate01 } from '../modules/m01Foundation.ts';
import {
  type VehiclePhilosophyCode,
  evaluateGate02,
  evaluatePhilosophyForTrack,
} from '../modules/m02Philosophy.ts';
import {
  FIA_2026_DEFAULT_EDITION,
  type RegulationEditionSpec,
  buildPackagingArchitecture,
  evaluateGate03,
} from '../modules/m03Packaging.ts';
import { evaluateAerodynamics, evaluateGate04 } from '../modules/m04Aerodynamics.ts';
import { evaluateGate05, evaluateVehicleDynamics } from '../modules/m05VehicleDynamics.ts';
import { type TireCompoundCode, evaluateGate06, evaluateTirePhysics } from '../modules/m06Tires.ts';
import { evaluateGate07, evaluateStructures } from '../modules/m07Structures.ts';
import { evaluateGate08, evaluatePowerUnit } from '../modules/m08PowerUnit.ts';
import { evaluateGate09, evaluateTransmission } from '../modules/m09Transmission.ts';
import { evaluateGate10, runMultidisciplinarySimulation } from '../modules/m10Multidisciplinary.ts';
import { evaluateGate11, runRaceSimulation } from '../modules/m11RaceSimulation.ts';
import { evaluateGate12, runCalibrationPipeline } from '../modules/m12Calibration.ts';

export type RequirementStatus =
  | 'NOT_STARTED'
  | 'SPECIFIED'
  | 'IN_DEVELOPMENT'
  | 'IMPLEMENTED'
  | 'TESTED'
  | 'VALIDATED'
  | 'APPROVED'
  | 'BLOCKED';

export interface TraceableRequirementSpec {
  reqCode: string;
  moduleCode: string;
  manualSection: string;
  description: string;
  phenomenonRef: string;
  equationRef: string;
  variablesList: string;
  unitSi: string;
  computationalModel: string;
  softwareComponent: string;
  dbTables: string;
  requiredTests: string;
  status: RequirementStatus;
  evidenceRef: string;
  implementedVersion: string;
}

export const MASTER_TRACEABILITY_CATALOG: TraceableRequirementSpec[] = [
  {
    reqCode: 'REQ-M01-SI-PARSER',
    moduleCode: 'M01',
    manualSection: 'Seção 1.1–1.4 / Gate 01',
    description: 'Biblioteca SI estrita, parser matemático controlado e verificação dimensional 5D [M,L,T,I,Θ].',
    phenomenonRef: 'Conservação dimensional, Lei dos Gases Ideais, Sutherland',
    equationRef: 'q=0.5*rho*V^2; F=m*a; P=I_el^2*R_el',
    variablesList: 'm, V, a, rho, q, A, F, T_q, omega, P, m_dot, cp, dT, k_th, L, I_el, R_el',
    unitSi: 'kg, m, s, N, Pa, J, W, K, rad',
    computationalModel: 'AST Recursive-Descent Safe Evaluator + 5D Dimensional Checker',
    softwareComponent: 'src/engine/math/controlledParser.ts; src/engine/modules/m01Foundation.ts',
    dbTables: 'disciplines, units, sources, phenomena, variables, equations, fluids, materials',
    requiredTests: 'tests/m01_m03.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 01 (G01-C1..C4) + 5D AST dimensional suite',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M02-PHILOSOPHY-J',
    moduleCode: 'M02',
    manualSection: 'Seção 2.1–2.3 / Gate 02',
    description: 'Seis filosofias competitivas parametrizadas por J = Σ w_i·f_i(x) - penalidades, compatibilidade de pista e confirmação de trade-offs.',
    phenomenonRef: 'Relações diretas, indiretas, condicionais, conflitantes e sinérgicas',
    equationRef: 'J = sum(w_i * f_i(x)) - constraintPenalty',
    variablesList: 'CL, CD, L/D, platformStability, mechanicalGrip, thermalMarginK',
    unitSi: '-, K',
    computationalModel: 'Normalized Multi-Objective Track Utility Evaluator',
    softwareComponent: 'src/engine/modules/m02Philosophy.ts',
    dbTables: 'vehicle_philosophies, philosophy_weights, track_characteristics, philosophy_track_fits',
    requiredTests: 'tests/m01_m03.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 02 (G02-C1..C4) + Explicit tradeoff acknowledgment check',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M03-PACKAGING-3D',
    moduleCode: 'M03',
    manualSection: 'Seção 3.1–3.4 / Gate 03',
    description: 'Packaging 3D no referencial SAE/ISO com CG composto, inércia de yaw Iz (Steiner), colisão AABB e envelope FIA versionado.',
    phenomenonRef: 'Equilíbrio estático por momentos, Eixos Paralelos (Steiner), Transferência 1ª ordem',
    equationRef: 'xCG=Σ(mi*xi)/Σmi; Iz=Σ(mi*((xi-xCG)^2+(yi-yCG)^2)+Izz,i)',
    variablesList: 'wheelbaseM, frontTrackM, rearTrackM, massKg, xCgM, yCgM, zCgM, yawInertiaIzKgM2',
    unitSi: 'm, kg, kg*m^2, N',
    computationalModel: '3D Subsystem Packaging & AABB Interference Kernel',
    softwareComponent: 'src/engine/modules/m03Packaging.ts; src/components/engineering/Packaging3DViewport.tsx',
    dbTables: 'regulation_editions, regulation_limits, vehicle_architectures, component_packages, hardpoints, interference_checks',
    requiredTests: 'tests/m01_m03.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 03 (G03-C1..C5) + Three.js 3D Packaging Viewport',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M04-AERO-MAP',
    moduleCode: 'M04',
    manualSection: 'Seção 4.1–4.4 / Gate 04',
    description: '8 fenômenos aerodinâmicos, sensibilidades ∂Fz/∂h/pitch/yaw/roll, mapas multi-ponto Z/X, atuadores FIA restritos e modelo de esteira λ.',
    phenomenonRef: 'Camada limite, Separação, Efeito solo, Difusor, Vórtices, Coandă, Esteira, Arrasto induzido',
    equationRef: 'Fz=0.5*rho*V^2*CL*A; PD=D*V; Fz_follow=Fz_clean*(1-lambda)',
    variablesList: 'speedMs, frontRhM, rearRhM, pitchRad, yawRad, rollRad, clTotal, cdTotal, frontBalanceBf',
    unitSi: 'm/s, m, rad, N, N*m, W, -',
    computationalModel: 'Parametric Reduced Aero Map + Finite-Diff Sensitivities + OpenFOAM Exporter',
    softwareComponent: 'src/engine/modules/m04Aerodynamics.ts; src/engine/adapters/externalCfdFeaAdapter.ts',
    dbTables: 'aero_configurations, aero_maps',
    requiredTests: 'tests/m04_m07.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 04 (G04-C1..C5) + 48-point Z/X Aero Grid',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M05-DYNAMICS-3DOF',
    moduleCode: 'M05',
    manualSection: 'Seção 5.1–5.4 / Gate 05',
    description: 'Dinâmica veicular 3DOF com separação massa suspensa/não-suspensa, transferência geométrica vs elástica (sem duplicação), frenagem híbrida e K&C.',
    phenomenonRef: 'Equações planares 3DOF, Cinemática e Compliance, Resposta 2ª ordem ωn/ζ, Blend MGU-K/hidráulico',
    equationRef: 'm(vx_dot-r*vy)=ΣFx; Iz*r_dot=ΣMz; ΔFz=ΔFz_geom+ΔFz_elast',
    variablesList: 'dynFrontRhM, dynRearRhM, pitchRad, rollRad, yawRateRadS, wheelLoadsN, dampingRatio',
    unitSi: 'kg, m, rad, rad/s, N, Hz, s',
    computationalModel: 'Coupled Aero-Suspension Fixed-Point + 3DOF Planar Vehicle Dynamics',
    softwareComponent: 'src/engine/modules/m05VehicleDynamics.ts',
    dbTables: 'dynamics_configurations, vehicle_dynamics_runs',
    requiredTests: 'tests/m04_m07.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 05 (G05-C1..C5) + Non-duplication closure audit',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M06-TIRES-PACEJKA',
    moduleCode: 'M06',
    manualSection: 'Seção 6.1–6.3 / Gate 06',
    description: 'Magic Formula combinada (elipse de atrito), sensibilidade de carga n<1, EDO térmica 4 nós, gás ideal abs/manométrico, graining/blistering/aquaplanagem e relaxation length.',
    phenomenonRef: 'Pacejka combinada, Histerese viscoelástica, Gases ideais (Kelvin), Aquaplanagem dinâmica',
    equationRef: 'Fy=D*sin(C*atan(Bx-E*(Bx-atan(Bx)))); dFy/ds=(Fy_ss-Fy)/sigma; PV=nRT',
    variablesList: 'slipAngleRad, slipRatioKappa, fxCombinedN, fyCombinedN, fyTransientN, mzAligningNm, pressureAbsPa',
    unitSi: 'rad, -, N, N*m, K, Pa, m',
    computationalModel: 'Magic Formula + Friction Ellipse + 4-Node Thermal ODE + Ideal Gas Pressure',
    softwareComponent: 'src/engine/modules/m06Tires.ts',
    dbTables: 'tire_compounds, tire_simulation_results',
    requiredTests: 'tests/m04_m07.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 06 (G06-C1..C4) + 5-compound Pirelli catalog',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M07-STRUCTURES-CLT',
    moduleCode: 'M07',
    manualSection: 'Seção 7.1–7.3 / Gate 07',
    description: 'Teoria Clássica dos Laminados [A,B,D], Bredt-Batho em série com câmbio, 5 load cases (Tsai-Wu, delaminação, flambagem, Miner S-N, impacto), convergência de malha e deck CalculiX.',
    phenomenonRef: 'Anisotropia CFRP [A,B,D], Critério Tsai-Wu, Flambagem ortotrópica, Regra de Miner',
    equationRef: '[N,M]=[A,B;B,D][eps0,kappa]; 1/K_tot=1/K_mono+1/K_gb; D_miner=Σ(n_i/N_i)',
    variablesList: 'aMatrixNPerM, dMatrixNm, torsionalStiffnessNmPerDeg, tsaiWuIndex, bucklingFactor, fatigueDamageMiner',
    unitSi: 'N/m, N*m, N*m/deg, MPa, J',
    computationalModel: '16-Ply Symmetric CLT Solver + Jacobi Eigenvalue Buckling + CalculiX Exporter',
    softwareComponent: 'src/engine/modules/m07Structures.ts; src/engine/adapters/externalCfdFeaAdapter.ts',
    dbTables: 'materials, laminate_stacks, structural_load_cases',
    requiredTests: 'tests/m04_m07.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 07 (G07-C1..C5) + 4-level Mesh Convergence Study',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M08-POWER-UNIT',
    moduleCode: 'M08',
    manualSection: 'Seção 8.1–8.3 / Gate 08',
    description: 'ICE 1.6L V6, mapas de compressor/turbina + inércia de spool, MGU-K 350kW, Energy Store 800V com perdas I²R, rede térmica e balanço exato de energia.',
    phenomenonRef: 'Ciclo Otto real, Mapas corrigidos de turbo, Efeito Joule I²R, Conservação de energia no barramento',
    equationRef: 'P=T*omega; P_loss=I^2*R; E_final=E_init+E_rec-E_sup-E_loss',
    variablesList: 'icePowerW, mgukActualShaftW, busCurrentA, jouleLossW, balanceResidualJ, iceTempK, batteryTempK',
    unitSi: 'W, N*m, rad/s, A, V, Ohm, J, K',
    computationalModel: 'Coupled Thermal-Electrical-Mechanical Power Unit Model',
    softwareComponent: 'src/engine/modules/m08PowerUnit.ts',
    dbTables: 'power_unit_configs, power_unit_simulations',
    requiredTests: 'tests/m08_m09.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 08 (G08-C1..C5) + Zero-residual energy conservation check',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M09-TRANSMISSION',
    moduleCode: 'M09',
    manualSection: 'Seção 9.1–9.3 / Gate 09',
    description: '8 marchas discretas Z2/Z1, eficiência e força tangencial Ft=2T/dp, diferencial LSD conservativo (TL+TR=T_eixo), embreagem Tcap=nμFNRm, semieixo vazado τ=Tr/J e fadiga.',
    phenomenonRef: 'Cinemática de engrenagens, Conservação no diferencial, Torção polar, Fadiga de Basquin',
    equationRef: 'i=Z2/Z1; T_out=T_in*i*eta; Ft=2*T/dp; tau=T*r/J; Tcap=n*mu*FN*Rm',
    variablesList: 'overallRatio, outputAxleTorqueNm, wheelForceTractionLimitedN, shaftSafetyFactor, clutchSlipPowerW',
    unitSi: 'N*m, rad/s, W, N, Pa, m^4, K',
    computationalModel: 'Discrete 8-Speed Gearbox + Conservative LSD + Driveshaft Torsion Solver',
    softwareComponent: 'src/engine/modules/m09Transmission.ts',
    dbTables: 'transmission_configs, transmission_simulations',
    requiredTests: 'tests/m08_m09.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 09 (G09-C1..C5) + Torque conservation & tire traction clamp checks',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M10-MULTIDISCIPLINARY',
    moduleCode: 'M10',
    manualSection: 'Seção 10.1–10.4 / Gate 10',
    description: '5 contratos explícitos de interface, fidelidades L0–L3, acoplamento fraco/forte com resíduo honesto, auditoria de conservação, DOE ∂y/∂p e fronteira de Pareto não-dominada.',
    phenomenonRef: 'Ponto fixo amortecido M04↔M05↔M06, Jacobiano finito DOE, Dominância de Pareto',
    equationRef: 'max(|h_k+1 - h_k|) <= tol; J_ij = dy_i / dp_j',
    variablesList: 'fidelityLevel, couplingMode, converged, finalResidualM, sensitivityStudy, paretoFrontier',
    unitSi: 'm, N, J, N*m, s',
    computationalModel: 'Damped Fixed-Point MDO Orchestrator + Finite-Diff DOE + Non-Dominated Pareto Filter',
    softwareComponent: 'src/engine/modules/m10Multidisciplinary.ts',
    dbTables: 'simulation_campaigns',
    requiredTests: 'tests/m10_m12.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 10 (G10-C1..C5) + Honest non-convergence flag in weak mode / tight tol',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M11-RACE-SIMULATION',
    moduleCode: 'M11',
    manualSection: 'Seção 11.1–11.4 / Gate 11',
    description: 'Simulação segmentada nos 6 circuitos, estado com timestamp, massa variável m(t), balanço combustível/ERS, esteira λ em tráfego, clima/lâmina d’água, VSC/SC e E[T]=Σ P_i·T_i.',
    phenomenonRef: 'Dinâmica longitudinal por segmento, Evolução de pista/água, Ar sujo acoplado, Valor esperado de estratégia',
    equationRef: 'm(t)=m_dry+m_fuel(t); E[T]=sum(P_i*T_i); Fz_follow=Fz_clean*(1-lambda)',
    variablesList: 'totalRaceTimeS, expectedTimeWithUncertaintyS, fuelConsumedKg, energySummary, waterFilmMm',
    unitSi: 's, m, m/s, kg, J, mm, K',
    computationalModel: 'Multi-Fidelity Segmented Race Integrator (Strategic / Dynamic / Advanced)',
    softwareComponent: 'src/engine/modules/m11RaceSimulation.ts',
    dbTables: 'circuit_segments, race_simulation_runs',
    requiredTests: 'tests/m10_m12.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 11 (G11-C1..C5) + 6-circuit segment catalog & E[T] check',
    implementedVersion: '1.0.0',
  },
  {
    reqCode: 'REQ-M12-CALIBRATION-UQ',
    moduleCode: 'M12',
    manualSection: 'Seção 12.1–12.6 / Gate 12',
    description: 'Pré-verificação M01/M08/M10, análise de identificabilidade (J^T·J e colinearidade), split cronológico sem vazamento, Levenberg-Marquardt/Nelder-Mead, Monte Carlo UQ (P05/P50/P95) e ciclo de vida.',
    phenomenonRef: 'Decomposição espectral J^T·J, Mínimos Quadrados Amortecidos (LM), Propagação de incerteza Monte Carlo',
    equationRef: '(J^T*J + lambda*I)*dp = -J^T*r; kappa = lambda_max / lambda_min',
    variablesList: 'identifiabilityRank, conditionNumber, valRmse, valRSquared, uqP05, uqP50, uqP95',
    unitSi: 'N, s, -',
    computationalModel: 'LM & Nelder-Mead Calibrator + Spectral Identifiability + Seeded Monte Carlo UQ',
    softwareComponent: 'src/engine/modules/m12Calibration.ts; src/engine/math/solvers.ts',
    dbTables: 'calibration_campaigns, model_versions, requirement_traceability',
    requiredTests: 'tests/m10_m12.test.ts; tests/integration_gates.test.ts',
    status: 'VALIDATED',
    evidenceRef: 'Gate 12 (G12-C1..C5) + LM/NM + UQ P05/P50/P95 tests',
    implementedVersion: '1.0.0',
  },
];

export interface FullSystemAuditReport {
  edition: RegulationEditionSpec;
  gates: GateResult[];
  allGatesPassed: boolean;
  passedGatesCount: number;
  traceability: TraceableRequirementSpec[];
  snapshotOutputs: {
    m02: ReturnType<typeof evaluatePhilosophyForTrack>;
    m03: ReturnType<typeof buildPackagingArchitecture>;
    m04Corner: ReturnType<typeof evaluateAerodynamics>;
    m05: ReturnType<typeof evaluateVehicleDynamics>;
    m06: ReturnType<typeof evaluateTirePhysics>;
    m07: ReturnType<typeof evaluateStructures>;
    m08: ReturnType<typeof evaluatePowerUnit>;
    m09: ReturnType<typeof evaluateTransmission>;
    m10: ReturnType<typeof runMultidisciplinarySimulation>;
    m11: ReturnType<typeof runRaceSimulation>;
    m12: ReturnType<typeof runCalibrationPipeline>;
  };
}

export function evaluateAllGates(
  params: VehicleEngineeringParameters,
  options: {
    philosophyCode?: VehiclePhilosophyCode;
    circuitCode?: string;
    tireCompound?: TireCompoundCode;
    tradeoffsAcknowledged?: boolean;
    edition?: RegulationEditionSpec;
    ambientTempK?: number;
    airPressurePa?: number;
    calibrationSeed?: number;
  } = {}
): FullSystemAuditReport {
  const edition = options.edition ?? FIA_2026_DEFAULT_EDITION;
  const circuitCode = options.circuitCode ?? 'monza';
  const philosophyCode = options.philosophyCode ?? 'aero_efficiency';
  const tireCompound = options.tireCompound ?? 'medium';
  const ambientTempK = options.ambientTempK ?? 298.15;
  const airPressurePa = options.airPressurePa ?? 101325;
  const tradeoffsAcknowledged = options.tradeoffsAcknowledged ?? true;

  // Run M10 first to obtain self-consistent M03..M09 coupled subsystems without duplication
  const m10 = runMultidisciplinarySimulation(
    params,
    {
      fidelityLevel: 'L2',
      couplingMode: 'strong',
      convergenceTolM: 5e-5,
      maxIterations: 25,
      ambientTempK,
      airPressurePa,
      tireCompound,
      referenceTrackLapDistM: 5793,
      highSpeedShare: 0.62,
      lowSpeedShare: 0.16,
    },
    edition
  );

  const m03 = m10.subsystems.packaging;
  const m04Corner = m10.subsystems.aeroCorner;
  const m05 = m10.subsystems.dynamics;
  const m06 = m10.subsystems.tireCorner;
  const m07 = m10.subsystems.structures;
  const m08 = m10.subsystems.powerUnit;
  const m09 = m10.subsystems.transmission;

  const regViolationsCount =
    (m03.envelopeCompliant ? 0 : m03.envelopeViolations.length) +
    (m09.regulatoryCompliance.compliant ? 0 : m09.regulatoryCompliance.violations.length);

  const m02 = evaluatePhilosophyForTrack(
    philosophyCode,
    circuitCode,
    {
      aeroEfficiencyLd: m04Corner.forces.aeroEfficiencyLD,
      clTotal: m04Corner.forces.clTotal,
      cdTotal: m04Corner.forces.cdTotal,
      platformStability01: m10.vehicleMetrics.stabilityScore01,
      mechanicalGrip01: Math.min(1, m06.forcesAndMoments.fyPeakN / 10000),
      thermalMarginK: m08.thermalAndLubrication.thermalMarginK,
    },
    regViolationsCount,
    tradeoffsAcknowledged
  );

  const m11 = runRaceSimulation(
    params,
    {
      circuitCode,
      fidelityMode: 'dynamic',
      weather: 'dry_clear',
      initialFuelKg: 78,
      stints: [
        { compound: 'medium', lapsCount: 22 },
        { compound: 'hard', lapsCount: 31 },
      ],
      trafficFollowGapS: 1.1,
      pitStopDurationS: 22.0,
      seed: 2026,
    },
    edition
  );

  const m12 = runCalibrationPipeline(
    params,
    {
      method: 'levenberg_marquardt',
      seed: options.calibrationSeed ?? 202601,
      monteCarloSamples: 150,
      regularizationLambda: 0.05,
      requestedLifecycleStage: 'Approved',
    },
    edition
  );

  const gates: GateResult[] = [
    evaluateGate01(),
    evaluateGate02(m02),
    evaluateGate03(m03),
    evaluateGate04(m04Corner),
    evaluateGate05(m05),
    evaluateGate06(m06),
    evaluateGate07(m07),
    evaluateGate08(m08),
    evaluateGate09(m09),
    evaluateGate10(m10),
    evaluateGate11(m11),
    evaluateGate12(m12),
  ];

  const gateMap = Object.fromEntries(gates.map((g) => [g.moduleCode, g.passed]));
  const traceability: TraceableRequirementSpec[] = MASTER_TRACEABILITY_CATALOG.map((req) => ({
    ...req,
    status: gateMap[req.moduleCode] ? 'APPROVED' : 'IMPLEMENTED',
  }));

  return {
    edition,
    gates,
    allGatesPassed: gates.every((g) => g.passed),
    passedGatesCount: gates.filter((g) => g.passed).length,
    traceability,
    snapshotOutputs: {
      m02,
      m03,
      m04Corner,
      m05,
      m06,
      m07,
      m08,
      m09,
      m10,
      m11,
      m12,
    },
  };
}
