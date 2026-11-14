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
  evaluateStaffPhilosophyConflict,
  getAttributeVisualTone,
  getDriverMarketAnalysis,
  getDriverPotentialProfile,
  getDriverTechnicalAttributes,
  getRecommendedDriverTraitsForPhilosophy,
  getStaffFullProfile
} from '../src/utils/profileSheets';

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
    const lindblad = F3_DRIVERS_REAL.find(d => d.id === 'f3_lindblad')!;
    const pot = getDriverPotentialProfile(lindblad);
    expect(pot.tier).toBe('Elite');
    expect(pot.isElite).toBe(true);

    const tsunoda = F1_DRIVERS_REAL.find(d => d.id === 'driver_tsunoda')!;
    const marketTsunoda = getDriverMarketAnalysis(tsunoda);
    expect(marketTsunoda.isSoleRepresentative).toBe(true);
    expect(marketTsunoda.effectiveMarketability).toBe(97);
    expect(marketTsunoda.marketingBonusCashM).toBeGreaterThanOrEqual(2.5);
  });

  it('gera os 7 atributos de Staff em PT-BR e DNA de Projeto coerente para todos os chefes e engenheiros de corrida', () => {
    const allStaff = [
      ...AERO_STAFF_MEMBERS,
      ...PU_STAFF_MEMBERS,
      ...SPORTING_STAFF_MEMBERS,
      ...CHIEF_MECHANIC_STAFF_MEMBERS,
      ...RACE_ENGINEER_MEMBERS
    ];

    expect(RACE_ENGINEER_MEMBERS).toHaveLength(10);

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
});

