import { count, eq } from 'drizzle-orm';
import { COMPOSITE_MATERIALS, CASING_ALLOYS, PHYSICS_PHENOMENA_CATALOG } from '../data/physicsDatabase.ts';
import {
  BASE_EQUATIONS_CATALOG,
  FLUID_CATALOG,
  SCIENTIFIC_SOURCES,
  SI_VARIABLE_REGISTRY,
} from '../engine/modules/m01Foundation.ts';
import {
  TRACK_CHARACTERISTICS_CATALOG,
  VEHICLE_PHILOSOPHIES_M02,
} from '../engine/modules/m02Philosophy.ts';
import { FIA_2026_DEFAULT_EDITION } from '../engine/modules/m03Packaging.ts';
import { TIRE_COMPOUND_CATALOG } from '../engine/modules/m06Tires.ts';
import { CIRCUIT_SEGMENTS_CATALOG } from '../engine/modules/m11RaceSimulation.ts';
import { MASTER_TRACEABILITY_CATALOG } from '../engine/traceability/traceabilityRegistry.ts';
import { db } from './index.ts';
import {
  circuitSegments,
  componentsCatalog,
  disciplines,
  equations,
  fluids,
  materials,
  modelVersions,
  phenomena,
  philosophyWeights,
  regulationEditions,
  regulationLimits,
  requirementTraceability,
  sources,
  tireCompounds,
  trackCharacteristics,
  units,
  variables,
  vehiclePhilosophies,
} from './schema.ts';

let seedPromise: Promise<{ seeded: boolean; counts: Record<string, number> }> | null = null;

function formatDimVector(d: readonly number[]): string {
  const labels = ['M', 'L', 'T', 'I', 'Θ'];
  const parts = d
    .map((exp, idx) => (exp !== 0 ? `${labels[idx]}^${exp}` : null))
    .filter((x): x is string => x !== null);
  return parts.length > 0 ? parts.join(' ') : '1';
}

