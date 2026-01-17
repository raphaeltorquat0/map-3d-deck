/**
 * @raphaeltorquat0/map-3d-deck
 * Framework agnóstico para mapas 3D multi-nível com Deck.gl + MapLibre
 *
 * @example
 * ```typescript
 * import { Map3D, createZoningLayer, ElevationController } from '@raphaeltorquat0/map-3d-deck'
 *
 * // Criar mapa
 * const map = new Map3D({
 *   container: 'map',
 *   initialViewState: {
 *     longitude: -46.6333,
 *     latitude: -23.5505,
 *     zoom: 12,
 *     pitch: 45,
 *   }
 * })
 *
 * // Adicionar camada de zoneamento
 * const zoningLayer = createZoningLayer({
 *   data: zoningGeoJSON,
 *   extruded: true,
 * })
 * map.addLayer(zoningLayer)
 *
 * // Controlar elevação
 * const elevationCtrl = new ElevationController({
 *   onChange: (range) => {
 *     map.setElevationRange(range)
 *   }
 * })
 * elevationCtrl.applyPreset('surface')
 * ```
 */

// Core
export { Map3D } from './core'

// Types
export * from './types'

// Layers
export * from './layers'

// Controls
export * from './controls'

// Utils
export * from './utils'

// Telemetry
export {
  telemetry,
  initTelemetry,
  disableTelemetry,
  enableTelemetry,
  isTelemetryEnabled,
  TELEMETRY_EVENTS,
  type TelemetryConfig,
  type TelemetryEventName,
} from './telemetry'

// Version
export const VERSION = '0.1.0'
