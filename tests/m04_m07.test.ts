import { describe, expect, it } from 'vitest';
import { FIA_2026_DEFAULT_EDITION, buildPackagingArchitecture } from '../src/engine/modules/m03Packaging.ts';
import { evaluateAerodynamics, evaluateGate04 } from '../src/engine/modules/m04Aerodynamics.ts';
import { evaluateGate05, evaluateVehicleDynamics } from '../src/engine/modules/m05VehicleDynamics.ts';
import { evaluateGate06, evaluateTirePhysics } from '../src/engine/modules/m06Tires.ts';
import { evaluateGate07, evaluateStructures } from '../src/engine/modules/m07Structures.ts';
import { DEFAULT_VEHICLE_PARAMS } from '../src/engine/physicsEngine.ts';

describe('M04 — Aerodinâmica Modo Z/X, Sensibilidades e Esteira', () => {
  it('Mode X reduz arrasto vs Mode Z e bloqueia ativação em pista molhada ou fora de zona', () => {
    const zAero = evaluateAerodynamics(DEFAULT_VEHICLE_PARAMS, {
      speedMs: 70,
      frontRhM: 0.024,
      rearRhM: 0.048,
      pitchRad: 0,
      yawRad: 0.02,
      rollRad: 0,
      mode: 'MODE_Z',
      ambientTempK: 298.15,
      airPressurePa: 101325,
      gearboxLayout: DEFAULT_VEHICLE_PARAMS.gearboxLayout,
    });
    const xAero = evaluateAerodynamics(DEFAULT_VEHICLE_PARAMS, {
      speedMs: 70,
      frontRhM: 0.024,
      rearRhM: 0.048,
      pitchRad: 0,
      yawRad: 0,
      rollRad: 0,
      mode: 'MODE_X',
      ambientTempK: 298.15,
      airPressurePa: 101325,
      gearboxLayout: DEFAULT_VEHICLE_PARAMS.gearboxLayout,
      inAeroActivationZone: true,
      wetSurface: false,
    });
    const xBlockedWet = evaluateAerodynamics(DEFAULT_VEHICLE_PARAMS, {
      speedMs: 70,
      frontRhM: 0.024,
      rearRhM: 0.048,
      pitchRad: 0,
      yawRad: 0,
      rollRad: 0,
      mode: 'MODE_X',
      ambientTempK: 298.15,
      airPressurePa: 101325,
      gearboxLayout: DEFAULT_VEHICLE_PARAMS.gearboxLayout,
      inAeroActivationZone: true,
      wetSurface: true,
    });

    expect(xAero.forces.dragTotalN).toBeLessThan(zAero.forces.dragTotalN * 0.85);
    expect(xBlockedWet.actuator.mode).toBe('MODE_Z');
    expect(zAero.mapGrid.length).toBeGreaterThanOrEqual(48);
    expect(evaluateGate04(zAero).passed).toBe(true);
  });

  it('modela redução de downforce e aumento de perdas na esteira (dirty air λ > 0)', () => {
    const clean = evaluateAerodynamics(DEFAULT_VEHICLE_PARAMS, {
      speedMs: 70,
      frontRhM: 0.024,
      rearRhM: 0.048,
      pitchRad: 0,
      yawRad: 0.02,
      rollRad: 0,
      mode: 'MODE_Z',
      ambientTempK: 298.15,
      airPressurePa: 101325,
      gearboxLayout: DEFAULT_VEHICLE_PARAMS.gearboxLayout,
      followDistanceM: 80,
    });
    const wake = evaluateAerodynamics(DEFAULT_VEHICLE_PARAMS, {
      speedMs: 70,
      frontRhM: 0.024,
      rearRhM: 0.048,
      pitchRad: 0,
      yawRad: 0.02,
      rollRad: 0,
      mode: 'MODE_Z',
      ambientTempK: 298.15,
      airPressurePa: 101325,
      gearboxLayout: DEFAULT_VEHICLE_PARAMS.gearboxLayout,
      followDistanceM: 12,
    });
    expect(wake.wakeEffect.lambdaWakeLoss).toBeGreaterThan(0.15);
    expect(wake.wakeEffect.fzFollowN).toBeLessThan(clean.wakeEffect.fzCleanN);
  });
});

describe('M05 — Dinâmica Veicular 3DOF e Não-Duplicação de Transferência de Carga', () => {
  it('converge acoplamento aero↔suspensão e fecha soma exata das 4 cargas verticais sem duplicar ΔFz', () => {
    const pkg = buildPackagingArchitecture(DEFAULT_VEHICLE_PARAMS, FIA_2026_DEFAULT_EDITION);
    const dyn = evaluateVehicleDynamics(DEFAULT_VEHICLE_PARAMS, pkg, {
      speedMs: 69.44,
      steerAngleRad: 0.06,
      longAccelMs2: -15.0,
      latAccelMs2: 32.0,
      brakePressureRatio: 0.4,
      brakeBiasFront: 0.56,
      brakeDiscTempK: 920,
      mgukRegenTorqueNm: -180,
      aeroMode: 'MODE_Z',
      ambientTempK: 298.15,
      airPressurePa: 101325,
      tireMaxFxFrontN: 10000,
      tireMaxFxRearN: 11200,
      tireMaxFyFrontN: 13500,
      tireMaxFyRearN: 15200,
    });
    expect(dyn.platformState.aeroCouplingConverged).toBe(true);
    expect(dyn.wheelLoadsN.closureErrorN).toBeLessThan(2.0);
    expect(evaluateGate05(dyn).passed).toBe(true);
  });
});

