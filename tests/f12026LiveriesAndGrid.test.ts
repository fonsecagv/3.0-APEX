import { describe, it, expect } from 'vitest';
import { INITIAL_TEAMS, INITIAL_DRIVERS } from '../src/data/f1Data';
import { LIVERY_2026_CATALOG, resolveTeamLivery2026 } from '../src/data/f12026Liveries';
import { resolveRaceGridDrivers } from '../src/engine/raceGridAndEvents';

describe('Grid Oficial F1 2026 & Catálogo de Pinturas 3D', () => {
  it('contém os 11 carros oficiais da temporada 2026 com nomes de chassi e pinturas válidas', () => {
    const ids = LIVERY_2026_CATALOG.map((c) => c.teamId);
    expect(ids).toEqual([
      'ferrari',
      'audi',
      'redbull',
      'mercedes',
      'mclaren',
      'astonmartin',
      'alpine',
      'williams',
      'rb',
      'haas',
      'cadillac',
    ]);

    for (const spec of LIVERY_2026_CATALOG) {
      expect(spec.carModelName.length).toBeGreaterThan(2);
      expect(spec.primaryHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(spec.secondaryHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(spec.accentHex).toMatch(/^#[0-9A-Fa-f]{6}$/);

      expect(spec.drivers).toHaveLength(2);
      const [d0, d1] = spec.drivers;
      expect(d0.number).not.toBe(d1.number);
      expect(d0.shortCode).toMatch(/^[A-Z0-9]{2,4}$/);
      expect(d1.shortCode).toMatch(/^[A-Z0-9]{2,4}$/);
      expect(d0.tCamHex).toBe('#111318');
      expect(d1.tCamHex).toBe('#EAB308');
      expect(d0.helmetPrimaryHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(d1.helmetPrimaryHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('alinha as duplas titulares 2026 sem duplicatas no grid de 24 pilotos', () => {
    const resolved = resolveRaceGridDrivers(INITIAL_TEAMS, INITIAL_DRIVERS);
    expect(resolved.normalizedTeams).toHaveLength(12);
    expect(resolved.gridDrivers).toHaveLength(24);

    const byTeam = new Map(resolved.normalizedTeams.map((t) => [t.id, t]));
    expect(byTeam.get('ferrari')?.carModelName).toBe('SF-26');
    expect(byTeam.get('ferrari')?.drivers).toEqual(['driver_leclerc', 'driver_hamilton']);

    expect(byTeam.get('redbull')?.carModelName).toBe('RB22');
    expect(byTeam.get('redbull')?.drivers).toEqual(['driver_verstappen', 'driver_hadjar']);
    expect(byTeam.get('redbull')?.affiliateDriverId).toBe('driver_tsunoda');

    expect(byTeam.get('alpine')?.carModelName).toBe('A526');
    expect(byTeam.get('alpine')?.drivers).toEqual(['driver_gasly', 'driver_colapinto']);
    expect(byTeam.get('alpine')?.engineSupplier).toBe('Mercedes');

    expect(byTeam.get('rb')?.carModelName).toBe('VCARB03');
    expect(byTeam.get('rb')?.drivers).toEqual(['driver_lawson', 'driver_lindblad']);

    expect(byTeam.get('audi')?.carModelName).toBe('Revolut R26');
    expect(byTeam.get('audi')?.drivers).toEqual(['driver_hulkenberg', 'driver_bortoleto']);

    expect(byTeam.get('mercedes')?.carModelName).toBe('W17');
    expect(byTeam.get('mclaren')?.carModelName).toBe('MCL40');
    expect(byTeam.get('astonmartin')?.carModelName).toBe('AMR26');
    expect(byTeam.get('williams')?.carModelName).toBe('FW48');
    expect(byTeam.get('haas')?.carModelName).toBe('VF-26');
    expect(byTeam.get('cadillac')?.carModelName).toBe('MAC-26');

    const ver = resolved.gridDrivers.find((d) => d.id === 'driver_verstappen');
    expect(ver?.number).toBe(3);
  });

  it('resolve pintura customizada para equipe do jogador mantendo cores escolhidas e dupla ativa', () => {
    const customSpec = resolveTeamLivery2026(
      {
        id: 'apex',
        name: 'Escuderia Brasil 2026',
        shortName: 'BRA',
        carModelName: 'BR-26',
        color: '#009B3A',
        secondaryColor: '#FEDF00',
        isPlayer: true,
        engineSupplier: 'Honda',
      },
      undefined,
      [
        { ...INITIAL_DRIVERS[0], name: 'Lucas Moreau', number: 28 },
        { ...INITIAL_DRIVERS[1], name: 'Rafael Câmara', number: 88 },
      ]
    );

    expect(customSpec.patternStyle).toBe('custom');
    expect(customSpec.primaryHex).toBe('#009B3A');
    expect(customSpec.secondaryHex).toBe('#FEDF00');
    expect(customSpec.carModelName).toBe('BR-26');
    expect(customSpec.drivers[0].number).toBe(28);
    expect(customSpec.drivers[0].tCamHex).toBe('#111318');
    expect(customSpec.drivers[1].number).toBe(88);
    expect(customSpec.drivers[1].tCamHex).toBe('#EAB308');
  });
});
