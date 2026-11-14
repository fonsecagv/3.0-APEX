import type {
  RegulatoryCheckResult,
  VehicleEngineeringParameters,
  VehiclePhysicsOutputs,
} from '../types/physics.ts';
import {
  FIA_2026_DEFAULT_EDITION,
  type RegulationEditionSpec,
} from './modules/m03Packaging.ts';

// Derived from active RegulationEditionSpec (never eternal unversioned constants)
export const FIA_2026_LIMITS = {
  editionId: FIA_2026_DEFAULT_EDITION.editionId,
  maxWheelbaseMm: Math.round(FIA_2026_DEFAULT_EDITION.maxWheelbaseM * 1000),
  minWheelbaseMm: Math.round(FIA_2026_DEFAULT_EDITION.minWheelbaseM * 1000),
  maxWidthMm: Math.round(FIA_2026_DEFAULT_EDITION.maxWidthM * 1000),
  minMassKg: FIA_2026_DEFAULT_EDITION.minMassKg,
  maxMgukPowerKw: Math.round(FIA_2026_DEFAULT_EDITION.maxMgukPowerW / 1000),
  maxIceCompressionRatio: FIA_2026_DEFAULT_EDITION.maxIceCompressionRatio,
  maxFloorUsefulWidthMm: Math.round(FIA_2026_DEFAULT_EDITION.maxFloorUsefulWidthM * 1000),
  minFrontRideHeightMm: Math.round(FIA_2026_DEFAULT_EDITION.minFrontRideHeightM * 1000),
  minRearRideHeightMm: Math.round(FIA_2026_DEFAULT_EDITION.minRearRideHeightM * 1000),
  maxDiffuserAngleDeg: Number(((FIA_2026_DEFAULT_EDITION.maxDiffuserAngleRad * 180) / Math.PI).toFixed(1)),
  maxDiffuserLengthMm: Math.round(FIA_2026_DEFAULT_EDITION.maxDiffuserLengthM * 1000),
  maxWingSpanMm: Math.round(FIA_2026_DEFAULT_EDITION.maxWingSpanM * 1000),
  minCornerFrontFlapDeg: 16,
  maxCornerFrontFlapDeg: 45,
  minStraightFlapDeg: 2,
  maxStraightFlapDeg: 18,
};

