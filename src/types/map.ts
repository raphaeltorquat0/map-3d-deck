import type { Feature } from 'geojson'

/**
 * Estado da viewport do mapa
 */
export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
  transitionDuration?: number
}

/**
 * Configuração inicial do mapa
 */
export interface MapConfig {
  container: HTMLElement | string
  initialViewState?: Partial<MapViewState>
  mapStyle?: string
  controller?: boolean | ControllerConfig
  useDevicePixels?: boolean | number
  pickingRadius?: number
  /**
   * Modo de renderização Deck.gl
   * - true: camadas intercaladas com layers do MapLibre (melhor para 3D)
   * - false: camadas acima do mapa base (mais compatível)
   * @default true
   */
  interleaved?: boolean
}

/**
 * Configuração do controlador de mapa
 */
export interface ControllerConfig {
  doubleClickZoom?: boolean
  touchRotate?: boolean
  keyboard?: boolean
  dragPan?: boolean
  dragRotate?: boolean
  scrollZoom?: boolean
}

/**
 * Informações de picking (clique/hover em features)
 */
export interface PickInfo<T = Feature> {
  x: number
  y: number
  coordinate: [number, number] | null
  object?: T
  layer?: {
    id: string
    props: Record<string, unknown>
  }
  index?: number
  picked?: boolean
}

/**
 * Eventos do mapa
 */
export interface MapEvents {
  onClick?: (info: PickInfo, event: MouseEvent) => void
  onHover?: (info: PickInfo, event: MouseEvent) => void
  onViewStateChange?: (viewState: MapViewState) => void
  onLoad?: () => void
  onError?: (error: Error) => void
}

/**
 * Opções de estilo de mapa base
 */
export const MAP_STYLES = {
  DARK: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  LIGHT: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  VOYAGER: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  OSM: 'https://tiles.openfreemap.org/styles/liberty',
} as const

/**
 * Viewport padrão (Brasil - São Paulo)
 */
export const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: -46.6333,
  latitude: -23.5505,
  zoom: 12,
  pitch: 45,
  bearing: 0,
}

/**
 * Bounds do Brasil
 */
export const BRAZIL_BOUNDS = {
  minLng: -73.9872,
  maxLng: -34.7299,
  minLat: -33.7683,
  maxLat: 5.2842,
} as const
