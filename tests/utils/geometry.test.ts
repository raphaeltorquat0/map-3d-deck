import { describe, it, expect } from 'vitest'
import type { Feature, Polygon, Point } from 'geojson'
import {
  calculateBounds,
  getBoundsCenter,
  getZoomForBounds,
  simplifyLine,
  calculatePolygonArea,
  pointInPolygon,
} from '../../src/utils/geometry'

describe('geometry utils', () => {
  describe('calculateBounds', () => {
    it('should calculate bounds for point features', () => {
      const features: Feature[] = [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
        },
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [-46.7, -23.6] },
        },
      ]

      const bounds = calculateBounds(features)

      expect(bounds).toEqual([-46.7, -23.6, -46.6, -23.5])
    })

    it('should calculate bounds for polygon features', () => {
      const features: Feature<Polygon>[] = [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.7, -23.5],
                [-46.7, -23.6],
                [-46.6, -23.6],
                [-46.6, -23.5],
              ],
            ],
          },
        },
      ]

      const bounds = calculateBounds(features)

      expect(bounds).toEqual([-46.7, -23.6, -46.6, -23.5])
    })

    it('should calculate bounds for FeatureCollection', () => {
      const fc = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Point' as const, coordinates: [-46.6, -23.5] },
          },
          {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Point' as const, coordinates: [-46.8, -23.7] },
          },
        ],
      }

      const bounds = calculateBounds(fc)

      expect(bounds).toEqual([-46.8, -23.7, -46.6, -23.5])
    })

    it('should return null for empty features', () => {
      expect(calculateBounds([])).toBeNull()
    })

    it('should handle features without geometry', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: null as unknown as Point,
        },
      ]

      expect(calculateBounds(features)).toBeNull()
    })
  })

  describe('getBoundsCenter', () => {
    it('should calculate center correctly', () => {
      const bounds: [number, number, number, number] = [-46.8, -23.7, -46.6, -23.5]
      const center = getBoundsCenter(bounds)

      expect(center[0]).toBeCloseTo(-46.7)
      expect(center[1]).toBeCloseTo(-23.6)
    })

    it('should handle single point bounds', () => {
      const bounds: [number, number, number, number] = [-46.6, -23.5, -46.6, -23.5]
      const center = getBoundsCenter(bounds)

      expect(center[0]).toBe(-46.6)
      expect(center[1]).toBe(-23.5)
    })
  })

  describe('getZoomForBounds', () => {
    it('should return higher zoom for smaller bounds', () => {
      const smallBounds: [number, number, number, number] = [-46.61, -23.51, -46.60, -23.50]
      const largeBounds: [number, number, number, number] = [-47.0, -24.0, -46.0, -23.0]

      const smallZoom = getZoomForBounds(smallBounds, 800, 600)
      const largeZoom = getZoomForBounds(largeBounds, 800, 600)

      expect(smallZoom).toBeGreaterThan(largeZoom)
    })

    it('should respect max zoom limit', () => {
      const tinyBounds: [number, number, number, number] = [-46.6001, -23.5001, -46.6000, -23.5000]
      const zoom = getZoomForBounds(tinyBounds, 800, 600)

      expect(zoom).toBeLessThanOrEqual(20)
    })

    it('should account for padding', () => {
      const bounds: [number, number, number, number] = [-46.7, -23.6, -46.6, -23.5]
      const zoomNoPadding = getZoomForBounds(bounds, 800, 600, 0)
      const zoomWithPadding = getZoomForBounds(bounds, 800, 600, 100)

      expect(zoomNoPadding).toBeGreaterThan(zoomWithPadding)
    })
  })

  describe('simplifyLine', () => {
    it('should return same line for 2 points or less', () => {
      const line = [
        [0, 0],
        [1, 1],
      ] as [number, number][]
      expect(simplifyLine(line, 0.1)).toEqual(line)

      const singlePoint = [[0, 0]] as [number, number][]
      expect(simplifyLine(singlePoint, 0.1)).toEqual(singlePoint)
    })

    it('should simplify straight line to 2 points', () => {
      const line = [
        [0, 0],
        [0.5, 0.5],
        [1, 1],
        [1.5, 1.5],
        [2, 2],
      ] as [number, number][]

      const simplified = simplifyLine(line, 0.1)

      expect(simplified.length).toBeLessThanOrEqual(line.length)
      expect(simplified[0]).toEqual([0, 0])
      expect(simplified[simplified.length - 1]).toEqual([2, 2])
    })

    it('should preserve corners with low tolerance', () => {
      const line = [
        [0, 0],
        [1, 0],
        [1, 1],
      ] as [number, number][]

      const simplified = simplifyLine(line, 0.01)

      expect(simplified.length).toBe(3)
    })

    it('should simplify with higher tolerance', () => {
      const line = [
        [0, 0],
        [0.1, 0.01],
        [0.2, 0.02],
        [1, 0],
      ] as [number, number][]

      const simplified = simplifyLine(line, 0.1)

      expect(simplified.length).toBeLessThan(line.length)
    })
  })

  describe('calculatePolygonArea', () => {
    it('should calculate area of unit square', () => {
      const square = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ] as [number, number][]

      const area = calculatePolygonArea(square)

      expect(area).toBeCloseTo(1)
    })

    it('should calculate area of triangle', () => {
      const triangle = [
        [0, 0],
        [2, 0],
        [1, 2],
        [0, 0],
      ] as [number, number][]

      const area = calculatePolygonArea(triangle)

      expect(area).toBeCloseTo(2)
    })

    it('should return 0 for degenerate polygon', () => {
      const line = [
        [0, 0],
        [1, 1],
        [0, 0],
      ] as [number, number][]

      const area = calculatePolygonArea(line)

      expect(area).toBeCloseTo(0)
    })
  })

  describe('pointInPolygon', () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ] as [number, number][]

    it('should return true for point inside', () => {
      expect(pointInPolygon([5, 5], square)).toBe(true)
      expect(pointInPolygon([1, 1], square)).toBe(true)
      expect(pointInPolygon([9, 9], square)).toBe(true)
    })

    it('should return false for point outside', () => {
      expect(pointInPolygon([-1, 5], square)).toBe(false)
      expect(pointInPolygon([11, 5], square)).toBe(false)
      expect(pointInPolygon([5, -1], square)).toBe(false)
      expect(pointInPolygon([5, 11], square)).toBe(false)
    })

    it('should handle complex polygons', () => {
      const lShape = [
        [0, 0],
        [5, 0],
        [5, 5],
        [10, 5],
        [10, 10],
        [0, 10],
        [0, 0],
      ] as [number, number][]

      expect(pointInPolygon([2, 2], lShape)).toBe(true)
      expect(pointInPolygon([7, 7], lShape)).toBe(true)
      expect(pointInPolygon([7, 2], lShape)).toBe(false) // In the "cut out" area
    })
  })
})
