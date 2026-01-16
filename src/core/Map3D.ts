import { Deck } from '@deck.gl/core'
import { MapboxOverlay } from '@deck.gl/mapbox'
import maplibregl from 'maplibre-gl'
import type { Layer } from '@deck.gl/core'
import type {
  MapConfig,
  MapViewState,
  MapEvents,
  PickInfo,
  ElevationRange,
} from '../types'
import { DEFAULT_VIEW_STATE, MAP_STYLES, ELEVATION_BOUNDS } from '../types'

/**
 * Classe principal para criar mapas 3D multi-nível
 * Utiliza Deck.gl + MapLibre como arquitetura híbrida
 */
export class Map3D {
  private deck: Deck | null = null
  private map: maplibregl.Map | null = null
  private overlay: MapboxOverlay | null = null
  private container: HTMLElement
  private layers: Map<string, Layer> = new Map()
  private viewState: MapViewState
  private elevationRange: ElevationRange
  private events: MapEvents
  private isInitialized = false

  constructor(config: MapConfig & MapEvents) {
    // Resolve container
    if (typeof config.container === 'string') {
      const el = document.getElementById(config.container)
      if (!el) throw new Error(`Container "${config.container}" not found`)
      this.container = el
    } else {
      this.container = config.container
    }

    // Initialize state
    this.viewState = {
      ...DEFAULT_VIEW_STATE,
      ...config.initialViewState,
    }

    this.elevationRange = {
      min: ELEVATION_BOUNDS.MIN,
      max: ELEVATION_BOUNDS.MAX,
    }

    this.events = {
      onClick: config.onClick,
      onHover: config.onHover,
      onViewStateChange: config.onViewStateChange,
      onLoad: config.onLoad,
      onError: config.onError,
    }

    // Initialize map
    this.initialize(config)
  }

  /**
   * Inicializa o mapa MapLibre + Deck.gl overlay
   */
  private async initialize(config: MapConfig): Promise<void> {
    try {
      // Create MapLibre map
      this.map = new maplibregl.Map({
        container: this.container,
        style: config.mapStyle || MAP_STYLES.DARK,
        center: [this.viewState.longitude, this.viewState.latitude],
        zoom: this.viewState.zoom,
        pitch: this.viewState.pitch,
        bearing: this.viewState.bearing,
        antialias: true,
      })

      // Create Deck.gl overlay
      this.overlay = new MapboxOverlay({
        interleaved: true,
        layers: [],
        onClick: (info, event) => {
          this.events.onClick?.(info as PickInfo, event.srcEvent as MouseEvent)
        },
        onHover: (info, event) => {
          this.events.onHover?.(info as PickInfo, event.srcEvent as MouseEvent)
        },
      })

      // Wait for map load
      await new Promise<void>((resolve) => {
        this.map!.on('load', () => {
          // Add Deck.gl overlay to map
          this.map!.addControl(this.overlay as unknown as maplibregl.IControl)

          // Track view state changes
          this.map!.on('move', () => {
            const center = this.map!.getCenter()
            this.viewState = {
              longitude: center.lng,
              latitude: center.lat,
              zoom: this.map!.getZoom(),
              pitch: this.map!.getPitch(),
              bearing: this.map!.getBearing(),
            }
            this.events.onViewStateChange?.(this.viewState)
          })

          this.isInitialized = true
          resolve()
        })
      })

      this.events.onLoad?.()
    } catch (error) {
      this.events.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Adiciona uma camada ao mapa
   */
  addLayer(layer: Layer): void {
    if (!layer.id) {
      throw new Error('Layer must have an id')
    }
    this.layers.set(layer.id, layer)
    this.updateLayers()
  }

  /**
   * Remove uma camada do mapa
   */
  removeLayer(layerId: string): void {
    this.layers.delete(layerId)
    this.updateLayers()
  }

  /**
   * Atualiza uma camada existente
   */
  updateLayer(layer: Layer): void {
    if (this.layers.has(layer.id)) {
      this.layers.set(layer.id, layer)
      this.updateLayers()
    }
  }

  /**
   * Obtém uma camada pelo ID
   */
  getLayer(layerId: string): Layer | undefined {
    return this.layers.get(layerId)
  }

  /**
   * Obtém todas as camadas
   */
  getLayers(): Layer[] {
    return Array.from(this.layers.values())
  }

  /**
   * Define múltiplas camadas de uma vez
   */
  setLayers(layers: Layer[]): void {
    this.layers.clear()
    layers.forEach((layer) => {
      this.layers.set(layer.id, layer)
    })
    this.updateLayers()
  }

  /**
   * Atualiza as camadas no overlay
   */
  private updateLayers(): void {
    if (this.overlay) {
      this.overlay.setProps({
        layers: Array.from(this.layers.values()),
      })
    }
  }

  /**
   * Define o range de elevação visível
   */
  setElevationRange(range: ElevationRange): void {
    this.elevationRange = range
    // Layers que implementam filtro de elevação devem ser atualizadas
    this.updateLayers()
  }

  /**
   * Obtém o range de elevação atual
   */
  getElevationRange(): ElevationRange {
    return { ...this.elevationRange }
  }

  /**
   * Navega para uma localização
   */
  flyTo(options: {
    longitude: number
    latitude: number
    zoom?: number
    pitch?: number
    bearing?: number
    duration?: number
  }): void {
    if (!this.map) return

    this.map.flyTo({
      center: [options.longitude, options.latitude],
      zoom: options.zoom ?? this.viewState.zoom,
      pitch: options.pitch ?? this.viewState.pitch,
      bearing: options.bearing ?? this.viewState.bearing,
      duration: options.duration ?? 1000,
    })
  }

  /**
   * Ajusta a viewport para caber os bounds especificados
   */
  fitBounds(
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; duration?: number }
  ): void {
    if (!this.map) return

    this.map.fitBounds(bounds, {
      padding: options?.padding ?? 50,
      duration: options?.duration ?? 1000,
    })
  }

  /**
   * Obtém o estado atual da viewport
   */
  getViewState(): MapViewState {
    return { ...this.viewState }
  }

  /**
   * Define o estado da viewport
   */
  setViewState(viewState: Partial<MapViewState>): void {
    if (!this.map) return

    if (viewState.longitude !== undefined && viewState.latitude !== undefined) {
      this.map.setCenter([viewState.longitude, viewState.latitude])
    }
    if (viewState.zoom !== undefined) {
      this.map.setZoom(viewState.zoom)
    }
    if (viewState.pitch !== undefined) {
      this.map.setPitch(viewState.pitch)
    }
    if (viewState.bearing !== undefined) {
      this.map.setBearing(viewState.bearing)
    }
  }

  /**
   * Alterna entre vista 2D e 3D
   */
  toggle3D(enabled: boolean): void {
    this.setViewState({
      pitch: enabled ? 45 : 0,
    })
  }

  /**
   * Verifica se o mapa está inicializado
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Obtém a instância do MapLibre
   */
  getMapInstance(): maplibregl.Map | null {
    return this.map
  }

  /**
   * Obtém a instância do Deck.gl overlay
   */
  getDeckOverlay(): MapboxOverlay | null {
    return this.overlay
  }

  /**
   * Redimensiona o mapa (chamar quando o container mudar de tamanho)
   */
  resize(): void {
    this.map?.resize()
  }

  /**
   * Destrói o mapa e libera recursos
   */
  destroy(): void {
    this.layers.clear()
    this.overlay?.finalize()
    this.map?.remove()
    this.deck?.finalize()
    this.deck = null
    this.map = null
    this.overlay = null
    this.isInitialized = false
  }
}

export default Map3D
