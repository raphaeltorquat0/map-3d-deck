/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Layer } from '@deck.gl/core'

// Store event callbacks for simulation
const eventCallbacks: Map<string, (() => void)[]> = new Map()

// Track pending load timeouts to cancel on remove
const pendingLoadTimeouts: Set<ReturnType<typeof setTimeout>> = new Set()

// Mock maplibre-gl with factory function
vi.mock('maplibre-gl', () => {
  const mockOn = vi.fn((event: string, callback: () => void) => {
    if (!eventCallbacks.has(event)) {
      eventCallbacks.set(event, [])
    }
    eventCallbacks.get(event)!.push(callback)

    // Auto-fire load event after a tick
    if (event === 'load') {
      const timeoutId = setTimeout(() => {
        pendingLoadTimeouts.delete(timeoutId)
        callback()
      }, 0)
      pendingLoadTimeouts.add(timeoutId)
    }
  })

  return {
    default: {
      Map: vi.fn().mockImplementation(() => {
        // Check flag inside the implementation (accessed via closure)
        if ((globalThis as { shouldMapConstructorFail?: boolean }).shouldMapConstructorFail) {
          throw new Error('MapLibre GL initialization failed')
        }
        return {
          on: mockOn,
          addControl: vi.fn(),
          getCenter: vi.fn(() => ({ lng: -46.6, lat: -23.5 })),
          getZoom: vi.fn(() => 12),
          getPitch: vi.fn(() => 45),
          getBearing: vi.fn(() => 0),
          flyTo: vi.fn(),
          fitBounds: vi.fn(),
          easeTo: vi.fn(),
          setCenter: vi.fn(),
          setZoom: vi.fn(),
          setPitch: vi.fn(),
          setBearing: vi.fn(),
          triggerRepaint: vi.fn(),
          resize: vi.fn(),
          remove: vi.fn(() => {
            // Cancel all pending load timeouts when map is removed
            pendingLoadTimeouts.forEach((id) => clearTimeout(id))
            pendingLoadTimeouts.clear()
          }),
        }
      }),
    },
  }
})

// Helper to fire map events
function fireMapEvent(event: string) {
  const callbacks = eventCallbacks.get(event) || []
  callbacks.forEach((cb) => cb())
}

// Store deck overlay callbacks for simulation
let deckOnHover: ((info: unknown, event: unknown) => void) | null = null
let deckOnClick: ((info: unknown, event: unknown) => void) | null = null

// Mock @deck.gl/mapbox
vi.mock('@deck.gl/mapbox', () => ({
  MapboxOverlay: vi
    .fn()
    .mockImplementation(
      (props: {
        onHover?: (info: unknown, event: unknown) => void
        onClick?: (info: unknown, event: unknown) => void
      }) => {
        deckOnHover = props.onHover || null
        deckOnClick = props.onClick || null
        return {
          setProps: vi.fn(),
          finalize: vi.fn(),
        }
      }
    ),
}))

// Flag to control initTelemetry behavior
let shouldInitTelemetryFail = false

// Mock telemetry
vi.mock('../../src/telemetry', () => ({
  telemetry: {
    capture: vi.fn(),
    captureError: vi.fn(),
  },
  initTelemetry: vi.fn(() => {
    if (shouldInitTelemetryFail) {
      return Promise.reject(new Error('Telemetry init failed'))
    }
    return Promise.resolve(undefined)
  }),
  TELEMETRY_EVENTS: {
    MAP_INITIALIZED: 'map_initialized',
    MAP_DESTROYED: 'map_destroyed',
    LAYER_ADDED: 'layer_added',
    LAYER_REMOVED: 'layer_removed',
  },
}))

// Import after mocks
import { Map3D, type Map3DConfig } from '../../src/core/Map3D'
import { DEFAULT_VIEW_STATE, MAP_STYLES } from '../../src/types'

// Import telemetry to verify calls
import { telemetry, TELEMETRY_EVENTS } from '../../src/telemetry'

