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
  })
})
