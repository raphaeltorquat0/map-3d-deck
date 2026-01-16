import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import type { Feature, LineString, Point } from 'geojson'
import type { SubsurfaceFeatureProperties, ElevationRange, SubsurfaceNetworkType } from '../types'
import { isInElevationRange, SUBSURFACE_NETWORK_COLORS } from '../types'

/**
 * Opções para criação da camada de infraestrutura subterrânea
 */
export interface SubsurfaceLayerOptions {
  id?: string
  data: Feature<LineString, SubsurfaceFeatureProperties>[] | string
  visible?: boolean
  opacity?: number
  pickable?: boolean
  elevationRange?: ElevationRange
  widthScale?: number
  widthMinPixels?: number
  widthMaxPixels?: number
  networkTypes?: SubsurfaceNetworkType[] // Filtrar por tipo de rede
  getWidth?: (feature: Feature<LineString, SubsurfaceFeatureProperties>) => number
  getColor?: (feature: Feature<LineString, SubsurfaceFeatureProperties>) => [number, number, number, number]
  onClick?: (info: { object?: Feature }) => void
  onHover?: (info: { object?: Feature }) => void
}

/**
 * Opções para camada de pontos de acesso (poços, bueiros, etc.)
 */
export interface AccessPointLayerOptions {
  id?: string
  data: Feature<Point, SubsurfaceFeatureProperties>[] | string
  visible?: boolean
  opacity?: number
  pickable?: boolean
  radiusScale?: number
  radiusMinPixels?: number
  radiusMaxPixels?: number
  networkTypes?: SubsurfaceNetworkType[]
  onClick?: (info: { object?: Feature }) => void
  onHover?: (info: { object?: Feature }) => void
}

/**
 * Converte cor hex para RGBA
 */
function hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [128, 128, 128, alpha]
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    alpha,
  ]
}

/**
 * Obtém coordenadas 3D com profundidade
 */
function getPath3D(
  feature: Feature<LineString, SubsurfaceFeatureProperties>
): [number, number, number][] {
  const coords = feature.geometry.coordinates
  const depth = feature.properties?.depth ?? -5

  return coords.map((coord) => [
    coord[0],
    coord[1],
    depth, // Profundidade como Z (negativo)
  ])
}

/**
 * Cria uma camada de redes subterrâneas
 */
export function createSubsurfaceLayer(options: SubsurfaceLayerOptions): PathLayer {
  const {
    id = 'subsurface-layer',
    data,
    visible = true,
    opacity = 0.8,
    pickable = true,
    widthScale = 1,
    widthMinPixels = 2,
    widthMaxPixels = 10,
    networkTypes,
    getWidth,
    getColor,
    onClick,
    onHover,
  } = options

  // Filtra dados por tipo de rede se especificado
  const filteredData = networkTypes && Array.isArray(data)
    ? data.filter((f) => networkTypes.includes(f.properties?.network_type))
    : data

  return new PathLayer<Feature<LineString, SubsurfaceFeatureProperties>>({
    id,
    data: filteredData as Feature<LineString, SubsurfaceFeatureProperties>[],
    visible,
    opacity,
    pickable,
    widthScale,
    widthMinPixels,
    widthMaxPixels,

    // Caminho 3D com profundidade
    getPath: (feature) => getPath3D(feature),

    // Largura baseada no diâmetro (se disponível)
    getWidth: (feature) => {
      if (getWidth) {
        return getWidth(feature)
      }
      const diameter = feature.properties?.diameter ?? 100
      return diameter / 100 // Converte mm para metros
    },

    // Cor baseada no tipo de rede
    getColor: (feature) => {
      if (getColor) {
        return getColor(feature)
      }
      const networkType = feature.properties?.network_type ?? 'water'
      const colorHex = SUBSURFACE_NETWORK_COLORS[networkType]
      return hexToRgba(colorHex, Math.round(opacity * 255))
    },

    // Configurações visuais
    capRounded: true,
    jointRounded: true,
    billboard: false,

    // Eventos
    onClick: onClick as (info: unknown) => void,
    onHover: onHover as (info: unknown) => void,

    // Atualização automática
    updateTriggers: {
      getColor: [opacity, networkTypes],
      getPath: [],
    },
  })
}

