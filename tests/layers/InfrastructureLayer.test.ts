import { describe, it, expect, vi } from 'vitest'
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import type { Feature, LineString, Point } from 'geojson'
import {
  createInfrastructureLayer,
  createInfrastructurePointLayer,
  groupInfrastructureByNetwork,
  filterInfrastructureByElevation,
  getInfrastructureStats,
  INFRASTRUCTURE_NETWORK_COLORS,
  INFRASTRUCTURE_NETWORK_LABELS,
  type InfrastructureFeatureProperties,
} from '../../src/layers/InfrastructureLayer'

// Mock data
const mockLineFeatures: Feature<LineString, InfrastructureFeatureProperties>[] = [
  {
    type: 'Feature',
    properties: {
      id: '1',
      network_type: 'water',
      depth: -3,
      diameter: 150,
      status: 'active',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.6, -23.5],
        [-46.61, -23.51],
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: '2',
      network_type: 'gas',
      depth: -5,
      diameter: 100,
      status: 'active',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.62, -23.52],
        [-46.63, -23.53],
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: '3',
      network_type: 'water',
      depth: -10,
      diameter: 200,
      status: 'maintenance',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.64, -23.54],
        [-46.65, -23.55],
      ],
    },
  },
]

const mockPointFeatures: Feature<Point, InfrastructureFeatureProperties>[] = [
  {
    type: 'Feature',
    properties: {
      id: 'p1',
      network_type: 'water',
      depth: -2,
      diameter: 500,
    },
    geometry: {
      type: 'Point',
      coordinates: [-46.6, -23.5],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'p2',
      network_type: 'sewage',
      depth: -4,
      diameter: 800,
    },
    geometry: {
      type: 'Point',
      coordinates: [-46.61, -23.51],
    },
  },
]

