import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import type { Feature, LineString, Point, FeatureCollection, Geometry } from 'geojson'
import type { SubsurfaceNetworkType, ElevationRange } from '../types'
import { SUBSURFACE_NETWORK_COLORS, isInElevationRange } from '../types'

/**
 * Tipo de rede de infraestrutura
 */
export type InfrastructureNetworkType = SubsurfaceNetworkType

/**
 * Propriedades de feature de infraestrutura
 */
export interface InfrastructureFeatureProperties {
  id?: string
  network_type: InfrastructureNetworkType
  depth?: number
  diameter?: number
  material?: string
  year_installed?: number
  status?: 'active' | 'inactive' | 'maintenance'
  owner?: string
  [key: string]: unknown
}

/**
 * Cores das redes de infraestrutura
 */
export const INFRASTRUCTURE_NETWORK_COLORS: Record<InfrastructureNetworkType, string> = {
  ...SUBSURFACE_NETWORK_COLORS,
}

/**
 * Labels das redes de infraestrutura
 */
export const INFRASTRUCTURE_NETWORK_LABELS: Record<InfrastructureNetworkType, string> = {
  water: 'Água',
  sewage: 'Esgoto',
  gas: 'Gás',
  electric: 'Elétrica',
  telecom: 'Telecomunicações',
  drainage: 'Drenagem',
  metro: 'Metrô',
}

/**
 * Preset de estilo para camadas de infraestrutura
 */
export type InfrastructurePreset = 'utility-line' | 'utility-point' | 'risk-line' | 'default'

/**
 * Opções para criação da camada de infraestrutura
 */
export interface InfrastructureLayerOptions {
  id?: string
  data:
    | Feature<LineString | Point, InfrastructureFeatureProperties>[]
    | FeatureCollection<LineString | Point, InfrastructureFeatureProperties>
    | string
  networkType?: InfrastructureNetworkType
  networkTypes?: InfrastructureNetworkType[]
  preset?: InfrastructurePreset
  visible?: boolean
  opacity?: number
  pickable?: boolean
  elevationRange?: ElevationRange

  // Line options
  widthScale?: number
  widthMinPixels?: number
  widthMaxPixels?: number
  capRounded?: boolean
  jointRounded?: boolean
  dashed?: boolean
  dashGapPickable?: boolean

  // Point options
  radiusScale?: number
  radiusMinPixels?: number
  radiusMaxPixels?: number
  stroked?: boolean

  // Custom accessors
  getWidth?: (feature: Feature<LineString, InfrastructureFeatureProperties>) => number
  getColor?: (
    feature: Feature<Geometry, InfrastructureFeatureProperties>
  ) => [number, number, number, number]
  getRadius?: (feature: Feature<Point, InfrastructureFeatureProperties>) => number

  // Events
  onClick?: (info: { object?: Feature; layer?: { id: string } }) => void
  onHover?: (info: { object?: Feature; layer?: { id: string } }) => void
}

/**
 * Converte cor hex para RGBA
 */
function hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [128, 128, 128, alpha]
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), alpha]
}

/**
 * Obtém cor por tipo de rede
 */
function getColorByNetworkType(
  networkType: InfrastructureNetworkType,
  opacity: number
): [number, number, number, number] {
  const colorHex = INFRASTRUCTURE_NETWORK_COLORS[networkType] ?? '#808080'
  return hexToRgba(colorHex, Math.round(opacity * 255))
}

/**
 * Obtém coordenadas 3D com profundidade
 */
function getPath3D(
  feature: Feature<LineString, InfrastructureFeatureProperties>
): [number, number, number][] {
  const coords = feature.geometry.coordinates
  const depth = feature.properties?.depth ?? 0

  return coords.map((coord) => [coord[0], coord[1], depth])
}

/**
 * Obtém posição 3D de um ponto
 */
function getPosition3D(
  feature: Feature<Point, InfrastructureFeatureProperties>
): [number, number, number] {
  const coords = feature.geometry.coordinates
  const depth = feature.properties?.depth ?? 0
  return [coords[0], coords[1], depth]
}

/**
 * Aplica preset de estilo
 */
function applyPreset(preset: InfrastructurePreset): Partial<InfrastructureLayerOptions> {
  switch (preset) {
    case 'utility-line':
      return {
        widthMinPixels: 2,
        widthMaxPixels: 8,
        capRounded: true,
        jointRounded: true,
        opacity: 0.85,
      }
    case 'utility-point':
      return {
        radiusMinPixels: 4,
        radiusMaxPixels: 12,
        stroked: true,
        opacity: 0.9,
      }
    case 'risk-line':
      return {
        widthMinPixels: 3,
        widthMaxPixels: 10,
        capRounded: false,
        dashed: true,
        opacity: 0.9,
      }
    case 'default':
    default:
      return {}
  }
}

/**
 * Filtra features por tipo de rede
 */