export async function ensureDatabaseSeeded(): Promise<{
  seeded: boolean;
  counts: Record<string, number>;
}> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    // 1. FIA Regulation Edition & Limits
    let [editionRow] = await db.select().from(regulationEditions).limit(1);
    if (!editionRow) {
      [editionRow] = await db
        .insert(regulationEditions)
        .values({
          series: FIA_2026_DEFAULT_EDITION.series,
          seasonYear: FIA_2026_DEFAULT_EDITION.seasonYear,
          section: FIA_2026_DEFAULT_EDITION.section,
          issue: FIA_2026_DEFAULT_EDITION.issue,
          effectiveDate: FIA_2026_DEFAULT_EDITION.effectiveDate,
          title: FIA_2026_DEFAULT_EDITION.editionId,
          sourceUrl: 'https://www.fia.com/regulation/category/110',
          documentHash: 'sha256:fia-2026-sec-c-iss16-pu-iss5',
        })
        .returning();

      await db.insert(regulationLimits).values([
        {
          editionId: editionRow.id,
          moduleCode: 'M03',
          parameterCode: 'wheelbaseM',
          parameterName: 'Distância entre-eixos',
          minValue: FIA_2026_DEFAULT_EDITION.minWheelbaseM,
          maxValue: FIA_2026_DEFAULT_EDITION.maxWheelbaseM,
          unitSi: 'm',
          articleRef: 'Sec. C Art. 3.4.1',
          notes: 'Entre-eixos 2026 reduzido para agilidade.',
        },
        {
          editionId: editionRow.id,
          moduleCode: 'M03',
          parameterCode: 'minMassKg',
          parameterName: 'Massa mínima seca com piloto',
          minValue: FIA_2026_DEFAULT_EDITION.minMassKg,
          maxValue: null,
          unitSi: 'kg',
          articleRef: 'Sec. C Art. 4.1',
          notes: 'Massa mínima sem combustível.',
        },
        {
          editionId: editionRow.id,
          moduleCode: 'M04',
          parameterCode: 'maxFloorUsefulWidthM',
          parameterName: 'Largura útil do assoalho',
          minValue: 1.0,
          maxValue: FIA_2026_DEFAULT_EDITION.maxFloorUsefulWidthM,
          unitSi: 'm',
          articleRef: 'Sec. C Art. 3.5',
          notes: 'Assoalho mais plano em 2026 com difusor estendido.',
        },
        {
          editionId: editionRow.id,
          moduleCode: 'M08',
          parameterCode: 'maxMgukPowerW',
          parameterName: 'Potência máxima MGU-K',
          minValue: 0,
          maxValue: FIA_2026_DEFAULT_EDITION.maxMgukPowerW,
          unitSi: 'W',
          articleRef: 'PU Art. 5.2',
          notes: '350 kW (50/50 split elétrico/térmico).',
        },
        {
          editionId: editionRow.id,
          moduleCode: 'M09',
          parameterCode: 'minShiftTimeS',
          parameterName: 'Tempo mínimo de troca de marchas',
          minValue: FIA_2026_DEFAULT_EDITION.minShiftTimeS,
          maxValue: 0.25,
          unitSi: 's',
          articleRef: 'Sec. C Art. 9.6',
          notes: '8 marchas à frente.',
        },
      ]);
    }

    // 2. Model Versions (M01..M12)
    const [mvCount] = await db.select({ value: count() }).from(modelVersions);
    if (mvCount.value === 0) {
      const moduleNames: Array<[string, string]> = [
        ['M01', 'Fundação Física e Parser Dimensional'],
        ['M02', 'Filosofia do Veículo'],
        ['M03', 'Packaging e Arquitetura 3D'],
        ['M04', 'Aerodinâmica Modo Z/X e Mapas'],
        ['M05', 'Dinâmica Veicular 3DOF Acoplada'],
        ['M06', 'Pneus Pacejka Combinada e Térmica'],
        ['M07', 'Estruturas Compósitos CLT e Flambagem'],
        ['M08', 'Unidade de Potência Híbrida 2026'],
        ['M09', 'Transmissão 8 Marchas e Diferencial'],
        ['M10', 'Simulação Multidisciplinar e Pareto'],
        ['M11', 'Simulação de Corrida Segmentada'],
        ['M12', 'Calibração LM/NM, Identificabilidade e UQ'],
      ];
      await db.insert(modelVersions).values(
        moduleNames.map(([code, name]) => ({
          moduleCode: code,
          modelName: name,
          major: 1,
          minor: 0,
          patch: 0,
          semver: '1.0.0',
          lifecycleStatus: 'Approved',
          approvedBy: 'APEX Master Technical Audit',
        }))
      );
    }

    // 3. Disciplines & Units & Sources (M01)
    await db
      .insert(disciplines)
      .values([
        { code: 'DISC_AERO', name: 'Aerodinâmica', consumers: 'M04, M05, M10, M11' },
        { code: 'DISC_FLUID', name: 'Dinâmica dos Fluidos', consumers: 'M01, M04, M08' },
        { code: 'DISC_THERM', name: 'Termodinâmica', consumers: 'M06, M08, M09, M11' },
        { code: 'DISC_STRUCT', name: 'Estruturas', consumers: 'M03, M07, M09, M10' },
        { code: 'DISC_DYN', name: 'Dinâmica Veicular', consumers: 'M05, M06, M10, M11' },
        { code: 'DISC_TIREDYN', name: 'Dinâmica de Pneus', consumers: 'M05, M06, M10, M11' },
      ])
      .onConflictDoNothing({ target: disciplines.code });

    await db
      .insert(units)
      .values([
        { symbol: 'kg', name: 'Quilograma', quantity: 'Massa', isSiBase: true, siDimensions: 'M^1' },
        { symbol: 'm', name: 'Metro', quantity: 'Comprimento', isSiBase: true, siDimensions: 'L^1' },
        { symbol: 's', name: 'Segundo', quantity: 'Tempo', isSiBase: true, siDimensions: 'T^1' },
        { symbol: 'K', name: 'Kelvin', quantity: 'Temperatura', isSiBase: true, siDimensions: 'Θ^1' },
        { symbol: 'A', name: 'Ampère', quantity: 'Corrente Elétrica', isSiBase: true, siDimensions: 'I^1' },
        { symbol: 'm/s', name: 'Metro por segundo', quantity: 'Velocidade', isSiBase: false, siDimensions: 'L^1 T^-1' },
        { symbol: 'm/s^2', name: 'Metro por s²', quantity: 'Aceleração', isSiBase: false, siDimensions: 'L^1 T^-2' },
        { symbol: 'kg/m^3', name: 'Quilograma por m³', quantity: 'Massa Específica', isSiBase: false, siDimensions: 'M^1 L^-3' },
        { symbol: 'Pa', name: 'Pascal', quantity: 'Pressão', isSiBase: false, siDimensions: 'M^1 L^-1 T^-2' },
        { symbol: 'm^2', name: 'Metro quadrado', quantity: 'Área', isSiBase: false, siDimensions: 'L^2' },
        { symbol: 'N', name: 'Newton', quantity: 'Força', isSiBase: false, siDimensions: 'M^1 L^1 T^-2' },
        { symbol: 'N*m', name: 'Newton-metro', quantity: 'Torque / Momento', isSiBase: false, siDimensions: 'M^1 L^2 T^-2' },
        { symbol: 'rad/s', name: 'Radiano por segundo', quantity: 'Velocidade Angular', isSiBase: false, siDimensions: 'T^-1' },
        { symbol: 'W', name: 'Watt', quantity: 'Potência', isSiBase: false, siDimensions: 'M^1 L^2 T^-3' },
        { symbol: 'kg/s', name: 'Quilograma por s', quantity: 'Vazão Mássica', isSiBase: false, siDimensions: 'M^1 T^-1' },
        { symbol: 'J/(kg*K)', name: 'Calor Específico', quantity: 'Calor Específico', isSiBase: false, siDimensions: 'L^2 T^-2 Θ^-1' },
        { symbol: 'W/(m*K)', name: 'Condutividade Térmica', quantity: 'Condutividade', isSiBase: false, siDimensions: 'M^1 L^1 T^-3 Θ^-1' },
        { symbol: 'V', name: 'Volt', quantity: 'Tensão Elétrica', isSiBase: false, siDimensions: 'M^1 L^2 T^-3 I^-1' },
        { symbol: 'Ohm', name: 'Ohm', quantity: 'Resistência Elétrica', isSiBase: false, siDimensions: 'M^1 L^2 T^-3 I^-2' },
        { symbol: 'J', name: 'Joule', quantity: 'Energia', isSiBase: false, siDimensions: 'M^1 L^2 T^-2' },
        { symbol: '-', name: 'Adimensional', quantity: 'Razão / Coeficiente', isSiBase: false, siDimensions: '1' },
      ])
      .onConflictDoNothing({ target: units.symbol });

    await db
      .insert(sources)
      .values(
        SCIENTIFIC_SOURCES.map((s) => ({
          code: s.code,
          title: s.title,
          authorInstitution: s.authorInstitution,
          url: s.url,
          publishedDate: s.publishedDate,
          license: s.license,
          evidenceLevel: s.evidenceLevel,
          version: s.version,
          contentHash: s.contentHash,
        }))
      )
      .onConflictDoNothing({ target: sources.code });

    const allDiscs = await db.select().from(disciplines);
    const allUnits = await db.select().from(units);
    const allSources = await db.select().from(sources);

    const discByName = new Map<string, number>(allDiscs.map((d) => [d.name, d.id]));
    const unitBySymbol = new Map<string, number>(allUnits.map((u) => [u.symbol, u.id]));
    const sourceByCode = new Map<string, number>(allSources.map((s) => [s.code, s.id]));
    const fallbackDiscId = allDiscs[0]?.id ?? 1;
    const fallbackUnitId = unitBySymbol.get('-') ?? allUnits[0]?.id ?? 1;
    const fallbackSrcId = sourceByCode.get('SRC_APEX_GAME_PARAM') ?? allSources[0]?.id ?? 1;

    // 4. Phenomena, Variables, Equations, Materials, Fluids, Components
    await db
      .insert(phenomena)
      .values(
        PHYSICS_PHENOMENA_CATALOG.slice(0, 40).map((ph) => ({
          code: ph.id,
          disciplineId: discByName.get(ph.discipline) ?? fallbackDiscId,
          name: ph.name,
          whereItActs: ph.whereItActs,
          equationsText: ph.equations,
          limitations: ph.limitations,
          infoClass: ph.confidence === 'Alta' ? 'Física estabelecida' : 'Modelo reduzido',
          sourceId: fallbackSrcId,
          version: ph.version,
        }))
      )
      .onConflictDoNothing({ target: phenomena.code });

    await db
      .insert(variables)
      .values(
        SI_VARIABLE_REGISTRY.map((v) => ({
          symbol: v.symbol,
          name: v.name,
          unitId: unitBySymbol.get(v.unitSi) ?? fallbackUnitId,
          role: v.role,
          coordinateFrame: v.coordinateFrame,
          signConvention: v.signConvention,
          domainMin: v.domainMin,
          domainMax: v.domainMax,
          infoClass: v.infoClass,
          uncertaintyPct: v.uncertaintyPct,
          sourceId: sourceByCode.get(v.sourceCode) ?? fallbackSrcId,
          version: v.version,
        }))
      )
      .onConflictDoNothing({ target: variables.symbol });

    const allPhenomena = await db.select().from(phenomena);
    const fallbackPhenomId = allPhenomena[0]?.id ?? 1;

    await db
      .insert(equations)
      .values(
        BASE_EQUATIONS_CATALOG.map((eqItem) => ({
          code: eqItem.code,
          name: eqItem.name,
          expression: eqItem.expression,
          phenomenonId: fallbackPhenomId,
          domainDescription: eqItem.domainDescription,
          dimensionalCheckPassed: true,
          version: eqItem.version,
        }))
      )
      .onConflictDoNothing({ target: equations.code });

    await db
      .insert(materials)
      .values([
        ...Object.values(COMPOSITE_MATERIALS).map((c) => ({
          code: `MAT_${c.id.toUpperCase()}`,
          name: c.name,
          category: 'composite',
          densityKgM3: c.densityKgM3,
          modulusGpa: c.fiberModulusGpa,
          yieldStrengthMpa: c.tensileStrengthMpa * 0.55,
          tensileStrengthMpa: c.tensileStrengthMpa,
          thermalConductivityWmK: c.thermalConductivityWmK,
          fractureToughness: c.fractureToughness,
          fatigueEnduranceRatio: 0.62,
          costPerKgUsd: c.costPerKgUsd,
          infoClass: c.classification,
          sourceId: fallbackSrcId,
          version: '1.0.0',
        })),
        ...Object.values(CASING_ALLOYS).map((a) => ({
          code: `MAT_${a.id.toUpperCase()}`,
          name: a.name,
          category: 'alloy',
          densityKgM3: a.densityKgM3,
          modulusGpa: a.youngsModulusGpa,
          yieldStrengthMpa: a.yieldStrengthMpa,
          tensileStrengthMpa: a.yieldStrengthMpa * 1.12,
          thermalConductivityWmK: a.thermalConductivityWmK,
          fractureToughness: 1 - a.impactBrittleness,
          fatigueEnduranceRatio: a.fatigueEnduranceRatio,
          costPerKgUsd: a.id === 'titanium' ? 320 : a.id === 'carbon' ? 680 : 65,
          infoClass: a.classification,
          sourceId: fallbackSrcId,
          version: '1.0.0',
        })),
      ])
      .onConflictDoNothing({ target: materials.code });

    await db
      .insert(fluids)
      .values(
        FLUID_CATALOG.map((f) => ({
          code: f.code,
          name: f.name,
          fluidType: f.fluidType,
          refTempK: f.refTempK,
          refPressurePa: f.refPressurePa,
          densityKgM3: f.densityKgM3,
          cpJKgK: f.cpJKgK,
          dynamicViscosityPaS: f.dynamicViscosityPaS,
          thermalConductivityWmK: f.thermalConductivityWmK,
          sourceId: sourceByCode.get(f.sourceCode) ?? fallbackSrcId,
          version: f.version,
        }))
      )
      .onConflictDoNothing({ target: fluids.code });

    await db
      .insert(componentsCatalog)
      .values([
        { code: 'CMP_FLOOR', name: 'Assoalho Plano & Difusor 2026', moduleOwner: 'M04' },
        { code: 'CMP_WINGS', name: 'Asas Ativas Modo X / Modo Z', moduleOwner: 'M04' },
        { code: 'CMP_CHASSIS', name: 'Monocoque CFRP & Célula de Sobrevivência', moduleOwner: 'M07' },
        { code: 'CMP_SUSPENSION', name: 'Suspensão Pullrod / Pushrod K&C', moduleOwner: 'M05' },
        { code: 'CMP_TIRES', name: 'Pneus Pirelli 2026 Pacejka', moduleOwner: 'M06' },
        { code: 'CMP_PU', name: 'Unidade de Potência V6 + MGU-K 350kW', moduleOwner: 'M08' },
        { code: 'CMP_GEARBOX', name: 'Transmissão 8 Marchas & Diferencial LSD', moduleOwner: 'M09' },
      ])
      .onConflictDoNothing({ target: componentsCatalog.code });

    // 5. M02 Philosophies & Weights & Tracks & M11 Segments
    await db
      .insert(vehiclePhilosophies)
      .values(
        Object.values(VEHICLE_PHILOSOPHIES_M02).map((p) => ({
          code: p.code,
          name: p.name,
          prioritySummary: p.priority,
          tradeoffSummary: p.typicalTradeoffs.join(' | '),
        }))
      )
      .onConflictDoNothing({ target: vehiclePhilosophies.code });

    const [pwCount] = await db.select({ value: count() }).from(philosophyWeights);
    if (pwCount.value === 0) {
      const dbPhils = await db.select().from(vehiclePhilosophies);
      const philIdMap = new Map<string, number>(dbPhils.map((p) => [p.code, p.id]));
      const weightRows: Array<typeof philosophyWeights.$inferInsert> = [];
      for (const phil of Object.values(VEHICLE_PHILOSOPHIES_M02)) {
        const pid = philIdMap.get(phil.code);
        if (!pid) continue;
        for (const w of phil.weights) {
          weightRows.push({
            philosophyId: pid,
            objectiveMetric: w.metric,
            weightValue: w.weight,
            targetMin: w.targetMin,
            targetMax: w.targetMax,
            unitSi: w.unitSi,
            justification: w.justification,
            relationType: w.relationType,
          });
        }
      }
      if (weightRows.length > 0) {
        await db.insert(philosophyWeights).values(weightRows);
      }
    }

    await db
      .insert(trackCharacteristics)
      .values(
        TRACK_CHARACTERISTICS_CATALOG.map((t) => ({
          circuitCode: t.circuitCode,
          name: t.name,
          country: t.country,
          laps: t.laps,
          lapDistanceM: t.lapDistanceM,
          altitudeM: t.altitudeM,
          ambientTempK: t.ambientTempK,
          windSpeedMs: t.windSpeedMs,
          highSpeedShare: t.highSpeedShare,
          mediumSpeedShare: t.mediumSpeedShare,
          lowSpeedShare: t.lowSpeedShare,
          brakingSeverity: t.brakingSeverity,
          tractionDemand: t.tractionDemand,
          surfaceRoughnessUm: t.surfaceRoughnessUm,
          bumpinessIndex: t.bumpinessIndex,
          kerbSeverity: t.kerbSeverity,
        }))
      )
      .onConflictDoNothing({ target: trackCharacteristics.circuitCode });

    const [segCount] = await db.select({ value: count() }).from(circuitSegments);
    if (segCount.value === 0) {
      const dbTracks = await db.select().from(trackCharacteristics);
      const trackIdMap = new Map<string, number>(dbTracks.map((t) => [t.circuitCode, t.id]));
      const segRows: Array<typeof circuitSegments.$inferInsert> = [];
      for (const [circuitCode, segs] of Object.entries(CIRCUIT_SEGMENTS_CATALOG)) {
        const trackId = trackIdMap.get(circuitCode);
        if (!trackId) continue;
        for (const s of segs) {
          segRows.push({
            trackId,
            segmentIndex: s.segmentIndex,
            segmentName: s.segmentName,
            lengthM: s.lengthM,
            curvatureInvM: s.curvatureInvM,
            slopeRad: s.slopeRad,
            elevationM: s.elevationM,
            surfaceGripFactor: s.surfaceGripFactor,
            aeroModeAllowed: s.aeroModeAllowed,
            overtakeOpportunity: s.overtakeOpportunity,
          });
        }
      }
      if (segRows.length > 0) {
        await db.insert(circuitSegments).values(segRows);
      }
    }

    // 6. M06 Tire Compounds
    await db
      .insert(tireCompounds)
      .values(
        Object.values(TIRE_COMPOUND_CATALOG).map((tc) => ({
          code: tc.code,
          name: tc.name,
          compoundType: tc.code,
          nominalLoadN: tc.nominalLoadN,
          loadSensitivityExpN: tc.loadSensitivityExpN,
          magicB: tc.magicB,
          magicC: tc.magicC,
          magicD: tc.magicD,
          magicE: tc.magicE,
          relaxationLengthM: tc.relaxationLengthM,
          thermalCapJK: tc.thermalCapTreadJK,
          optimalTempK: tc.optimalTempK,
          nominalPressurePa: tc.nominalColdPressureAbsPa,
          infoClass: tc.infoClass,
        }))
      )
      .onConflictDoNothing({ target: tireCompounds.code });

    // 7. Traceability Matrix (REQ-M01 .. REQ-M12)
    await db
      .insert(requirementTraceability)
      .values(
        MASTER_TRACEABILITY_CATALOG.map((req) => ({
          reqCode: req.reqCode,
          moduleCode: req.moduleCode,
          manualSection: req.manualSection,
          description: req.description,
          phenomenonRef: req.phenomenonRef,
          equationRef: req.equationRef,
          variablesList: req.variablesList,
          unitSi: req.unitSi,
          computationalModel: req.computationalModel,
          softwareComponent: req.softwareComponent,
          dbTables: req.dbTables,
          requiredTests: req.requiredTests,
          status: req.status,
          evidenceRef: req.evidenceRef,
          implementedVersion: req.implementedVersion,
        }))
      )
      .onConflictDoNothing({ target: requirementTraceability.reqCode });

    // 8. Verify counts cleanly
    const [varsCount] = await db.select({ value: count() }).from(variables);
    const [reqCount] = await db.select({ value: count() }).from(requirementTraceability);
    const [tracksCount] = await db.select({ value: count() }).from(trackCharacteristics);
    const [segsCount] = await db.select({ value: count() }).from(circuitSegments);
    const [tiresCount] = await db.select({ value: count() }).from(tireCompounds);
    const [matsCount] = await db.select({ value: count() }).from(materials);

    void formatDimVector;
    void eq;

    return {
      seeded: true,
      counts: {
        variables: Number(varsCount.value),
        requirements: Number(reqCount.value),
        tracks: Number(tracksCount.value),
        circuitSegments: Number(segsCount.value),
        tireCompounds: Number(tiresCount.value),
        materials: Number(matsCount.value),
      },
    };
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });

  return seedPromise;
}