describe('InfrastructureLayer', () => {
  describe('INFRASTRUCTURE_NETWORK_COLORS', () => {
    it('should have colors for all network types', () => {
      expect(INFRASTRUCTURE_NETWORK_COLORS.water).toBeDefined()
      expect(INFRASTRUCTURE_NETWORK_COLORS.sewage).toBeDefined()
      expect(INFRASTRUCTURE_NETWORK_COLORS.gas).toBeDefined()
      expect(INFRASTRUCTURE_NETWORK_COLORS.electric).toBeDefined()
      expect(INFRASTRUCTURE_NETWORK_COLORS.telecom).toBeDefined()
      expect(INFRASTRUCTURE_NETWORK_COLORS.drainage).toBeDefined()
      expect(INFRASTRUCTURE_NETWORK_COLORS.metro).toBeDefined()
    })
  })

  describe('INFRASTRUCTURE_NETWORK_LABELS', () => {
    it('should have labels for all network types', () => {
      expect(INFRASTRUCTURE_NETWORK_LABELS.water).toBe('Água')
      expect(INFRASTRUCTURE_NETWORK_LABELS.sewage).toBe('Esgoto')
      expect(INFRASTRUCTURE_NETWORK_LABELS.gas).toBe('Gás')
    })
  })

  describe('createInfrastructureLayer', () => {
    it('should create a PathLayer instance', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
      })

      expect(layer).toBeInstanceOf(PathLayer)
    })

    it('should use default id when not specified', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
      })

      expect(layer.id).toBe('infrastructure-layer')
    })

    it('should use custom id when specified', () => {
      const layer = createInfrastructureLayer({
        id: 'custom-layer',
        data: mockLineFeatures,
      })

      expect(layer.id).toBe('custom-layer')
    })

    it('should filter by networkType', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        networkType: 'water',
      })

      expect(layer.props.data).toHaveLength(2)
    })

    it('should filter by networkTypes array', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        networkTypes: ['water', 'gas'],
      })

      expect(layer.props.data).toHaveLength(3)
    })

    it('should apply utility-line preset', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        preset: 'utility-line',
      })

      expect(layer.props.widthMinPixels).toBe(2)
      expect(layer.props.capRounded).toBe(true)
    })

    it('should accept onClick callback', () => {
      const onClick = vi.fn()
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        onClick,
      })

      expect(layer.props.onClick).toBeDefined()
    })

    it('should accept onHover callback', () => {
      const onHover = vi.fn()
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        onHover,
      })

      expect(layer.props.onHover).toBeDefined()
    })

    it('should use custom getWidth function', () => {
      const customGetWidth = vi.fn().mockReturnValue(5)
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        getWidth: customGetWidth,
      })

      // Call the accessor
      const width = layer.props.getWidth(mockLineFeatures[0])
      expect(width).toBe(5)
      expect(customGetWidth).toHaveBeenCalled()
    })

    it('should use custom getColor function', () => {
      const customColor: [number, number, number, number] = [255, 0, 0, 255]
      const customGetColor = vi.fn().mockReturnValue(customColor)
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        getColor: customGetColor,
      })

      const color = layer.props.getColor(mockLineFeatures[0])
      expect(color).toEqual(customColor)
    })

    it('should handle FeatureCollection data', () => {
      const layer = createInfrastructureLayer({
        data: {
          type: 'FeatureCollection',
          features: mockLineFeatures,
        },
      })

      expect(layer.props.data).toHaveLength(3)
    })

    it('should handle URL string data', () => {
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
      })

      // When URL is passed, deck.gl fetches data asynchronously
      // The layer is created successfully
      expect(layer).toBeInstanceOf(PathLayer)
      expect(layer.id).toBe('infrastructure-layer')
    })
  })

  describe('createInfrastructureLayer URL data accessors', () => {
    it('should use default getWidth when URL and no custom getWidth', () => {
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
      })

      // Call the accessor with a mock feature
      const mockFeature: Feature<LineString, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water', diameter: 200 },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-46.6, -23.5],
            [-46.61, -23.51],
          ],
        },
      }

      const width = layer.props.getWidth(mockFeature)
      expect(width).toBe(2) // 200 / 100 = 2
    })

    it('should use default width when URL and diameter not provided', () => {
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
      })

      const mockFeature: Feature<LineString, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-46.6, -23.5],
            [-46.61, -23.51],
          ],
        },
      }

      const width = layer.props.getWidth(mockFeature)
      expect(width).toBe(1) // 100 / 100 = 1 (default)
    })

    it('should use custom getWidth when provided with URL', () => {
      const customGetWidth = vi.fn().mockReturnValue(5)
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
        getWidth: customGetWidth,
      })

      const mockFeature: Feature<LineString, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-46.6, -23.5],
            [-46.61, -23.51],
          ],
        },
      }

      const width = layer.props.getWidth(mockFeature)
      expect(width).toBe(5)
      expect(customGetWidth).toHaveBeenCalledWith(mockFeature)
    })

    it('should use default getColor when URL and no custom getColor', () => {
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
        opacity: 1,
      })

      const mockFeature: Feature<LineString, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'gas' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-46.6, -23.5],
            [-46.61, -23.51],
          ],
        },
      }

      const color = layer.props.getColor(mockFeature)
      expect(color).toHaveLength(4)
      // Gas color is #F59E0B which is [245, 158, 11, 255]
      expect(color[0]).toBe(245)
    })

    it('should use networkType option for color when URL', () => {
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
        networkType: 'sewage',
        opacity: 1,
      })

      const mockFeature: Feature<LineString, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-46.6, -23.5],
            [-46.61, -23.51],
          ],
        },
      }

      const color = layer.props.getColor(mockFeature)
      // Sewage color is #92400E which is [146, 64, 14, 255]
      expect(color[0]).toBe(146)
    })

    it('should fallback to water color when URL and no network_type', () => {
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
        opacity: 1,
      })

      const mockFeature: Feature<LineString, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1' } as InfrastructureFeatureProperties,
        geometry: {
          type: 'LineString',
          coordinates: [
            [-46.6, -23.5],
            [-46.61, -23.51],
          ],
        },
      }

      const color = layer.props.getColor(mockFeature)
      // Water (default) color is #3B82F6 which is [59, 130, 246, 255]
      expect(color[0]).toBe(59)
    })

    it('should use custom getColor when provided with URL', () => {
      const customColor: [number, number, number, number] = [100, 50, 25, 255]
      const customGetColor = vi.fn().mockReturnValue(customColor)
      const layer = createInfrastructureLayer({
        data: '/api/geo/infrastructure',
        getColor: customGetColor,
      })

      const mockFeature: Feature<LineString, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-46.6, -23.5],
            [-46.61, -23.51],
          ],
        },
      }

      const color = layer.props.getColor(mockFeature)
      expect(color).toEqual(customColor)
      expect(customGetColor).toHaveBeenCalledWith(mockFeature)
    })
  })

  describe('createInfrastructurePointLayer', () => {
    it('should create a ScatterplotLayer instance', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
      })

      expect(layer).toBeInstanceOf(ScatterplotLayer)
    })

    it('should use default id', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
      })

      expect(layer.id).toBe('infrastructure-points-layer')
    })

    it('should apply utility-point preset', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        preset: 'utility-point',
      })

      expect(layer.props.stroked).toBe(true)
      expect(layer.props.radiusMinPixels).toBe(4)
    })

    it('should filter by networkType', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        networkType: 'water',
      })

      expect(layer.props.data).toHaveLength(1)
    })
  })

  describe('groupInfrastructureByNetwork', () => {
    it('should group features by network type', () => {
      const grouped = groupInfrastructureByNetwork(mockLineFeatures)

      expect(grouped.water).toHaveLength(2)
      expect(grouped.gas).toHaveLength(1)
      expect(grouped.sewage).toHaveLength(0)
    })

    it('should return empty arrays for missing types', () => {
      const grouped = groupInfrastructureByNetwork(mockLineFeatures)

      expect(grouped.electric).toHaveLength(0)
      expect(grouped.telecom).toHaveLength(0)
    })
  })

  describe('filterInfrastructureByElevation', () => {
    it('should filter features by elevation range', () => {
      const filtered = filterInfrastructureByElevation(mockLineFeatures, {
        min: -6,
        max: 0,
      })

      expect(filtered).toHaveLength(2) // depth -3 and -5
    })

    it('should exclude features outside range', () => {
      const filtered = filterInfrastructureByElevation(mockLineFeatures, {
        min: -4,
        max: 0,
      })

      expect(filtered).toHaveLength(1) // only depth -3
    })

    it('should return empty array for non-matching range', () => {
      const filtered = filterInfrastructureByElevation(mockLineFeatures, {
        min: -100,
        max: -50,
      })

      expect(filtered).toHaveLength(0)
    })
  })

  describe('getInfrastructureStats', () => {
    it('should calculate total count', () => {
      const stats = getInfrastructureStats(mockLineFeatures)

      expect(stats.total).toBe(3)
    })

    it('should group by network type', () => {
      const stats = getInfrastructureStats(mockLineFeatures)

      expect(stats.byNetwork.water).toBe(2)
      expect(stats.byNetwork.gas).toBe(1)
    })

    it('should group by status', () => {
      const stats = getInfrastructureStats(mockLineFeatures)

      expect(stats.byStatus.active).toBe(2)
      expect(stats.byStatus.maintenance).toBe(1)
    })

    it('should handle features without status', () => {
      const featuresNoStatus: Feature<LineString, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: '1', network_type: 'water' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]
      const stats = getInfrastructureStats(featuresNoStatus)
      expect(stats.byStatus.unknown).toBe(1)
    })

    it('should handle empty features array', () => {
      const stats = getInfrastructureStats([])
      expect(stats.total).toBe(0)
      expect(stats.byNetwork.water).toBe(0)
    })
  })

  describe('createInfrastructureLayer accessors', () => {
    it('should use default getWidth when not provided', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
      })

      // Call getWidth accessor with feature that has diameter
      const width = layer.props.getWidth(mockLineFeatures[0])
      expect(width).toBe(1.5) // 150 / 100 = 1.5
    })

    it('should use default getColor when not provided', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        opacity: 1,
      })

      // Call getColor accessor with feature that has network_type water
      const color = layer.props.getColor(mockLineFeatures[0])
      expect(color).toHaveLength(4)
      // Water color is #3B82F6 which is [59, 130, 246, 255]
      expect(color[0]).toBe(59)
    })

    it('should use networkType option for getColor when specified', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        networkType: 'gas',
        opacity: 1,
      })

      // Even though feature has network_type water, should use layer's networkType (gas)
      const color = layer.props.getColor(mockLineFeatures[0])
      // Gas color is #F59E0B which is [245, 158, 11, 255]
      expect(color[0]).toBe(245)
    })

    it('should fallback to water when feature has no network_type', () => {
      const featuresNoType: Feature<LineString, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: '1' } as InfrastructureFeatureProperties,
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]

      const layer = createInfrastructureLayer({
        data: featuresNoType,
        opacity: 1,
      })

      const color = layer.props.getColor(featuresNoType[0])
      // Water (default) color is #3B82F6 which is [59, 130, 246, 255]
      expect(color[0]).toBe(59)
    })
  })

  describe('createInfrastructureLayer presets', () => {
    it('should apply risk-line preset', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        preset: 'risk-line',
      })

      expect(layer.props.widthMinPixels).toBe(3)
      expect(layer.props.capRounded).toBe(false)
    })

    it('should apply default preset', () => {
      const layer = createInfrastructureLayer({
        data: mockLineFeatures,
        preset: 'default',
      })

      // Default preset returns empty object, so defaults are used
      expect(layer).toBeInstanceOf(PathLayer)
    })

    it('should handle FeatureCollection with mixed geometry types', () => {
      const mixedData = {
        type: 'FeatureCollection' as const,
        features: [...mockLineFeatures, ...mockPointFeatures],
      }

      const layer = createInfrastructureLayer({
        data: mixedData,
      })

      // Should only include LineString features
      expect(layer.props.data).toHaveLength(3)
    })

    it('should handle empty FeatureCollection', () => {
      const layer = createInfrastructureLayer({
        data: { type: 'FeatureCollection', features: [] },
      })

      expect(layer.props.data).toHaveLength(0)
    })

    it('should handle features without network_type in filtering', () => {
      const featuresNoType: Feature<LineString, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: '1' } as InfrastructureFeatureProperties,
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]

      const layer = createInfrastructureLayer({
        data: featuresNoType,
        networkTypes: ['water'],
      })

      expect(layer.props.data).toHaveLength(0)
    })

    it('should use default width when diameter is not provided', () => {
      const featuresNoDiameter: Feature<LineString, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: '1', network_type: 'water' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]

      const layer = createInfrastructureLayer({ data: featuresNoDiameter })
      const width = layer.props.getWidth(featuresNoDiameter[0])
      expect(width).toBe(1) // 100 / 100 = 1
    })

    it('should use default depth (0) when not provided', () => {
      const featuresNoDepth: Feature<LineString, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: '1', network_type: 'water' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]

      const layer = createInfrastructureLayer({ data: featuresNoDepth })
      const path = layer.props.getPath(featuresNoDepth[0])
      expect(path[0][2]).toBe(0) // depth defaults to 0
    })
  })

  describe('createInfrastructurePointLayer additional tests', () => {
    it('should use custom id', () => {
      const layer = createInfrastructurePointLayer({
        id: 'custom-points',
        data: mockPointFeatures,
      })

      expect(layer.id).toBe('custom-points')
    })

    it('should handle URL string data', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
      })

      expect(layer).toBeInstanceOf(ScatterplotLayer)
    })

    it('should use custom getRadius function', () => {
      const customGetRadius = vi.fn().mockReturnValue(10)
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        getRadius: customGetRadius,
      })

      const radius = layer.props.getRadius(mockPointFeatures[0])
      expect(radius).toBe(10)
      expect(customGetRadius).toHaveBeenCalled()
    })

    it('should use custom getColor function', () => {
      const customColor: [number, number, number, number] = [0, 255, 0, 255]
      const customGetColor = vi.fn().mockReturnValue(customColor)
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        getColor: customGetColor,
      })

      const color = layer.props.getFillColor(mockPointFeatures[0])
      expect(color).toEqual(customColor)
    })

    it('should filter by networkTypes array', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        networkTypes: ['water'],
      })

      expect(layer.props.data).toHaveLength(1)
    })

    it('should use default radius when diameter not provided', () => {
      const pointsNoDiameter: Feature<Point, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'p1', network_type: 'water' },
          geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
        },
      ]

      const layer = createInfrastructurePointLayer({ data: pointsNoDiameter })
      const radius = layer.props.getRadius(pointsNoDiameter[0])
      expect(radius).toBe(2.5) // 500 / 200 = 2.5
    })

    it('should apply risk-line preset to points', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        preset: 'risk-line', // Unusual but should work
      })

      expect(layer).toBeInstanceOf(ScatterplotLayer)
    })

    it('should use default color for points by network type', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        opacity: 1,
      })

      const color = layer.props.getFillColor(mockPointFeatures[0])
      expect(color).toHaveLength(4)
      expect(color[3]).toBe(255) // Full opacity
    })

    it('should use networkType option for point color when specified', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
        networkType: 'gas',
        opacity: 1,
      })

      const color = layer.props.getFillColor(mockPointFeatures[0])
      expect(color).toHaveLength(4)
    })

    it('should get position with depth for points', () => {
      const layer = createInfrastructurePointLayer({
        data: mockPointFeatures,
      })

      const position = layer.props.getPosition(mockPointFeatures[0])
      expect(position).toHaveLength(3)
      expect(position[2]).toBe(-2) // depth from mockPointFeatures
    })

    it('should get position with default depth when not specified', () => {
      const pointNoDepth: Feature<Point, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'p1', network_type: 'water' },
          geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
        },
      ]

      const layer = createInfrastructurePointLayer({ data: pointNoDepth })
      const position = layer.props.getPosition(pointNoDepth[0])
      expect(position[2]).toBe(0) // default depth
    })

    it('should calculate radius from diameter', () => {
      const pointWithDiameter: Feature<Point, InfrastructureFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'p1', network_type: 'water', diameter: 800 },
          geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
        },
      ]

      const layer = createInfrastructurePointLayer({ data: pointWithDiameter })
      const radius = layer.props.getRadius(pointWithDiameter[0])
      expect(radius).toBe(4) // 800 / 200 = 4
    })
  })

  describe('groupInfrastructureByNetwork additional tests', () => {
    it('should handle features without network_type', () => {
      const featuresNoType = [
        {
          type: 'Feature' as const,
          properties: { id: '1' } as InfrastructureFeatureProperties,
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]

      const grouped = groupInfrastructureByNetwork(featuresNoType)

      // Should not crash, all arrays should be empty
      expect(grouped.water).toHaveLength(0)
      expect(grouped.gas).toHaveLength(0)
    })
  })

  describe('filterInfrastructureByElevation additional tests', () => {
    it('should handle features without depth (defaults to 0)', () => {
      const featuresNoDepth = [
        {
          type: 'Feature' as const,
          properties: { id: '1', network_type: 'water' } as InfrastructureFeatureProperties,
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]

      const filtered = filterInfrastructureByElevation(featuresNoDepth, { min: -5, max: 5 })
      expect(filtered).toHaveLength(1)
    })
  })

  describe('createInfrastructurePointLayer URL data accessors', () => {
    it('should use default getRadius fallback when URL and no custom getRadius', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
      })

      // Call the accessor directly with a mock feature
      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water', diameter: 600 },
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const radius = layer.props.getRadius(mockFeature)
      expect(radius).toBe(3) // 600 / 200 = 3
    })

    it('should use default getRadius with fallback diameter when URL', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
      })

      // Feature without diameter
      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' },
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const radius = layer.props.getRadius(mockFeature)
      expect(radius).toBe(2.5) // 500 / 200 = 2.5 (default)
    })

    it('should use custom getRadius when provided with URL', () => {
      const customGetRadius = vi.fn().mockReturnValue(7)
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
        getRadius: customGetRadius,
      })

      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' },
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const radius = layer.props.getRadius(mockFeature)
      expect(radius).toBe(7)
      expect(customGetRadius).toHaveBeenCalledWith(mockFeature)
    })

    it('should use default getFillColor fallback when URL and no custom getColor', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
        opacity: 1,
      })

      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'gas' },
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const color = layer.props.getFillColor(mockFeature)
      expect(color).toHaveLength(4)
      // Color should be RGBA array with full opacity (255)
      expect(color[3]).toBe(255)
      // Gas color is #F59E0B which is [245, 158, 11, 255]
      expect(color[0]).toBe(245)
    })

    it('should use networkType option for color when URL', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
        networkType: 'sewage',
        opacity: 1,
      })

      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' }, // Feature has water, but layer has sewage
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const color = layer.props.getFillColor(mockFeature)
      // Should use networkType option (sewage), not feature's network_type
      // Sewage color is #92400E which is [146, 64, 14, 255]
      expect(color[0]).toBe(146)
    })

    it('should use feature network_type when no networkType option with URL', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
        opacity: 1,
      })

      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'electric' },
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const color = layer.props.getFillColor(mockFeature)
      // Electric color is #FBBF24 which is [251, 191, 36, 255]
      expect(color[0]).toBe(251)
    })

    it('should fallback to water color when no network_type in feature with URL', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
        opacity: 1,
      })

      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1' } as InfrastructureFeatureProperties,
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const color = layer.props.getFillColor(mockFeature)
      // Water color is #3B82F6 which is [59, 130, 246, 255]
      expect(color[0]).toBe(59)
    })

    it('should use custom getColor when provided with URL', () => {
      const customColor: [number, number, number, number] = [128, 64, 32, 255]
      const customGetColor = vi.fn().mockReturnValue(customColor)
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
        getColor: customGetColor,
      })

      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water' },
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const color = layer.props.getFillColor(mockFeature)
      expect(color).toEqual(customColor)
      expect(customGetColor).toHaveBeenCalledWith(mockFeature)
    })

    it('should get position with depth for URL data', () => {
      const layer = createInfrastructurePointLayer({
        data: '/api/geo/points',
      })

      const mockFeature: Feature<Point, InfrastructureFeatureProperties> = {
        type: 'Feature',
        properties: { id: '1', network_type: 'water', depth: -5 },
        geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
      }

      const position = layer.props.getPosition(mockFeature)
      expect(position).toHaveLength(3)
      expect(position[2]).toBe(-5)
    })
  })
})
