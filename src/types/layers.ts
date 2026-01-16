import type { Feature, FeatureCollection, Geometry } from 'geojson'

/**
 * Tipos de camadas suportadas
 */
export type LayerType =
  | 'zoning'
  | 'building'
  | 'subsurface'
  | 'lot'
  | 'risk'
  | 'infrastructure'
  | 'custom'

/**
 * Tipos de redes subterrâneas
 */
export type SubsurfaceNetworkType =
  | 'water'       // Rede de água
  | 'sewage'      // Rede de esgoto
  | 'gas'         // Rede de gás
  | 'electric'    // Rede elétrica
  | 'telecom'     // Telecomunicações
  | 'drainage'    // Drenagem
  | 'metro'       // Metrô/transporte

/**
 * Configuração base de uma camada
 */
export interface LayerConfig {
  id: string
  type: LayerType
  label: string
  visible: boolean
  opacity: number
  pickable?: boolean
  minZoom?: number
  maxZoom?: number
  elevationMin: number
  elevationMax: number
}

/**
 * Propriedades de feature de zoneamento
 */
export interface ZoningFeatureProperties {
  id: string
  zone_code: string
  zone_name: string
  max_height: number          // Gabarito máximo em metros
  max_floors: number          // Número máximo de pavimentos
  max_far: number             // Coeficiente de aproveitamento
  max_coverage: number        // Taxa de ocupação
  min_setback: number         // Recuo mínimo
  allowed_uses: string[]
  color: string
  description?: string
}

/**
 * Propriedades de feature de edificação
 */
export interface BuildingFeatureProperties {
  id: string
  name?: string
  height: number
  floors: number
  year_built?: number
  use_type: 'residential' | 'commercial' | 'mixed' | 'industrial' | 'institutional'
  zone_code: string
  lot_id?: string
  area_m2: number
  elevation_base: number
  elevation_top: number
}

/**
 * Propriedades de feature subterrânea
 */
export interface SubsurfaceFeatureProperties {
  id: string
  network_type: SubsurfaceNetworkType
  depth: number               // Profundidade em metros (negativo)
  diameter?: number           // Diâmetro em mm (para tubos)
  material?: string
  year_installed?: number
  status: 'active' | 'inactive' | 'maintenance'
  owner?: string
}

/**
 * Propriedades de feature de lote
 */
export interface LotFeatureProperties {
  id: string
  cadastral_id: string
  area_m2: number
  zone_code: string
  max_buildable_area: number
  current_built_area: number
  owner_type: 'private' | 'public' | 'mixed'
  land_value?: number
}

/**
 * Propriedades de feature de risco
 */
export interface RiskFeatureProperties {
  id: string
  risk_type: 'flood' | 'landslide' | 'erosion' | 'subsidence' | 'seismic'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation_status?: string
}

/**
 * Union type de todas as propriedades de features
 */
export type GeoFeatureProperties =
  | ZoningFeatureProperties
  | BuildingFeatureProperties
  | SubsurfaceFeatureProperties
  | LotFeatureProperties
  | RiskFeatureProperties

/**
 * Feature tipada
 */
export type TypedFeature<T = GeoFeatureProperties> = Feature<Geometry, T>

/**
 * FeatureCollection com metadados
 */
export interface MapFeatureCollection<T = GeoFeatureProperties> extends FeatureCollection<Geometry, T> {
  metadata?: {
    source: string
    lastUpdated: string
    totalFeatures: number
    bounds?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
  }
}

/**
 * Cores das redes subterrâneas
 */
export const SUBSURFACE_NETWORK_COLORS: Record<SubsurfaceNetworkType, string> = {
  water: '#3B82F6',      // Azul
  sewage: '#92400E',     // Marrom
  gas: '#F59E0B',        // Laranja
  electric: '#FBBF24',   // Amarelo
  telecom: '#8B5CF6',    // Roxo
  drainage: '#06B6D4',   // Ciano
  metro: '#EF4444',      // Vermelho
}

/**
 * Labels das redes subterrâneas
 */
export const SUBSURFACE_NETWORK_LABELS: Record<SubsurfaceNetworkType, string> = {
  water: 'Água',
  sewage: 'Esgoto',
  gas: 'Gás',
  electric: 'Elétrica',
  telecom: 'Telecom',
  drainage: 'Drenagem',
  metro: 'Metrô',
}

/**
 * Cores de uso de edificação
 */
export const BUILDING_USE_COLORS: Record<BuildingFeatureProperties['use_type'], string> = {
  residential: '#22C55E',   // Verde
  commercial: '#3B82F6',    // Azul
  mixed: '#8B5CF6',         // Roxo
  industrial: '#F59E0B',    // Laranja
  institutional: '#EF4444', // Vermelho
}

/**
 * Cores de nível de risco
 */
export const RISK_LEVEL_COLORS: Record<RiskFeatureProperties['risk_level'], string> = {
  low: '#22C55E',      // Verde
  medium: '#F59E0B',   // Amarelo
  high: '#EF4444',     // Vermelho
  critical: '#7C2D12', // Marrom escuro
}
