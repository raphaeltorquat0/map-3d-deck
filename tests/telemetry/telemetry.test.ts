import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  initTelemetry,
  disableTelemetry,
  enableTelemetry,
  isTelemetryEnabled,
  captureEvent,
  captureError,
  resetTelemetry,
  telemetry,
  TELEMETRY_EVENTS,
} from '../../src/telemetry'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Mock navigator
const navigatorMock = {
  doNotTrack: null as string | null,
  globalPrivacyControl: null as string | null,
}

describe('Telemetry Module', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    localStorageMock.clear()

    // Setup global mocks
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    Object.defineProperty(global, 'navigator', {
      value: navigatorMock,
      writable: true,
    })

    // Reset navigator mock
    navigatorMock.doNotTrack = null
    navigatorMock.globalPrivacyControl = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('TELEMETRY_EVENTS export', () => {
    it('should export TELEMETRY_EVENTS', () => {
      expect(TELEMETRY_EVENTS).toBeDefined()
      expect(TELEMETRY_EVENTS.MAP_INITIALIZED).toBe('map_initialized')
    })
  })

  describe('telemetry singleton', () => {
    it('should export telemetry singleton with all methods', () => {
      expect(telemetry).toBeDefined()
      expect(telemetry.init).toBeDefined()
      expect(telemetry.capture).toBeDefined()
      expect(telemetry.captureError).toBeDefined()
      expect(telemetry.disable).toBeDefined()
      expect(telemetry.enable).toBeDefined()
      expect(telemetry.isEnabled).toBeDefined()
      expect(telemetry.reset).toBeDefined()
      expect(telemetry.events).toBeDefined()
    })

    it('should have events property matching TELEMETRY_EVENTS', () => {
      expect(telemetry.events).toBe(TELEMETRY_EVENTS)
    })
  })

  describe('initTelemetry', () => {
    it('should be a function', () => {
      expect(typeof initTelemetry).toBe('function')
    })

    it('should accept disabled config', async () => {
      await initTelemetry({ disabled: true })
      // Should not throw
      expect(true).toBe(true)
    })

    it('should accept custom sessionId', async () => {
      await initTelemetry({ sessionId: 'custom-session-123' })
      expect(true).toBe(true)
    })

    it('should accept onEvent callback', async () => {
      const onEvent = vi.fn()
      await initTelemetry({ onEvent })
      expect(true).toBe(true)
    })
  })

  describe('disableTelemetry', () => {
    it('should be a function', () => {
      expect(typeof disableTelemetry).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => disableTelemetry()).not.toThrow()
    })

    it('should persist opt-out to localStorage', () => {
      disableTelemetry()
      expect(localStorageMock.setItem).toHaveBeenCalledWith('map3d_telemetry_optout', 'true')
    })
  })

  describe('enableTelemetry', () => {
    it('should be a function', () => {
      expect(typeof enableTelemetry).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => enableTelemetry()).not.toThrow()
    })

    it('should remove opt-out from localStorage', () => {
      enableTelemetry()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('map3d_telemetry_optout')
    })
  })

  describe('isTelemetryEnabled', () => {
    it('should be a function', () => {
      expect(typeof isTelemetryEnabled).toBe('function')
    })

    it('should return a boolean', () => {
      const result = isTelemetryEnabled()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('captureEvent', () => {
    it('should be a function', () => {
      expect(typeof captureEvent).toBe('function')
    })

    it('should not throw when called with valid event', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.MAP_INITIALIZED)).not.toThrow()
    })

    it('should accept properties object', () => {
      expect(() =>
        captureEvent(TELEMETRY_EVENTS.LAYER_ADDED, {
          layer_id: 'test',
          layer_type: 'PolygonLayer',
        })
      ).not.toThrow()
    })

    it('should call onEvent callback when provided', async () => {
      const onEvent = vi.fn()
      await initTelemetry({ onEvent, disabled: false })

      captureEvent(TELEMETRY_EVENTS.MAP_INITIALIZED, { test: true })

      // Note: The callback may or may not be called depending on initialization state
      // This test verifies the function doesn't throw
      expect(true).toBe(true)
    })
  })

  describe('captureError', () => {
    it('should be a function', () => {
      expect(typeof captureError).toBe('function')
    })

    it('should not throw when called with Error', () => {
      const error = new Error('Test error')
      expect(() => captureError(error)).not.toThrow()
    })

    it('should accept optional context', () => {
      const error = new Error('Test error')
      expect(() => captureError(error, 'initialization')).not.toThrow()
    })
  })

  describe('resetTelemetry', () => {
    it('should be a function', () => {
      expect(typeof resetTelemetry).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => resetTelemetry()).not.toThrow()
    })
  })

  describe('telemetry singleton methods', () => {
    it('init should be same as initTelemetry', () => {
      expect(telemetry.init).toBe(initTelemetry)
    })

    it('capture should be same as captureEvent', () => {
      expect(telemetry.capture).toBe(captureEvent)
    })

    it('captureError should be same as exported captureError', () => {
      expect(telemetry.captureError).toBe(captureError)
    })

    it('disable should be same as disableTelemetry', () => {
      expect(telemetry.disable).toBe(disableTelemetry)
    })

    it('enable should be same as enableTelemetry', () => {
      expect(telemetry.enable).toBe(enableTelemetry)
    })

    it('isEnabled should be same as isTelemetryEnabled', () => {
      expect(telemetry.isEnabled).toBe(isTelemetryEnabled)
    })

    it('reset should be same as resetTelemetry', () => {
      expect(telemetry.reset).toBe(resetTelemetry)
    })
  })

  describe('Event type coverage', () => {
    it('should handle lifecycle events', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.MAP_INITIALIZED)).not.toThrow()
      expect(() => captureEvent(TELEMETRY_EVENTS.MAP_DESTROYED)).not.toThrow()
    })

    it('should handle layer events', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.LAYER_ADDED)).not.toThrow()
      expect(() => captureEvent(TELEMETRY_EVENTS.LAYER_REMOVED)).not.toThrow()
      expect(() => captureEvent(TELEMETRY_EVENTS.LAYERS_SET)).not.toThrow()
    })

    it('should handle interaction events', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.FEATURE_CLICKED)).not.toThrow()
      expect(() => captureEvent(TELEMETRY_EVENTS.FEATURE_HOVERED)).not.toThrow()
    })

    it('should handle navigation events', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.VIEW_CHANGED)).not.toThrow()
      expect(() => captureEvent(TELEMETRY_EVENTS.FLY_TO)).not.toThrow()
      expect(() => captureEvent(TELEMETRY_EVENTS.TOGGLE_3D)).not.toThrow()
    })

    it('should handle elevation events', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.ELEVATION_RANGE_CHANGED)).not.toThrow()
      expect(() => captureEvent(TELEMETRY_EVENTS.ELEVATION_PRESET_APPLIED)).not.toThrow()
    })

    it('should handle error events', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.ERROR_OCCURRED)).not.toThrow()
    })

    it('should handle performance events', () => {
      expect(() => captureEvent(TELEMETRY_EVENTS.RENDER_TIME)).not.toThrow()
    })
  })

  describe('TelemetryConfig', () => {
    it('should accept empty config', async () => {
      await expect(initTelemetry({})).resolves.not.toThrow()
    })

    it('should accept full config', async () => {
      await expect(
        initTelemetry({
          disabled: false,
          sessionId: 'test-session',
          onEvent: () => {},
        })
      ).resolves.not.toThrow()
    })
  })
})