export function validateFia2026Compliance(
  params: VehicleEngineeringParameters,
  physics?: Pick<VehiclePhysicsOutputs, 'totalMassKg' | 'effectiveMgukPowerKw'>,
  edition: RegulationEditionSpec = FIA_2026_DEFAULT_EDITION
): RegulatoryCheckResult {
  const violations: RegulatoryCheckResult['violations'] = [];
  const warnings: string[] = [];

  const maxWheelbaseMm = Math.round(edition.maxWheelbaseM * 1000);
  const minWheelbaseMm = Math.round(edition.minWheelbaseM * 1000);
  const maxWidthMm = Math.round(edition.maxWidthM * 1000);
  const maxFloorUsefulWidthMm = Math.round(edition.maxFloorUsefulWidthM * 1000);
  const minFrontRhMm = Math.round(edition.minFrontRideHeightM * 1000);
  const maxDiffuserDeg = Number(((edition.maxDiffuserAngleRad * 180) / Math.PI).toFixed(1));
  const maxWingSpanMm = Math.round(edition.maxWingSpanM * 1000);
  const maxMgukKw = Math.round(edition.maxMgukPowerW / 1000);

  if (params.wheelbaseMm > maxWheelbaseMm || params.wheelbaseMm < minWheelbaseMm) {
    violations.push({
      article: `${edition.editionId} Sec. C Art. 3.4.1`,
      parameter: 'Distância Entre-Eixos',
      measuredValue: `${params.wheelbaseMm} mm`,
      limitValue: `${minWheelbaseMm}–${maxWheelbaseMm} mm`,
      severity: 'critical',
    });
  }

  if (params.trackWidthMm > maxWidthMm || params.wingSpanMm > maxWingSpanMm) {
    violations.push({
      article: `${edition.editionId} Sec. C Art. 3.2.1`,
      parameter: 'Largura Máxima do Veículo / Asa',
      measuredValue: `${Math.max(params.trackWidthMm, params.wingSpanMm)} mm`,
      limitValue: `≤ ${maxWidthMm} mm`,
      severity: 'critical',
    });
  }

  if (params.floorUsefulWidthMm > maxFloorUsefulWidthMm) {
    violations.push({
      article: `${edition.editionId} Sec. C Art. 3.5`,
      parameter: 'Largura Útil do Assoalho Plano',
      measuredValue: `${params.floorUsefulWidthMm} mm`,
      limitValue: `≤ ${maxFloorUsefulWidthMm} mm`,
      severity: 'critical',
    });
  }

  if (params.diffuserAngleDeg > maxDiffuserDeg) {
    violations.push({
      article: `${edition.editionId} Sec. C Art. 3.5.4`,
      parameter: 'Ângulo de Expansão do Difusor',
      measuredValue: `${params.diffuserAngleDeg.toFixed(1)}°`,
      limitValue: `≤ ${maxDiffuserDeg}°`,
      severity: 'critical',
    });
  }

  if (params.frontRideHeightMm < minFrontRhMm) {
    violations.push({
      article: `${edition.editionId} Art. 3.15.8 (Skid Block)`,
      parameter: 'Altura de Rodagem Dianteira Estática',
      measuredValue: `${params.frontRideHeightMm} mm`,
      limitValue: `≥ ${minFrontRhMm} mm`,
      severity: 'critical',
    });
  }

  if (params.mgukMaxKw > maxMgukKw) {
    violations.push({
      article: `${edition.editionId} PU Art. 5.2`,
      parameter: 'Potência Máxima MGU-K',
      measuredValue: `${params.mgukMaxKw} kW`,
      limitValue: `≤ ${maxMgukKw} kW`,
      severity: 'critical',
    });
  }

  if (params.iceCompressionRatio > edition.maxIceCompressionRatio) {
    violations.push({
      article: `${edition.editionId} PU Art. 5.1.6`,
      parameter: 'Taxa de Compressão Geométrica ICE',
      measuredValue: `${params.iceCompressionRatio.toFixed(1)}:1`,
      limitValue: `≤ ${edition.maxIceCompressionRatio.toFixed(1)}:1`,
      severity: 'critical',
    });
  }

  // Coordinated Active Aero check: Straight Mode must reduce flap incidence vs Corner Mode on both wings
  if (
    params.frontWingFlapStraightDeg >= params.frontWingFlapCornerDeg - 4 ||
    params.rearWingFlapStraightDeg >= params.rearWingFlapCornerDeg - 6
  ) {
    violations.push({
      article: `${edition.editionId} Aero Ativa Art. 3.10`,
      parameter: 'Transição Coordenada Modo Z → Modo X',
      measuredValue: `ΔF=${params.frontWingFlapCornerDeg - params.frontWingFlapStraightDeg}° / ΔR=${params.rearWingFlapCornerDeg - params.rearWingFlapStraightDeg}°`,
      limitValue: 'Atuação dianteira e traseira coordenada obrigatória',
      severity: 'warning',
    });
  }

  if (physics && physics.totalMassKg < edition.minMassKg) {
    warnings.push(
      `Massa estrutural calculada (${physics.totalMassKg.toFixed(1)} kg) abaixo do mínimo FIA (${edition.minMassKg} kg): necessário lastro de ${(edition.minMassKg - physics.totalMassKg).toFixed(1)} kg no assoalho para conformidade e ajuste de CG.`
    );
  }

  if (params.frontRideHeightMm <= minFrontRhMm + 3 || params.rearRideHeightMm <= 40) {
    warnings.push(
      'Altura de rodagem próxima do limite mínimo: risco elevado de desgaste excessivo da prancha (skid block) em pistas onduladas.'
    );
  }

  return {
    compliant: violations.filter((v) => v.severity === 'critical').length === 0,
    violations,
    warnings,
  };
}
