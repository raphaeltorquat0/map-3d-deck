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