describe('Map3D', () => {
  let container: HTMLElement

  beforeEach(() => {
    // Create mock container
    container = document.createElement('div')
    container.id = 'map-container'
    document.body.appendChild(container)

    // Clear event callbacks
    eventCallbacks.clear()

    // Clear pending load timeouts from previous tests
    pendingLoadTimeouts.forEach((id) => clearTimeout(id))
    pendingLoadTimeouts.clear()

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup - be defensive about container
    try {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('constructor', () => {
    it('should create Map3D instance with HTMLElement container', () => {
      const map = new Map3D({ container })
      expect(map).toBeInstanceOf(Map3D)
      map.destroy()
    })

    it('should create Map3D instance with string container id', () => {
      const map = new Map3D({ container: 'map-container' })
      expect(map).toBeInstanceOf(Map3D)
      map.destroy()
    })

    it('should throw error for non-existent container id', () => {
      expect(() => new Map3D({ container: 'non-existent-id' })).toThrow(
        'Container "non-existent-id" not found'
      )
    })

    it('should use default view state when not specified', () => {
      const map = new Map3D({ container })
      const viewState = map.getViewState()
      expect(viewState.latitude).toBe(DEFAULT_VIEW_STATE.latitude)
      expect(viewState.longitude).toBe(DEFAULT_VIEW_STATE.longitude)
      expect(viewState.zoom).toBe(DEFAULT_VIEW_STATE.zoom)
      map.destroy()
    })

    it('should use custom initial view state', () => {
      const map = new Map3D({
        container,
        initialViewState: {
          latitude: 40.7128,
          longitude: -74.006,
          zoom: 15,
          pitch: 60,
          bearing: 45,
        },
      })
      const viewState = map.getViewState()
      expect(viewState.latitude).toBe(40.7128)
      expect(viewState.longitude).toBe(-74.006)
      expect(viewState.zoom).toBe(15)
      expect(viewState.pitch).toBe(60)
      expect(viewState.bearing).toBe(45)
      map.destroy()
    })

    it('should use default interleaved mode (true)', () => {
      const map = new Map3D({ container })
      expect(map).toBeDefined()
      map.destroy()
    })

    it('should accept custom interleaved mode', () => {
      const map = new Map3D({ container, interleaved: false })
      expect(map).toBeDefined()
      map.destroy()
    })

    it('should initialize popup controller', () => {
      const map = new Map3D({ container })
      expect(map.popup).toBeDefined()
      map.destroy()
    })

    it('should initialize legend controller', () => {
      const map = new Map3D({ container })
      expect(map.legend).toBeDefined()
      map.destroy()
    })

    it('should accept popup config', () => {
      const map = new Map3D({
        container,
        popup: { enabled: true, showOnHover: true },
      })
      expect(map.popup).toBeDefined()
      map.destroy()
    })

    it('should accept legend config', () => {
      const map = new Map3D({
        container,
        legend: { enabled: true, position: 'top-right' },
      })
      expect(map.legend).toBeDefined()
      map.destroy()
    })

    it('should accept event callbacks', () => {
      const onClick = vi.fn()
      const onHover = vi.fn()
      const onViewStateChange = vi.fn()
      const onLoad = vi.fn()
      const onError = vi.fn()

      const map = new Map3D({
        container,
        onClick,
        onHover,
        onViewStateChange,
        onLoad,
        onError,
      })
      expect(map).toBeDefined()
      map.destroy()
    })
  })

  describe('layer management', () => {
    it('should add layer', () => {
      const map = new Map3D({ container })
      const mockLayer = { id: 'test-layer' } as Layer
      map.addLayer(mockLayer)
      expect(map.getLayer('test-layer')).toBe(mockLayer)
      map.destroy()
    })

    it('should throw error when adding layer without id', () => {
      const map = new Map3D({ container })
      const mockLayer = {} as Layer
      expect(() => map.addLayer(mockLayer)).toThrow('Layer must have an id')
      map.destroy()
    })

    it('should remove layer', () => {
      const map = new Map3D({ container })
      const mockLayer = { id: 'test-layer' } as Layer
      map.addLayer(mockLayer)
      map.removeLayer('test-layer')
      expect(map.getLayer('test-layer')).toBeUndefined()
      map.destroy()
    })

    it('should update existing layer', () => {
      const map = new Map3D({ container })
      const mockLayer = { id: 'test-layer', props: { opacity: 1 } } as unknown as Layer
      map.addLayer(mockLayer)

      const updatedLayer = { id: 'test-layer', props: { opacity: 0.5 } } as unknown as Layer
      map.updateLayer(updatedLayer)

      expect(map.getLayer('test-layer')).toBe(updatedLayer)
      map.destroy()
    })

    it('should not update non-existent layer', () => {
      const map = new Map3D({ container })
      const mockLayer = { id: 'non-existent' } as Layer
      map.updateLayer(mockLayer)
      expect(map.getLayer('non-existent')).toBeUndefined()
      map.destroy()
    })

    it('should get all layers', () => {
      const map = new Map3D({ container })
      const layer1 = { id: 'layer-1' } as Layer
      const layer2 = { id: 'layer-2' } as Layer
      map.addLayer(layer1)
      map.addLayer(layer2)

      const layers = map.getLayers()
      expect(layers).toHaveLength(2)
      expect(layers).toContain(layer1)
      expect(layers).toContain(layer2)
      map.destroy()
    })

    it('should set multiple layers at once', () => {
      const map = new Map3D({ container })
      const layer1 = { id: 'layer-1' } as Layer
      const layer2 = { id: 'layer-2' } as Layer
      const layer3 = { id: 'layer-3' } as Layer

      map.addLayer(layer1)
      map.setLayers([layer2, layer3])

      const layers = map.getLayers()
      expect(layers).toHaveLength(2)
      expect(layers).not.toContain(layer1)
      expect(layers).toContain(layer2)
      expect(layers).toContain(layer3)
      map.destroy()
    })
  })

  describe('elevation range', () => {
    it('should get elevation range', () => {
      const map = new Map3D({ container })
      const range = map.getElevationRange()
      expect(range).toHaveProperty('min')
      expect(range).toHaveProperty('max')
      map.destroy()
    })

    it('should set elevation range', () => {
      const map = new Map3D({ container })
      map.setElevationRange({ min: -10, max: 100 })
      const range = map.getElevationRange()
      expect(range.min).toBe(-10)
      expect(range.max).toBe(100)
      map.destroy()
    })

    it('should return copy of elevation range', () => {
      const map = new Map3D({ container })
      const range1 = map.getElevationRange()
      const range2 = map.getElevationRange()
      expect(range1).not.toBe(range2)
      expect(range1).toEqual(range2)
      map.destroy()
    })
  })

  describe('view state', () => {
    it('should get view state', () => {
      const map = new Map3D({ container })
      const viewState = map.getViewState()
      expect(viewState).toHaveProperty('longitude')
      expect(viewState).toHaveProperty('latitude')
      expect(viewState).toHaveProperty('zoom')
      expect(viewState).toHaveProperty('pitch')
      expect(viewState).toHaveProperty('bearing')
      map.destroy()
    })

    it('should return copy of view state', () => {
      const map = new Map3D({ container })
      const viewState1 = map.getViewState()
      const viewState2 = map.getViewState()
      expect(viewState1).not.toBe(viewState2)
      expect(viewState1).toEqual(viewState2)
      map.destroy()
    })
  })

  describe('utility methods', () => {
    it('should get map instance', () => {
      const map = new Map3D({ container })
      const instance = map.getMapInstance()
      expect(instance).toBeDefined()
      map.destroy()
    })

    it('should get deck overlay', () => {
      const map = new Map3D({ container })
      const overlay = map.getDeckOverlay()
      expect(overlay).toBeDefined()
      map.destroy()
    })

    it('should not throw when calling navigation methods', () => {
      const map = new Map3D({ container })
      expect(() => map.flyTo({ longitude: 0, latitude: 0 })).not.toThrow()
      expect(() =>
        map.fitBounds([
          [0, 0],
          [1, 1],
        ])
      ).not.toThrow()
      expect(() => map.setViewState({ zoom: 10 })).not.toThrow()
      expect(() => map.toggle3D(true)).not.toThrow()
      expect(() => map.resize()).not.toThrow()
      map.destroy()
    })
  })

  describe('destroy', () => {
    it('should destroy map and release resources', () => {
      const map = new Map3D({ container })
      map.destroy()

      expect(map.isReady()).toBe(false)
      expect(map.getMapInstance()).toBeNull()
      expect(map.getDeckOverlay()).toBeNull()
    })

    it('should clear all layers on destroy', () => {
      const map = new Map3D({ container })
      map.addLayer({ id: 'test-layer' } as Layer)
      map.destroy()

      expect(map.getLayers()).toHaveLength(0)
    })

    it('should handle methods called after destroy', () => {
      const map = new Map3D({ container })
      map.destroy()

      // These should not throw when map is null
      expect(() => map.flyTo({ longitude: 0, latitude: 0 })).not.toThrow()
      expect(() =>
        map.fitBounds([
          [0, 0],
          [1, 1],
        ])
      ).not.toThrow()
      expect(() => map.setViewState({ zoom: 10 })).not.toThrow()
      expect(() => map.toggle3D(true)).not.toThrow()
      expect(() => map.resize()).not.toThrow()
    })
  })

  describe('Map3DConfig interface', () => {
    it('should accept all config options', () => {
      const config: Map3DConfig = {
        container,
        mapStyle: MAP_STYLES.LIGHT,
        initialViewState: {
          latitude: 0,
          longitude: 0,
          zoom: 1,
          pitch: 0,
          bearing: 0,
        },
        interleaved: true,
        popup: { enabled: true },
        legend: { enabled: true },
        onClick: () => {},
        onHover: () => {},
        onViewStateChange: () => {},
        onLoad: () => {},
        onError: () => {},
      }

      const map = new Map3D(config)
      expect(map).toBeDefined()
      map.destroy()
    })
  })

  describe('MAP_STYLES', () => {
    it('should use custom map style', () => {
      const map = new Map3D({
        container,
        mapStyle: MAP_STYLES.LIGHT,
      })
      expect(map).toBeDefined()
      map.destroy()
    })

    it('should support dark style', () => {
      const map = new Map3D({
        container,
        mapStyle: MAP_STYLES.DARK,
      })
      expect(map).toBeDefined()
      map.destroy()
    })

    it('should support streets style', () => {
      const map = new Map3D({
        container,
        mapStyle: MAP_STYLES.STREETS,
      })
      expect(map).toBeDefined()
      map.destroy()
    })

    it('should support satellite style', () => {
      const map = new Map3D({
        container,
        mapStyle: MAP_STYLES.SATELLITE,
      })
      expect(map).toBeDefined()
      map.destroy()
    })
  })

  describe('partial view state updates', () => {
    it('should handle partial latitude/longitude update', () => {
      const map = new Map3D({ container })
      // Only updating one coordinate at a time
      expect(() => map.setViewState({ latitude: 40 }, { animate: false })).not.toThrow()
      expect(() => map.setViewState({ longitude: -74 }, { animate: false })).not.toThrow()
      map.destroy()
    })

    it('should handle setViewState with default animation', () => {
      const map = new Map3D({ container })
      // Default should be animated
      expect(() => map.setViewState({ zoom: 15 })).not.toThrow()
      map.destroy()
    })

    it('should handle setViewState with bearing', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ bearing: 45 }, { animate: false })

      expect(mapInstance?.setBearing).toHaveBeenCalledWith(45)
      map.destroy()
    })
  })

  describe('toggle3D with easing', () => {
    it('should call easeTo with easing function', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.toggle3D(true)

      expect(mapInstance?.easeTo).toHaveBeenCalled()
      const call = (mapInstance?.easeTo as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call.pitch).toBe(45)
      expect(call.duration).toBe(800)
      expect(typeof call.easing).toBe('function')

      // Test the easing function (ease-out-cubic)
      const easing = call.easing
      expect(easing(0)).toBe(0) // Start
      expect(easing(1)).toBe(1) // End
      expect(easing(0.5)).toBeCloseTo(0.875) // 1 - (0.5)^3 = 1 - 0.125 = 0.875

      map.destroy()
    })

    it('should call easeTo with custom duration', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.toggle3D(false, { duration: 500 })

      expect(mapInstance?.easeTo).toHaveBeenCalled()
      const call = (mapInstance?.easeTo as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call.pitch).toBe(0)
      expect(call.duration).toBe(500)

      map.destroy()
    })
  })

  describe('telemetry', () => {
    it('should capture telemetry on initialization', async () => {
      const map = new Map3D({ container })

      // Wait for async initialization
      await vi.waitFor(() => expect(telemetry.capture).toHaveBeenCalled())

      expect(telemetry.capture).toHaveBeenCalledWith(
        TELEMETRY_EVENTS.MAP_INITIALIZED,
        expect.objectContaining({
          interleaved: true,
        })
      )
      map.destroy()
    })

    it('should silently ignore telemetry init errors', async () => {
      // Make initTelemetry fail
      shouldInitTelemetryFail = true

      // Should not throw even when telemetry init fails
      const map = new Map3D({ container })
      expect(map).toBeDefined()

      // Wait a tick for the rejected promise to be handled
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Reset flag
      shouldInitTelemetryFail = false
      map.destroy()
    })
  })

  describe('map events', () => {
    it('should call onLoad callback when map loads', async () => {
      const onLoad = vi.fn()
      const map = new Map3D({ container, onLoad })

      // Wait for load
      await vi.waitFor(() => expect(onLoad).toHaveBeenCalled())

      expect(onLoad).toHaveBeenCalledTimes(1)
      map.destroy()
    })

    it('should update viewState on map move event', async () => {
      const onViewStateChange = vi.fn()
      const map = new Map3D({ container, onViewStateChange })

      // Wait for load first
      await vi.waitFor(() => expect(map.isReady()).toBe(true))

      // Fire the move event
      fireMapEvent('move')

      expect(onViewStateChange).toHaveBeenCalled()
      const viewState = map.getViewState()
      expect(viewState.longitude).toBe(-46.6)
      expect(viewState.latitude).toBe(-23.5)
      expect(viewState.zoom).toBe(12)
      expect(viewState.pitch).toBe(45)
      expect(viewState.bearing).toBe(0)

      map.destroy()
    })

    it('should not call onViewStateChange if not provided', async () => {
      const map = new Map3D({ container })

      // Wait for load
      await vi.waitFor(() => expect(map.isReady()).toBe(true))

      // Fire the move event - should not throw
      expect(() => fireMapEvent('move')).not.toThrow()

      map.destroy()
    })
  })

  describe('deck overlay events', () => {
    it('should handle hover event on deck overlay', () => {
      const onHover = vi.fn()
      const map = new Map3D({ container, onHover })

      // Simulate hover event on deck overlay
      if (deckOnHover) {
        deckOnHover(
          { x: 100, y: 100, object: null, layer: null },
          { srcEvent: new MouseEvent('mousemove') }
        )
      }

      expect(onHover).toHaveBeenCalled()
      map.destroy()
    })

    it('should handle hover event without user callback', () => {
      const map = new Map3D({ container })

      // Should not throw when no onHover callback
      if (deckOnHover) {
        expect(() => {
          deckOnHover!(
            { x: 100, y: 100, object: null, layer: null },
            { srcEvent: new MouseEvent('mousemove') }
          )
        }).not.toThrow()
      }

      map.destroy()
    })

    it('should handle click event on deck overlay', () => {
      const onClick = vi.fn()
      const map = new Map3D({ container, onClick })

      // Simulate click event on deck overlay
      if (deckOnClick) {
        deckOnClick(
          { x: 100, y: 100, object: { type: 'Feature' }, layer: { id: 'test' } },
          { srcEvent: new MouseEvent('click') }
        )
      }

      expect(onClick).toHaveBeenCalled()
      map.destroy()
    })

    it('should handle click event without user callback', () => {
      const map = new Map3D({ container })

      // Should not throw when no onClick callback
      if (deckOnClick) {
        expect(() => {
          deckOnClick!(
            { x: 100, y: 100, object: null, layer: null },
            { srcEvent: new MouseEvent('click') }
          )
        }).not.toThrow()
      }

      map.destroy()
    })
  })

  describe('setViewState with animation', () => {
    it('should call easeTo with center when both longitude and latitude provided', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ longitude: -74, latitude: 40 }, { animate: true })

      expect(mapInstance?.easeTo).toHaveBeenCalled()
      const call = (mapInstance?.easeTo as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call.center).toEqual([-74, 40])
      map.destroy()
    })

    it('should not set center when only longitude is provided', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ longitude: -74 }, { animate: true })

      const call = (mapInstance?.easeTo as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call.center).toBeUndefined()
      map.destroy()
    })

    it('should include zoom in easeTo options', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ zoom: 15 }, { animate: true })

      const call = (mapInstance?.easeTo as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call.zoom).toBe(15)
      map.destroy()
    })
  })

  describe('setViewState without animation', () => {
    it('should call setZoom when zoom is provided', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ zoom: 15 }, { animate: false })

      expect(mapInstance?.setZoom).toHaveBeenCalledWith(15)
      map.destroy()
    })

    it('should call setPitch when pitch is provided', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ pitch: 60 }, { animate: false })

      expect(mapInstance?.setPitch).toHaveBeenCalledWith(60)
      map.destroy()
    })

    it('should call setCenter when both longitude and latitude are provided', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ longitude: -74, latitude: 40 }, { animate: false })

      expect(mapInstance?.setCenter).toHaveBeenCalledWith([-74, 40])
      map.destroy()
    })

    it('should not call setCenter when only longitude is provided', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ longitude: -74 }, { animate: false })

      expect(mapInstance?.setCenter).not.toHaveBeenCalled()
      map.destroy()
    })

    it('should not call setCenter when only latitude is provided', () => {
      const map = new Map3D({ container })
      const mapInstance = map.getMapInstance()

      map.setViewState({ latitude: 40 }, { animate: false })

      expect(mapInstance?.setCenter).not.toHaveBeenCalled()
      map.destroy()
    })
  })

  describe('initialization error handling', () => {
    it('should call onError callback when map initialization fails', async () => {
      // Enable the error flag via globalThis
      ;(globalThis as { shouldMapConstructorFail?: boolean }).shouldMapConstructorFail = true

      const onError = vi.fn()
      vi.clearAllMocks()

      // Map3D constructor calls initialize() which is async, so error is thrown async
      new Map3D({ container, onError })

      // Wait for the async initialize to complete and error to be handled
      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })

      // The error should have been captured by telemetry
      expect(telemetry.captureError).toHaveBeenCalledWith(expect.any(Error), 'map_initialization')

      // The onError callback should have been called with the error
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'MapLibre GL initialization failed',
        })
      )

      // Reset the flag
      ;(globalThis as { shouldMapConstructorFail?: boolean }).shouldMapConstructorFail = false
    })

    it('should capture error to telemetry when initialization fails', async () => {
      ;(globalThis as { shouldMapConstructorFail?: boolean }).shouldMapConstructorFail = true

      vi.clearAllMocks()

      new Map3D({ container })

      // Wait for async error handling
      await vi.waitFor(() => {
        expect(telemetry.captureError).toHaveBeenCalled()
      })

      expect(telemetry.captureError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'MapLibre GL initialization failed' }),
        'map_initialization'
      )
      ;(globalThis as { shouldMapConstructorFail?: boolean }).shouldMapConstructorFail = false
    })

    it('should throw error as unhandled promise rejection', async () => {
      ;(globalThis as { shouldMapConstructorFail?: boolean }).shouldMapConstructorFail = true

      vi.clearAllMocks()

      // The error is re-thrown after being captured, resulting in unhandled rejection
      new Map3D({ container })

      // Verify the error was processed through the catch block
      await vi.waitFor(() => {
        expect(telemetry.captureError).toHaveBeenCalled()
      })
      ;(globalThis as { shouldMapConstructorFail?: boolean }).shouldMapConstructorFail = false
    })
  })
})
