import { describe, it, expect } from 'vitest'
import {
  DEFAULT_3D_MATERIAL,
  UTILITY_LINE_PRESET,
  UTILITY_POINT_PRESET,
  RISK_AREA_PRESET,
  BUILDING_3D_PRESET,
  BUILDING_FLAT_PRESET,
  ZONING_3D_PRESET,
  ZONING_FLAT_PRESET,
  LAYER_PRESETS,
  getPreset,
  getLinePreset,
  getPointPreset,
  getPolygonPreset,
  listPresets,
  listPresetsByType,
  mergePresetWithOptions,
} from '../../src/styles/presets'

describe('presets', () => {
  describe('DEFAULT_3D_MATERIAL', () => {
    it('should have required properties', () => {
      expect(DEFAULT_3D_MATERIAL.ambient).toBeDefined()
      expect(DEFAULT_3D_MATERIAL.diffuse).toBeDefined()
      expect(DEFAULT_3D_MATERIAL.shininess).toBeDefined()
      expect(DEFAULT_3D_MATERIAL.specularColor).toHaveLength(3)
    })
  })

  describe('preset constants', () => {
    it('UTILITY_LINE_PRESET should have line properties', () => {
      expect(UTILITY_LINE_PRESET.widthMinPixels).toBeDefined()
      expect(UTILITY_LINE_PRESET.capRounded).toBe(true)
      expect(UTILITY_LINE_PRESET.jointRounded).toBe(true)
    })

    it('UTILITY_POINT_PRESET should have point properties', () => {
      expect(UTILITY_POINT_PRESET.radiusMinPixels).toBeDefined()
      expect(UTILITY_POINT_PRESET.stroked).toBe(true)
    })

    it('RISK_AREA_PRESET should have polygon properties', () => {
      expect(RISK_AREA_PRESET.filled).toBe(true)
      expect(RISK_AREA_PRESET.stroked).toBe(true)
      expect(RISK_AREA_PRESET.extruded).toBe(false)
    })

    it('BUILDING_3D_PRESET should be extruded', () => {
      expect(BUILDING_3D_PRESET.extruded).toBe(true)
      expect(BUILDING_3D_PRESET.material).toBeDefined()
    })

    it('BUILDING_FLAT_PRESET should not be extruded', () => {
      expect(BUILDING_FLAT_PRESET.extruded).toBe(false)
    })

    it('ZONING_3D_PRESET should be extruded with wireframe', () => {
      expect(ZONING_3D_PRESET.extruded).toBe(true)
      expect(ZONING_3D_PRESET.wireframe).toBe(true)
    })

    it('ZONING_FLAT_PRESET should not be extruded', () => {
      expect(ZONING_FLAT_PRESET.extruded).toBe(false)
    })
  })

  describe('LAYER_PRESETS', () => {
    it('should have all preset IDs', () => {
      expect(LAYER_PRESETS['utility-line']).toBeDefined()
      expect(LAYER_PRESETS['utility-point']).toBeDefined()
      expect(LAYER_PRESETS['risk-area']).toBeDefined()
      expect(LAYER_PRESETS['building-3d']).toBeDefined()
      expect(LAYER_PRESETS['building-flat']).toBeDefined()
      expect(LAYER_PRESETS['zoning-3d']).toBeDefined()
      expect(LAYER_PRESETS['zoning-flat']).toBeDefined()
      expect(LAYER_PRESETS['custom']).toBeDefined()
    })

    it('should have correct types for each preset', () => {
      expect(LAYER_PRESETS['utility-line'].type).toBe('line')
      expect(LAYER_PRESETS['utility-point'].type).toBe('point')
      expect(LAYER_PRESETS['risk-area'].type).toBe('polygon')
      expect(LAYER_PRESETS['building-3d'].type).toBe('polygon')
    })
  })

  describe('getPreset', () => {
    it('should return preset by ID', () => {
      const preset = getPreset('utility-line')
      expect(preset.id).toBe('utility-line')
      expect(preset.type).toBe('line')
    })

    it('should return custom preset for unknown ID', () => {
      const preset = getPreset('unknown' as never)
      expect(preset.id).toBe('custom')
    })
  })

  describe('getLinePreset', () => {
    it('should return line config for line preset', () => {
      const config = getLinePreset('utility-line')
      expect(config.widthMinPixels).toBeDefined()
    })

    it('should return default line config for non-line preset', () => {
      const config = getLinePreset('building-3d')
      expect(config).toEqual(UTILITY_LINE_PRESET)
    })
  })

  describe('getPointPreset', () => {
    it('should return point config for point preset', () => {
      const config = getPointPreset('utility-point')
      expect(config.radiusMinPixels).toBeDefined()
    })

    it('should return default point config for non-point preset', () => {
      const config = getPointPreset('building-3d')
      expect(config).toEqual(UTILITY_POINT_PRESET)
    })
  })

  describe('getPolygonPreset', () => {
    it('should return polygon config for polygon preset', () => {
      const config = getPolygonPreset('building-3d')
      expect(config.extruded).toBe(true)
    })

    it('should return default polygon config for non-polygon preset', () => {
      const config = getPolygonPreset('utility-line')
      expect(config).toEqual(ZONING_FLAT_PRESET)
    })
  })

  describe('listPresets', () => {
    it('should return all presets', () => {
      const presets = listPresets()
      expect(presets.length).toBe(8)
    })

    it('should return array of preset objects', () => {
      const presets = listPresets()
      expect(presets[0].id).toBeDefined()
      expect(presets[0].name).toBeDefined()
      expect(presets[0].type).toBeDefined()
    })
  })

  describe('listPresetsByType', () => {
    it('should return only line presets', () => {
      const presets = listPresetsByType('line')
      expect(presets.every((p) => p.type === 'line')).toBe(true)
    })

    it('should return only point presets', () => {
      const presets = listPresetsByType('point')
      expect(presets.every((p) => p.type === 'point')).toBe(true)
    })

    it('should return only polygon presets', () => {
      const presets = listPresetsByType('polygon')
      expect(presets.every((p) => p.type === 'polygon')).toBe(true)
      expect(presets.length).toBeGreaterThan(0)
    })
  })

  describe('mergePresetWithOptions', () => {
    it('should merge preset with custom options', () => {
      const merged = mergePresetWithOptions(UTILITY_LINE_PRESET, {
        widthMinPixels: 5,
        opacity: 1,
      })

      expect(merged.widthMinPixels).toBe(5)
      expect(merged.opacity).toBe(1)
      expect(merged.capRounded).toBe(true) // from preset
    })

    it('should override preset values with options', () => {
      const merged = mergePresetWithOptions(BUILDING_3D_PRESET, {
        extruded: false,
      })

      expect(merged.extruded).toBe(false)
    })

    it('should preserve preset values not in options', () => {
      const merged = mergePresetWithOptions(UTILITY_POINT_PRESET, {
        radiusMinPixels: 10,
      })

      expect(merged.stroked).toBe(true)
      expect(merged.lineWidthMinPixels).toBe(1)
    })
  })
})
