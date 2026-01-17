/**
 * Presets de estilo para camadas
 */

import type {
  LayerPreset,
  LayerPresetId,
  LayerPresetsMap,
  LinePresetConfig,
  PointPresetConfig,
  PolygonPresetConfig,
  Material3DConfig,
} from '../types/presets'

/**
 * Material padrão para camadas 3D
 */
export const DEFAULT_3D_MATERIAL: Material3DConfig = {
  ambient: 0.35,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [30, 30, 30],
}

/**
 * Preset para linhas de utilidades (tubulações, cabos)
 */
export const UTILITY_LINE_PRESET: LinePresetConfig = {
  widthMinPixels: 2,
  widthMaxPixels: 8,
  widthScale: 1,
  capRounded: true,
  jointRounded: true,
  opacity: 0.85,
}

/**
 * Preset para pontos de utilidades (válvulas, poços, caixas)
 */
export const UTILITY_POINT_PRESET: PointPresetConfig = {
  radiusMinPixels: 4,
  radiusMaxPixels: 12,
  radiusScale: 1,
  stroked: true,
  lineWidthMinPixels: 1,
  opacity: 0.9,
}

/**
 * Preset para áreas de risco
 */
export const RISK_AREA_PRESET: PolygonPresetConfig = {
  filled: true,
  stroked: true,
  extruded: false,
  lineWidthMinPixels: 2,
  opacity: 0.6,
}

/**
 * Preset para edificações 3D
 */
export const BUILDING_3D_PRESET: PolygonPresetConfig = {
  filled: true,
  stroked: false,
  extruded: true,
  wireframe: false,
  elevationScale: 1,
  opacity: 0.9,
  material: DEFAULT_3D_MATERIAL,
}

/**
 * Preset para edificações 2D (planta)
 */
export const BUILDING_FLAT_PRESET: PolygonPresetConfig = {
  filled: true,
  stroked: true,
  extruded: false,
  lineWidthMinPixels: 1,
  opacity: 0.7,
}

/**
 * Preset para zoneamento 3D
 */
export const ZONING_3D_PRESET: PolygonPresetConfig = {
  filled: true,
  stroked: true,
  extruded: true,
  wireframe: true,
  elevationScale: 1,
  lineWidthMinPixels: 1,
  opacity: 0.7,
  material: DEFAULT_3D_MATERIAL,
}

/**
 * Preset para zoneamento 2D
 */
export const ZONING_FLAT_PRESET: PolygonPresetConfig = {
  filled: true,
  stroked: true,
  extruded: false,
  lineWidthMinPixels: 1,
  opacity: 0.6,
}

/**
 * Mapa completo de presets
 */
export const LAYER_PRESETS: LayerPresetsMap = {
  'utility-line': {
    id: 'utility-line',
    name: 'Linha de Utilidade',
    description: 'Estilo para tubulações e cabos de infraestrutura',
    type: 'line',
    config: UTILITY_LINE_PRESET,
  },
  'utility-point': {
    id: 'utility-point',
    name: 'Ponto de Utilidade',
    description: 'Estilo para válvulas, poços e caixas de inspeção',
    type: 'point',
    config: UTILITY_POINT_PRESET,
  },
  'risk-area': {
    id: 'risk-area',
    name: 'Área de Risco',
    description: 'Estilo para áreas de risco (inundação, deslizamento, etc.)',
    type: 'polygon',
    config: RISK_AREA_PRESET,
  },
  'building-3d': {
    id: 'building-3d',
    name: 'Edificação 3D',
    description: 'Estilo para edificações com extrusão 3D',
    type: 'polygon',
    config: BUILDING_3D_PRESET,
  },
  'building-flat': {
    id: 'building-flat',
    name: 'Edificação 2D',
    description: 'Estilo para edificações em planta (2D)',
    type: 'polygon',
    config: BUILDING_FLAT_PRESET,
  },
  'zoning-3d': {
    id: 'zoning-3d',
    name: 'Zoneamento 3D',
    description: 'Estilo para zoneamento com gabarito 3D',
    type: 'polygon',
    config: ZONING_3D_PRESET,
  },
  'zoning-flat': {
    id: 'zoning-flat',
    name: 'Zoneamento 2D',
    description: 'Estilo para zoneamento em planta',
    type: 'polygon',
    config: ZONING_FLAT_PRESET,
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Configuração personalizada',
    type: 'mixed',
    config: {},
  },
}

/**
 * Obtém um preset pelo ID
 */
export function getPreset(id: LayerPresetId): LayerPreset {
  return LAYER_PRESETS[id] ?? LAYER_PRESETS.custom
}

/**
 * Obtém configuração de preset para linhas
 */
export function getLinePreset(id: LayerPresetId): LinePresetConfig {
  const preset = getPreset(id)
  if (preset.type !== 'line') {
    return UTILITY_LINE_PRESET
  }
  return preset.config as LinePresetConfig
}

/**
 * Obtém configuração de preset para pontos
 */
export function getPointPreset(id: LayerPresetId): PointPresetConfig {
  const preset = getPreset(id)
  if (preset.type !== 'point') {
    return UTILITY_POINT_PRESET
  }
  return preset.config as PointPresetConfig
}

/**
 * Obtém configuração de preset para polígonos
 */
export function getPolygonPreset(id: LayerPresetId): PolygonPresetConfig {
  const preset = getPreset(id)
  if (preset.type !== 'polygon') {
    return ZONING_FLAT_PRESET
  }
  return preset.config as PolygonPresetConfig
}

/**
 * Lista todos os presets disponíveis
 */
export function listPresets(): LayerPreset[] {
  return Object.values(LAYER_PRESETS)
}

/**
 * Lista presets por tipo
 */
export function listPresetsByType(type: LayerPreset['type']): LayerPreset[] {
  return Object.values(LAYER_PRESETS).filter((preset) => preset.type === type)
}

/**
 * Merge de preset com opções customizadas
 */
export function mergePresetWithOptions<T extends Record<string, unknown>>(
  presetConfig: T,
  options: Partial<T>
): T {
  return { ...presetConfig, ...options }
}
