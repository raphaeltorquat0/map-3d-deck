/**
 * Controlador de legenda para o mapa
 * Framework-agnóstico: emite eventos para UI customizada
 */

import type {
  LegendConfig,
  LegendItem,
  LegendState,
  LegendChangeCallback,
  LegendToggleCallback,
  LayerLegendInfo,
  LegendPosition,
} from '../types/legend'

/**
 * Opções do LegendController
 */
export interface LegendControllerOptions extends LegendConfig {
  /** Callback inicial para mudanças */
  onChange?: LegendChangeCallback
  /** Callback inicial para toggle de visibilidade */
  onToggle?: LegendToggleCallback
}

/**
 * Controlador de legenda framework-agnóstico
 */
export class LegendController {
  private config: Required<LegendConfig>
  private state: LegendState = {
    items: [],
    position: 'top-right',
    visible: true,
  }
  private layerInfo: Map<string, LayerLegendInfo> = new Map()
  private layerVisibility: Map<string, boolean> = new Map()
  private layerCounts: Map<string, number> = new Map()
  private changeListeners: Set<LegendChangeCallback> = new Set()
  private toggleListeners: Set<LegendToggleCallback> = new Set()

  constructor(options: LegendControllerOptions = {}) {
    this.config = {
      enabled: options.enabled ?? true,
      position: options.position ?? 'top-right',
      showFeatureCount: options.showFeatureCount ?? false,
      showToggle: options.showToggle ?? true,
      className: options.className ?? '',
      title: options.title ?? 'Legenda',
      autoUpdate: options.autoUpdate ?? true,
    }

    this.state.position = this.config.position

    if (options.onChange) {
      this.changeListeners.add(options.onChange)
    }
    if (options.onToggle) {
      this.toggleListeners.add(options.onToggle)
    }
  }

  /**
   * Verifica se a legenda está habilitada
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Habilita/desabilita a legenda
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * Obtém o estado atual da legenda
   */
  getState(): LegendState {
    return {
      ...this.state,
      items: [...this.state.items],
    }
  }

  /**
   * Obtém os itens da legenda
   */
  getItems(): LegendItem[] {
    return [...this.state.items]
  }

  /**
   * Obtém a posição da legenda
   */
  getPosition(): LegendPosition {
    return this.state.position
  }

  /**
   * Define a posição da legenda
   */
  setPosition(position: LegendPosition): void {
    this.state.position = position
    this.config.position = position
  }

  /**
   * Registra uma camada na legenda
   */
  registerLayer(info: LayerLegendInfo): void {
    this.layerInfo.set(info.id, info)
    this.layerVisibility.set(info.id, true)
    this.updateItems()
  }

  /**
   * Remove uma camada da legenda
   */
  unregisterLayer(layerId: string): void {
    this.layerInfo.delete(layerId)
    this.layerVisibility.delete(layerId)
    this.layerCounts.delete(layerId)
    this.updateItems()
  }

  /**
   * Atualiza informações de uma camada
   */
  updateLayerInfo(layerId: string, info: Partial<LayerLegendInfo>): void {
    const existing = this.layerInfo.get(layerId)
    if (existing) {
      this.layerInfo.set(layerId, { ...existing, ...info })
      this.updateItems()
    }
  }

  /**
   * Define a contagem de features de uma camada
   */
  setLayerCount(layerId: string, count: number): void {
    this.layerCounts.set(layerId, count)
    if (this.config.showFeatureCount) {
      this.updateItems()
    }
  }

  /**
   * Define a visibilidade de uma camada
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    this.layerVisibility.set(layerId, visible)
    this.updateItems()
  }

  /**
   * Alterna a visibilidade de uma camada
   */
  toggleLayer(layerId: string): boolean {
    const current = this.layerVisibility.get(layerId) ?? true
    const newValue = !current
    this.layerVisibility.set(layerId, newValue)
    this.updateItems()
    this.notifyToggle(layerId, newValue)
    return newValue
  }

