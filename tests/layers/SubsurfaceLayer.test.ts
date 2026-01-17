import { describe, it, expect, vi } from 'vitest'
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import type { Feature, LineString, Point } from 'geojson'
import {
  createSubsurfaceLayer,
  createAccessPointLayer,
  filterSubsurfaceByElevation,
  groupSubsurfaceByNetwork,
  groupSubsurfaceByDepth,
} from '../../src/layers/SubsurfaceLayer'
import type { SubsurfaceFeatureProperties } from '../../src/types'

// Mock subsurface line features
const mockSubsurfaceLines: Feature<LineString, SubsurfaceFeatureProperties>[] = [
  {
    type: 'Feature',
    properties: {
      id: '1',
      network_type: 'water',
      depth: -3,
      diameter: 150,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.6, -23.5],
        [-46.61, -23.51],
        [-46.62, -23.52],
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: '2',
      network_type: 'gas',
      depth: -8,
      diameter: 100,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.63, -23.5],
        [-46.64, -23.51],
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: '3',
      network_type: 'sewage',
      depth: -20,
      diameter: 300,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.65, -23.5],
        [-46.66, -23.51],
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: '4',
      network_type: 'electric',
      depth: -2,
      diameter: 50,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.67, -23.5],
        [-46.68, -23.51],
      ],
    },
  },
]

// Mock access point features
const mockAccessPoints: Feature<Point, SubsurfaceFeatureProperties>[] = [
  {
    type: 'Feature',
    properties: {
      id: 'ap1',
      network_type: 'water',
      depth: -3,
      diameter: 600,
    },
    geometry: {
      type: 'Point',
      coordinates: [-46.6, -23.5],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'ap2',
      network_type: 'sewage',
      depth: -15,
      diameter: 800,
    },
    geometry: {
      type: 'Point',
      coordinates: [-46.62, -23.52],
    },
  },
]