describe('M06 — Pneus Pacejka, Elipse de Atrito, Gás Ideal Kelvin e Aquaplanagem', () => {
  it('obedece elipse de atrito (Fx/Fxmax)² + (Fy/Fymax)² <= 1 e lei dos gases ideais em Kelvin', () => {
    const tireCold = evaluateTirePhysics({
      compoundCode: 'soft',
      verticalLoadN: 5200,
      slipAngleRad: 0.12,
      wheelAngularVelRadS: 205, // combined slip
      wheelVxMs: 70,
      effectiveRadiusM: 0.36,
      camberRad: -0.04,
      tempInnerK: 340,
      tempCenterK: 342,
      tempOuterK: 344,
      tempCarcassK: 335,
      ambientTempK: 295,
      atmosphericPressurePa: 101325,
      coldGasMolesN: 4.55,
      internalGasVolumeM3: 0.044,
      surfaceGripFactor: 1.0,
      waterFilmMm: 0,
      surfaceMacroTextureMm: 1.0,
      dtS: 0.05,
      currentWearRatio: 0.04,
    });
    const tireHot = evaluateTirePhysics({
      compoundCode: 'soft',
      verticalLoadN: 5200,
      slipAngleRad: 0.12,
      wheelAngularVelRadS: 205,
      wheelVxMs: 70,
      effectiveRadiusM: 0.36,
      camberRad: -0.04,
      tempInnerK: 390,
      tempCenterK: 392,
      tempOuterK: 394,
      tempCarcassK: 385,
      ambientTempK: 295,
      atmosphericPressurePa: 101325,
      coldGasMolesN: 4.55,
      internalGasVolumeM3: 0.044,
      surfaceGripFactor: 1.0,
      waterFilmMm: 0,
      surfaceMacroTextureMm: 1.0,
      dtS: 0.05,
      currentWearRatio: 0.04,
    });
    expect(tireHot.forcesAndMoments.frictionEllipseUtilization).toBeLessThanOrEqual(1.0001);
    expect(tireHot.pressureIdealGas.pressureAbsPa).toBeGreaterThan(tireCold.pressureIdealGas.pressureAbsPa);
    expect(evaluateGate06(tireHot).passed).toBe(true);
  });

  it('modela aquaplanagem e perda de aderência severa em slick sobre lâmina d’água espessa', () => {
    const slickWet = evaluateTirePhysics({
      compoundCode: 'medium',
      verticalLoadN: 4200,
      slipAngleRad: 0.10,
      wheelAngularVelRadS: 220,
      wheelVxMs: 78,
      effectiveRadiusM: 0.36,
      camberRad: -0.04,
      tempInnerK: 345,
      tempCenterK: 345,
      tempOuterK: 345,
      tempCarcassK: 340,
      ambientTempK: 290,
      atmosphericPressurePa: 101325,
      coldGasMolesN: 4.55,
      internalGasVolumeM3: 0.044,
      surfaceGripFactor: 0.85,
      waterFilmMm: 4.0,
      surfaceMacroTextureMm: 0.9,
      dtS: 0.05,
      currentWearRatio: 0.1,
    });
    expect(slickWet.degradationStates.aquaplaningRisk01).toBeGreaterThan(0.3);
    expect(slickWet.forcesAndMoments.fyPeakN).toBeLessThan(4000);
  });
});

describe('M07 — Estruturas CFRP CLT [A,B,D], Bredt-Batho em Série e Convergência', () => {
  it('laminado simétrico mantém [B] ~ 0 e converge malha < 0.5% no refino', () => {
    const st = evaluateStructures(
      DEFAULT_VEHICLE_PARAMS,
      {
        peakDownforceN: 20000,
        peakCornerLatAccelMs2: 4.2 * 9.80665,
        peakBrakeAccelMs2: 4.8 * 9.80665,
        totalMassKg: 768,
        shaftPowerW: 760000,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(Number(st.cltMatrices.symmetryErrorNorm)).toBeLessThan(1e-6);
    expect(st.meshConvergence.converged).toBe(true);
    expect(st.failureSummary.worstTsaiWuIndex).toBeLessThan(1.0);
    expect(st.failureSummary.minBucklingFactor).toBeGreaterThanOrEqual(1.0);
    expect(evaluateGate07(st).passed).toBe(true);
  });
});
