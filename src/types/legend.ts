/**
 * Sistema de legenda para camadas do mapa
 */

/**
 * Posição da legenda no mapa
 */
export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Item da legenda representando uma camada
 */
export interface LegendItem {
  /** ID da camada */
  layerId: string
  /** Label de exibição */
  label: string
  /** Cor principal da camada */
  color: string
  /** Cores adicionais (para gradientes ou categorias) */
  colors?: string[]
  /** Se a camada está visível */
  visible: boolean
  /** Contagem de features (opcional) */
  count?: number
  /** Tipo de geometria */
  type?: 'line' | 'point' | 'polygon' | 'mixed'
  /** Ordem de exibição */
  order?: number
  /** Metadados adicionais */
  metadata?: Record<string, unknown>
}

/**
 * Configuração do sistema de legenda
 */
export interface LegendConfig {
  /** Se o sistema de legenda está habilitado */
  enabled?: boolean
  /** Posição da legenda no mapa */
  position?: LegendPosition
  /** Mostrar contagem de features por camada */
  showFeatureCount?: boolean
  /** Mostrar toggle de visibilidade */
  showToggle?: boolean
  /** Classes CSS customizadas */
  className?: string
  /** Título da legenda */
  title?: string
  /** Se deve auto-atualizar quando camadas mudam */
  autoUpdate?: boolean
}

/**
 * Callback para mudanças na legenda
 */
export type LegendChangeCallback = (items: LegendItem[]) => void

/**
 * Callback para toggle de visibilidade
 */
export type LegendToggleCallback = (layerId: string, visible: boolean) => void

/**
 * Estado interno da legenda
 */
export interface LegendState {
  items: LegendItem[]
  position: LegendPosition
  visible: boolean
}

/**
 * Informações de camada para registro na legenda
 */
export interface LayerLegendInfo {
  /** ID da camada */
  id: string
  /** Label de exibição */
  label: string
  /** Cor principal */
  color: string
  /** Cores adicionais */
  colors?: string[]
  /** Tipo de geometria */
  type?: 'line' | 'point' | 'polygon' | 'mixed'
  /** Ordem de exibição */
  order?: number
  /** Metadados adicionais */
  metadata?: Record<string, unknown>
}