describe('SubsurfaceLayer', () => {
  describe('createSubsurfaceLayer', () => {
    it('should create a PathLayer instance', () => {
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
      expect(layer).toBeInstanceOf(PathLayer)
    })

    it('should use default id when not specified', () => {
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
      expect(layer.id).toBe('subsurface-layer')
    })

    it('should use custom id when specified', () => {
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, id: 'custom-subsurface' })
      expect(layer.id).toBe('custom-subsurface')
    })

    it('should apply default options', () => {
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
      expect(layer.props.visible).toBe(true)
      expect(layer.props.pickable).toBe(true)
      expect(layer.props.opacity).toBe(0.8)
    })

    it('should apply custom options', () => {
      const layer = createSubsurfaceLayer({
        data: mockSubsurfaceLines,
        visible: false,
        pickable: false,
        opacity: 0.5,
        widthScale: 2,
        widthMinPixels: 3,
        widthMaxPixels: 15,
      })
      expect(layer.props.visible).toBe(false)
      expect(layer.props.pickable).toBe(false)
      expect(layer.props.opacity).toBe(0.5)
      expect(layer.props.widthScale).toBe(2)
      expect(layer.props.widthMinPixels).toBe(3)
      expect(layer.props.widthMaxPixels).toBe(15)
    })

    it('should filter by networkTypes', () => {
      const layer = createSubsurfaceLayer({
        data: mockSubsurfaceLines,
        networkTypes: ['water', 'gas'],
      })
      expect(layer).toBeInstanceOf(PathLayer)
      // Data should be filtered
      expect((layer.props.data as unknown[]).length).toBe(2)
    })

    it('should accept onClick callback', () => {
      const onClick = vi.fn()
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, onClick })
      expect(layer.props.onClick).toBeDefined()
    })

    it('should accept onHover callback', () => {
      const onHover = vi.fn()
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, onHover })
      expect(layer.props.onHover).toBeDefined()
    })

    it('should use custom getWidth function', () => {
      const getWidth = vi.fn().mockReturnValue(5)
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, getWidth })
      expect(layer.props.getWidth).toBeDefined()
    })

    it('should use custom getColor function', () => {
      const getColor = vi.fn().mockReturnValue([255, 0, 0, 255])
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, getColor })
      expect(layer.props.getColor).toBeDefined()
    })

    it('should handle URL string data', () => {
      const layer = createSubsurfaceLayer({ data: '/api/subsurface.json' })
      expect(layer).toBeInstanceOf(PathLayer)
    })

    it('should have rounded caps and joints', () => {
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
      expect(layer.props.capRounded).toBe(true)
      expect(layer.props.jointRounded).toBe(true)
    })

    it('should not use billboard mode', () => {
      const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
      expect(layer.props.billboard).toBe(false)
    })
  })

  describe('createAccessPointLayer', () => {
    it('should create a ScatterplotLayer instance', () => {
      const layer = createAccessPointLayer({ data: mockAccessPoints })
      expect(layer).toBeInstanceOf(ScatterplotLayer)
    })

    it('should use default id when not specified', () => {
      const layer = createAccessPointLayer({ data: mockAccessPoints })
      expect(layer.id).toBe('access-points-layer')
    })

    it('should use custom id when specified', () => {
      const layer = createAccessPointLayer({ data: mockAccessPoints, id: 'custom-access' })
      expect(layer.id).toBe('custom-access')
    })

    it('should apply default options', () => {
      const layer = createAccessPointLayer({ data: mockAccessPoints })
      expect(layer.props.visible).toBe(true)
      expect(layer.props.pickable).toBe(true)
      expect(layer.props.opacity).toBe(0.8)
      expect(layer.props.stroked).toBe(true)
    })

    it('should apply custom options', () => {
      const layer = createAccessPointLayer({
        data: mockAccessPoints,
        visible: false,
        pickable: false,
        opacity: 0.6,
        radiusScale: 2,
        radiusMinPixels: 5,
        radiusMaxPixels: 20,
      })
      expect(layer.props.visible).toBe(false)
      expect(layer.props.pickable).toBe(false)
      expect(layer.props.opacity).toBe(0.6)
      expect(layer.props.radiusScale).toBe(2)
      expect(layer.props.radiusMinPixels).toBe(5)
      expect(layer.props.radiusMaxPixels).toBe(20)
    })

    it('should filter by networkTypes', () => {
      const layer = createAccessPointLayer({
        data: mockAccessPoints,
        networkTypes: ['water'],
      })
      expect(layer).toBeInstanceOf(ScatterplotLayer)
      expect((layer.props.data as unknown[]).length).toBe(1)
    })

    it('should accept onClick callback', () => {
      const onClick = vi.fn()
      const layer = createAccessPointLayer({ data: mockAccessPoints, onClick })
      expect(layer.props.onClick).toBeDefined()
    })

    it('should accept onHover callback', () => {
      const onHover = vi.fn()
      const layer = createAccessPointLayer({ data: mockAccessPoints, onHover })
      expect(layer.props.onHover).toBeDefined()
    })

    it('should handle URL string data', () => {
      const layer = createAccessPointLayer({ data: '/api/access-points.json' })
      expect(layer).toBeInstanceOf(ScatterplotLayer)
    })
  })

  describe('filterSubsurfaceByElevation', () => {
    it('should filter features within elevation range', () => {
      const range = { min: -10, max: 0 }
      const filtered = filterSubsurfaceByElevation(mockSubsurfaceLines, range)
      expect(filtered.length).toBe(3) // depth -3, -8, -2 are within range
    })

    it('should exclude features outside range', () => {
      const range = { min: -5, max: 0 }
      const filtered = filterSubsurfaceByElevation(mockSubsurfaceLines, range)
      expect(filtered.length).toBe(2) // only -3 and -2
    })

    it('should handle deep features', () => {
      const range = { min: -30, max: -15 }
      const filtered = filterSubsurfaceByElevation(mockSubsurfaceLines, range)
      expect(filtered.length).toBe(1) // only -20
    })

    it('should return empty array for non-matching range', () => {
      const range = { min: -100, max: -50 }
      const filtered = filterSubsurfaceByElevation(mockSubsurfaceLines, range)
      expect(filtered.length).toBe(0)
    })

    it('should handle features without depth (default to 0)', () => {
      const featuresWithoutDepth: Feature<LineString, SubsurfaceFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'no-depth', network_type: 'water' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]
      const range = { min: -5, max: 5 }
      const filtered = filterSubsurfaceByElevation(featuresWithoutDepth, range)
      expect(filtered.length).toBe(1)
    })

    it('should work with point features', () => {
      const range = { min: -20, max: 0 }
      const filtered = filterSubsurfaceByElevation(mockAccessPoints, range)
      expect(filtered.length).toBe(2)
    })
  })

  describe('groupSubsurfaceByNetwork', () => {
    it('should group features by network type', () => {
      const groups = groupSubsurfaceByNetwork(mockSubsurfaceLines)
      expect(groups.water.length).toBe(1)
      expect(groups.gas.length).toBe(1)
      expect(groups.sewage.length).toBe(1)
      expect(groups.electric.length).toBe(1)
    })

    it('should return empty arrays for missing network types', () => {
      const groups = groupSubsurfaceByNetwork(mockSubsurfaceLines)
      expect(groups.telecom.length).toBe(0)
      expect(groups.drainage.length).toBe(0)
      expect(groups.metro.length).toBe(0)
    })

    it('should handle empty array', () => {
      const groups = groupSubsurfaceByNetwork([])
      expect(groups.water.length).toBe(0)
      expect(groups.gas.length).toBe(0)
    })

    it('should handle features without network_type', () => {
      const featuresWithoutType: Feature<LineString, SubsurfaceFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'no-type' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]
      const groups = groupSubsurfaceByNetwork(featuresWithoutType)
      // Should not throw, all groups should be empty
      expect(groups.water.length).toBe(0)
    })

    it('should work with point features', () => {
      const groups = groupSubsurfaceByNetwork(mockAccessPoints)
      expect(groups.water.length).toBe(1)
      expect(groups.sewage.length).toBe(1)
    })
  })

  describe('groupSubsurfaceByDepth', () => {
    it('should group features into shallow, medium, deep categories', () => {
      const groups = groupSubsurfaceByDepth(mockSubsurfaceLines)
      expect(groups.shallow).toBeDefined()
      expect(groups.medium).toBeDefined()
      expect(groups.deep).toBeDefined()
    })

    it('should categorize shallow features (0 to -5m)', () => {
      const groups = groupSubsurfaceByDepth(mockSubsurfaceLines)
      expect(groups.shallow.length).toBe(2) // -3 and -2
    })

    it('should categorize medium features (-5 to -15m)', () => {
      const groups = groupSubsurfaceByDepth(mockSubsurfaceLines)
      expect(groups.medium.length).toBe(1) // -8
    })

    it('should categorize deep features (-15m+)', () => {
      const groups = groupSubsurfaceByDepth(mockSubsurfaceLines)
      expect(groups.deep.length).toBe(1) // -20
    })

    it('should handle features without depth (default to 0)', () => {
      const featuresWithoutDepth: Feature<LineString, SubsurfaceFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'no-depth', network_type: 'water' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]
      const groups = groupSubsurfaceByDepth(featuresWithoutDepth)
      expect(groups.shallow.length).toBe(1)
    })

    it('should handle empty array', () => {
      const groups = groupSubsurfaceByDepth([])
      expect(groups.shallow.length).toBe(0)
      expect(groups.medium.length).toBe(0)
      expect(groups.deep.length).toBe(0)
    })

    it('should handle boundary value (exactly -5m)', () => {
      const boundaryFeatures: Feature<LineString, SubsurfaceFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'boundary', network_type: 'water', depth: -5 },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]
      const groups = groupSubsurfaceByDepth(boundaryFeatures)
      expect(groups.shallow.length).toBe(1)
    })

    it('should handle boundary value (exactly -15m)', () => {
      const boundaryFeatures: Feature<LineString, SubsurfaceFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'boundary', network_type: 'water', depth: -15 },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        },
      ]
      const groups = groupSubsurfaceByDepth(boundaryFeatures)
      expect(groups.medium.length).toBe(1)
    })
  })

  describe('accessor functions', () => {
    describe('createSubsurfaceLayer accessors', () => {
      it('should calculate width from diameter', () => {
        const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
        const getWidth = layer.props.getWidth as (
          feature: Feature<LineString, SubsurfaceFeatureProperties>
        ) => number

        const result = getWidth(mockSubsurfaceLines[0]) // diameter: 150
        expect(result).toBe(1.5) // 150 / 100
      })

      it('should use custom getWidth when provided', () => {
        const customGetWidth = vi.fn().mockReturnValue(10)
        const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, getWidth: customGetWidth })
        const getWidth = layer.props.getWidth as (
          feature: Feature<LineString, SubsurfaceFeatureProperties>
        ) => number

        getWidth(mockSubsurfaceLines[0])
        expect(customGetWidth).toHaveBeenCalled()
      })

      it('should use default diameter when not specified', () => {
        const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
        const getWidth = layer.props.getWidth as (
          feature: Feature<LineString, SubsurfaceFeatureProperties>
        ) => number

        const featureWithoutDiameter: Feature<LineString, SubsurfaceFeatureProperties> = {
          type: 'Feature',
          properties: { id: 'no-diameter', network_type: 'water' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        }

        const result = getWidth(featureWithoutDiameter)
        expect(result).toBe(1) // default 100 / 100
      })

      it('should get color by network type', () => {
        const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, opacity: 1 })
        const getColor = layer.props.getColor as (
          feature: Feature<LineString, SubsurfaceFeatureProperties>
        ) => [number, number, number, number]

        const result = getColor(mockSubsurfaceLines[0]) // water
        expect(result).toHaveLength(4)
        expect(result[3]).toBe(255) // opacity * 255
      })

      it('should use custom getColor when provided', () => {
        const customColor: [number, number, number, number] = [255, 0, 0, 255]
        const customGetColor = vi.fn().mockReturnValue(customColor)
        const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines, getColor: customGetColor })
        const getColor = layer.props.getColor as (
          feature: Feature<LineString, SubsurfaceFeatureProperties>
        ) => [number, number, number, number]

        const result = getColor(mockSubsurfaceLines[0])
        expect(customGetColor).toHaveBeenCalled()
        expect(result).toEqual(customColor)
      })

      it('should get 3D path with depth', () => {
        const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
        const getPath = layer.props.getPath as (
          feature: Feature<LineString, SubsurfaceFeatureProperties>
        ) => [number, number, number][]

        const result = getPath(mockSubsurfaceLines[0]) // depth: -3
        expect(result[0]).toEqual([-46.6, -23.5, -3])
        expect(result[1]).toEqual([-46.61, -23.51, -3])
      })

      it('should use default depth when not specified', () => {
        const layer = createSubsurfaceLayer({ data: mockSubsurfaceLines })
        const getPath = layer.props.getPath as (
          feature: Feature<LineString, SubsurfaceFeatureProperties>
        ) => [number, number, number][]

        const featureWithoutDepth: Feature<LineString, SubsurfaceFeatureProperties> = {
          type: 'Feature',
          properties: { id: 'no-depth', network_type: 'water' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-46.6, -23.5],
              [-46.61, -23.51],
            ],
          },
        }

        const result = getPath(featureWithoutDepth)
        expect(result[0][2]).toBe(-5) // default depth
      })
    })

    describe('createAccessPointLayer accessors', () => {
      it('should calculate radius from diameter', () => {
        const layer = createAccessPointLayer({ data: mockAccessPoints })
        const getRadius = layer.props.getRadius as (
          feature: Feature<Point, SubsurfaceFeatureProperties>
        ) => number

        const result = getRadius(mockAccessPoints[0]) // diameter: 600
        expect(result).toBe(3) // 600 / 200
      })

      it('should use default diameter for radius when not specified', () => {
        const layer = createAccessPointLayer({ data: mockAccessPoints })
        const getRadius = layer.props.getRadius as (
          feature: Feature<Point, SubsurfaceFeatureProperties>
        ) => number

        const featureWithoutDiameter: Feature<Point, SubsurfaceFeatureProperties> = {
          type: 'Feature',
          properties: { id: 'no-diameter', network_type: 'water' },
          geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
        }

        const result = getRadius(featureWithoutDiameter)
        expect(result).toBe(2.5) // default 500 / 200
      })

      it('should get fill color by network type', () => {
        const layer = createAccessPointLayer({ data: mockAccessPoints, opacity: 1 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Point, SubsurfaceFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(mockAccessPoints[0]) // water
        expect(result).toHaveLength(4)
        expect(result[3]).toBe(255) // opacity * 255
      })

      it('should use default network type for color when not specified', () => {
        const layer = createAccessPointLayer({ data: mockAccessPoints, opacity: 1 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Point, SubsurfaceFeatureProperties>
        ) => [number, number, number, number]

        const featureWithoutType: Feature<Point, SubsurfaceFeatureProperties> = {
          type: 'Feature',
          properties: { id: 'no-type' },
          geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
        }

        const result = getFillColor(featureWithoutType)
        expect(result).toHaveLength(4)
      })

      it('should get 3D position with depth', () => {
        const layer = createAccessPointLayer({ data: mockAccessPoints })
        const getPosition = layer.props.getPosition as (
          feature: Feature<Point, SubsurfaceFeatureProperties>
        ) => [number, number, number]

        const result = getPosition(mockAccessPoints[0]) // depth: -3
        expect(result).toEqual([-46.6, -23.5, -3])
      })

      it('should use default depth for position when not specified', () => {
        const layer = createAccessPointLayer({ data: mockAccessPoints })
        const getPosition = layer.props.getPosition as (
          feature: Feature<Point, SubsurfaceFeatureProperties>
        ) => [number, number, number]

        const featureWithoutDepth: Feature<Point, SubsurfaceFeatureProperties> = {
          type: 'Feature',
          properties: { id: 'no-depth', network_type: 'water' },
          geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
        }

        const result = getPosition(featureWithoutDepth)
        expect(result[2]).toBe(-5) // default depth
      })
    })
  })
})