function filterByNetworkType<G extends Geometry>(
  features: Feature<G, InfrastructureFeatureProperties>[],
  networkType?: InfrastructureNetworkType,
  networkTypes?: InfrastructureNetworkType[]
): Feature<G, InfrastructureFeatureProperties>[] {
  if (!networkType && !networkTypes) return features

  const types = networkTypes ?? (networkType ? [networkType] : [])
  if (types.length === 0) return features

  return features.filter((f) => types.includes(f.properties?.network_type))
}

/**
 * Extrai features de dados
 */
function extractFeatures<G extends Geometry>(
  data:
    | Feature<G, InfrastructureFeatureProperties>[]
    | FeatureCollection<G, InfrastructureFeatureProperties>
): Feature<G, InfrastructureFeatureProperties>[] {
  if (Array.isArray(data)) {
    return data
  }
  return (data.features ?? []) as Feature<G, InfrastructureFeatureProperties>[]
}

/**
 * Separa features por tipo de geometria
 */
function separateByGeometryType(
  data:
    | Feature<LineString | Point, InfrastructureFeatureProperties>[]
    | FeatureCollection<LineString | Point, InfrastructureFeatureProperties>
): {
  lines: Feature<LineString, InfrastructureFeatureProperties>[]
  points: Feature<Point, InfrastructureFeatureProperties>[]
} {
  const features = extractFeatures(data)

  const lines: Feature<LineString, InfrastructureFeatureProperties>[] = []
  const points: Feature<Point, InfrastructureFeatureProperties>[] = []

  for (const feature of features) {
    if (feature.geometry.type === 'LineString') {
      lines.push(feature as Feature<LineString, InfrastructureFeatureProperties>)
    } else if (feature.geometry.type === 'Point') {
      points.push(feature as Feature<Point, InfrastructureFeatureProperties>)
    }
  }

  return { lines, points }
}

/**
 * Cria uma camada de infraestrutura unificada
 * Suporta linhas (tubulações) e pontos (válvulas, poços) automaticamente
 */
export function createInfrastructureLayer(options: InfrastructureLayerOptions): PathLayer {
  const preset = options.preset ? applyPreset(options.preset) : {}
  const mergedOptions = { ...preset, ...options }

  const {
    id = 'infrastructure-layer',
    data,
    networkType,
    networkTypes,
    visible = true,
    opacity = 0.8,
    pickable = true,
    widthScale = 1,
    widthMinPixels = 2,
    widthMaxPixels = 10,
    capRounded = true,
    jointRounded = true,
    getWidth,
    getColor,
    onClick,
    onHover,
  } = mergedOptions

  // Se os dados são URL, passa direto para o PathLayer
  if (typeof data === 'string') {
    return new PathLayer<Feature<LineString, InfrastructureFeatureProperties>>({
      id,
      data: data as unknown as Feature<LineString, InfrastructureFeatureProperties>[],
      visible,
      opacity,
      pickable,
      widthScale,
      widthMinPixels,
      widthMaxPixels,
      capRounded,
      jointRounded,
      billboard: false,

      getPath: (feature) => getPath3D(feature),

      getWidth: (feature) => {
        if (getWidth) return getWidth(feature)
        const diameter = feature.properties?.diameter ?? 100
        return diameter / 100
      },

      getColor: (feature) => {
        if (getColor) return getColor(feature)
        const type = networkType ?? feature.properties?.network_type ?? 'water'
        return getColorByNetworkType(type, opacity)
      },

      onClick: onClick as (info: unknown) => void,
      onHover: onHover as (info: unknown) => void,

      updateTriggers: {
        getColor: [opacity, networkType, networkTypes],
      },
    })
  }

  // Extrai e filtra features
  const { lines } = separateByGeometryType(data)
  const filteredLines = filterByNetworkType(lines, networkType, networkTypes)

  return new PathLayer<Feature<LineString, InfrastructureFeatureProperties>>({
    id,
    data: filteredLines,
    visible,
    opacity,
    pickable,
    widthScale,
    widthMinPixels,
    widthMaxPixels,
    capRounded,
    jointRounded,
    billboard: false,

    getPath: (feature) => getPath3D(feature),

    getWidth: (feature) => {
      if (getWidth) return getWidth(feature)
      const diameter = feature.properties?.diameter ?? 100
      return diameter / 100
    },

    getColor: (feature) => {
      if (getColor) return getColor(feature)
      const type = networkType ?? feature.properties?.network_type ?? 'water'
      return getColorByNetworkType(type, opacity)
    },

    onClick: onClick as (info: unknown) => void,
    onHover: onHover as (info: unknown) => void,

    updateTriggers: {
      getColor: [opacity, networkType, networkTypes],
    },
  })
}

/**
 * Cria uma camada de pontos de infraestrutura (válvulas, poços, etc.)
 */
