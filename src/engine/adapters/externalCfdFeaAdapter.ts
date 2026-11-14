// External CFD (OpenFOAM) & FEA (CalculiX) Adapter Contract
// Rule: Never simulate that OpenFOAM or CalculiX ran if real integration/binaries are not present.

import { COMPOSITE_MATERIALS } from '../../data/physicsDatabase.ts';
import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import { computeAirState } from '../modules/m01Foundation.ts';

export interface ExternalSolverCapability {
  tool: 'openfoam' | 'calculix' | 'python_scipy';
  status: 'AVAILABLE' | 'NOT_INSTALLED_ON_HOST';
  note: string;
}

export interface ExternalSolverStatus {
  toolName: string;
  status: 'AVAILABLE' | 'NOT_INSTALLED_ON_HOST';
  checkedCommand: string;
  canExportInputDeck: boolean;
  honestDisclaimer: string;
}

export interface OpenFoamCaseManifest {
  solver: 'simpleFoam' | 'pimpleFoam';
  turbulenceModel: 'kOmegaSST';
  airDensityKgM3: number;
  kinematicViscosityM2S: number;
  inletVelocityMs: number;
  frontRideHeightM: number;
  rearRideHeightM: number;
  diffuserAngleRad: number;
  yawRad: number;
  controlDictText: string;
  transportPropertiesText: string;
}

export interface CalculixInpManifest {
  analysisType: '*STATIC' | '*BUCKLE' | '*FREQUENCY';
  fiberName: string;
  e1Pa: number;
  e2Pa: number;
  g12Pa: number;
  nu12: number;
  densityKgM3: number;
  plyThicknessM: number;
  tensileStrengthMpa?: number;
  inpDeckText: string;
}

export function buildOpenFoamCaseManifest(params: {
  airDensityKgM3: number;
  dynamicViscosityPaS: number;
  speedMs: number;
  frontRideHeightM: number;
  rearRideHeightM: number;
  diffuserAngleRad: number;
  yawRad: number;
}): OpenFoamCaseManifest {
  const nu = params.dynamicViscosityPaS / Math.max(0.1, params.airDensityKgM3);
  const vx = params.speedMs * Math.cos(params.yawRad);
  const vy = params.speedMs * Math.sin(params.yawRad);

  const controlDictText = `/* OpenFOAM Case Export - APEX F1 2026 M04/M10 */
FoamFile { version 2.0; format ascii; class dictionary; object controlDict; }
application     simpleFoam;
startFrom       startTime;
startTime       0;
stopAt          endTime;
endTime         1500;
deltaT          1;
writeControl    timeStep;
writeInterval   250;
// Ride heights: h_f=${params.frontRideHeightM.toFixed(4)}m, h_r=${params.rearRideHeightM.toFixed(4)}m, diffuser=${params.diffuserAngleRad.toFixed(4)}rad
// Inlet U = (${vx.toFixed(3)} ${vy.toFixed(3)} 0) m/s`;

  const transportPropertiesText = `FoamFile { version 2.0; format ascii; class dictionary; object transportProperties; }
transportModel  Newtonian;
nu              [0 2 -1 0 0 0 0] ${nu.toExponential(6)};
rho             [1 -3 0 0 0 0 0] ${params.airDensityKgM3.toFixed(5)};`;

  return {
    solver: 'simpleFoam',
    turbulenceModel: 'kOmegaSST',
    airDensityKgM3: params.airDensityKgM3,
    kinematicViscosityM2S: nu,
    inletVelocityMs: params.speedMs,
    frontRideHeightM: params.frontRideHeightM,
    rearRideHeightM: params.rearRideHeightM,
    diffuserAngleRad: params.diffuserAngleRad,
    yawRad: params.yawRad,
    controlDictText,
    transportPropertiesText,
  };
}

