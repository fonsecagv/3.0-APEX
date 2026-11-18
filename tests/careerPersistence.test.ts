import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  INITIAL_COMPONENTS,
  INITIAL_DRIVERS,
  INITIAL_FACILITIES,
  INITIAL_SPONSORS,
  INITIAL_STAFF,
  INITIAL_TEAMS,
} from '../src/data/f1Data';
import { DEFAULT_VEHICLE_PARAMS } from '../src/engine/physicsEngine';
import type { Team } from '../src/types/f1';
import {
  CAREER_ACTIVE_SCREEN_KEY,
  CAREER_RECENT_SAVE_KEY,
  CAREER_SAVE_SLOTS_KEY,
  buildCareerSavePayload,
  isValidPersistedCareerSave,
  readRecentCareerSave,
  readSavedSlotsList,
  setActiveScreenPreference,
  shouldStartOnStartScreenOnBoot,
  writeCareerSaveToStorage,
  type PersistedCareerState,
} from '../src/utils/careerPersistence';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

describe('Persistência de Carreira & Recuperação de Estado (careerPersistence)', () => {
  const origLocalStorage = globalThis.localStorage;
  const origSessionStorage = globalThis.sessionStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: origLocalStorage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: origSessionStorage,
      configurable: true,
      writable: true,
    });
  });

  it('1) Preserva integralmente os dados da carreira customizada (GArban / GAR-01 / Cosworth / al_si_low_friction / Drugovich / Schumacher / staff) no roundtrip localStorage', () => {
    const customTeams: Team[] = INITIAL_TEAMS.map(t =>
      t.isPlayer
        ? {
            ...t,
            name: 'GArban',
            shortName: 'GAR',
            carModelName: 'GAR-01',
            engineSupplier: 'In-House',
            engineCustomName: 'Cosworth',
            engineOrigin: 'customer',
            headOfAero: 'Juan Molina',
            headOfPowerUnit: 'Omar Al-Saadi',
            sportingDirector: 'Victor Hernandez',
            chiefMechanic: 'Rob Smedley',
          }
        : t
    );

    const customDrivers = INITIAL_DRIVERS.map((d, idx) => {
      if (idx === 0) return { ...d, id: 'drv_drugovich', name: 'Felipe Drugovich', teamId: 'apex' };
      if (idx === 1) return { ...d, id: 'drv_schumacher', name: 'Mick Schumacher', teamId: 'apex' };
      return d;
    });

    const customStaff = INITIAL_STAFF.map(s => {
      if (s.role === 'head_aero') return { ...s, name: 'Juan Molina', currentTeam: 'GArban' };
      if (s.role === 'head_pu') return { ...s, name: 'Omar Al-Saadi', currentTeam: 'GArban' };
      if (s.role === 'sporting_director') return { ...s, name: 'Victor Hernandez', currentTeam: 'GArban' };
      if (s.role === 'chief_mechanic') return { ...s, name: 'Rob Smedley', currentTeam: 'GArban' };
      return s;
    });

    const customState: PersistedCareerState = {
      careerInitialized: true,
      currentWeek: 3,
      seasonYear: 2026,
      currentCircuitIndex: 1,
      activeTab: 'engineering',
      allTeams: customTeams,
      drivers: customDrivers,
      staff: customStaff,
      facilities: INITIAL_FACILITIES,
      components: INITIAL_COMPONENTS,
      sponsors: INITIAL_SPONSORS,
      financials: {
        bankBalance: 84200000,
        costCapLimit: 135000000,
        costCapSpent: 41500000,
        atrWindTunnelHoursAvailable: 320,
        atrCfdMegaAllocations: 280,
        atrPeriodWeeksLeft: 6,
      },
      principalProfile: { name: 'Guilherme', background: 'ex_driver' },
      vehicleParams: {
        ...DEFAULT_VEHICLE_PARAMS,
        iceMetallurgyId: 'al_si_low_friction',
        ersDeployBiasPct: 68,
      },
      unlockedPuMaterials: ['fia_iron_ams6487', 'al_si_low_friction'],
      baseDeFas: 20000000,
      receitaMarketing: 15000000,
      receitaMerchandising: 2500000,
      notifications: [
        {
          id: 'notif_1',
          title: 'HOMOLOGAÇÃO GARBAN',
          message: 'GAR-01 equipado com Cosworth e Liga Al-Si.',
          date: 'Semana 3',
          type: 'info',
        },
      ],
    };

    const payload = buildCareerSavePayload('slot_autosave', customState, 'pt');
    const updatedSlots = writeCareerSaveToStorage(payload, readSavedSlotsList());

    expect(updatedSlots).toHaveLength(1);
    expect(updatedSlots[0].teamName).toBe('GArban');

    const hydrated = readRecentCareerSave();
    expect(hydrated).not.toBeNull();
    expect(isValidPersistedCareerSave(hydrated)).toBe(true);

    const hydratedPlayer = hydrated!.state.allTeams.find(t => t.isPlayer);
    expect(hydratedPlayer?.name).toBe('GArban');
    expect(hydratedPlayer?.carModelName).toBe('GAR-01');
    expect(hydratedPlayer?.engineCustomName).toBe('Cosworth');
    expect(hydratedPlayer?.headOfAero).toBe('Juan Molina');
    expect(hydratedPlayer?.headOfPowerUnit).toBe('Omar Al-Saadi');
    expect(hydratedPlayer?.sportingDirector).toBe('Victor Hernandez');
    expect(hydratedPlayer?.chiefMechanic).toBe('Rob Smedley');

    expect(hydrated!.state.vehicleParams?.iceMetallurgyId).toBe('al_si_low_friction');
    expect(hydrated!.state.vehicleParams?.ersDeployBiasPct).toBe(68);
    expect(hydrated!.state.unlockedPuMaterials).toContain('al_si_low_friction');
    expect(hydrated!.state.drivers.map(d => d.name)).toContain('Felipe Drugovich');
    expect(hydrated!.state.drivers.map(d => d.name)).toContain('Mick Schumacher');
    expect(hydrated!.state.drivers.map(d => d.name)).not.toContain('Lucas Moreau');
    expect(hydrated!.state.currentWeek).toBe(3);
    expect(hydrated!.state.activeTab).toBe('engineering');
  });

  it('2) Retoma direto para a carreira após F5 dentro do cockpit e mostra StartScreen com Continuar quando navegado para a tela inicial', () => {
    const state: PersistedCareerState = {
      careerInitialized: true,
      currentWeek: 2,
      seasonYear: 2026,
      currentCircuitIndex: 0,
      allTeams: INITIAL_TEAMS.map(t => (t.isPlayer ? { ...t, name: 'GArban', carModelName: 'GAR-01' } : t)),
      drivers: INITIAL_DRIVERS,
      staff: INITIAL_STAFF,
      facilities: INITIAL_FACILITIES,
      components: INITIAL_COMPONENTS,
      sponsors: INITIAL_SPONSORS,
      financials: {
        bankBalance: 80000000,
        costCapLimit: 135000000,
        costCapSpent: 38000000,
        atrWindTunnelHoursAvailable: 360,
        atrCfdMegaAllocations: 300,
        atrPeriodWeeksLeft: 8,
      },
    };
    const save = buildCareerSavePayload('slot_autosave', state, 'pt');

    // Sem save -> StartScreen obrigatória
    expect(shouldStartOnStartScreenOnBoot(null)).toBe(true);

    // Nova aba com save existente -> abre StartScreen (exibindo Continuar Carreira (GArban))
    expect(shouldStartOnStartScreenOnBoot(save)).toBe(true);

    // Usuário estava no cockpit ('career') e pressionou F5 -> retoma direto no cockpit (false para showStartScreen)
    setActiveScreenPreference('career');
    expect(sessionStorage.getItem(CAREER_ACTIVE_SCREEN_KEY)).toBe('career');
    expect(shouldStartOnStartScreenOnBoot(save)).toBe(false);

    // Usuário clicou em Home para voltar à StartScreen ('start') -> permanece na StartScreen
    setActiveScreenPreference('start');
    expect(shouldStartOnStartScreenOnBoot(save)).toBe(true);
  });

  it('3) Atualiza slots existentes sem duplicar e mantém teto de 5 slots em localStorage', () => {
    const baseState: PersistedCareerState = {
      careerInitialized: true,
      currentWeek: 1,
      seasonYear: 2026,
      currentCircuitIndex: 0,
      allTeams: INITIAL_TEAMS,
      drivers: INITIAL_DRIVERS,
      staff: INITIAL_STAFF,
      facilities: INITIAL_FACILITIES,
      components: INITIAL_COMPONENTS,
      sponsors: INITIAL_SPONSORS,
      financials: {
        bankBalance: 100000000,
        costCapLimit: 135000000,
        costCapSpent: 30000000,
        atrWindTunnelHoursAvailable: 360,
        atrCfdMegaAllocations: 300,
        atrPeriodWeeksLeft: 8,
      },
    };

    for (let i = 1; i <= 7; i += 1) {
      const payload = buildCareerSavePayload(`slot_${i}`, { ...baseState, currentWeek: i }, 'pt');
      writeCareerSaveToStorage(payload, readSavedSlotsList());
    }
    expect(readSavedSlotsList()).toHaveLength(5);

    const updatedSlot = buildCareerSavePayload('slot_7', { ...baseState, currentWeek: 12 }, 'pt');
    const afterUpdate = writeCareerSaveToStorage(updatedSlot, readSavedSlotsList());
    expect(afterUpdate).toHaveLength(5);
    expect(afterUpdate.find(s => s.id === 'slot_7')?.week).toBe(12);
    expect(localStorage.getItem('f1_apex_slot_slot_7')).not.toBeNull();
  });

  it('4) Trata JSON corrompido ou payload inválido sem quebrar a inicialização', () => {
    localStorage.setItem(CAREER_RECENT_SAVE_KEY, '{broken_json');
    localStorage.setItem(CAREER_SAVE_SLOTS_KEY, '{not_an_array');

    expect(readRecentCareerSave()).toBeNull();
    expect(readSavedSlotsList()).toEqual([]);

    localStorage.setItem(
      CAREER_RECENT_SAVE_KEY,
      JSON.stringify({ id: 'bad', state: { allTeams: [], drivers: [] } })
    );
    expect(readRecentCareerSave()).toBeNull();
  });
});
