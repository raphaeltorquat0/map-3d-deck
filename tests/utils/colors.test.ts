import { describe, it, expect } from 'vitest'
import {
  hexToRgba,
  rgbaToHex,
  interpolateColor,
  createColorScale,
  adjustBrightness,
  setOpacity,
} from '../../src/utils/colors'

describe('color utils', () => {
  describe('hexToRgba', () => {
    it('should convert hex with # prefix', () => {
      expect(hexToRgba('#FF0000')).toEqual([255, 0, 0, 255])
      expect(hexToRgba('#00FF00')).toEqual([0, 255, 0, 255])
      expect(hexToRgba('#0000FF')).toEqual([0, 0, 255, 255])
    })

    it('should convert hex without # prefix', () => {
      expect(hexToRgba('FF0000')).toEqual([255, 0, 0, 255])
    })

    it('should accept custom alpha', () => {
      expect(hexToRgba('#FF0000', 128)).toEqual([255, 0, 0, 128])
    })

    it('should handle lowercase hex', () => {
      expect(hexToRgba('#ff0000')).toEqual([255, 0, 0, 255])
    })

    it('should return fallback for invalid hex', () => {
      expect(hexToRgba('invalid')).toEqual([128, 128, 128, 255])
      expect(hexToRgba('#GGG')).toEqual([128, 128, 128, 255])
    })

    it('should handle common colors', () => {
      expect(hexToRgba('#3B82F6')).toEqual([59, 130, 246, 255]) // Blue
      expect(hexToRgba('#22C55E')).toEqual([34, 197, 94, 255]) // Green
      expect(hexToRgba('#EF4444')).toEqual([239, 68, 68, 255]) // Red
    })
  })

  describe('rgbaToHex', () => {
    it('should convert RGBA to hex', () => {
      expect(rgbaToHex([255, 0, 0, 255])).toBe('#ff0000')
      expect(rgbaToHex([0, 255, 0, 255])).toBe('#00ff00')
      expect(rgbaToHex([0, 0, 255, 255])).toBe('#0000ff')
    })

    it('should ignore alpha channel', () => {
      expect(rgbaToHex([255, 0, 0, 128])).toBe('#ff0000')
      expect(rgbaToHex([255, 0, 0])).toBe('#ff0000')
    })

    it('should pad single digit values', () => {
      expect(rgbaToHex([1, 2, 3, 255])).toBe('#010203')
    })
  })

  describe('interpolateColor', () => {
    const red: [number, number, number, number] = [255, 0, 0, 255]
    const blue: [number, number, number, number] = [0, 0, 255, 255]

    it('should return first color at t=0', () => {
      expect(interpolateColor(red, blue, 0)).toEqual(red)
    })

    it('should return second color at t=1', () => {
      expect(interpolateColor(red, blue, 1)).toEqual(blue)
    })

    it('should interpolate at t=0.5', () => {
      const result = interpolateColor(red, blue, 0.5)
      expect(result[0]).toBe(128) // R
      expect(result[1]).toBe(0) // G
      expect(result[2]).toBe(128) // B
      expect(result[3]).toBe(255) // A
    })

    it('should clamp t to [0, 1]', () => {
      expect(interpolateColor(red, blue, -1)).toEqual(red)
      expect(interpolateColor(red, blue, 2)).toEqual(blue)
    })

    it('should interpolate alpha', () => {
      const transparent: [number, number, number, number] = [255, 0, 0, 0]
      const opaque: [number, number, number, number] = [255, 0, 0, 255]
      const result = interpolateColor(transparent, opaque, 0.5)
      expect(result[3]).toBe(128)
    })
  })

  describe('createColorScale', () => {
    const red: [number, number, number, number] = [255, 0, 0, 255]
    const green: [number, number, number, number] = [0, 255, 0, 255]
    const blue: [number, number, number, number] = [0, 0, 255, 255]

    it('should return first color at min value', () => {
      const scale = createColorScale([0, 100], [red, green])
      expect(scale(0)).toEqual(red)
    })

    it('should return last color at max value', () => {
      const scale = createColorScale([0, 100], [red, green])
      expect(scale(100)).toEqual(green)
    })

    it('should interpolate between colors', () => {
      const scale = createColorScale([0, 100], [red, green])
      const result = scale(50)
      expect(result[0]).toBe(128) // R decreasing
      expect(result[1]).toBe(128) // G increasing
    })

    it('should handle multiple colors', () => {
      const scale = createColorScale([0, 100], [red, green, blue])

      expect(scale(0)).toEqual(red)
      expect(scale(50)).toEqual(green)
      expect(scale(100)).toEqual(blue)
    })

    it('should clamp values outside domain', () => {
      const scale = createColorScale([0, 100], [red, green])
      expect(scale(-50)).toEqual(red)
      expect(scale(150)).toEqual(green)
    })

    it('should handle single color', () => {
      const scale = createColorScale([0, 100], [red])
      expect(scale(50)).toEqual(red)
    })

    it('should handle empty colors array', () => {
      const scale = createColorScale([0, 100], [])
      expect(scale(50)).toEqual([128, 128, 128, 255])
    })
  })

  describe('adjustBrightness', () => {
    const color: [number, number, number, number] = [100, 100, 100, 255]

    it('should increase brightness', () => {
      const result = adjustBrightness(color, 1.5)
      expect(result[0]).toBe(150)
      expect(result[1]).toBe(150)
      expect(result[2]).toBe(150)
    })

    it('should decrease brightness', () => {
      const result = adjustBrightness(color, 0.5)
      expect(result[0]).toBe(50)
      expect(result[1]).toBe(50)
      expect(result[2]).toBe(50)
    })

    it('should preserve alpha', () => {
      const result = adjustBrightness(color, 1.5)
      expect(result[3]).toBe(255)
    })

    it('should clamp to 255', () => {
      const result = adjustBrightness(color, 3)
      expect(result[0]).toBe(255)
      expect(result[1]).toBe(255)
      expect(result[2]).toBe(255)
    })
  })

  describe('setOpacity', () => {
    const color: [number, number, number, number] = [100, 100, 100, 255]

    it('should set opacity correctly', () => {
      expect(setOpacity(color, 1)[3]).toBe(255)
      expect(setOpacity(color, 0.5)[3]).toBe(128)
      expect(setOpacity(color, 0)[3]).toBe(0)
    })

    it('should preserve RGB values', () => {
      const result = setOpacity(color, 0.5)
      expect(result[0]).toBe(100)
      expect(result[1]).toBe(100)
      expect(result[2]).toBe(100)
    })
  })
})
