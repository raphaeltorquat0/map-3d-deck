/**
 * Controlador de popup/tooltip para o mapa
 * Framework-agnóstico: emite eventos para UI customizada
 */

import type { Feature } from 'geojson'
import type {
  PopupConfig,
  PopupInfo,
  PopupState,
  PopupOpenCallback,
  PopupCloseCallback,
  OpenPopupOptions,
  ReverseGeocodeResult,
} from '../types/popup'

/**
 * URL padrão do Nominatim para geocodificação reversa
 */
const DEFAULT_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse'

/**
 * Opções do PopupController
 */
export interface PopupControllerOptions extends PopupConfig {
  /** Callback inicial para abertura de popup */
  onOpen?: PopupOpenCallback
  /** Callback inicial para fechamento de popup */
  onClose?: PopupCloseCallback
}

/**
 * Controlador de popup framework-agnóstico
 */
export class PopupController {
  private config: Required<PopupConfig>
  private state: PopupState = {
    isOpen: false,
    info: null,
    isLoading: false,
  }
  private openListeners: Set<PopupOpenCallback> = new Set()
  private closeListeners: Set<PopupCloseCallback> = new Set()
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null
  private geocodeCache: Map<string, ReverseGeocodeResult> = new Map()

  constructor(options: PopupControllerOptions = {}) {
    this.config = {
      enabled: options.enabled ?? true,
      showOnHover: options.showOnHover ?? true,
      showOnClick: options.showOnClick ?? true,
      reverseGeocode: options.reverseGeocode ?? false,
      geocodeUrl: options.geocodeUrl ?? DEFAULT_GEOCODE_URL,
      hoverDelay: options.hoverDelay ?? 200,
      formatContent: options.formatContent ?? this.defaultFormatContent,
      className: options.className ?? '',
      offset: options.offset ?? [0, 0],
      closeOnClickOutside: options.closeOnClickOutside ?? true,
      showCloseButton: options.showCloseButton ?? true,
    }

    if (options.onOpen) {
      this.openListeners.add(options.onOpen)
    }
    if (options.onClose) {
      this.closeListeners.add(options.onClose)
    }
  }

  /**
   * Formatador de conteúdo padrão
   */
  private defaultFormatContent(feature: Feature, _layerId: string): Record<string, string> {
    const props = feature.properties ?? {}
    const result: Record<string, string> = {}

    for (const [key, value] of Object.entries(props)) {
      if (value !== null && value !== undefined) {
        result[key] = String(value)
      }
    }

    return result
  }

  /**
   * Verifica se o popup está habilitado
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Habilita/desabilita o sistema de popup
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    if (!enabled) {
      this.close()
    }
  }

  /**
   * Obtém o estado atual do popup
   */
  getState(): PopupState {
    return { ...this.state }
  }

  /**
   * Verifica se o popup está aberto
   */
  isOpen(): boolean {
    return this.state.isOpen
  }

  /**
   * Obtém as informações do popup atual
   */
  getInfo(): PopupInfo | null {
    return this.state.info ? { ...this.state.info } : null
  }