/**
 * Cria uma camada de pontos de acesso (poços, bueiros, válvulas)
 */
export function createAccessPointLayer(options: AccessPointLayerOptions): ScatterplotLayer {
  const {
    id = 'access-points-layer',
    data,
    visible = true,
    opacity = 0.8,
    pickable = true,
    radiusScale = 1,
    radiusMinPixels = 3,
    radiusMaxPixels = 15,
    networkTypes,
    onClick,
    onHover,
  } = options

  // Filtra dados por tipo de rede se especificado
  const filteredData = networkTypes && Array.isArray(data)
    ? data.filter((f) => networkTypes.includes(f.properties?.network_type))
    : data

  return new ScatterplotLayer<Feature<Point, SubsurfaceFeatureProperties>>({
    id,
    data: filteredData as Feature<Point, SubsurfaceFeatureProperties>[],
    visible,
    opacity,
    pickable,
    radiusScale,
    radiusMinPixels,
    radiusMaxPixels,

    // Posição 3D
    getPosition: (feature) => {
      const coords = feature.geometry.coordinates
      const depth = feature.properties?.depth ?? -5
      return [coords[0], coords[1], depth]
    },

    // Raio baseado no diâmetro
    getRadius: (feature) => {
      const diameter = feature.properties?.diameter ?? 500
      return diameter / 200 // Tamanho visual
    },

    // Cor baseada no tipo
    getFillColor: (feature) => {
      const networkType = feature.properties?.network_type ?? 'water'
      const colorHex = SUBSURFACE_NETWORK_COLORS[networkType]
      return hexToRgba(colorHex, Math.round(opacity * 255))
    },

    getLineColor: [255, 255, 255, 200],
    stroked: true,
    lineWidthMinPixels: 1,

    // Eventos
    onClick: onClick as (info: unknown) => void,
    onHover: onHover as (info: unknown) => void,
  })
}

/**
 * Filtra features subterrâneas por range de elevação
 */
export function filterSubsurfaceByElevation(
  features: Feature<LineString | Point, SubsurfaceFeatureProperties>[],
  range: ElevationRange
): Feature<LineString | Point, SubsurfaceFeatureProperties>[] {
  return features.filter((feature) => {
    const depth = feature.properties?.depth ?? 0
    // Profundidade é negativa, então min e max são invertidos
    return isInElevationRange(depth, depth, range)
  })
}

/**
 * Agrupa features subterrâneas por tipo de rede
 */
export function groupSubsurfaceByNetwork(
  features: Feature<LineString | Point, SubsurfaceFeatureProperties>[]
): Record<SubsurfaceNetworkType, Feature<LineString | Point, SubsurfaceFeatureProperties>[]> {
  const groups: Record<SubsurfaceNetworkType, Feature<LineString | Point, SubsurfaceFeatureProperties>[]> = {
    water: [],
    sewage: [],
    gas: [],
    electric: [],
    telecom: [],
    drainage: [],
    metro: [],
  }

  features.forEach((feature) => {
    const networkType = feature.properties?.network_type
    if (networkType && groups[networkType]) {
      groups[networkType].push(feature)
    }
  })

  return groups
}

/**
 * Agrupa features subterrâneas por faixa de profundidade
 */
export function groupSubsurfaceByDepth(
  features: Feature<LineString | Point, SubsurfaceFeatureProperties>[]
): {
  shallow: Feature<LineString | Point, SubsurfaceFeatureProperties>[]  // 0 a -5m
  medium: Feature<LineString | Point, SubsurfaceFeatureProperties>[]   // -5 a -15m
  deep: Feature<LineString | Point, SubsurfaceFeatureProperties>[]     // -15m+
} {
  const groups = {
    shallow: [] as Feature<LineString | Point, SubsurfaceFeatureProperties>[],
    medium: [] as Feature<LineString | Point, SubsurfaceFeatureProperties>[],
    deep: [] as Feature<LineString | Point, SubsurfaceFeatureProperties>[],
  }

  features.forEach((feature) => {
    const depth = feature.properties?.depth ?? 0
    if (depth >= -5) {
      groups.shallow.push(feature)
    } else if (depth >= -15) {
      groups.medium.push(feature)
    } else {
      groups.deep.push(feature)
    }
  })

  return groups
}

export default createSubsurfaceLayer
