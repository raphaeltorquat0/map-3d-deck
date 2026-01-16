import { PolygonLayer } from '@deck.gl/layers'
import type { Feature, Polygon, MultiPolygon } from 'geojson'
import type { BuildingFeatureProperties, ElevationRange } from '../types'
import { isInElevationRange, BUILDING_USE_COLORS } from '../types'

/**
 * Opções para criação da camada de edifícios
 */
export interface BuildingLayerOptions {
  id?: string
  data: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[] | string
  visible?: boolean
  opacity?: number
  pickable?: boolean
  extruded?: boolean
  wireframe?: boolean
  elevationRange?: ElevationRange
  elevationScale?: number
  getHeight?: (feature: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>) => number
  getFillColor?: (
    feature: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>
  ) => [number, number, number, number]
  getLineColor?: [number, number, number, number]
  lineWidthMinPixels?: number
  showMaxHeight?: boolean // Mostra gabarito máximo como wireframe
  onClick?: (info: { object?: Feature }) => void
  onHover?: (info: { object?: Feature }) => void
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
 * Extrai coordenadas do polígono
 */
function getPolygonCoordinates(
  feature: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>
): number[][][] {
  const geometry = feature.geometry
  if (geometry.type === 'Polygon') {
    return geometry.coordinates
  }
  // MultiPolygon - retorna o primeiro polígono
  return geometry.coordinates[0]
}

/**
 * Cria uma camada de edifícios extrudados
 */
export function createBuildingLayer(options: BuildingLayerOptions): PolygonLayer {
  const {
    id = 'building-layer',
    data,
    visible = true,
    opacity = 0.8,
    pickable = true,
    extruded = true,
    wireframe = false,
    elevationRange: _elevationRange,
    elevationScale = 1,
    getHeight,
    getFillColor,
    getLineColor = [255, 255, 255, 100],
    lineWidthMinPixels = 1,
    onClick,
    onHover,
  } = options

  return new PolygonLayer<Feature<Polygon | MultiPolygon, BuildingFeatureProperties>>({
    id,
    data: data as Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[],
    visible,
    opacity,
    pickable,
    extruded,
    wireframe,

    // Obtém polígono do feature
    getPolygon: (feature) => getPolygonCoordinates(feature),

    // Altura do edifício
    getElevation: (feature) => {
      if (getHeight) {
        return getHeight(feature) * elevationScale
      }
      const props = feature.properties
      return (props?.height ?? 10) * elevationScale
    },

    // Elevação base (para edifícios sobre terreno irregular)
    // getElevationBase: (feature) => {
    //   const props = feature.properties
    //   return props?.elevation_base ?? 0
    // },

    // Cor de preenchimento baseada no uso
    getFillColor: (feature) => {
      if (getFillColor) {
        return getFillColor(feature)
      }
      const props = feature.properties
      const useType = props?.use_type ?? 'residential'
      const colorHex = BUILDING_USE_COLORS[useType]
      return hexToRgba(colorHex, Math.round(opacity * 255))
    },

    getLineColor: () => getLineColor,
    lineWidthMinPixels,

    // Material para iluminação 3D
    material: {
      ambient: 0.35,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [30, 30, 30],
    },

    // Eventos
    onClick: onClick as (info: unknown) => void,
    onHover: onHover as (info: unknown) => void,

    // Atualização automática
    updateTriggers: {
      getFillColor: [opacity],
      getElevation: [elevationScale],
    },
  })
}

/**
 * Cria uma camada de gabarito máximo (wireframe)
 * Mostra a altura máxima permitida pela zona
 */
export function createMaxHeightLayer(
  options: BuildingLayerOptions & { maxHeights: Map<string, number> }
): PolygonLayer {
  const { id = 'max-height-layer', data, visible = true, maxHeights, elevationScale = 1 } = options

  return new PolygonLayer<Feature<Polygon | MultiPolygon, BuildingFeatureProperties>>({
    id,
    data: data as Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[],
    visible,
    opacity: 0.3,
    pickable: false,
    extruded: true,
    wireframe: true,

    getPolygon: (feature) => getPolygonCoordinates(feature),

    getElevation: (feature) => {
      const props = feature.properties
      const zoneMaxHeight = maxHeights.get(props?.zone_code ?? '') ?? 50
      return zoneMaxHeight * elevationScale
    },

    getFillColor: [100, 100, 100, 50],
    getLineColor: [255, 255, 255, 100],
    lineWidthMinPixels: 1,
  })
}

/**
 * Filtra features de edifícios por range de elevação
 */
export function filterBuildingsByElevation(
  features: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[],
  range: ElevationRange
): Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[] {
  return features.filter((feature) => {
    const props = feature.properties
    const featureMin = props?.elevation_base ?? 0
    const featureMax = (props?.elevation_base ?? 0) + (props?.height ?? 0)
    return isInElevationRange(featureMin, featureMax, range)
  })
}

/**
 * Agrupa edifícios por faixa de altura
 */
export function groupBuildingsByHeight(
  features: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[]
): {
  low: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[] // 0-15m
  medium: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[] // 15-50m
  high: Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[] // 50m+
} {
  const groups = {
    low: [] as Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[],
    medium: [] as Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[],
    high: [] as Feature<Polygon | MultiPolygon, BuildingFeatureProperties>[],
  }

  features.forEach((feature) => {
    const height = feature.properties?.height ?? 0
    if (height <= 15) {
      groups.low.push(feature)
    } else if (height <= 50) {
      groups.medium.push(feature)
    } else {
      groups.high.push(feature)
    }
  })

  return groups
}

export default createBuildingLayer
