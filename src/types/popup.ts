/**
 * Sistema de popup/tooltip para features do mapa
 */

import type { Feature } from 'geojson'

/**
 * Posição do popup no mapa
 */
export interface PopupPosition {
  /** Coordenada [longitude, latitude] */
  coordinate: [number, number]
  /** Posição X em pixels na tela */
  x: number
  /** Posição Y em pixels na tela */
  y: number
}

/**
 * Informações do popup aberto
 */
export interface PopupInfo {
  /** Posição do popup */
  position: PopupPosition
  /** Feature associada (se houver) */
  feature?: Feature
  /** ID da camada de origem */
  layerId?: string
  /** Conteúdo formatado */
  content?: string | Record<string, string>
  /** Endereço reverso geocodificado */
  address?: string
  /** Se o popup foi aberto por hover ou click */
  trigger: 'hover' | 'click' | 'programmatic'
}

/**
 * Configuração do sistema de popup
 */
export interface PopupConfig {
  /** Se o sistema de popup está habilitado */
  enabled?: boolean
  /** Mostrar tooltip no hover */
  showOnHover?: boolean
  /** Mostrar popup no click */
  showOnClick?: boolean
  /** Buscar endereço via geocodificação reversa */
  reverseGeocode?: boolean
  /** URL do serviço de geocodificação (Nominatim por padrão) */
  geocodeUrl?: string
  /** Delay em ms antes de mostrar o tooltip no hover */
  hoverDelay?: number
  /** Função para formatar o conteúdo do popup */
  formatContent?: (feature: Feature, layerId: string) => string | Record<string, string>
  /** Classes CSS customizadas para o popup */
  className?: string
  /** Offset do popup em relação ao cursor [x, y] */
  offset?: [number, number]
  /** Se deve fechar o popup ao clicar fora */
  closeOnClickOutside?: boolean
  /** Se deve mostrar o botão de fechar */
  showCloseButton?: boolean
}

/**
 * Callback para eventos de popup
 */
export type PopupOpenCallback = (info: PopupInfo) => void
export type PopupCloseCallback = () => void

/**
 * Estado interno do popup
 */
export interface PopupState {
  isOpen: boolean
  info: PopupInfo | null
  isLoading: boolean
}

/**
 * Opções para abrir um popup programaticamente
 */
export interface OpenPopupOptions {
  /** Coordenada [longitude, latitude] */
  coordinate: [number, number]
  /** Conteúdo do popup */
  content: string | Record<string, string>
  /** Feature associada (opcional) */
  feature?: Feature
  /** ID da camada (opcional) */
  layerId?: string
}

/**
 * Resposta da geocodificação reversa
 */
export interface ReverseGeocodeResult {
  address: string
  displayName: string
  city?: string
  state?: string
  country?: string
  postcode?: string
}
