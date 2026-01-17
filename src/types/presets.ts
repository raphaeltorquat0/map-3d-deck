/**
 * Sistema de presets de estilo para camadas
 */

/**
 * Identificadores de presets de camada
 */
export type LayerPresetId =
  | 'utility-line'
  | 'utility-point'
  | 'risk-area'
  | 'building-3d'
  | 'building-flat'
  | 'zoning-3d'
  | 'zoning-flat'
  | 'custom'

/**
 * Configuração de material 3D
 */
export interface Material3DConfig {
  ambient: number
  diffuse: number
  shininess: number
  specularColor: [number, number, number]
}

/**
 * Configuração de preset para linhas
 */
export interface LinePresetConfig {
  widthMinPixels?: number
  widthMaxPixels?: number
  widthScale?: number
  capRounded?: boolean
  jointRounded?: boolean
  dashed?: boolean
  dashGapPickable?: boolean
  opacity?: number
}

/**
 * Configuração de preset para pontos
 */
export interface PointPresetConfig {
  radiusMinPixels?: number
  radiusMaxPixels?: number
  radiusScale?: number
  stroked?: boolean
  lineWidthMinPixels?: number
  opacity?: number
}

/**
 * Configuração de preset para polígonos
 */
export interface PolygonPresetConfig {
  filled?: boolean
  stroked?: boolean
  extruded?: boolean
  wireframe?: boolean
  elevationScale?: number
  lineWidthMinPixels?: number
  opacity?: number
  material?: Material3DConfig
}

/**
 * Configuração completa de um preset
 */
export interface LayerPreset {
  id: LayerPresetId
  name: string
  description: string
  type: 'line' | 'point' | 'polygon' | 'mixed'
  config: LinePresetConfig | PointPresetConfig | PolygonPresetConfig
}

/**
 * Mapa de presets disponíveis por ID
 */
export type LayerPresetsMap = Record<LayerPresetId, LayerPreset>