  /**
   * Verifica se uma camada está visível
   */
  isLayerVisible(layerId: string): boolean {
    return this.layerVisibility.get(layerId) ?? true
  }

  /**
   * Mostra todas as camadas
   */
  showAll(): void {
    for (const layerId of this.layerVisibility.keys()) {
      this.layerVisibility.set(layerId, true)
    }
    this.updateItems()
  }

  /**
   * Esconde todas as camadas
   */
  hideAll(): void {
    for (const layerId of this.layerVisibility.keys()) {
      this.layerVisibility.set(layerId, false)
    }
    this.updateItems()
  }

  /**
   * Atualiza os itens da legenda
   */
  private updateItems(): void {
    const items: LegendItem[] = []

    for (const [layerId, info] of this.layerInfo.entries()) {
      items.push({
        layerId,
        label: info.label,
        color: info.color,
        colors: info.colors,
        visible: this.layerVisibility.get(layerId) ?? true,
        count: this.config.showFeatureCount ? this.layerCounts.get(layerId) : undefined,
        type: info.type,
        order: info.order ?? 999,
        metadata: info.metadata,
      })
    }

    // Ordena por ordem
    items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

    this.state.items = items
    this.notifyChange()
  }

  /**
   * Adiciona listener para mudanças
   */
  onChange(callback: LegendChangeCallback): () => void {
    this.changeListeners.add(callback)
    // Notifica imediatamente com estado atual
    callback(this.getItems())
    return () => this.changeListeners.delete(callback)
  }

  /**
   * Adiciona listener para toggle de visibilidade
   */
  onToggle(callback: LegendToggleCallback): () => void {
    this.toggleListeners.add(callback)
    return () => this.toggleListeners.delete(callback)
  }

  /**
   * Remove listener de mudança
   */
  offChange(callback: LegendChangeCallback): void {
    this.changeListeners.delete(callback)
  }

  /**
   * Remove listener de toggle
   */
  offToggle(callback: LegendToggleCallback): void {
    this.toggleListeners.delete(callback)
  }

  /**
   * Remove todos os listeners
   */
  removeAllListeners(): void {
    this.changeListeners.clear()
    this.toggleListeners.clear()
  }

  /**
   * Notifica listeners de mudança
   */
  private notifyChange(): void {
    const items = this.getItems()
    this.changeListeners.forEach((callback) => callback(items))
  }

  /**
   * Notifica listeners de toggle
   */
  private notifyToggle(layerId: string, visible: boolean): void {
    this.toggleListeners.forEach((callback) => callback(layerId, visible))
  }

  /**
   * Atualiza configuração
   */
  setConfig(config: Partial<LegendConfig>): void {
    this.config = { ...this.config, ...config }
    if (config.position) {
      this.state.position = config.position
    }
    this.updateItems()
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): LegendConfig {
    return { ...this.config }
  }

  /**
   * Limpa todas as camadas registradas
   */
  clear(): void {
    this.layerInfo.clear()
    this.layerVisibility.clear()
    this.layerCounts.clear()
    this.updateItems()
  }

  /**
   * Serializa estado
   */
  toJSON(): {
    position: LegendPosition
    layers: { id: string; visible: boolean }[]
  } {
    return {
      position: this.state.position,
      layers: Array.from(this.layerVisibility.entries()).map(([id, visible]) => ({
        id,
        visible,
      })),
    }
  }

  /**
   * Restaura estado
   */
  fromJSON(state: {
    position?: LegendPosition
    layers?: { id: string; visible: boolean }[]
  }): void {
    if (state.position) {
      this.setPosition(state.position)
    }
    if (state.layers) {
      for (const { id, visible } of state.layers) {
        this.layerVisibility.set(id, visible)
      }
      this.updateItems()
    }
  }

  /**
   * Destrói o controller
   */
  destroy(): void {
    this.clear()
    this.removeAllListeners()
  }
}

/**
 * Cria uma instância do LegendController
 */
export function createLegendController(options?: LegendControllerOptions): LegendController {
  return new LegendController(options)
}

export default LegendController
