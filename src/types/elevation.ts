/**
 * Tipos de elevação para classificação vertical de features
 */
export type ElevationType =
  | 'deep_subsurface' // -50m a -20m: Metrô, fundações
  | 'shallow_subsurface' // -20m a 0m: Água, esgoto, gás, drenagem
  | 'surface' // 0m: Zoneamento, lotes, geotécnica
  | 'low_elevation' // 0m a 15m: Edifícios baixos (até 5 pav)
  | 'medium_elevation' // 15m a 50m: Edifícios médios
  | 'high_elevation' // 50m a 200m: Torres/arranha-céus

/**
 * Definição de um nível de elevação
 */
export interface ElevationLevel {
  type: ElevationType
  label: string
  labelShort: string
  minHeight: number
  maxHeight: number
  color: string
  description: string
}

/**
 * Range de elevação (min/max)
 */
export interface ElevationRange {
  min: number
  max: number
}

/**
 * Preset de elevação pré-configurado
 */
export interface ElevationPreset {
  id: string
  label: string
  range: ElevationRange
}

/**
 * Níveis de elevação pré-definidos
 */
export const ELEVATION_LEVELS: readonly ElevationLevel[] = [
  {
    type: 'deep_subsurface',
    label: 'Subsolo Profundo',
    labelShort: 'Prof.',
    minHeight: -50,
    maxHeight: -20,
    color: '#1E3A5F',
    description: 'Metrô, fundações profundas',
  },
  {
    type: 'shallow_subsurface',
    label: 'Subsolo Raso',
    labelShort: 'Raso',
    minHeight: -20,
    maxHeight: 0,
    color: '#3B82F6',
    description: 'Água, esgoto, gás, drenagem',
  },
  {
    type: 'surface',
    label: 'Superfície',
    labelShort: 'Sup.',
    minHeight: 0,
    maxHeight: 0,
    color: '#22C55E',
    description: 'Zoneamento, lotes, geotécnica',
  },
  {
    type: 'low_elevation',
    label: 'Baixa Elevação',
    labelShort: 'Baixo',
    minHeight: 0,
    maxHeight: 15,
    color: '#F59E0B',
    description: 'Edifícios baixos (até 5 pavimentos)',
  },
  {
    type: 'medium_elevation',
    label: 'Média Elevação',
    labelShort: 'Médio',
    minHeight: 15,
    maxHeight: 50,
    color: '#EF4444',
    description: 'Edifícios médios',
  },
  {
    type: 'high_elevation',
    label: 'Alta Elevação',
    labelShort: 'Alto',
    minHeight: 50,
    maxHeight: 200,
    color: '#8B5CF6',
    description: 'Torres e arranha-céus',
  },
] as const

/**
 * Presets de elevação pré-configurados
 */
export const ELEVATION_PRESETS: readonly ElevationPreset[] = [
  {
    id: 'subsurface',
    label: 'Subsolo',
    range: { min: -50, max: 0 },
  },
  {
    id: 'surface',
    label: 'Superfície',
    range: { min: -5, max: 5 },
  },
  {
    id: 'buildings',
    label: 'Edifícios',
    range: { min: 0, max: 200 },
  },
  {
    id: 'all',
    label: 'Tudo',
    range: { min: -50, max: 200 },
  },
] as const

/**
 * Obtém o nível de elevação para uma altura específica
 */
export function getElevationLevel(height: number): ElevationLevel | undefined {
  return ELEVATION_LEVELS.find((level) => height >= level.minHeight && height <= level.maxHeight)
}

/**
 * Obtém a cor para uma altura específica
 */
export function getElevationColor(height: number): string {
  const level = getElevationLevel(height)
  return level?.color ?? '#6B7280'
}

/**
 * Verifica se uma feature está dentro do range de elevação
 */
export function isInElevationRange(
  featureMin: number,
  featureMax: number,
  range: ElevationRange
): boolean {
  return featureMax >= range.min && featureMin <= range.max
}

/**
 * Constantes de elevação
 */
export const ELEVATION_BOUNDS = {
  MIN: -50,
  MAX: 200,
  TOTAL_RANGE: 250,
} as const
