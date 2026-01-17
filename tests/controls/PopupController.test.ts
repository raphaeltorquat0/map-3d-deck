import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Feature, Point } from 'geojson'
import { PopupController, createPopupController } from '../../src/controls/PopupController'

// Mock feature
const mockFeature: Feature<Point> = {
  type: 'Feature',
  properties: {
    id: '1',
    name: 'Test Feature',
    value: 100,
  },
  geometry: {
    type: 'Point',
    coordinates: [-46.6, -23.5],
  },
}

describe('PopupController', () => {
  let controller: PopupController

  beforeEach(() => {
    controller = new PopupController()
    vi.useFakeTimers()
  })

  afterEach(() => {
    controller.destroy()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = controller.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.showOnHover).toBe(true)
      expect(config.showOnClick).toBe(true)
    })

    it('should accept custom config', () => {
      const customController = new PopupController({
        enabled: false,
        showOnHover: false,
        hoverDelay: 500,
      })

      const config = customController.getConfig()
      expect(config.enabled).toBe(false)
      expect(config.showOnHover).toBe(false)
      expect(config.hoverDelay).toBe(500)

      customController.destroy()
    })

    it('should accept initial callbacks', () => {
      const onOpen = vi.fn()
      const onClose = vi.fn()

      const customController = new PopupController({ onOpen, onClose })

      customController.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(onOpen).toHaveBeenCalled()

      customController.close()
      expect(onClose).toHaveBeenCalled()

      customController.destroy()
    })
  })

  describe('isEnabled / setEnabled', () => {
    it('should return enabled state', () => {
      expect(controller.isEnabled()).toBe(true)
    })

    it('should disable popup system', () => {
      controller.setEnabled(false)
      expect(controller.isEnabled()).toBe(false)
    })

    it('should close popup when disabled', () => {
      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(true)

      controller.setEnabled(false)
      expect(controller.isOpen()).toBe(false)
    })
  })

  describe('handleClick', () => {
    it('should open popup on click with feature', () => {
      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(true)
      const info = controller.getInfo()
      expect(info?.trigger).toBe('click')
      expect(info?.layerId).toBe('test-layer')
    })

    it('should close popup on click without feature', () => {
      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(true)

      controller.handleClick({
        x: 200,
        y: 200,
        coordinate: [-46.7, -23.6],
      })

      expect(controller.isOpen()).toBe(false)
    })

    it('should not open when disabled', () => {
      controller.setEnabled(false)

      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(false)
    })

    it('should not open when showOnClick is false', () => {
      controller.setConfig({ showOnClick: false })

      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(false)
    })

    it('should close popup when clicking outside with closeOnClickOutside', () => {
      // First open a popup
      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(true)

      // Set closeOnClickOutside to true (default)
      controller.setConfig({ closeOnClickOutside: true })

      // Click outside (no object, no coordinate)
      controller.handleClick({
        x: 200,
        y: 200,
      })

      expect(controller.isOpen()).toBe(false)
    })

    it('should not close popup when clicking outside if closeOnClickOutside is false', () => {
      controller.setConfig({ closeOnClickOutside: false })

      // First open a popup
      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(true)

      // Click outside (no object)
      controller.handleClick({
        x: 200,
        y: 200,
        coordinate: null,
      })

      // Should still be open
      expect(controller.isOpen()).toBe(true)
    })
  })

  describe('handleHover', () => {
    it('should open tooltip after delay', () => {
      controller.handleHover({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      expect(controller.isOpen()).toBe(false)

      vi.advanceTimersByTime(200)

      expect(controller.isOpen()).toBe(true)
      expect(controller.getInfo()?.trigger).toBe('hover')
    })

    it('should close tooltip when hovering away', () => {
      controller.handleHover({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      vi.advanceTimersByTime(200)
      expect(controller.isOpen()).toBe(true)

      controller.handleHover({
        x: 200,
        y: 200,
        coordinate: null,
      })

      expect(controller.isOpen()).toBe(false)
    })

    it('should not open when showOnHover is false', () => {
      controller.setConfig({ showOnHover: false })

      controller.handleHover({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      vi.advanceTimersByTime(200)

      expect(controller.isOpen()).toBe(false)
    })

    it('should respect custom hover delay', () => {
      controller.setConfig({ hoverDelay: 500 })

      controller.handleHover({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      vi.advanceTimersByTime(200)
      expect(controller.isOpen()).toBe(false)

      vi.advanceTimersByTime(300)
      expect(controller.isOpen()).toBe(true)
    })
  })

  describe('open / close', () => {
    it('should open popup programmatically', () => {
      controller.open({
        coordinate: [-46.6, -23.5],
        content: 'Hello World',
      })

      expect(controller.isOpen()).toBe(true)
      const info = controller.getInfo()
      expect(info?.trigger).toBe('programmatic')
      expect(info?.content).toBe('Hello World')
    })

    it('should close popup', () => {
      controller.open({
        coordinate: [-46.6, -23.5],
        content: 'Hello World',
      })

      expect(controller.isOpen()).toBe(true)

      controller.close()

      expect(controller.isOpen()).toBe(false)
      expect(controller.getInfo()).toBeNull()
    })

    it('should not open when disabled', () => {
      controller.setEnabled(false)

      controller.open({
        coordinate: [-46.6, -23.5],
        content: 'Hello World',
      })

      expect(controller.isOpen()).toBe(false)
    })
  })

  describe('getState / getInfo', () => {
    it('should return current state', () => {
      const state = controller.getState()
      expect(state.isOpen).toBe(false)
      expect(state.info).toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('should return popup info when open', () => {
      controller.open({
        coordinate: [-46.6, -23.5],
        content: { name: 'Test' },
        layerId: 'test-layer',
      })

      const info = controller.getInfo()
      expect(info?.position.coordinate).toEqual([-46.6, -23.5])
      expect(info?.layerId).toBe('test-layer')
      expect(info?.content).toEqual({ name: 'Test' })
    })
  })

  describe('onOpen / onClose callbacks', () => {
    it('should notify listeners on open', () => {
      const listener = vi.fn()
      controller.onOpen(listener)

      controller.open({
        coordinate: [-46.6, -23.5],
        content: 'Test',
      })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: 'programmatic',
        })
      )
    })

    it('should notify listeners on close', () => {
      const listener = vi.fn()
      controller.onClose(listener)

      controller.open({
        coordinate: [-46.6, -23.5],
        content: 'Test',
      })

      controller.close()

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = controller.onOpen(listener)

      controller.open({ coordinate: [-46.6, -23.5], content: 'Test' })
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      controller.close()
      controller.open({ coordinate: [-46.6, -23.5], content: 'Test' })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should remove specific listener', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      controller.onOpen(listener1)
      controller.onOpen(listener2)

      controller.open({ coordinate: [-46.6, -23.5], content: 'Test' })
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      controller.offOpen(listener1)
      controller.close()
      controller.open({ coordinate: [-46.6, -23.5], content: 'Test' })

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(2)
    })
  })

  describe('removeAllListeners', () => {
    it('should remove all listeners', () => {
      const openListener = vi.fn()
      const closeListener = vi.fn()

      controller.onOpen(openListener)
      controller.onClose(closeListener)
      controller.removeAllListeners()

      controller.open({ coordinate: [-46.6, -23.5], content: 'Test' })
      controller.close()

      expect(openListener).not.toHaveBeenCalled()
      expect(closeListener).not.toHaveBeenCalled()
    })
  })

  describe('setConfig', () => {
    it('should update config', () => {
      controller.setConfig({
        showOnHover: false,
        hoverDelay: 500,
      })

      const config = controller.getConfig()
      expect(config.showOnHover).toBe(false)
      expect(config.hoverDelay).toBe(500)
    })
  })

  describe('formatContent', () => {
    it('should use custom formatContent function', () => {
      const customController = new PopupController({
        formatContent: (feature) => `ID: ${feature.properties?.id}`,
      })

      customController.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      const info = customController.getInfo()
      expect(info?.content).toBe('ID: 1')

      customController.destroy()
    })

    it('should use default formatContent when not provided', () => {
      controller.handleClick({
        x: 100,
        y: 100,
        coordinate: [-46.6, -23.5],
        object: mockFeature,
        layer: { id: 'test-layer' },
      })

      const info = controller.getInfo()
      expect(info?.content).toEqual({
        id: '1',
        name: 'Test Feature',
        value: '100',
      })
    })
  })

  describe('toJSON', () => {
    it('should serialize state', () => {
      const json = controller.toJSON()
      expect(json.isOpen).toBe(false)
      expect(json.coordinate).toBeUndefined()
    })

    it('should include coordinate when open', () => {
      controller.open({
        coordinate: [-46.6, -23.5],
        content: 'Test',
      })

      const json = controller.toJSON()
      expect(json.isOpen).toBe(true)
      expect(json.coordinate).toEqual([-46.6, -23.5])
    })
  })

  describe('destroy', () => {
    it('should close popup and remove listeners', () => {
      const listener = vi.fn()
      controller.onOpen(listener)

      controller.open({ coordinate: [-46.6, -23.5], content: 'Test' })
      expect(controller.isOpen()).toBe(true)

      controller.destroy()

      expect(controller.isOpen()).toBe(false)
    })
  })
})

describe('createPopupController', () => {
  it('should create a PopupController instance', () => {
    const controller = createPopupController()
    expect(controller).toBeInstanceOf(PopupController)
    controller.destroy()
  })

  it('should pass options to constructor', () => {
    const onOpen = vi.fn()
    const controller = createPopupController({
      enabled: false,
      onOpen,
    })

    expect(controller.isEnabled()).toBe(false)
    controller.destroy()
  })
})

describe('PopupController reverseGeocode', () => {
  let controller: PopupController

  beforeEach(() => {
    controller = new PopupController({ reverseGeocode: true })
    vi.useFakeTimers()
  })

  afterEach(() => {
    controller.destroy()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should perform reverse geocoding', async () => {
    const mockResponse = {
      display_name: 'Rua Teste, Santos, SP, Brasil',
      address: {
        road: 'Rua Teste',
        city: 'Santos',
        state: 'São Paulo',
        country: 'Brasil',
        postcode: '11000-000',
      },
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await controller.reverseGeocode([-46.333333, -23.960833])

    expect(result.address).toBe('Rua Teste')
    expect(result.displayName).toBe('Rua Teste, Santos, SP, Brasil')
    expect(result.city).toBe('Santos')
    expect(result.state).toBe('São Paulo')
    expect(result.country).toBe('Brasil')
    expect(result.postcode).toBe('11000-000')
  })

  it('should cache geocode results', async () => {
    const mockResponse = {
      display_name: 'Cached Address',
      address: {
        road: 'Cached Street',
      },
    }

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    // First call
    await controller.reverseGeocode([-46.333333, -23.960833])
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Second call with same coordinates should use cache
    const result = await controller.reverseGeocode([-46.333333, -23.960833])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.address).toBe('Cached Street')
  })

  it('should throw on fetch error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    await expect(controller.reverseGeocode([-46.333333, -23.960833])).rejects.toThrow(
      'Geocode failed: 500'
    )
  })

  it('should handle missing address fields', async () => {
    const mockResponse = {
      display_name: 'Some Place',
      address: {
        town: 'Small Town',
      },
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await controller.reverseGeocode([-46.5, -23.5])

    expect(result.address).toBe('')
    expect(result.city).toBe('Small Town')
  })

  it('should handle village instead of city', async () => {
    const mockResponse = {
      display_name: 'Rural Area',
      address: {
        village: 'Small Village',
      },
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await controller.reverseGeocode([-46.4, -23.4])

    expect(result.city).toBe('Small Village')
  })
})

describe('offOpen / offClose', () => {
  let controller: PopupController

  beforeEach(() => {
    controller = new PopupController()
    vi.useFakeTimers()
  })

  afterEach(() => {
    controller.destroy()
    vi.useRealTimers()
  })

  it('should remove open listener with offOpen', () => {
    const listener = vi.fn()

    controller.onOpen(listener)
    controller.handleClick({
      x: 100,
      y: 100,
      coordinate: [-46.6, -23.5],
      object: mockFeature,
      layer: { id: 'test-layer' },
    })

    expect(listener).toHaveBeenCalledTimes(1)

    controller.offOpen(listener)
    controller.close()
    controller.handleClick({
      x: 100,
      y: 100,
      coordinate: [-46.6, -23.5],
      object: mockFeature,
      layer: { id: 'test-layer' },
    })

    expect(listener).toHaveBeenCalledTimes(1) // Still 1, not 2
  })

  it('should remove close listener with offClose', () => {
    const listener = vi.fn()

    controller.onClose(listener)
    controller.handleClick({
      x: 100,
      y: 100,
      coordinate: [-46.6, -23.5],
      object: mockFeature,
      layer: { id: 'test-layer' },
    })
    controller.close()

    expect(listener).toHaveBeenCalledTimes(1)

    controller.offClose(listener)
    controller.handleClick({
      x: 100,
      y: 100,
      coordinate: [-46.6, -23.5],
      object: mockFeature,
      layer: { id: 'test-layer' },
    })
    controller.close()

    expect(listener).toHaveBeenCalledTimes(1) // Still 1, not 2
  })
})

describe('reverseGeocode in openFromInfo', () => {
  it('should handle reverseGeocode failure gracefully', async () => {
    const controller = new PopupController({
      reverseGeocode: true,
    })

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const onOpen = vi.fn()
    controller.onOpen(onOpen)

    controller.handleClick({
      x: 100,
      y: 100,
      coordinate: [-46.6, -23.5],
      object: mockFeature,
      layer: { id: 'test-layer' },
    })

    // Wait for the reverseGeocode to fail
    await vi.waitFor(() => {
      const state = controller.getState()
      expect(state.isLoading).toBe(false)
    })

    // Popup should still be open, just without address
    expect(controller.isOpen()).toBe(true)
    expect(controller.getInfo()?.address).toBeUndefined()

    controller.destroy()
  })

  it('should update popup with address when reverseGeocode succeeds', async () => {
    const controller = new PopupController({
      reverseGeocode: true,
    })

    const mockResponse = {
      display_name: 'Rua Teste, 123, Santos, SP',
      address: {
        road: 'Rua Teste',
        city: 'Santos',
        state: 'São Paulo',
      },
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const onOpen = vi.fn()
    controller.onOpen(onOpen)

    controller.handleClick({
      x: 100,
      y: 100,
      coordinate: [-46.6, -23.5],
      object: mockFeature,
      layer: { id: 'test-layer' },
    })

    // Initial call without address
    expect(onOpen).toHaveBeenCalledTimes(1)

    // Wait for the reverseGeocode to complete
    await vi.waitFor(() => {
      const state = controller.getState()
      expect(state.isLoading).toBe(false)
    })

    // Should have been called twice: once initially, once with address
    expect(onOpen).toHaveBeenCalledTimes(2)
    expect(controller.getInfo()?.address).toBe('Rua Teste, 123, Santos, SP')

    controller.destroy()
  })

  it('should not update address if popup coordinate changed', async () => {
    const controller = new PopupController({
      reverseGeocode: true,
    })

    let resolveGeocode: (value: Response) => void
    const geocodePromise = new Promise<Response>((resolve) => {
      resolveGeocode = resolve
    })

    vi.spyOn(global, 'fetch').mockReturnValueOnce(geocodePromise)

    controller.handleClick({
      x: 100,
      y: 100,
      coordinate: [-46.6, -23.5],
      object: mockFeature,
      layer: { id: 'test-layer' },
    })

    // Close and open a new popup at different coordinate
    controller.close()
    controller.handleClick({
      x: 200,
      y: 200,
      coordinate: [-46.7, -23.6], // Different coordinate
      object: mockFeature,
      layer: { id: 'other-layer' },
    })

    // Now resolve the first geocode
    resolveGeocode!({
      ok: true,
      json: () =>
        Promise.resolve({
          display_name: 'Old Address',
          address: { road: 'Old Road' },
        }),
    } as Response)

    // Wait a bit for any updates
    await new Promise((resolve) => setTimeout(resolve, 50))

    // The address should NOT be updated because coordinate changed
    expect(controller.getInfo()?.address).toBeUndefined()

    controller.destroy()
  })
})