  /**
   * Manipula evento de hover
   */
  handleHover(info: {
    x: number
    y: number
    coordinate?: [number, number] | null
    object?: Feature
    layer?: { id: string }
  }): void {
    if (!this.config.enabled || !this.config.showOnHover) return

    // Limpa timeout anterior
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout)
      this.hoverTimeout = null
    }

    // Se não há objeto, fecha tooltip de hover
    if (!info.object || !info.coordinate) {
      if (this.state.info?.trigger === 'hover') {
        this.close()
      }
      return
    }

    // Aguarda delay antes de mostrar
    this.hoverTimeout = setTimeout(() => {
      this.openFromPick(info, 'hover')
    }, this.config.hoverDelay)
  }

  /**
   * Manipula evento de click
   */
  handleClick(info: {
    x: number
    y: number
    coordinate?: [number, number] | null
    object?: Feature
    layer?: { id: string }
  }): void {
    if (!this.config.enabled || !this.config.showOnClick) return

    // Se clicou fora de uma feature
    if (!info.object || !info.coordinate) {
      if (this.config.closeOnClickOutside) {
        this.close()
      }
      return
    }

    this.openFromPick(info, 'click')
  }

  /**
   * Abre popup a partir de um evento de pick
   */
  private async openFromPick(
    info: {
      x: number
      y: number
      coordinate?: [number, number] | null
      object?: Feature
      layer?: { id: string }
    },
    trigger: 'hover' | 'click'
  ): Promise<void> {
    if (!info.coordinate || !info.object) return

    const feature = info.object
    const layerId = info.layer?.id ?? 'unknown'
    const content = this.config.formatContent(feature, layerId)

    const popupInfo: PopupInfo = {
      position: {
        coordinate: info.coordinate,
        x: info.x + this.config.offset[0],
        y: info.y + this.config.offset[1],
      },
      feature,
      layerId,
      content,
      trigger,
    }

    this.state = {
      isOpen: true,
      info: popupInfo,
      isLoading: this.config.reverseGeocode,
    }

    this.notifyOpen(popupInfo)

    // Busca endereço se configurado
    if (this.config.reverseGeocode) {
      try {
        const result = await this.reverseGeocode(info.coordinate)
        if (this.state.info?.position.coordinate === info.coordinate) {
          this.state.info = {
            ...this.state.info,
            address: result.displayName,
          }
          this.state.isLoading = false
          this.notifyOpen(this.state.info)
        }
      } catch {
        this.state.isLoading = false
      }
    }
  }

  /**
   * Abre popup programaticamente
   */
  open(options: OpenPopupOptions): void {
    if (!this.config.enabled) return

    const popupInfo: PopupInfo = {
      position: {
        coordinate: options.coordinate,
        x: 0,
        y: 0,
      },
      feature: options.feature,
      layerId: options.layerId,
      content: options.content,
      trigger: 'programmatic',
    }

    this.state = {
      isOpen: true,
      info: popupInfo,
      isLoading: false,
    }

    this.notifyOpen(popupInfo)
  }

  /**
   * Fecha o popup
   */
  close(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout)
      this.hoverTimeout = null
    }

    if (this.state.isOpen) {
      this.state = {
        isOpen: false,
        info: null,
        isLoading: false,
      }
      this.notifyClose()
    }
  }

  /**
   * Realiza geocodificação reversa
   */
  async reverseGeocode(coordinate: [number, number]): Promise<ReverseGeocodeResult> {
    const cacheKey = `${coordinate[0].toFixed(6)},${coordinate[1].toFixed(6)}`

    // Verifica cache
    const cached = this.geocodeCache.get(cacheKey)
    if (cached) return cached

    const [lng, lat] = coordinate
    const url = `${this.config.geocodeUrl}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Geocode failed: ${response.status}`)
    }

    const data = await response.json()

    const result: ReverseGeocodeResult = {
      address: data.address?.road ?? '',
      displayName: data.display_name ?? '',
      city: data.address?.city ?? data.address?.town ?? data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      postcode: data.address?.postcode,
    }

    // Salva no cache
    this.geocodeCache.set(cacheKey, result)

    return result
  }

  /**
   * Adiciona listener para abertura de popup
   */
  onOpen(callback: PopupOpenCallback): () => void {
    this.openListeners.add(callback)
    return () => this.openListeners.delete(callback)
  }

  /**
   * Adiciona listener para fechamento de popup
   */
  onClose(callback: PopupCloseCallback): () => void {
    this.closeListeners.add(callback)
    return () => this.closeListeners.delete(callback)
  }

  /**
   * Remove listener de abertura
   */
  offOpen(callback: PopupOpenCallback): void {
    this.openListeners.delete(callback)
  }

  /**
   * Remove listener de fechamento
   */
  offClose(callback: PopupCloseCallback): void {
    this.closeListeners.delete(callback)
  }

  /**
   * Remove todos os listeners
   */
  removeAllListeners(): void {
    this.openListeners.clear()
    this.closeListeners.clear()
  }

  /**
   * Notifica listeners de abertura
   */
  private notifyOpen(info: PopupInfo): void {
    this.openListeners.forEach((callback) => callback(info))
  }

  /**
   * Notifica listeners de fechamento
   */
  private notifyClose(): void {
    this.closeListeners.forEach((callback) => callback())
  }

  /**
   * Atualiza configuração
   */
  setConfig(config: Partial<PopupConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): PopupConfig {
    return { ...this.config }
  }

  /**
   * Limpa cache de geocodificação
   */
  clearGeocodeCache(): void {
    this.geocodeCache.clear()
  }

  /**
   * Serializa estado
   */
  toJSON(): { isOpen: boolean; coordinate?: [number, number] } {
    return {
      isOpen: this.state.isOpen,
      coordinate: this.state.info?.position.coordinate,
    }
  }

  /**
   * Destrói o controller
   */
  destroy(): void {
    this.close()
    this.removeAllListeners()
    this.clearGeocodeCache()
  }
}

/**
 * Cria uma instância do PopupController
 */
export function createPopupController(options?: PopupControllerOptions): PopupController {
  return new PopupController(options)
}

export default PopupController
