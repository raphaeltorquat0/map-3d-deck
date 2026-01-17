import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LegendController, createLegendController } from '../../src/controls/LegendController'

describe('LegendController', () => {
  let controller: LegendController

  beforeEach(() => {
    controller = new LegendController()
  })

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = controller.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.position).toBe('top-right')
      expect(config.showFeatureCount).toBe(false)
      expect(config.showToggle).toBe(true)
    })

    it('should accept custom config', () => {
      const customController = new LegendController({
        enabled: false,
        position: 'bottom-left',
        showFeatureCount: true,
      })

      const config = customController.getConfig()
      expect(config.enabled).toBe(false)
      expect(config.position).toBe('bottom-left')
      expect(config.showFeatureCount).toBe(true)
    })

    it('should accept initial callbacks', () => {
      const onChange = vi.fn()
      const onToggle = vi.fn()

      const customController = new LegendController({ onChange, onToggle })

      customController.registerLayer({
        id: 'test',
        label: 'Test Layer',
        color: '#ff0000',
      })

      // onChange is called when registered
      expect(onChange).toHaveBeenCalled()

      customController.toggleLayer('test')
      expect(onToggle).toHaveBeenCalledWith('test', false)
    })
  })

  describe('isEnabled / setEnabled', () => {
    it('should return enabled state', () => {
      expect(controller.isEnabled()).toBe(true)
    })

    it('should disable legend', () => {
      controller.setEnabled(false)
      expect(controller.isEnabled()).toBe(false)
    })
  })

  describe('registerLayer / unregisterLayer', () => {
    it('should register a layer', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
        type: 'line',
      })

      const items = controller.getItems()
      expect(items).toHaveLength(1)
      expect(items[0].layerId).toBe('water')
      expect(items[0].label).toBe('Água')
      expect(items[0].color).toBe('#3B82F6')
      expect(items[0].visible).toBe(true)
    })

    it('should unregister a layer', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      expect(controller.getItems()).toHaveLength(1)

      controller.unregisterLayer('water')
      expect(controller.getItems()).toHaveLength(0)
    })

    it('should register multiple layers', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
        order: 1,
      })

      controller.registerLayer({
        id: 'gas',
        label: 'Gás',
        color: '#F59E0B',
        order: 2,
      })

      const items = controller.getItems()
      expect(items).toHaveLength(2)
      expect(items[0].layerId).toBe('water')
      expect(items[1].layerId).toBe('gas')
    })
  })

  describe('updateLayerInfo', () => {
    it('should update layer info', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.updateLayerInfo('water', {
        label: 'Rede de Água',
        color: '#1E40AF',
      })

      const items = controller.getItems()
      expect(items[0].label).toBe('Rede de Água')
      expect(items[0].color).toBe('#1E40AF')
    })

    it('should not update non-existent layer', () => {
      controller.updateLayerInfo('nonexistent', {
        label: 'Test',
      })

      expect(controller.getItems()).toHaveLength(0)
    })
  })

  describe('setLayerCount', () => {
    it('should set layer count', () => {
      const customController = new LegendController({
        showFeatureCount: true,
      })

      customController.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      customController.setLayerCount('water', 150)

      const items = customController.getItems()
      expect(items[0].count).toBe(150)
    })

    it('should not include count when showFeatureCount is false', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.setLayerCount('water', 150)

      const items = controller.getItems()
      expect(items[0].count).toBeUndefined()
    })
  })

  describe('toggleLayer', () => {
    it('should toggle layer visibility', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      expect(controller.isLayerVisible('water')).toBe(true)

      controller.toggleLayer('water')
      expect(controller.isLayerVisible('water')).toBe(false)

      controller.toggleLayer('water')
      expect(controller.isLayerVisible('water')).toBe(true)
    })

    it('should return new visibility state', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      const result = controller.toggleLayer('water')
      expect(result).toBe(false)
    })

    it('should update items on toggle', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.toggleLayer('water')

      const items = controller.getItems()
      expect(items[0].visible).toBe(false)
    })
  })

  describe('setLayerVisibility', () => {
    it('should set layer visibility', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.setLayerVisibility('water', false)
      expect(controller.isLayerVisible('water')).toBe(false)

      controller.setLayerVisibility('water', true)
      expect(controller.isLayerVisible('water')).toBe(true)
    })
  })

  describe('showAll / hideAll', () => {
    beforeEach(() => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })
      controller.registerLayer({
        id: 'gas',
        label: 'Gás',
        color: '#F59E0B',
      })
    })

    it('should show all layers', () => {
      controller.setLayerVisibility('water', false)
      controller.setLayerVisibility('gas', false)

      controller.showAll()

      expect(controller.isLayerVisible('water')).toBe(true)
      expect(controller.isLayerVisible('gas')).toBe(true)
    })

    it('should hide all layers', () => {
      controller.hideAll()

      expect(controller.isLayerVisible('water')).toBe(false)
      expect(controller.isLayerVisible('gas')).toBe(false)
    })
  })

  describe('getPosition / setPosition', () => {
    it('should get position', () => {
      expect(controller.getPosition()).toBe('top-right')
    })

    it('should set position', () => {
      controller.setPosition('bottom-left')
      expect(controller.getPosition()).toBe('bottom-left')
    })
  })

  describe('onChange callback', () => {
    it('should notify on layer registration', () => {
      const listener = vi.fn()
      controller.onChange(listener)

      // Called immediately with current state
      expect(listener).toHaveBeenCalledTimes(1)

      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      expect(listener).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenLastCalledWith([
        expect.objectContaining({
          layerId: 'water',
          label: 'Água',
        }),
      ])
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = controller.onChange(listener)

      // Initial call
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      // Should still be 1, not called again
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('onToggle callback', () => {
    it('should notify on toggle', () => {
      const listener = vi.fn()
      controller.onToggle(listener)

      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.toggleLayer('water')

      expect(listener).toHaveBeenCalledWith('water', false)
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = controller.onToggle(listener)

      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.toggleLayer('water')
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      controller.toggleLayer('water')
      // Should still be 1, not called again
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('offChange / offToggle', () => {
    it('should remove change listener via offChange', () => {
      const listener = vi.fn()
      controller.onChange(listener)

      // Initial call
      expect(listener).toHaveBeenCalledTimes(1)

      controller.offChange(listener)

      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      // Should still be 1, not called again
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should remove toggle listener via offToggle', () => {
      const listener = vi.fn()
      controller.onToggle(listener)

      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.toggleLayer('water')
      expect(listener).toHaveBeenCalledTimes(1)

      controller.offToggle(listener)
      controller.toggleLayer('water')
      // Should still be 1, not called again
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('getState', () => {
    it('should return current state', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      const state = controller.getState()
      expect(state.items).toHaveLength(1)
      expect(state.position).toBe('top-right')
      expect(state.visible).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear all layers', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.registerLayer({
        id: 'gas',
        label: 'Gás',
        color: '#F59E0B',
      })

      expect(controller.getItems()).toHaveLength(2)

      controller.clear()
      expect(controller.getItems()).toHaveLength(0)
    })
  })

  describe('setConfig / getConfig', () => {
    it('should update config with position', () => {
      controller.setConfig({ position: 'bottom-left' })

      const config = controller.getConfig()
      expect(config.position).toBe('bottom-left')

      const state = controller.getState()
      expect(state.position).toBe('bottom-left')
    })

    it('should update showFeatureCount', () => {
      controller.setConfig({ showFeatureCount: true })

      const config = controller.getConfig()
      expect(config.showFeatureCount).toBe(true)
    })
  })

  describe('toJSON / fromJSON', () => {
    it('should serialize state', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.setLayerVisibility('water', false)

      const json = controller.toJSON()
      expect(json.position).toBe('top-right')
      expect(json.layers).toEqual([{ id: 'water', visible: false }])
    })

    it('should restore state', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.fromJSON({
        position: 'bottom-left',
        layers: [{ id: 'water', visible: false }],
      })

      expect(controller.getPosition()).toBe('bottom-left')
      expect(controller.isLayerVisible('water')).toBe(false)
    })

    it('should handle partial fromJSON', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      // Only position, no layers
      controller.fromJSON({
        position: 'bottom-right',
      })

      expect(controller.getPosition()).toBe('bottom-right')
      expect(controller.isLayerVisible('water')).toBe(true)
    })

    it('should handle fromJSON without position', () => {
      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      // Only layers, no position
      controller.fromJSON({
        layers: [{ id: 'water', visible: false }],
      })

      expect(controller.getPosition()).toBe('top-right')
      expect(controller.isLayerVisible('water')).toBe(false)
    })
  })

  describe('destroy', () => {
    it('should clear layers and listeners', () => {
      const listener = vi.fn()
      controller.onChange(listener)

      controller.registerLayer({
        id: 'water',
        label: 'Água',
        color: '#3B82F6',
      })

      controller.destroy()

      expect(controller.getItems()).toHaveLength(0)
    })
  })
})

describe('createLegendController', () => {
  it('should create a LegendController instance', () => {
    const controller = createLegendController()
    expect(controller).toBeInstanceOf(LegendController)
  })

  it('should pass options to constructor', () => {
    const controller = createLegendController({
      position: 'bottom-right',
      showFeatureCount: true,
    })

    const config = controller.getConfig()
    expect(config.position).toBe('bottom-right')
    expect(config.showFeatureCount).toBe(true)
  })

  it('should create controller with undefined options', () => {
    const controller = createLegendController(undefined)
    expect(controller).toBeInstanceOf(LegendController)
    expect(controller.getConfig().position).toBe('top-right')
  })
})

describe('LegendController updateItems comprehensive', () => {
  it('should notify all change listeners when items update', () => {
    const controller = new LegendController({ showFeatureCount: true })
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    controller.onChange(listener1)
    controller.onChange(listener2)

    // Initial call
    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(1)

    // Trigger update
    controller.registerLayer({
      id: 'test',
      label: 'Test',
      color: '#FF0000',
    })

    expect(listener1).toHaveBeenCalledTimes(2)
    expect(listener2).toHaveBeenCalledTimes(2)
  })

  it('should sort items by order and use 999 as default', () => {
    const controller = new LegendController()

    controller.registerLayer({ id: 'a', label: 'A', color: '#000', order: 10 })
    controller.registerLayer({ id: 'b', label: 'B', color: '#000' }) // Default 999
    controller.registerLayer({ id: 'c', label: 'C', color: '#000', order: 5 })

    const items = controller.getItems()
    expect(items[0].layerId).toBe('c') // order 5
    expect(items[1].layerId).toBe('a') // order 10
    expect(items[2].layerId).toBe('b') // order 999
  })

  it('should include count when showFeatureCount is enabled', () => {
    const controller = new LegendController({ showFeatureCount: true })

    controller.registerLayer({ id: 'test', label: 'Test', color: '#000' })
    controller.setLayerCount('test', 100)

    const items = controller.getItems()
    expect(items[0].count).toBe(100)
  })

  it('should not include count when showFeatureCount is disabled', () => {
    const controller = new LegendController({ showFeatureCount: false })

    controller.registerLayer({ id: 'test', label: 'Test', color: '#000' })
    controller.setLayerCount('test', 100)

    const items = controller.getItems()
    expect(items[0].count).toBeUndefined()
  })

  it('should preserve visibility from layerVisibility map', () => {
    const controller = new LegendController()

    controller.registerLayer({ id: 'test', label: 'Test', color: '#000' })
    controller.setLayerVisibility('test', false)

    const items = controller.getItems()
    expect(items[0].visible).toBe(false)
  })

  it('should default visibility to true for unknown layers', () => {
    const controller = new LegendController()

    controller.registerLayer({ id: 'newLayer', label: 'New', color: '#000' })

    const items = controller.getItems()
    expect(items[0].visible).toBe(true)
  })

  it('should include all metadata from layer info', () => {
    const controller = new LegendController()

    controller.registerLayer({
      id: 'full',
      label: 'Full',
      color: '#123',
      colors: { a: '#111', b: '#222' },
      type: 'custom',
      order: 42,
      metadata: { foo: 'bar' },
    })

    const items = controller.getItems()
    expect(items[0].colors).toEqual({ a: '#111', b: '#222' })
    expect(items[0].type).toBe('custom')
    expect(items[0].metadata).toEqual({ foo: 'bar' })
  })
})
