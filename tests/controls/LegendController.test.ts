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
})
