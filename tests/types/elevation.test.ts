import { describe, it, expect } from 'vitest'
import {
  ELEVATION_LEVELS,
  ELEVATION_PRESETS,
  ELEVATION_BOUNDS,
  getElevationLevel,
  getElevationColor,
  isInElevationRange,
} from '../../src/types/elevation'

describe('elevation types', () => {
  describe('ELEVATION_LEVELS', () => {
    it('should have 6 levels defined', () => {
      expect(ELEVATION_LEVELS).toHaveLength(6)
    })

    it('should have all required properties for each level', () => {
      ELEVATION_LEVELS.forEach((level) => {
        expect(level).toHaveProperty('type')
        expect(level).toHaveProperty('label')
        expect(level).toHaveProperty('labelShort')
        expect(level).toHaveProperty('minHeight')
        expect(level).toHaveProperty('maxHeight')
        expect(level).toHaveProperty('color')
        expect(level).toHaveProperty('description')
      })
    })

    it('should have valid hex colors', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      ELEVATION_LEVELS.forEach((level) => {
        expect(level.color).toMatch(hexColorRegex)
      })
    })

    it('should cover the full elevation range', () => {
      const minHeight = Math.min(...ELEVATION_LEVELS.map((l) => l.minHeight))
      const maxHeight = Math.max(...ELEVATION_LEVELS.map((l) => l.maxHeight))

      expect(minHeight).toBe(ELEVATION_BOUNDS.MIN)
      expect(maxHeight).toBe(ELEVATION_BOUNDS.MAX)
    })
  })

  describe('ELEVATION_PRESETS', () => {
    it('should have 4 presets defined', () => {
      expect(ELEVATION_PRESETS).toHaveLength(4)
    })

    it('should have all required properties for each preset', () => {
      ELEVATION_PRESETS.forEach((preset) => {
        expect(preset).toHaveProperty('id')
        expect(preset).toHaveProperty('label')
        expect(preset).toHaveProperty('range')
        expect(preset.range).toHaveProperty('min')
        expect(preset.range).toHaveProperty('max')
      })
    })

    it('should have an "all" preset covering full range', () => {
      const allPreset = ELEVATION_PRESETS.find((p) => p.id === 'all')
      expect(allPreset).toBeDefined()
      expect(allPreset?.range.min).toBe(ELEVATION_BOUNDS.MIN)
      expect(allPreset?.range.max).toBe(ELEVATION_BOUNDS.MAX)
    })
  })

  describe('ELEVATION_BOUNDS', () => {
    it('should have correct values', () => {
      expect(ELEVATION_BOUNDS.MIN).toBe(-50)
      expect(ELEVATION_BOUNDS.MAX).toBe(200)
      expect(ELEVATION_BOUNDS.TOTAL_RANGE).toBe(250)
    })
  })

  describe('getElevationLevel', () => {
    it('should return deep_subsurface for -30m', () => {
      const level = getElevationLevel(-30)
      expect(level?.type).toBe('deep_subsurface')
    })

    it('should return shallow_subsurface for -10m', () => {
      const level = getElevationLevel(-10)
      expect(level?.type).toBe('shallow_subsurface')
    })

    it('should return surface for 0m', () => {
      const level = getElevationLevel(0)
      expect(level?.type).toBe('surface')
    })

    it('should return low_elevation for 10m', () => {
      const level = getElevationLevel(10)
      expect(level?.type).toBe('low_elevation')
    })

    it('should return medium_elevation for 30m', () => {
      const level = getElevationLevel(30)
      expect(level?.type).toBe('medium_elevation')
    })

    it('should return high_elevation for 100m', () => {
      const level = getElevationLevel(100)
      expect(level?.type).toBe('high_elevation')
    })

    it('should return undefined for out of range values', () => {
      expect(getElevationLevel(-100)).toBeUndefined()
      expect(getElevationLevel(300)).toBeUndefined()
    })
  })

  describe('getElevationColor', () => {
    it('should return correct color for known heights', () => {
      expect(getElevationColor(-30)).toBe('#1E3A5F')
      expect(getElevationColor(-10)).toBe('#3B82F6')
      expect(getElevationColor(0)).toBe('#22C55E')
      expect(getElevationColor(10)).toBe('#F59E0B')
      expect(getElevationColor(30)).toBe('#EF4444')
      expect(getElevationColor(100)).toBe('#8B5CF6')
    })

    it('should return fallback color for out of range values', () => {
      expect(getElevationColor(-100)).toBe('#6B7280')
      expect(getElevationColor(300)).toBe('#6B7280')
    })
  })

  describe('isInElevationRange', () => {
    const range = { min: 0, max: 50 }

    it('should return true for feature fully inside range', () => {
      expect(isInElevationRange(10, 30, range)).toBe(true)
    })

    it('should return true for feature partially overlapping range', () => {
      expect(isInElevationRange(-10, 10, range)).toBe(true)
      expect(isInElevationRange(40, 70, range)).toBe(true)
    })

    it('should return true for feature containing range', () => {
      expect(isInElevationRange(-10, 100, range)).toBe(true)
    })

    it('should return false for feature completely outside range', () => {
      expect(isInElevationRange(-50, -10, range)).toBe(false)
      expect(isInElevationRange(60, 100, range)).toBe(false)
    })

    it('should return true for feature touching range boundary', () => {
      expect(isInElevationRange(-10, 0, range)).toBe(true)
      expect(isInElevationRange(50, 60, range)).toBe(true)
    })
  })
})
