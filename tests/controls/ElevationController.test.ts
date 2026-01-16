import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ElevationController,
  createElevationController,
} from '../../src/controls/ElevationController'
import { ELEVATION_BOUNDS, ELEVATION_PRESETS } from '../../src/types/elevation'

describe('ElevationController', () => {
  let controller: ElevationController

  beforeEach(() => {
    controller = new ElevationController()
  })

  describe('constructor', () => {
    it('should initialize with default range', () => {
      const range = controller.getRange()
      expect(range.min).toBe(ELEVATION_BOUNDS.MIN)
      expect(range.max).toBe(ELEVATION_BOUNDS.MAX)
    })

    it('should accept initial range', () => {
      const customController = new ElevationController({
        initialRange: { min: 0, max: 50 },
      })
      const range = customController.getRange()
      expect(range.min).toBe(0)
      expect(range.max).toBe(50)
    })

    it('should accept onChange callback', () => {
      const onChange = vi.fn()
      const customController = new ElevationController({ onChange })

      customController.setRange({ min: 0, max: 100 })

      expect(onChange).toHaveBeenCalledWith({ min: 0, max: 100 })
    })
  })

  describe('setRange', () => {
    it('should update range correctly', () => {
      controller.setRange({ min: 10, max: 100 })
      const range = controller.getRange()

      expect(range.min).toBe(10)
      expect(range.max).toBe(100)
    })

    it('should clamp min to ELEVATION_BOUNDS.MIN', () => {
      controller.setRange({ min: -100, max: 50 })
      const range = controller.getRange()

      expect(range.min).toBe(ELEVATION_BOUNDS.MIN)
    })

    it('should clamp max to ELEVATION_BOUNDS.MAX', () => {
      controller.setRange({ min: 0, max: 500 })
      const range = controller.getRange()

      expect(range.max).toBe(ELEVATION_BOUNDS.MAX)
    })

    it('should ensure min is less than max', () => {
      controller.setRange({ min: 100, max: 50 })
      const range = controller.getRange()

      expect(range.min).toBeLessThan(range.max)
    })

    it('should notify listeners on change', () => {
      const listener = vi.fn()
      controller.onChange(listener)

      controller.setRange({ min: 0, max: 50 })

      expect(listener).toHaveBeenCalledWith({ min: 0, max: 50 })
    })
  })

  describe('setMin / setMax', () => {
    it('should update only min', () => {
      controller.setMin(10)
      const range = controller.getRange()

      expect(range.min).toBe(10)
      expect(range.max).toBe(ELEVATION_BOUNDS.MAX)
    })

    it('should update only max', () => {
      controller.setMax(100)
      const range = controller.getRange()

      expect(range.min).toBe(ELEVATION_BOUNDS.MIN)
      expect(range.max).toBe(100)
    })
  })

  describe('applyPreset', () => {
    it('should apply subsurface preset', () => {
      controller.applyPreset('subsurface')
      const range = controller.getRange()

      const preset = ELEVATION_PRESETS.find((p) => p.id === 'subsurface')
      expect(range.min).toBe(preset?.range.min)
      expect(range.max).toBe(preset?.range.max)
    })

    it('should apply surface preset', () => {
      controller.applyPreset('surface')
      const range = controller.getRange()

      const preset = ELEVATION_PRESETS.find((p) => p.id === 'surface')
      expect(range.min).toBe(preset?.range.min)
      expect(range.max).toBe(preset?.range.max)
    })

    it('should apply all preset', () => {
      controller.applyPreset('all')
      const range = controller.getRange()

      expect(range.min).toBe(ELEVATION_BOUNDS.MIN)
      expect(range.max).toBe(ELEVATION_BOUNDS.MAX)
    })

    it('should ignore invalid preset', () => {
      const initialRange = controller.getRange()
      controller.applyPreset('invalid')
      const range = controller.getRange()

      expect(range).toEqual(initialRange)
    })
  })

  describe('getCurrentPreset', () => {
    it('should return current preset when matching', () => {
      controller.applyPreset('surface')
      const preset = controller.getCurrentPreset()

      expect(preset?.id).toBe('surface')
    })

    it('should return null when not matching any preset', () => {
      controller.setRange({ min: 10, max: 90 })
      const preset = controller.getCurrentPreset()

      expect(preset).toBeNull()
    })
  })

  describe('getVisibleLevels', () => {
    it('should return all levels for full range', () => {
      const levels = controller.getVisibleLevels()
      expect(levels.length).toBe(6)
    })

    it('should return only surface levels for surface preset', () => {
      controller.applyPreset('surface')
      const levels = controller.getVisibleLevels()

      expect(levels.some((l) => l.type === 'surface')).toBe(true)
    })

    it('should return subsurface levels for subsurface preset', () => {
      controller.applyPreset('subsurface')
      const levels = controller.getVisibleLevels()

      expect(levels.some((l) => l.type === 'deep_subsurface')).toBe(true)
      expect(levels.some((l) => l.type === 'shallow_subsurface')).toBe(true)
    })
  })

  describe('isVisible', () => {
    it('should return true for height in range', () => {
      controller.setRange({ min: 0, max: 50 })

      expect(controller.isVisible(25)).toBe(true)
      expect(controller.isVisible(0)).toBe(true)
      expect(controller.isVisible(50)).toBe(true)
    })

    it('should return false for height outside range', () => {
      controller.setRange({ min: 0, max: 50 })

      expect(controller.isVisible(-10)).toBe(false)
      expect(controller.isVisible(60)).toBe(false)
    })
  })

  describe('isFeatureVisible', () => {
    it('should return true for overlapping features', () => {
      controller.setRange({ min: 0, max: 50 })

      expect(controller.isFeatureVisible(10, 30)).toBe(true)
      expect(controller.isFeatureVisible(-10, 10)).toBe(true)
      expect(controller.isFeatureVisible(40, 70)).toBe(true)
    })

    it('should return false for non-overlapping features', () => {
      controller.setRange({ min: 0, max: 50 })

      expect(controller.isFeatureVisible(-50, -10)).toBe(false)
      expect(controller.isFeatureVisible(60, 100)).toBe(false)
    })
  })

  describe('heightToPercent / percentToHeight', () => {
    it('should convert height to percent correctly', () => {
      expect(controller.heightToPercent(ELEVATION_BOUNDS.MIN)).toBe(0)
      expect(controller.heightToPercent(ELEVATION_BOUNDS.MAX)).toBe(100)
      expect(controller.heightToPercent(75)).toBe(50) // midpoint
    })

    it('should convert percent to height correctly', () => {
      expect(controller.percentToHeight(0)).toBe(ELEVATION_BOUNDS.MIN)
      expect(controller.percentToHeight(100)).toBe(ELEVATION_BOUNDS.MAX)
      expect(controller.percentToHeight(50)).toBe(75) // midpoint
    })

    it('should be reversible', () => {
      const height = 50
      const percent = controller.heightToPercent(height)
      const backToHeight = controller.percentToHeight(percent)

      expect(backToHeight).toBe(height)
    })
  })

  describe('onChange / offChange', () => {
    it('should add and notify listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      controller.onChange(listener1)
      controller.onChange(listener2)
      controller.setRange({ min: 0, max: 50 })

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('should remove listener correctly', () => {
      const listener = vi.fn()

      controller.onChange(listener)
      controller.setRange({ min: 0, max: 50 })
      expect(listener).toHaveBeenCalledTimes(1)

      controller.offChange(listener)
      controller.setRange({ min: 10, max: 60 })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()

      const unsubscribe = controller.onChange(listener)
      controller.setRange({ min: 0, max: 50 })
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      controller.setRange({ min: 10, max: 60 })
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('removeAllListeners', () => {
    it('should remove all listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      controller.onChange(listener1)
      controller.onChange(listener2)
      controller.removeAllListeners()
      controller.setRange({ min: 0, max: 50 })

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('should reset to default range', () => {
      controller.setRange({ min: 0, max: 50 })
      controller.reset()
      const range = controller.getRange()

      expect(range.min).toBe(ELEVATION_BOUNDS.MIN)
      expect(range.max).toBe(ELEVATION_BOUNDS.MAX)
    })
  })

  describe('toJSON / fromJSON', () => {
    it('should serialize to JSON', () => {
      controller.setRange({ min: 10, max: 90 })
      const json = controller.toJSON()

      expect(json).toEqual({ min: 10, max: 90 })
    })

    it('should restore from JSON', () => {
      controller.fromJSON({ min: 20, max: 80 })
      const range = controller.getRange()

      expect(range.min).toBe(20)
      expect(range.max).toBe(80)
    })
  })
})

describe('createElevationController', () => {
  it('should create an ElevationController instance', () => {
    const controller = createElevationController()
    expect(controller).toBeInstanceOf(ElevationController)
  })

  it('should pass options to constructor', () => {
    const onChange = vi.fn()
    const controller = createElevationController({
      initialRange: { min: 0, max: 50 },
      onChange,
    })

    const range = controller.getRange()
    expect(range.min).toBe(0)
    expect(range.max).toBe(50)

    controller.setRange({ min: 10, max: 60 })
    expect(onChange).toHaveBeenCalled()
  })
})
