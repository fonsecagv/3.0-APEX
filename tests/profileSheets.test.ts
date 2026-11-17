import { describe, expect, it } from 'vitest';
import {
  F1_DRIVERS_REAL,
  F3_DRIVERS_REAL,
  AERO_STAFF_MEMBERS,
  PU_STAFF_MEMBERS,
  SPORTING_STAFF_MEMBERS,
  CHIEF_MECHANIC_STAFF_MEMBERS,
  RACE_ENGINEER_MEMBERS
} from '../src/data/marketData';
import { HEADQUARTERS_OPTIONS } from '../src/data/headquartersData';
import {
  calculateStaffInterest,
  evaluateCascadingRdImpact,
  evaluateCombinedLeadershipDna,
  evaluatePhilosophyFitWithLeadership,
  evaluatePuFitWithPhilosophy,
  evaluateStaffPhilosophyConflict,
  getAttributeVisualTone,
  getDriverMarketAnalysis,
  getDriverPotentialProfile,
  getDriverTechnicalAttributes,
  getEngineersTargetShadow,
  getPuRecommendationForCarPhilosophy,
  getRecommendedDriverTraitsForPhilosophy,
  getStaffFullProfile
} from '../src/utils/profileSheets';
import { DEFAULT_VEHICLE_PARAMS } from '../src/engine/physicsEngine';
import { evaluatePitAndGarageOperations, runMultiPhysicsSimulation } from '../src/engine/simulationEngine';