export function createInfrastructurePointLayer(
  options: InfrastructureLayerOptions
): ScatterplotLayer {
  const preset = options.preset ? applyPreset(options.preset) : {}
  const mergedOptions = { ...preset, ...options }

  const {
    id = 'infrastructure-points-layer',
    data,
    networkType,
    networkTypes,
    visible = true,
    opacity = 0.8,
    pickable = true,
    radiusScale = 1,
    radiusMinPixels = 4,
    radiusMaxPixels = 15,
    stroked = true,
    getColor,
    getRadius,
    onClick,
    onHover,
  } = mergedOptions

  // Se os dados são URL, passa direto
  if (typeof data === 'string') {
    return new ScatterplotLayer<Feature<Point, InfrastructureFeatureProperties>>({
      id,
      data: data as unknown as Feature<Point, InfrastructureFeatureProperties>[],
      visible,
      opacity,
      pickable,
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      stroked,
      lineWidthMinPixels: 1,

      getPosition: (feature) => getPosition3D(feature),

      getRadius: (feature) => {
        if (getRadius) return getRadius(feature)
        const diameter = feature.properties?.diameter ?? 500
        return diameter / 200
      },

      getFillColor: (feature) => {
        if (getColor) return getColor(feature)
        const type = networkType ?? feature.properties?.network_type ?? 'water'
        return getColorByNetworkType(type, opacity)
      },

      getLineColor: [255, 255, 255, 200],

      onClick: onClick as (info: unknown) => void,
      onHover: onHover as (info: unknown) => void,

      updateTriggers: {
        getFillColor: [opacity, networkType, networkTypes],
      },
    })
  }

  // Extrai e filtra features
  const { points } = separateByGeometryType(data)
  const filteredPoints = filterByNetworkType(points, networkType, networkTypes)

  return new ScatterplotLayer<Feature<Point, InfrastructureFeatureProperties>>({
    id,
    data: filteredPoints,
    visible,
    opacity,
    pickable,
    radiusScale,
    radiusMinPixels,
    radiusMaxPixels,
    stroked,
    lineWidthMinPixels: 1,

    getPosition: (feature) => getPosition3D(feature),

    getRadius: (feature) => {
      if (getRadius) return getRadius(feature)
      const diameter = feature.properties?.diameter ?? 500
      return diameter / 200
    },

    getFillColor: (feature) => {
      if (getColor) return getColor(feature)
      const type = networkType ?? feature.properties?.network_type ?? 'water'
      return getColorByNetworkType(type, opacity)
    },

    getLineColor: [255, 255, 255, 200],

    onClick: onClick as (info: unknown) => void,
    onHover: onHover as (info: unknown) => void,

    updateTriggers: {
      getFillColor: [opacity, networkType, networkTypes],
    },
  })
}

/**
 * Agrupa features de infraestrutura por tipo de rede
 */
export function groupInfrastructureByNetwork<G extends Geometry>(
  features: Feature<G, InfrastructureFeatureProperties>[]
): Record<InfrastructureNetworkType, Feature<G, InfrastructureFeatureProperties>[]> {
  const groups: Record<InfrastructureNetworkType, Feature<G, InfrastructureFeatureProperties>[]> = {
    water: [],
    sewage: [],
    gas: [],
    electric: [],
    telecom: [],
    drainage: [],
    metro: [],
  }

  for (const feature of features) {
    const networkType = feature.properties?.network_type
    if (networkType && groups[networkType]) {
      groups[networkType].push(feature)
    }
  }

  return groups
}

/**
 * Filtra features de infraestrutura por range de elevação
 */
export function filterInfrastructureByElevation<G extends Geometry>(
  features: Feature<G, InfrastructureFeatureProperties>[],
  range: ElevationRange
): Feature<G, InfrastructureFeatureProperties>[] {
  return features.filter((feature) => {
    const depth = feature.properties?.depth ?? 0
    return isInElevationRange(depth, depth, range)
  })
}

/**
 * Obtém estatísticas de infraestrutura
 */
export function getInfrastructureStats(
  features: Feature<Geometry, InfrastructureFeatureProperties>[]
): {
  total: number
  byNetwork: Record<InfrastructureNetworkType, number>
  byStatus: Record<string, number>
} {
  const byNetwork: Record<InfrastructureNetworkType, number> = {
    water: 0,
    sewage: 0,
    gas: 0,
    electric: 0,
    telecom: 0,
    drainage: 0,
    metro: 0,
  }

  const byStatus: Record<string, number> = {}

  for (const feature of features) {
    const networkType = feature.properties?.network_type
    if (networkType && networkType in byNetwork) {
      byNetwork[networkType]++
    }

    const status = feature.properties?.status ?? 'unknown'
    byStatus[status] = (byStatus[status] ?? 0) + 1
  }

  return {
    total: features.length,
    byNetwork,
    byStatus,
  }
}

export default createInfrastructureLayer
