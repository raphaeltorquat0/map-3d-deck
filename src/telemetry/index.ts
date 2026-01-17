/**
 * Módulo de telemetria para tracking de uso da biblioteca
 * Utiliza PostHog para analytics
 */

import { TELEMETRY_EVENTS, type TelemetryEventName } from './events'

// Re-export events
export { TELEMETRY_EVENTS } from './events'
export type { TelemetryEventName, TelemetryEventProperties } from './events'

/**
 * Versão da biblioteca (injetada no build)
 */
const LIBRARY_VERSION = '0.1.0'

/**
 * PostHog API key para telemetria da biblioteca
 * Este é um projeto público para tracking de uso anônimo
 */
const POSTHOG_API_KEY = 'phc_PLACEHOLDER_KEY'
const POSTHOG_HOST = 'https://app.posthog.com'

/**
 * Configuração de telemetria
 */
export interface TelemetryConfig {
  /**
   * Desativar telemetria completamente
   * @default false
   */
  disabled?: boolean

  /**
   * ID de sessão customizado (para correlacionar eventos)
   */
  sessionId?: string

  /**
   * Callback para debug de eventos
   */
  onEvent?: (event: string, properties: Record<string, unknown>) => void
}

/**
 * Estado global de telemetria
 */
interface TelemetryState {
  initialized: boolean
  disabled: boolean
  sessionId: string
  posthog: PostHogLike | null
  onEvent?: (event: string, properties: Record<string, unknown>) => void
}

/**
 * Interface mínima do PostHog (para evitar dependência direta)
 */
interface PostHogLike {
  capture: (event: string, properties?: Record<string, unknown>) => void
  identify: (distinctId: string, properties?: Record<string, unknown>) => void
  opt_out_capturing: () => void
  opt_in_capturing: () => void
  reset: () => void
}

/**
 * Estado singleton
 */
const state: TelemetryState = {
  initialized: false,
  disabled: false,
  sessionId: generateSessionId(),
  posthog: null,
}

/**
 * Gera um ID de sessão único
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Verifica se Do Not Track está ativo
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    navigator.doNotTrack === '1' ||
    (navigator as unknown as { globalPrivacyControl?: string }).globalPrivacyControl === '1'
  )
}

/**
 * Carrega PostHog dinamicamente (lazy loading)
 */
async function loadPostHog(): Promise<PostHogLike | null> {
  // Skip in SSR
  if (typeof window === 'undefined') return null

  // Skip if DNT is enabled
  if (isDoNotTrackEnabled()) {
    console.debug('[map-3d-deck] Telemetry disabled: Do Not Track enabled')
    return null
  }

  try {
    // Dynamic import para evitar bundle size quando disabled
    const posthog = await import('posthog-js')

    posthog.default.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      persistence: 'memory',
      bootstrap: {
        distinctID: state.sessionId,
      },
    })

    return posthog.default as unknown as PostHogLike
  } catch {
    // PostHog not installed - use noop
    console.debug('[map-3d-deck] PostHog not available, telemetry disabled')
    return null
  }
}

/**
 * Inicializa a telemetria
 */
export async function initTelemetry(config?: TelemetryConfig): Promise<void> {
  if (state.initialized) return

  // Check if disabled via config
  if (config?.disabled) {
    state.disabled = true
    state.initialized = true
    return
  }

  // Check localStorage opt-out
  if (typeof localStorage !== 'undefined') {
    const optOut = localStorage.getItem('map3d_telemetry_optout')
    if (optOut === 'true') {
      state.disabled = true
      state.initialized = true
      return
    }
  }

  // Set custom session ID if provided
  if (config?.sessionId) {
    state.sessionId = config.sessionId
  }

  // Set debug callback
  if (config?.onEvent) {
    state.onEvent = config.onEvent
  }

  // Load PostHog
  state.posthog = await loadPostHog()
  state.initialized = true
}

/**
 * Desativa a telemetria (opt-out)
 */
export function disableTelemetry(): void {
  state.disabled = true
  state.posthog?.opt_out_capturing()

  // Persist opt-out
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('map3d_telemetry_optout', 'true')
  }
}

/**
 * Reativa a telemetria (opt-in)
 */
export function enableTelemetry(): void {
  state.disabled = false
  state.posthog?.opt_in_capturing()

  // Remove opt-out
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('map3d_telemetry_optout')
  }
}

/**
 * Verifica se a telemetria está ativa
 */
export function isTelemetryEnabled(): boolean {
  return state.initialized && !state.disabled
}

/**
 * Captura um evento de telemetria
 */
export function captureEvent(
  event: TelemetryEventName,
  properties?: Record<string, unknown>
): void {
  // Skip if not initialized or disabled
  if (!state.initialized || state.disabled) return

  const eventProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    library_version: LIBRARY_VERSION,
    session_id: state.sessionId,
  }

  // Debug callback
  state.onEvent?.(event, eventProperties)

  // Send to PostHog
  state.posthog?.capture(event, eventProperties)
}

/**
 * Captura um erro
 */
export function captureError(error: Error, context?: string): void {
  captureEvent(TELEMETRY_EVENTS.ERROR_OCCURRED, {
    error_message: error.message,
    error_stack: error.stack,
    context,
  })
}

/**
 * Reseta a sessão de telemetria
 */
export function resetTelemetry(): void {
  state.posthog?.reset()
  state.sessionId = generateSessionId()
}

/**
 * Singleton para uso interno
 */
export const telemetry = {
  init: initTelemetry,
  capture: captureEvent,
  captureError,
  disable: disableTelemetry,
  enable: enableTelemetry,
  isEnabled: isTelemetryEnabled,
  reset: resetTelemetry,
  events: TELEMETRY_EVENTS,
}

export default telemetry
