import { GeoJsonLayer } from '@deck.gl/layers'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { ZoningFeatureProperties, ElevationRange } from '../types'
import { isInElevationRange } from '../types'

/**
 * Opções para criação da camada de zoneamento
 */
export interface ZoningLayerOptions {
  id?: string
  data: FeatureCollection | string // GeoJSON ou URL
  visible?: boolean
  opacity?: number
  pickable?: boolean
  stroked?: boolean
  filled?: boolean
  extruded?: boolean
  wireframe?: boolean
  elevationRange?: ElevationRange
  elevationScale?: number
  getHeight?: (feature: Feature<Geometry, ZoningFeatureProperties>) => number
  getFillColor?: (
    feature: Feature<Geometry, ZoningFeatureProperties>
  ) => [number, number, number, number]
  getLineColor?: (
    feature: Feature<Geometry, ZoningFeatureProperties>
  ) => [number, number, number, number]
  lineWidthMinPixels?: number
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
 * Cor padrão por tipo de zona (baseado no código)
 */
function getDefaultZoneColor(zoneCode: string): [number, number, number, number] {
  const code = zoneCode.toUpperCase()

  // Residencial
  if (code.startsWith('ZR') || code.startsWith('R')) {
    return [34, 197, 94, 180] // Verde
  }
  // Comercial
  if (code.startsWith('ZC') || code.startsWith('C')) {
    return [59, 130, 246, 180] // Azul
  }
  // Misto
  if (code.startsWith('ZM') || code.startsWith('M')) {
    return [139, 92, 246, 180] // Roxo
  }
  // Industrial
  if (code.startsWith('ZI') || code.startsWith('I')) {
    return [245, 158, 11, 180] // Laranja
  }
  // Especial
  if (code.startsWith('ZE') || code.startsWith('E')) {
    return [239, 68, 68, 180] // Vermelho
  }
  // Preservação
  if (code.startsWith('ZP') || code.startsWith('P')) {
    return [16, 185, 129, 180] // Verde escuro
  }

  return [128, 128, 128, 180] // Cinza padrão
}

/**
 * Cria uma camada de zoneamento usando GeoJsonLayer
 */
export function createZoningLayer(options: ZoningLayerOptions): GeoJsonLayer {
  const {
    id = 'zoning-layer',
    data,
    visible = true,
    opacity = 0.7,
    pickable = true,
    stroked = true,
    filled = true,
    extruded = false,
    wireframe = false,
    elevationRange,
    elevationScale = 1,
    getHeight,
    getFillColor,
    getLineColor,
    lineWidthMinPixels = 1,
    onClick,
    onHover,
  } = options

  return new GeoJsonLayer({
    id,
    data,
    visible,
    opacity,
    pickable,
    stroked,
    filled,
    extruded,
    wireframe,

    // Elevação (para modo 3D)
    getElevation: (feature: Feature<Geometry, ZoningFeatureProperties>) => {
      if (getHeight) {
        return getHeight(feature) * elevationScale
      }
      // Usa gabarito máximo como altura de extrusão
      const props = feature.properties as ZoningFeatureProperties
      return (props?.max_height ?? 0) * elevationScale
    },

    // Cor de preenchimento
    getFillColor: (feature: Feature<Geometry, ZoningFeatureProperties>) => {
      if (getFillColor) {
        return getFillColor(feature)
      }
      const props = feature.properties as ZoningFeatureProperties
      // Usa cor definida no feature ou cor padrão por código
      if (props?.color) {
        return hexToRgba(props.color, Math.round(opacity * 255))
      }
      return getDefaultZoneColor(props?.zone_code ?? '')
    },

    // Cor da linha
    getLineColor: (feature: Feature<Geometry, ZoningFeatureProperties>) => {
      if (getLineColor) {
        return getLineColor(feature)
      }
      return [255, 255, 255, 200]
    },

    lineWidthMinPixels,

    // Filtra por elevação se especificado
    filterRange: elevationRange ? [[elevationRange.min, elevationRange.max]] : undefined,

    // Material para 3D
    material: extruded
      ? {
          ambient: 0.35,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [30, 30, 30],
        }
      : undefined,

    // Eventos
    onClick: onClick as (info: unknown) => void,
    onHover: onHover as (info: unknown) => void,

    // Atualização automática
    updateTriggers: {
      getFillColor: [opacity],
      getElevation: [elevationScale, extruded],
    },

    // Transições suaves
    transitions: {
      getElevation: 500,
      getFillColor: 300,
    },
  })
}

/**
 * Filtra features de zoneamento por range de elevação
 */
export function filterZoningByElevation(
  features: Feature<Geometry, ZoningFeatureProperties>[],
  range: ElevationRange
): Feature<Geometry, ZoningFeatureProperties>[] {
  return features.filter((feature) => {
    const props = feature.properties as ZoningFeatureProperties
    const featureMin = 0 // Zoneamento começa na superfície
    const featureMax = props?.max_height ?? 0
    return isInElevationRange(featureMin, featureMax, range)
  })
}

export default createZoningLayer