describe('Step 5 Ficha Completa (Drivers & Staff PT-BR)', () => {
  it('mapeia exatamente os 12 atributos traduzidos em PT-BR para pilotos', () => {
    const driver = F1_DRIVERS_REAL[0];
    const attrs = getDriverTechnicalAttributes(driver);
    expect(attrs.map(a => a.label)).toEqual([
      'Ritmo',
      'Curvas',
      'Frenagem',
      'Reações',
      'Consistência',
      'Precisão',
      'Controle',
      'Suavidade',
      'Habilidade de Corrida',
      'Ultrapassagem',
      'Defesa',
      'Adaptabilidade'
    ]);
    attrs.forEach(a => {
      expect(a.value).toBeGreaterThanOrEqual(0);
      expect(a.value).toBeLessThanOrEqual(100);
    });
  });

  it('destaca >90 em Verde Neon e <60 em Vermelho', () => {
    const eliteTone = getAttributeVisualTone(91);
    expect(eliteTone.tierLabel).toBe('ELITE (>90)');
    expect(eliteTone.textClass).toContain('#39FF14');
    expect(eliteTone.barClass).toContain('#39FF14');

    const boundary90 = getAttributeVisualTone(90);
    expect(boundary90.tierLabel).toBe('PADRÃO');

    const alertTone = getAttributeVisualTone(59);
    expect(alertTone.tierLabel).toBe('ALERTA (<60)');
    expect(alertTone.textClass).toContain('red');
    expect(alertTone.barClass).toContain('red');

    const boundary60 = getAttributeVisualTone(60);
    expect(boundary60.tierLabel).toBe('PADRÃO');
  });

  it('classifica potencial Elite, Alto e Médio corretamente e calcula bônus nacional', () => {
    const slater = F3_DRIVERS_REAL.find(d => d.id === 'f3_slater')!;
    const pot = getDriverPotentialProfile(slater);
    expect(pot.tier).toBe('Elite');
    expect(pot.isElite).toBe(true);

    const bortoleto = F1_DRIVERS_REAL.find(d => d.id === 'driver_bortoleto')!;
    const marketBortoleto = getDriverMarketAnalysis(bortoleto);
    expect(marketBortoleto.isSoleRepresentative).toBe(true);
    expect(marketBortoleto.isTraditionalCountry).toBe(true);
    expect(marketBortoleto.effectiveMarketability).toBe(99);
    expect(marketBortoleto.marketingBonusCashM).toBe(3.5);

    const stroll = F1_DRIVERS_REAL.find(d => d.id === 'driver_stroll')!;
    const marketStroll = getDriverMarketAnalysis(stroll);
    expect(marketStroll.isSoleRepresentative).toBe(true);
    expect(marketStroll.marketingBonusCashM).toBeGreaterThanOrEqual(2.5);
  });

  it('gera os 7 atributos de Staff em PT-BR e DNA de Projeto coerente para todos os chefes e engenheiros de corrida', () => {
    const allStaff = [
      ...AERO_STAFF_MEMBERS,
      ...PU_STAFF_MEMBERS,
      ...SPORTING_STAFF_MEMBERS,
      ...CHIEF_MECHANIC_STAFF_MEMBERS,
      ...RACE_ENGINEER_MEMBERS
    ];

    expect(RACE_ENGINEER_MEMBERS).toHaveLength(14);

    allStaff.forEach(s => {
      const profile = getStaffFullProfile(s);
      expect(profile.designDna.length).toBeGreaterThan(3);
      expect(profile.staffPhilosophyTag.length).toBeGreaterThan(2);
      expect(profile.pillarAttributes).toHaveLength(3);
      expect(profile.age).toBeGreaterThanOrEqual(28);
      expect(profile.attributes.map(a => a.label)).toEqual([
        'Técnica',
        'Criatividade',
        'Rigor/Validação',
        'Liderança',
        'Comunicação',
        'Gestão de Prazo',
        'Adaptação'
      ]);
      profile.attributes.forEach(a => {
        expect(a.value).toBeGreaterThanOrEqual(35);
        expect(a.value).toBeLessThanOrEqual(99);
      });
    });

    const newey = AERO_STAFF_MEMBERS.find(s => s.id === 'staff_newey')!;
    const neweyProfile = getStaffFullProfile(newey);
    expect(neweyProfile.designDna).toBe('Especialista em Assoalho');
    expect(neweyProfile.attributes.every(a => a.value > 90)).toBe(true);
  });

  it('bloqueia contratação de Staff Elite (OVR >= 90) em equipe custom Nível 1/2 e aplica bônus de sede europeia', () => {
    const silverstone = HEADQUARTERS_OPTIONS.find(h => h.id === 'silverstone')!;
    const indaiatuba = HEADQUARTERS_OPTIONS.find(h => h.id === 'indaiatuba')!;
    const newey = AERO_STAFF_MEMBERS.find(s => s.id === 'staff_newey')!;
    const ficAero = AERO_STAFF_MEMBERS.find(s => s.id === 'staff_aero_fic_1')!;

    const neweyBlocked = calculateStaffInterest({
      staff: newey,
      projectAmbition: 'bold',
      hqOption: silverstone,
      isRealTeam: false,
      realTeamReputation: 60
    });
    expect(neweyBlocked.status).toBe('blocked');
    expect(neweyBlocked.interestPct).toBeLessThanOrEqual(34);

    const ficSilverstone = calculateStaffInterest({
      staff: ficAero,
      projectAmbition: 'balanced',
      hqOption: silverstone,
      isRealTeam: false,
      realTeamReputation: 50
    });
    const ficIndaiatuba = calculateStaffInterest({
      staff: ficAero,
      projectAmbition: 'balanced',
      hqOption: indaiatuba,
      isRealTeam: false,
      realTeamReputation: 50
    });
    expect(ficSilverstone.interestPct).toBeGreaterThan(ficIndaiatuba.interestPct);
  });

  it('detecta conflito de filosofia (-15%) e bloqueio Zero-Pod para Mercedes cliente', () => {
    const hdOrMechAero = AERO_STAFF_MEMBERS.find(s =>
      ['mechanical_grip', 'high_downforce'].includes(getStaffFullProfile(s).preferredCarPhilosophy)
    )!;
    expect(hdOrMechAero).toBeDefined();
    const conflict = evaluateStaffPhilosophyConflict({
      philosophyCode: 'low_drag',
      headAero: hdOrMechAero,
      headPu: PU_STAFF_MEMBERS[0],
      engineOrigin: 'customer',
      customerSupplier: 'Mercedes',
      thirdPartyErsSupplier: null
    });

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.efficiencyDeltaPct).toBe(-15);
    expect(conflict.lockedSidepodConcepts).toContain('zeropod');
    expect(conflict.packagingConstraintReason).toBeTruthy();

    const rec = getRecommendedDriverTraitsForPhilosophy('low_drag');
    expect(rec.priorityAttrs.length).toBeGreaterThanOrEqual(2);
    expect(rec.title.length).toBeGreaterThan(5);
  });

  it('acopla competência do Chefe Mecânico ao tempo/risco de Pit Stop e diagnóstico de garagem', () => {
    const eliteMech = CHIEF_MECHANIC_STAFF_MEMBERS.find(s => s.id === 'staff_mech_calum')!; // OVR 90
    const rookieMech = CHIEF_MECHANIC_STAFF_MEMBERS.find(s => s.id === 'staff_mech_fic_3')!; // OVR 68

    const opsElite = evaluatePitAndGarageOperations({
      chiefMechanicRating: eliteMech.rating,
      principalBackground: 'legendary_mechanic',
      isSakuraHq: true,
    });
    const opsRookie = evaluatePitAndGarageOperations({
      chiefMechanicRating: rookieMech.rating,
      principalBackground: 'chief_engineer',
      isSakuraHq: false,
    });

    expect(opsElite.pitTimeDeltaFromMechSec).toBeLessThan(0);
    expect(opsElite.dnaPitBonusSec).toBe(-0.2);
    expect(opsElite.hqPitBonusSec).toBe(-0.25);
    expect(opsElite.totalPitDeltaSec).toBeCloseTo(-0.75, 2);
    expect(opsElite.pitErrorProbPct).toBeLessThan(opsRookie.pitErrorProbPct);
    expect(opsElite.pitErrorDelaySec).toBeLessThan(opsRookie.pitErrorDelaySec);
    expect(opsElite.garageTurnaroundDeltaMin).toBeLessThan(opsRookie.garageTurnaroundDeltaMin);

    const teamStaff = [
      { ...rookieMech, currentTeam: 'Outro Time' },
      { ...eliteMech, currentTeam: 'APEX Grand Prix Team' },
    ];
    const sim = runMultiPhysicsSimulation({
      componentType: 'gearbox',
      params: DEFAULT_VEHICLE_PARAMS,
      atrHoursUsed: 30,
      windTunnelLevel: 3,
      cfdLevel: 3,
      dnaCorrelationModifier: 0,
      staff: teamStaff,
      teamName: 'APEX Grand Prix Team',
    });

    const mechDiag = sim.diagnostics.find(d => d.specialistRole === 'Chefe Mecânico');
    expect(mechDiag).toBeDefined();
    expect(mechDiag?.specialistName).toBe(eliteMech.name);
    expect(mechDiag?.competenceRating).toBe(eliteMech.rating);
  });

  it('avalia conflito e sinergia de DNA na Fase 4 sem travar Zero-Pod antes da escolha do motor na Fase 5', () => {
    const hdAero = AERO_STAFF_MEMBERS.find(
      s => getStaffFullProfile(s).preferredCarPhilosophy === 'high_downforce'
    )!;
    expect(hdAero).toBeDefined();

    // Conflito na Fase 4: Low Drag vs Chefe de Aero High Downforce, mas sem travamento prematuro de Mercedes
    const phase4Conflict = evaluateStaffPhilosophyConflict({
      philosophyCode: 'low_drag',
      headAero: hdAero,
      headPu: PU_STAFF_MEMBERS[0],
      sportingDirector: SPORTING_STAFF_MEMBERS[0],
      engineOrigin: 'customer',
      customerSupplier: 'Mercedes',
      thirdPartyErsSupplier: null,
      includePowerUnitConstraints: false
    });

    expect(phase4Conflict.hasConflict).toBe(true);
    expect(phase4Conflict.efficiencyDeltaPct).toBe(-15);
    expect(phase4Conflict.warnings.some(w => w.includes('CONFLITO DE DNA'))).toBe(true);
    expect(phase4Conflict.lockedSidepodConcepts).toEqual([]);
    expect(phase4Conflict.packagingConstraintReason).toBeNull();

    // Sinergia na Fase 4: High Downforce alinhado ao Chefe de Aero (+8%)
    const phase4Synergy = evaluateStaffPhilosophyConflict({
      philosophyCode: 'high_downforce',
      headAero: hdAero,
      headPu: PU_STAFF_MEMBERS[0],
      sportingDirector: SPORTING_STAFF_MEMBERS[0],
      engineOrigin: 'customer',
      customerSupplier: 'Mercedes',
      thirdPartyErsSupplier: null,
      includePowerUnitConstraints: false
    });

    expect(phase4Synergy.hasConflict).toBe(false);
    expect(phase4Synergy.efficiencyDeltaPct).toBeGreaterThanOrEqual(8);
    expect(phase4Synergy.bonuses.some(b => b.includes('SINERGIA DETECTADA'))).toBe(true);
    expect(phase4Synergy.lockedSidepodConcepts).toEqual([]);
  });

  it('classifica compatibilidade de motores na Fase 5 e gera parecer técnico dos Chefes a partir do conceito da Fase 4', () => {
    const hondaHd = evaluatePuFitWithPhilosophy({
      philosophyCode: 'high_downforce',
      supplierOrFactoryId: 'Honda',
      isFactory: false
    });
    expect(hondaHd.fitLabel).toBe('ALTA SINERGIA');
    expect(hondaHd.fitTone).toBe('emerald');

    const mercedesHd = evaluatePuFitWithPhilosophy({
      philosophyCode: 'high_downforce',
      supplierOrFactoryId: 'Mercedes',
      isFactory: false
    });
    expect(mercedesHd.fitLabel).toBe('ATENÇÃO PACKAGING');
    expect(mercedesHd.fitTone).toBe('amber');

    const rbLowDrag = evaluatePuFitWithPhilosophy({
      philosophyCode: 'low_drag',
      supplierOrFactoryId: 'Red Bull-Ford',
      isFactory: false
    });
    expect(rbLowDrag.fitLabel).toBe('ALTA SINERGIA');
    expect(rbLowDrag.fitTone).toBe('emerald');

    const cosworthHd = evaluatePuFitWithPhilosophy({
      philosophyCode: 'high_downforce',
      supplierOrFactoryId: 'cosworth',
      isFactory: true
    });
    expect(cosworthHd.fitLabel).toBe('ALTA SINERGIA');

    const advice = getPuRecommendationForCarPhilosophy({
      philosophyCode: 'high_downforce',
      headPu: PU_STAFF_MEMBERS[0],
      headAero: AERO_STAFF_MEMBERS[0],
      engineOrigin: 'customer',
      customerSupplier: 'Mercedes'
    });
    expect(advice.philosophyName).toContain('Alto Downforce');
    expect(advice.aeroChiefAdvice).toContain('Zero-Pod');
    expect(advice.puChiefAdvice.length).toBeGreaterThan(20);
  });

  it('contabiliza o bônus do Jogador no DNA Técnico Combinado (Você + 3 Chefes) e filtra conceitos na Fase 4', () => {
    const hdAero = AERO_STAFF_MEMBERS.find(
      s => getStaffFullProfile(s).preferredCarPhilosophy === 'high_downforce'
    )!;
    const innovPu = PU_STAFF_MEMBERS.find(
      s => getStaffFullProfile(s).staffPhilosophyTag === 'INOVADOR'
    )!;
    const consSport = SPORTING_STAFF_MEMBERS.find(
      s => getStaffFullProfile(s).staffPhilosophyTag === 'CONSERVADOR'
    )!;

    expect(hdAero).toBeDefined();
    expect(innovPu).toBeDefined();
    expect(consSport).toBeDefined();

    // 1) Engenheiro Chefe + Aero High Downforce + PU Inovador + Gestão Conservador
    const ceDna = evaluateCombinedLeadershipDna({
      principalBackground: 'chief_engineer',
      headAero: hdAero,
      headPu: innovPu,
      sportingDirector: consSport
    });

    expect(ceDna.combinedHeadline).toBe('⚡ PERFORMANCE EXTREMA');
    expect(ceDna.puRiskMitigated).toBe(true);
    expect(ceDna.puPowerDeltaPct).toBe(0);
    expect(ceDna.synergyPct).toBeGreaterThanOrEqual(75);
    expect(ceDna.narrativeSummary).toContain(hdAero.name);
    expect(ceDna.narrativeSummary).toContain(consSport.name);

    // Filtro da Fase 4 guiado pelo DNA Combinado
    const fitHd = evaluatePhilosophyFitWithLeadership({
      philosophyCode: 'high_downforce',
      principalBackground: 'chief_engineer',
      headAero: hdAero,
      headPu: innovPu,
      sportingDirector: consSport
    });
    expect(fitHd.tier).toBe('recommended');

    const fitLowDrag = evaluatePhilosophyFitWithLeadership({
      philosophyCode: 'low_drag',
      principalBackground: 'chief_engineer',
      headAero: hdAero,
      headPu: innovPu,
      sportingDirector: consSport
    });
    expect(fitLowDrag.tier).toBe('conflict');
    expect(fitLowDrag.efficiencyDeltaPct).toBe(-15);

    const fitStable = evaluatePhilosophyFitWithLeadership({
      philosophyCode: 'stable_platform',
      principalBackground: 'chief_engineer',
      headAero: hdAero,
      headPu: innovPu,
      sportingDirector: consSport
    });
    expect(fitStable.tier).toBe('risk');
    expect(fitStable.efficiencyDeltaPct).toBe(-8);

    // 2) Executivo de Elite entra em conflito direto com Chefe de PU Inovador (-5% potência)
    const execDna = evaluateCombinedLeadershipDna({
      principalBackground: 'elite_executive',
      headAero: hdAero,
      headPu: innovPu,
      sportingDirector: consSport
    });

    expect(execDna.puPowerDeltaPct).toBe(-5);
    expect(execDna.synergyStatus).toBe('tension');
    expect(execDna.synergyTone).toBe('red');
    expect(execDna.boardroomRdPenaltyPct).toBe(-10);
    expect(execDna.interactions.some(i => i.type === 'conflict' && i.detail.includes('-5%'))).toBe(true);

    // 3) Colin Stewart tem DNA de Gestão de Staff & Orçamento (teto salarial)
    const colin = SPORTING_STAFF_MEMBERS.find(s => s.id === 'staff_sport_fic_2')!;
    const colinProfile = getStaffFullProfile(colin);
    expect(colinProfile.designDna).toBe('Gestão de Staff & Orçamento');
    expect(colinProfile.philosophyImpactSummary).toContain('teto salarial');

    // 4) Efeito Cascata Multiplicativo (Sinergia Diretoria x Alinhamento Filosofia)
    const bestCascade = evaluateCascadingRdImpact({
      philosophyCode: 'high_downforce',
      principalBackground: 'chief_engineer',
      headAero: hdAero,
      headPu: innovPu,
      sportingDirector: colin
    });
    expect(bestCascade.boardTone).toBe('emerald');
    expect(bestCascade.boardSpeedMultiplier).toBe(1.1);
    expect(bestCascade.philosophyMultiplier).toBe(1.0);
    expect(bestCascade.projectedChassisWeeks).toBe(7);
    expect(bestCascade.silentSabotageAeroPct).toBe(0);

    // Pior cenário: Guerra Civil (<50% -> 0.70x) + Conceito Oposto ao Chefe de Aero (0.60x) -> 19 semanas (Base 8) + Sabotagem -5%
    const worstCascade = evaluateCascadingRdImpact({
      philosophyCode: 'low_drag',
      principalBackground: 'elite_executive',
      headAero: hdAero,
      headPu: innovPu,
      sportingDirector: colin
    });
    expect(worstCascade.boardTone).toBe('red');
    expect(worstCascade.boardSpeedMultiplier).toBe(0.7);
    expect(worstCascade.philosophyMultiplier).toBe(0.6);
    expect(worstCascade.combinedSpeedMultiplier).toBeCloseTo(0.42, 2);
    expect(worstCascade.projectedChassisWeeks).toBe(19);
    expect(worstCascade.silentSabotageAeroPct).toBe(-5);
    expect(worstCascade.narrativeEventTitle).toBeTruthy();
    expect(worstCascade.mediaRumourText).toContain('Guerra civil');

    // Sombra dos Engenheiros aponta para High Downforce quando Chefe de Aero prefere High Downforce
    const shadow = getEngineersTargetShadow({
      principalBackground: 'chief_engineer',
      headAero: hdAero
    });
    expect(shadow.targetPosition).toBeGreaterThanOrEqual(85);
    expect(shadow.targetLabel).toContain(hdAero.name);
  });
});

