import type { ElevationRange, ElevationPreset, ElevationLevel } from '../types'
import {
  ELEVATION_BOUNDS,
  ELEVATION_LEVELS,
  ELEVATION_PRESETS,
  getElevationLevel,
  getElevationColor,
} from '../types'

/**
 * Callback para mudanças de elevação
 */
export type ElevationChangeCallback = (range: ElevationRange) => void

/**
 * Opções do ElevationController
 */
export interface ElevationControllerOptions {
  initialRange?: ElevationRange
  onChange?: ElevationChangeCallback
}

/**
 * Controlador de elevação para gerenciar o range de níveis visíveis
 * Pode ser usado com qualquer framework UI
 */
export class ElevationController {
  private range: ElevationRange
  private listeners: Set<ElevationChangeCallback> = new Set()

  constructor(options: ElevationControllerOptions = {}) {
    this.range = options.initialRange ?? {
      min: ELEVATION_BOUNDS.MIN,
      max: ELEVATION_BOUNDS.MAX,
    }

    if (options.onChange) {
      this.listeners.add(options.onChange)
    }
  }

  /**
   * Obtém o range atual
   */
  getRange(): ElevationRange {
    return { ...this.range }
  }

  /**
   * Define o range de elevação
   */
  setRange(range: ElevationRange): void {
    // Validação
    const min = Math.max(ELEVATION_BOUNDS.MIN, Math.min(range.min, range.max - 1))
    const max = Math.min(ELEVATION_BOUNDS.MAX, Math.max(range.max, range.min + 1))

    this.range = { min, max }
    this.notifyListeners()
  }

  /**
   * Define apenas o valor mínimo
   */
  setMin(min: number): void {
    this.setRange({ ...this.range, min })
  }

  /**
   * Define apenas o valor máximo
   */
  setMax(max: number): void {
    this.setRange({ ...this.range, max })
  }

  /**
   * Aplica um preset
   */
  applyPreset(presetId: string): void {
    const preset = ELEVATION_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      this.setRange(preset.range)
    }
  }

  /**
   * Obtém o preset atual (se corresponder a algum)
   */
  getCurrentPreset(): ElevationPreset | null {
    return (
      ELEVATION_PRESETS.find(
        (p) => p.range.min === this.range.min && p.range.max === this.range.max
      ) ?? null
    )
  }

  /**
   * Obtém todos os presets disponíveis
   */
  getPresets(): readonly ElevationPreset[] {
    return ELEVATION_PRESETS
  }

  /**
   * Obtém todos os níveis de elevação
   */
  getLevels(): readonly ElevationLevel[] {
    return ELEVATION_LEVELS
  }

  /**
   * Obtém os níveis visíveis no range atual
   */
  getVisibleLevels(): ElevationLevel[] {
    return ELEVATION_LEVELS.filter((level) => {
      return level.maxHeight >= this.range.min && level.minHeight <= this.range.max
    })
  }

  /**
   * Verifica se uma altura está no range visível
   */
  isVisible(height: number): boolean {
    return height >= this.range.min && height <= this.range.max
  }

  /**
   * Verifica se um range de feature está visível
   */
  isFeatureVisible(featureMin: number, featureMax: number): boolean {
    return featureMax >= this.range.min && featureMin <= this.range.max
  }

  /**
   * Obtém a cor para uma altura
   */
  getColorForHeight(height: number): string {
    return getElevationColor(height)
  }

  /**
   * Obtém o nível para uma altura
   */
  getLevelForHeight(height: number): ElevationLevel | undefined {
    return getElevationLevel(height)
  }

  /**
   * Obtém os bounds de elevação
   */
  getBounds(): typeof ELEVATION_BOUNDS {
    return ELEVATION_BOUNDS
  }

  /**
   * Converte altura para porcentagem (0-100) no range total
   */
  heightToPercent(height: number): number {
    return ((height - ELEVATION_BOUNDS.MIN) / ELEVATION_BOUNDS.TOTAL_RANGE) * 100
  }

  /**
   * Converte porcentagem para altura
   */
  percentToHeight(percent: number): number {
    return ELEVATION_BOUNDS.MIN + (percent / 100) * ELEVATION_BOUNDS.TOTAL_RANGE
  }

  /**
   * Adiciona um listener para mudanças
   */
  onChange(callback: ElevationChangeCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Remove um listener
   */
  offChange(callback: ElevationChangeCallback): void {
    this.listeners.delete(callback)
  }

  /**
   * Remove todos os listeners
   */
  removeAllListeners(): void {
    this.listeners.clear()
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners(): void {
    const range = this.getRange()
    this.listeners.forEach((callback) => callback(range))
  }

  /**
   * Reseta para o range padrão (tudo visível)
   */
  reset(): void {
    this.setRange({
      min: ELEVATION_BOUNDS.MIN,
      max: ELEVATION_BOUNDS.MAX,
    })
  }

  /**
   * Cria um objeto de estado serializável
   */
  toJSON(): { min: number; max: number } {
    return this.getRange()
  }

  /**
   * Restaura estado de um objeto
   */
  fromJSON(state: { min: number; max: number }): void {
    this.setRange(state)
  }
}

/**
 * Cria uma instância do ElevationController
 */
export function createElevationController(
  options?: ElevationControllerOptions
): ElevationController {
  return new ElevationController(options)
}

export default ElevationController