export function buildCalculixInpManifest(params: {
  fiberName: string;
  e1Gpa: number;
  e2Gpa: number;
  g12Gpa: number;
  nu12: number;
  densityKgM3: number;
  totalThicknessM: number;
  axialLoadN: number;
  tensileStrengthMpa?: number;
}): CalculixInpManifest {
  const e1Pa = params.e1Gpa * 1e9;
  const e2Pa = params.e2Gpa * 1e9;
  const g12Pa = params.g12Gpa * 1e9;

  const inpDeckText = `** CalculiX FEA Input Deck Export - APEX F1 2026 M07
** Composite Tensile Allowable = ${(params.tensileStrengthMpa ?? 4800).toFixed(1)} MPa | Total Laminate Thickness = ${(params.totalThicknessM * 1000).toFixed(2)} mm
*MATERIAL, NAME=${params.fiberName.replace(/\s+/g, '_')}
*ELASTIC, TYPE=ENGINEERING CONSTANTS
${e1Pa.toExponential(4)}, ${e2Pa.toExponential(4)}, ${e2Pa.toExponential(4)}, ${params.nu12}, ${params.nu12}, ${params.nu12}, ${g12Pa.toExponential(4)}, ${g12Pa.toExponential(4)},
${g12Pa.toExponential(4)}
*DENSITY
${params.densityKgM3.toFixed(2)}
*SHELL SECTION, ELSET=MONOCOQUE_LAMINATE, MATERIAL=${params.fiberName.replace(/\s+/g, '_')}, COMPOSITE
${(params.totalThicknessM / 4).toFixed(6)}, , 0.0, ${params.fiberName.replace(/\s+/g, '_')}
${(params.totalThicknessM / 4).toFixed(6)}, , 45.0, ${params.fiberName.replace(/\s+/g, '_')}
${(params.totalThicknessM / 4).toFixed(6)}, , -45.0, ${params.fiberName.replace(/\s+/g, '_')}
${(params.totalThicknessM / 4).toFixed(6)}, , 90.0, ${params.fiberName.replace(/\s+/g, '_')}
*STEP
*STATIC
*CLOAD
LOAD_NODES, 1, ${params.axialLoadN.toFixed(2)}
*END STEP`;

  return {
    analysisType: '*STATIC',
    fiberName: params.fiberName,
    e1Pa,
    e2Pa,
    g12Pa,
    nu12: params.nu12,
    densityKgM3: params.densityKgM3,
    plyThicknessM: params.totalThicknessM,
    tensileStrengthMpa: params.tensileStrengthMpa,
    inpDeckText,
  };
}

export function exportOpenFoamDeck(
  params: VehicleEngineeringParameters,
  speedMs: number
): OpenFoamCaseManifest {
  const air = computeAirState(101325, 298.15);
  return buildOpenFoamCaseManifest({
    airDensityKgM3: air.densityKgM3,
    dynamicViscosityPaS: air.dynamicViscosityPaS,
    speedMs,
    frontRideHeightM: params.frontRideHeightMm / 1000,
    rearRideHeightM: params.rearRideHeightMm / 1000,
    diffuserAngleRad: (params.diffuserAngleDeg * Math.PI) / 180,
    yawRad: 0.03,
  });
}

export function exportCalculixInputDeck(
  params: VehicleEngineeringParameters,
  tensileStrengthMpa: number
): CalculixInpManifest {
  const fiber = COMPOSITE_MATERIALS[params.compositeFiber];
  const vf = 0.58;
  const eResinGpa = 3.6;
  const e1Gpa = fiber.fiberModulusGpa * vf + eResinGpa * (1 - vf);
  const totalThicknessM = (params.laminateThicknessMm / 1000) * (1 + (params.localReinforcementPct / 100) * 0.25);

  return buildCalculixInpManifest({
    fiberName: fiber.name,
    e1Gpa,
    e2Gpa: 9.8,
    g12Gpa: 5.2,
    nu12: 0.3,
    densityKgM3: 1580,
    totalThicknessM,
    axialLoadN: 45000,
    tensileStrengthMpa,
  });
}
