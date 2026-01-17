import { describe, it, expect } from 'vitest'
import {
  TELEMETRY_EVENTS,
  type TelemetryEventName,
  type TelemetryEventProperties,
  type BaseEventProperties,
  type MapInitializedProperties,
  type LayerAddedProperties,
  type ErrorOccurredProperties,
  type ElevationPresetProperties,
} from '../../src/telemetry/events'

describe('Telemetry Events', () => {
  describe('TELEMETRY_EVENTS constants', () => {
    it('should define lifecycle events', () => {
      expect(TELEMETRY_EVENTS.MAP_INITIALIZED).toBe('map_initialized')
      expect(TELEMETRY_EVENTS.MAP_DESTROYED).toBe('map_destroyed')
    })

    it('should define layer events', () => {
      expect(TELEMETRY_EVENTS.LAYER_ADDED).toBe('layer_added')
      expect(TELEMETRY_EVENTS.LAYER_REMOVED).toBe('layer_removed')
      expect(TELEMETRY_EVENTS.LAYERS_SET).toBe('layers_set')
    })

    it('should define interaction events', () => {
      expect(TELEMETRY_EVENTS.FEATURE_CLICKED).toBe('feature_clicked')
      expect(TELEMETRY_EVENTS.FEATURE_HOVERED).toBe('feature_hovered')
    })

    it('should define navigation events', () => {
      expect(TELEMETRY_EVENTS.VIEW_CHANGED).toBe('view_changed')
      expect(TELEMETRY_EVENTS.FLY_TO).toBe('fly_to')
      expect(TELEMETRY_EVENTS.TOGGLE_3D).toBe('toggle_3d')
    })

    it('should define elevation events', () => {
      expect(TELEMETRY_EVENTS.ELEVATION_RANGE_CHANGED).toBe('elevation_range_changed')
      expect(TELEMETRY_EVENTS.ELEVATION_PRESET_APPLIED).toBe('elevation_preset_applied')
    })

    it('should define error events', () => {
      expect(TELEMETRY_EVENTS.ERROR_OCCURRED).toBe('error_occurred')
    })

    it('should define performance events', () => {
      expect(TELEMETRY_EVENTS.RENDER_TIME).toBe('render_time')
    })

    it('should be immutable (const assertion)', () => {
      expect(Object.isFrozen(TELEMETRY_EVENTS)).toBe(false) // as const doesn't freeze
      // But TypeScript prevents modification at compile time
      expect(Object.keys(TELEMETRY_EVENTS).length).toBe(14)
    })
  })

  describe('Type definitions', () => {
    it('should allow valid TelemetryEventName values', () => {
      const eventName: TelemetryEventName = TELEMETRY_EVENTS.MAP_INITIALIZED
      expect(eventName).toBe('map_initialized')
    })

    it('should define BaseEventProperties structure', () => {
      const baseProps: BaseEventProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
      }
      expect(baseProps.timestamp).toBeDefined()
      expect(baseProps.library_version).toBeDefined()
      expect(baseProps.session_id).toBeDefined()
    })

    it('should define MapInitializedProperties structure', () => {
      const mapInitProps: MapInitializedProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
        map_style: 'dark',
        interleaved: true,
        initial_zoom: 12,
        initial_pitch: 45,
      }
      expect(mapInitProps.map_style).toBe('dark')
      expect(mapInitProps.interleaved).toBe(true)
      expect(mapInitProps.initial_zoom).toBe(12)
      expect(mapInitProps.initial_pitch).toBe(45)
    })

    it('should define LayerAddedProperties structure', () => {
      const layerProps: LayerAddedProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
        layer_id: 'test-layer',
        layer_type: 'PolygonLayer',
        feature_count: 100,
      }
      expect(layerProps.layer_id).toBe('test-layer')
      expect(layerProps.layer_type).toBe('PolygonLayer')
      expect(layerProps.feature_count).toBe(100)
    })

    it('should define LayerAddedProperties without optional feature_count', () => {
      const layerProps: LayerAddedProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
        layer_id: 'test-layer',
        layer_type: 'GeoJsonLayer',
      }
      expect(layerProps.feature_count).toBeUndefined()
    })

    it('should define ErrorOccurredProperties structure', () => {
      const errorProps: ErrorOccurredProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
        error_message: 'Test error',
        error_stack: 'Error stack trace',
        context: 'initialization',
      }
      expect(errorProps.error_message).toBe('Test error')
      expect(errorProps.error_stack).toBe('Error stack trace')
      expect(errorProps.context).toBe('initialization')
    })

    it('should define ErrorOccurredProperties without optional fields', () => {
      const errorProps: ErrorOccurredProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
        error_message: 'Minimal error',
      }
      expect(errorProps.error_stack).toBeUndefined()
      expect(errorProps.context).toBeUndefined()
    })

    it('should define ElevationPresetProperties structure', () => {
      const presetProps: ElevationPresetProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
        preset_id: 'surface',
        range_min: -5,
        range_max: 50,
      }
      expect(presetProps.preset_id).toBe('surface')
      expect(presetProps.range_min).toBe(-5)
      expect(presetProps.range_max).toBe(50)
    })

    it('should allow TelemetryEventProperties union type', () => {
      const props1: TelemetryEventProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
      }

      const props2: TelemetryEventProperties = {
        timestamp: '2024-01-01T00:00:00.000Z',
        library_version: '1.0.0',
        session_id: 'test-session-123',
        map_style: 'light',
        interleaved: false,
        initial_zoom: 10,
        initial_pitch: 0,
      }

      expect(props1.timestamp).toBeDefined()
      expect((props2 as MapInitializedProperties).map_style).toBe('light')
    })
  })

  describe('Event names consistency', () => {
    it('should have all event names as snake_case strings', () => {
      const eventValues = Object.values(TELEMETRY_EVENTS)
      eventValues.forEach((eventName) => {
        // Allow numbers in snake_case (e.g., toggle_3d)
        expect(eventName).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/)
      })
    })

    it('should have all event keys as UPPER_SNAKE_CASE', () => {
      const eventKeys = Object.keys(TELEMETRY_EVENTS)
      eventKeys.forEach((key) => {
        // Allow numbers in UPPER_SNAKE_CASE (e.g., TOGGLE_3D)
        expect(key).toMatch(/^[A-Z0-9]+(_[A-Z0-9]+)*$/)
      })
    })

    it('should have unique event values', () => {
      const eventValues = Object.values(TELEMETRY_EVENTS)
      const uniqueValues = new Set(eventValues)
      expect(uniqueValues.size).toBe(eventValues.length)
    })
  })
})
