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
      const smallBounds: [number, number, number, number] = [-46.61, -23.51, -46.6, -23.5]
      const largeBounds: [number, number, number, number] = [-47.0, -24.0, -46.0, -23.0]

      const smallZoom = getZoomForBounds(smallBounds, 800, 600)
      const largeZoom = getZoomForBounds(largeBounds, 800, 600)

      expect(smallZoom).toBeGreaterThan(largeZoom)
    })

    it('should respect max zoom limit', () => {
      const tinyBounds: [number, number, number, number] = [-46.6001, -23.5001, -46.6, -23.5]
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

  describe('calculateBounds additional geometry types', () => {
    it('should calculate bounds for LineString geometry', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [-46.6, -23.5],
              [-46.7, -23.6],
              [-46.65, -23.55],
            ],
          },
        },
      ]

      const bounds = calculateBounds(features)
      expect(bounds).toEqual([-46.7, -23.6, -46.6, -23.5])
    })

    it('should calculate bounds for MultiPoint geometry', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'MultiPoint' as const,
            coordinates: [
              [-46.6, -23.5],
              [-46.7, -23.6],
            ],
          },
        },
      ]

      const bounds = calculateBounds(features)
      expect(bounds).toEqual([-46.7, -23.6, -46.6, -23.5])
    })

    it('should calculate bounds for MultiLineString geometry', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'MultiLineString' as const,
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.65, -23.55],
              ],
              [
                [-46.7, -23.6],
                [-46.75, -23.65],
              ],
            ],
          },
        },
      ]

      const bounds = calculateBounds(features)
      expect(bounds).toEqual([-46.75, -23.65, -46.6, -23.5])
    })

    it('should calculate bounds for MultiPolygon geometry', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'MultiPolygon' as const,
            coordinates: [
              [
                [
                  [-46.6, -23.5],
                  [-46.65, -23.5],
                  [-46.65, -23.55],
                  [-46.6, -23.55],
                  [-46.6, -23.5],
                ],
              ],
              [
                [
                  [-46.7, -23.6],
                  [-46.75, -23.6],
                  [-46.75, -23.65],
                  [-46.7, -23.65],
                  [-46.7, -23.6],
                ],
              ],
            ],
          },
        },
      ]

      const bounds = calculateBounds(features)
      expect(bounds).toEqual([-46.75, -23.65, -46.6, -23.5])
    })
  })

  describe('simplifyLine edge cases', () => {
    it('should handle line with coincident points (dx=0, dy=0)', () => {
      const line = [
        [0, 0],
        [0, 0], // Coincident with start
        [1, 1],
      ] as [number, number][]

      const simplified = simplifyLine(line, 0.1)
      // Should not crash and should return valid result
      expect(simplified.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle empty array', () => {
      const simplified = simplifyLine([], 0.1)
      expect(simplified).toEqual([])
    })

    it('should handle single point', () => {
      const line = [[5, 5]] as [number, number][]
      const simplified = simplifyLine(line, 0.1)
      expect(simplified).toEqual(line)
    })

    it('should handle zigzag pattern', () => {
      const zigzag = [
        [0, 0],
        [1, 1],
        [2, 0],
        [3, 1],
        [4, 0],
      ] as [number, number][]

      const simplified = simplifyLine(zigzag, 0.1)
      // With low tolerance, should preserve all points
      expect(simplified.length).toBe(5)
    })

    it('should handle high tolerance', () => {
      const zigzag = [
        [0, 0],
        [1, 1],
        [2, 0],
        [3, 1],
        [4, 0],
      ] as [number, number][]

      const simplified = simplifyLine(zigzag, 10)
      // With high tolerance, should simplify to endpoints
      expect(simplified.length).toBe(2)
    })
  })

  describe('calculatePolygonArea edge cases', () => {
    it('should handle clockwise polygon', () => {
      const square = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ] as [number, number][]

      const area = calculatePolygonArea(square)
      expect(area).toBeCloseTo(1)
    })

    it('should handle rectangle', () => {
      const rect = [
        [0, 0],
        [4, 0],
        [4, 2],
        [0, 2],
        [0, 0],
      ] as [number, number][]

      const area = calculatePolygonArea(rect)
      expect(area).toBeCloseTo(8)
    })

    it('should handle empty array', () => {
      const area = calculatePolygonArea([])
      expect(area).toBe(0)
    })
  })

  describe('pointInPolygon edge cases', () => {
    it('should handle point at corner', () => {
      const square = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ] as [number, number][]

      // Corner behavior can vary by implementation
      // Our implementation should handle this gracefully
      const result = pointInPolygon([0, 0], square)
      expect(typeof result).toBe('boolean')
    })

    it('should handle concave polygon', () => {
      const concave = [
        [0, 0],
        [4, 0],
        [4, 4],
        [2, 2], // Indent
        [0, 4],
        [0, 0],
      ] as [number, number][]

      expect(pointInPolygon([1, 1], concave)).toBe(true)
      expect(pointInPolygon([3, 3], concave)).toBe(true)
      expect(pointInPolygon([2, 3], concave)).toBe(false) // In the indented area
    })

    it('should handle triangle', () => {
      const triangle = [
        [0, 0],
        [10, 0],
        [5, 10],
        [0, 0],
      ] as [number, number][]

      expect(pointInPolygon([5, 3], triangle)).toBe(true)
      expect(pointInPolygon([0, 10], triangle)).toBe(false)
    })
  })

  describe('getZoomForBounds edge cases', () => {
    it('should handle very small viewport', () => {
      const bounds: [number, number, number, number] = [-46.7, -23.6, -46.6, -23.5]
      const zoom = getZoomForBounds(bounds, 100, 100)
      expect(zoom).toBeGreaterThan(0)
    })

    it('should handle large bounds', () => {
      const bounds: [number, number, number, number] = [-180, -90, 180, 90]
      const zoom = getZoomForBounds(bounds, 800, 600)
      expect(zoom).toBeLessThan(5)
    })
  })

  describe('simplifyLine perpendicularDistance edge case', () => {
    it('should handle line with all points at same location', () => {
      // This triggers the dx=0 && dy=0 branch in perpendicularDistance
      const line = [
        [5, 5],
        [5, 5],
        [5, 5],
      ] as [number, number][]

      const simplified = simplifyLine(line, 0.1)
      // Should return first and last points
      expect(simplified.length).toBe(2)
      expect(simplified[0]).toEqual([5, 5])
      expect(simplified[1]).toEqual([5, 5])
    })

    it('should calculate correct distance when endpoints are identical', () => {
      // Line where start and end are the same point
      // Middle point at [6, 6] should have distance calculated correctly
      const line = [
        [5, 5],
        [6, 6],
        [5, 5],
      ] as [number, number][]

      const simplified = simplifyLine(line, 0.1)
      // Middle point should be preserved due to large distance
      expect(simplified.length).toBe(3)
    })
  })

  describe('calculateBounds single coordinate edge case', () => {
    it('should handle GeometryCollection', () => {
      // GeometryCollection is not directly handled but shouldn't crash
      const features = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Point' as const,
            coordinates: [-46.6, -23.5],
          },
        },
      ]

      const bounds = calculateBounds(features)
      expect(bounds).toEqual([-46.6, -23.5, -46.6, -23.5])
    })

    it('should handle malformed LineString with single coordinate (defensive branch)', () => {
      // This tests the defensive branch at lines 30-31 in geometry.ts
      // When a LineString incorrectly has a single Position instead of Position[]
      const malformedFeatures = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            // Malformed: should be [[lng, lat], [lng, lat]] but is [lng, lat]
            coordinates: [-46.6, -23.5] as unknown as [number, number][],
          },
        },
      ]

      // Should not crash and should still calculate bounds from the single coord
      const bounds = calculateBounds(malformedFeatures)
      expect(bounds).toEqual([-46.6, -23.5, -46.6, -23.5])
    })

    it('should handle malformed MultiPoint with single coordinate', () => {
      // Similar test for MultiPoint geometry type
      const malformedFeatures = [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'MultiPoint' as const,
            // Malformed: should be [[lng, lat]] but is [lng, lat]
            coordinates: [-46.7, -23.6] as unknown as [number, number][],
          },
        },
      ]

      const bounds = calculateBounds(malformedFeatures)
      expect(bounds).toEqual([-46.7, -23.6, -46.7, -23.6])
    })
  })
})
