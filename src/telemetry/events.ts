/**
 * Definição de eventos de telemetria
 */

/**
 * Nomes dos eventos trackados
 */
export const TELEMETRY_EVENTS = {
  // Lifecycle
  MAP_INITIALIZED: 'map_initialized',
  MAP_DESTROYED: 'map_destroyed',

  // Layers
  LAYER_ADDED: 'layer_added',
  LAYER_REMOVED: 'layer_removed',
  LAYERS_SET: 'layers_set',

  // Interactions
  FEATURE_CLICKED: 'feature_clicked',
  FEATURE_HOVERED: 'feature_hovered',

  // Navigation
  VIEW_CHANGED: 'view_changed',
  FLY_TO: 'fly_to',
  TOGGLE_3D: 'toggle_3d',

  // Elevation
  ELEVATION_RANGE_CHANGED: 'elevation_range_changed',
  ELEVATION_PRESET_APPLIED: 'elevation_preset_applied',

  // Errors
  ERROR_OCCURRED: 'error_occurred',

  // Performance
  RENDER_TIME: 'render_time',
} as const

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS]

/**
 * Propriedades base de todos os eventos
 */
export interface BaseEventProperties {
  timestamp: string
  library_version: string
  session_id: string
}

/**
 * Propriedades do evento map_initialized
 */
export interface MapInitializedProperties extends BaseEventProperties {
  map_style: string
  interleaved: boolean
  initial_zoom: number
  initial_pitch: number
}

/**
 * Propriedades do evento layer_added
 */
export interface LayerAddedProperties extends BaseEventProperties {
  layer_id: string
  layer_type: string
  feature_count?: number
}

/**
 * Propriedades do evento error_occurred
 */
export interface ErrorOccurredProperties extends BaseEventProperties {
  error_message: string
  error_stack?: string
  context?: string
}

/**
 * Propriedades do evento elevation_preset_applied
 */
export interface ElevationPresetProperties extends BaseEventProperties {
  preset_id: string
  range_min: number
  range_max: number
}

/**
 * Union type de todas as propriedades de eventos
 */
export type TelemetryEventProperties =
  | BaseEventProperties
  | MapInitializedProperties
  | LayerAddedProperties
  | ErrorOccurredProperties
  | ElevationPresetProperties
