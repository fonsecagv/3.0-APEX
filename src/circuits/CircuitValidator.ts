import type { CircuitValidationReport, ProcessedCircuitPackage } from './types.ts';

export function validateProcessedCircuit(
  pkg: ProcessedCircuitPackage
): CircuitValidationReport {
  const warnings: string[] = [];
  const errors: string[] = [];

  const { metadata, points, segments, svgCenterlinePath } = pkg;
  const v = pkg.validation;

  if (points.length < 40) {
    errors.push(`Densidade geométrica insuficiente (${points.length} pontos; mínimo 40).`);
  }
  if (!v.hasFiniteGeometry) {
    errors.push('Coordenadas ou curvaturas inválidas (NaN/Infinity detectado).');
  }
  if (!svgCenterlinePath || svgCenterlinePath.length < 16) {
    errors.push('Traçado SVG não gerado.');
  }
  if (segments.length === 0) {
    errors.push('Segmentação física vazia.');
  }

  const totalSegmentM = segments.reduce((acc, s) => acc + s.lengthM, 0);
  if (Math.abs(totalSegmentM - metadata.officialLengthM) > 15) {
    errors.push(
      `Soma dos segmentos (${totalSegmentM} m) diverge do comprimento oficial (${metadata.officialLengthM} m).`
    );
  }

  if (v.lengthDeltaPct > 5.0) {
    warnings.push(
      `Comprimento GeoJSON bruto (${v.calculatedLengthM} m) difere ${v.lengthDeltaPct}% da referência oficial FIA (${v.officialLengthM} m).`
    );
  }

  if (metadata.provenance.certificationStatus === 'initial_geometry_reference') {
    warnings.push(
      `Referência inicial comunitária (${v.pointCount} pontos GeoJSON, ${v.calculatedLengthM} m calculado vs ${v.officialLengthM} m oficial) — não é certificação FIA completa de telemetria.`
    );
  }

  const expectedRaceKm = Math.round(((metadata.laps * metadata.officialLengthM) / 1000) * 1000) / 1000;
  if (Math.abs(expectedRaceKm - metadata.officialRaceDistanceKm) > 1.5) {
    warnings.push(
      `Distância calculada (${expectedRaceKm} km) difere da distância oficial (${metadata.officialRaceDistanceKm} km).`
    );
  }

  return {
    ...v,
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
