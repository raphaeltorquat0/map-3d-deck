import { describe, it, expect, vi } from 'vitest'
import { PolygonLayer } from '@deck.gl/layers'
import type { Feature, Polygon, MultiPolygon } from 'geojson'
import {
  createBuildingLayer,
  createMaxHeightLayer,
  filterBuildingsByElevation,
  groupBuildingsByHeight,
} from '../../src/layers/BuildingLayer'
import type { BuildingFeatureProperties } from '../../src/types'

// Mock building features
const mockBuildings: Feature<Polygon, BuildingFeatureProperties>[] = [
  {
    type: 'Feature',
    properties: {
      id: '1',
      height: 10,
      use_type: 'residential',
      elevation_base: 0,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-46.6, -23.5],
          [-46.6, -23.51],
          [-46.61, -23.51],
          [-46.61, -23.5],
          [-46.6, -23.5],
        ],
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: '2',
      height: 30,
      use_type: 'commercial',
      elevation_base: 0,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-46.62, -23.5],
          [-46.62, -23.51],
          [-46.63, -23.51],
          [-46.63, -23.5],
          [-46.62, -23.5],
        ],
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: '3',
      height: 80,
      use_type: 'mixed',
      elevation_base: 5,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-46.64, -23.5],
          [-46.64, -23.51],
          [-46.65, -23.51],
          [-46.65, -23.5],
          [-46.64, -23.5],
        ],
      ],
    },
  },
]

const mockMultiPolygonBuilding: Feature<MultiPolygon, BuildingFeatureProperties> = {
  type: 'Feature',
  properties: {
    id: '4',
    height: 25,
    use_type: 'industrial',
  },
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [-46.66, -23.5],
          [-46.66, -23.51],
          [-46.67, -23.51],
          [-46.67, -23.5],
          [-46.66, -23.5],
        ],
      ],
    ],
  },
}

describe('BuildingLayer', () => {
  describe('createBuildingLayer', () => {
    it('should create a PolygonLayer instance', () => {
      const layer = createBuildingLayer({ data: mockBuildings })
      expect(layer).toBeInstanceOf(PolygonLayer)
    })

    it('should use default id when not specified', () => {
      const layer = createBuildingLayer({ data: mockBuildings })
      expect(layer.id).toBe('building-layer')
    })

    it('should use custom id when specified', () => {
      const layer = createBuildingLayer({ data: mockBuildings, id: 'custom-buildings' })
      expect(layer.id).toBe('custom-buildings')
    })

    it('should apply default options', () => {
      const layer = createBuildingLayer({ data: mockBuildings })
      expect(layer.props.visible).toBe(true)
      expect(layer.props.pickable).toBe(true)
      expect(layer.props.extruded).toBe(true)
      expect(layer.props.wireframe).toBe(false)
    })

    it('should apply custom options', () => {
      const layer = createBuildingLayer({
        data: mockBuildings,
        visible: false,
        pickable: false,
        extruded: false,
        wireframe: true,
        opacity: 0.5,
      })
      expect(layer.props.visible).toBe(false)
      expect(layer.props.pickable).toBe(false)
      expect(layer.props.extruded).toBe(false)
      expect(layer.props.wireframe).toBe(true)
      expect(layer.props.opacity).toBe(0.5)
    })

    it('should accept onClick callback', () => {
      const onClick = vi.fn()
      const layer = createBuildingLayer({ data: mockBuildings, onClick })
      expect(layer.props.onClick).toBeDefined()
    })

    it('should accept onHover callback', () => {
      const onHover = vi.fn()
      const layer = createBuildingLayer({ data: mockBuildings, onHover })
      expect(layer.props.onHover).toBeDefined()
    })

    it('should use custom getHeight function', () => {
      const getHeight = vi.fn().mockReturnValue(50)
      const layer = createBuildingLayer({ data: mockBuildings, getHeight })
      expect(layer.props.getElevation).toBeDefined()
    })

    it('should use custom getFillColor function', () => {
      const getFillColor = vi.fn().mockReturnValue([255, 0, 0, 255])
      const layer = createBuildingLayer({ data: mockBuildings, getFillColor })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should apply elevationScale', () => {
      const layer = createBuildingLayer({ data: mockBuildings, elevationScale: 2 })
      expect(layer.props.getElevation).toBeDefined()
    })

    it('should set custom lineColor', () => {
      const layer = createBuildingLayer({
        data: mockBuildings,
        getLineColor: [0, 255, 0, 255],
      })
      expect(layer.props.getLineColor).toBeDefined()
    })

    it('should handle URL string data', () => {
      const layer = createBuildingLayer({ data: '/api/buildings.json' })
      expect(layer).toBeInstanceOf(PolygonLayer)
    })

    it('should have material settings for 3D lighting', () => {
      const layer = createBuildingLayer({ data: mockBuildings })
      expect(layer.props.material).toBeDefined()
      expect(layer.props.material.ambient).toBeDefined()
      expect(layer.props.material.diffuse).toBeDefined()
    })
  })

  describe('createMaxHeightLayer', () => {
    it('should create a PolygonLayer for max height visualization', () => {
      const maxHeights = new Map([
        ['ZR1', 15],
        ['ZC1', 50],
      ])
      const layer = createMaxHeightLayer({ data: mockBuildings, maxHeights })
      expect(layer).toBeInstanceOf(PolygonLayer)
    })

    it('should use default id', () => {
      const maxHeights = new Map<string, number>()
      const layer = createMaxHeightLayer({ data: mockBuildings, maxHeights })
      expect(layer.id).toBe('max-height-layer')
    })

    it('should use custom id', () => {
      const maxHeights = new Map<string, number>()
      const layer = createMaxHeightLayer({ data: mockBuildings, maxHeights, id: 'custom-max' })
      expect(layer.id).toBe('custom-max')
    })

    it('should be wireframe by default', () => {
      const maxHeights = new Map<string, number>()
      const layer = createMaxHeightLayer({ data: mockBuildings, maxHeights })
      expect(layer.props.wireframe).toBe(true)
    })

    it('should not be pickable', () => {
      const maxHeights = new Map<string, number>()
      const layer = createMaxHeightLayer({ data: mockBuildings, maxHeights })
      expect(layer.props.pickable).toBe(false)
    })

    it('should apply elevationScale', () => {
      const maxHeights = new Map<string, number>()
      const layer = createMaxHeightLayer({ data: mockBuildings, maxHeights, elevationScale: 1.5 })
      expect(layer.props.getElevation).toBeDefined()
    })
  })

  describe('filterBuildingsByElevation', () => {
    it('should include buildings that overlap with range', () => {
      // All buildings have elevation_base at or near 0, so they overlap with 0-20
      const range = { min: 0, max: 20 }
      const filtered = filterBuildingsByElevation(mockBuildings, range)
      // All buildings overlap with this range (they all start at or below 20)
      expect(filtered.length).toBe(3)
    })

    it('should include buildings that partially overlap range', () => {
      const range = { min: 0, max: 50 }
      const filtered = filterBuildingsByElevation(mockBuildings, range)
      expect(filtered.length).toBe(3) // All overlap
    })

    it('should handle buildings with elevation_base', () => {
      const range = { min: 0, max: 100 }
      const filtered = filterBuildingsByElevation(mockBuildings, range)
      expect(filtered.length).toBe(3)
    })

    it('should return empty array for non-matching range', () => {
      const range = { min: 200, max: 300 }
      const filtered = filterBuildingsByElevation(mockBuildings, range)
      expect(filtered.length).toBe(0)
    })

    it('should handle features without height property', () => {
      const buildingsWithoutHeight: Feature<Polygon, BuildingFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'no-height' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.6, -23.51],
                [-46.61, -23.51],
                [-46.6, -23.5],
              ],
            ],
          },
        },
      ]
      const range = { min: 0, max: 10 }
      const filtered = filterBuildingsByElevation(buildingsWithoutHeight, range)
      expect(filtered.length).toBe(1)
    })
  })

  describe('groupBuildingsByHeight', () => {
    it('should group buildings into low, medium, high categories', () => {
      const groups = groupBuildingsByHeight(mockBuildings)
      expect(groups.low).toBeDefined()
      expect(groups.medium).toBeDefined()
      expect(groups.high).toBeDefined()
    })

    it('should categorize low buildings (0-15m)', () => {
      const groups = groupBuildingsByHeight(mockBuildings)
      expect(groups.low.length).toBe(1)
      expect(groups.low[0].properties?.height).toBe(10)
    })

    it('should categorize medium buildings (15-50m)', () => {
      const groups = groupBuildingsByHeight(mockBuildings)
      expect(groups.medium.length).toBe(1)
      expect(groups.medium[0].properties?.height).toBe(30)
    })

    it('should categorize high buildings (50m+)', () => {
      const groups = groupBuildingsByHeight(mockBuildings)
      expect(groups.high.length).toBe(1)
      expect(groups.high[0].properties?.height).toBe(80)
    })

    it('should handle features without height (default to 0)', () => {
      const buildingsWithoutHeight: Feature<Polygon, BuildingFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'no-height' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.6, -23.51],
                [-46.61, -23.51],
                [-46.6, -23.5],
              ],
            ],
          },
        },
      ]
      const groups = groupBuildingsByHeight(buildingsWithoutHeight)
      expect(groups.low.length).toBe(1)
    })

    it('should handle empty array', () => {
      const groups = groupBuildingsByHeight([])
      expect(groups.low.length).toBe(0)
      expect(groups.medium.length).toBe(0)
      expect(groups.high.length).toBe(0)
    })

    it('should handle boundary values (exactly 15m)', () => {
      const boundaryBuildings: Feature<Polygon, BuildingFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'boundary', height: 15 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.6, -23.51],
                [-46.61, -23.51],
                [-46.6, -23.5],
              ],
            ],
          },
        },
      ]
      const groups = groupBuildingsByHeight(boundaryBuildings)
      expect(groups.low.length).toBe(1)
    })

    it('should handle boundary values (exactly 50m)', () => {
      const boundaryBuildings: Feature<Polygon, BuildingFeatureProperties>[] = [
        {
          type: 'Feature',
          properties: { id: 'boundary', height: 50 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.6, -23.51],
                [-46.61, -23.51],
                [-46.6, -23.5],
              ],
            ],
          },
        },
      ]
      const groups = groupBuildingsByHeight(boundaryBuildings)
      expect(groups.medium.length).toBe(1)
    })
  })

  describe('MultiPolygon support', () => {
    it('should handle MultiPolygon geometry', () => {
      const layer = createBuildingLayer({ data: [mockMultiPolygonBuilding] })
      expect(layer).toBeInstanceOf(PolygonLayer)
    })

    it('should group MultiPolygon buildings by height', () => {
      const groups = groupBuildingsByHeight([mockMultiPolygonBuilding])
      expect(groups.medium.length).toBe(1)
    })
  })

  describe('accessor functions', () => {
    describe('getPolygon accessor', () => {
      it('should extract coordinates from Polygon', () => {
        const layer = createBuildingLayer({ data: mockBuildings })
        const getPolygon = layer.props.getPolygon as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => number[][][]

        const result = getPolygon(mockBuildings[0])
        expect(result).toEqual(mockBuildings[0].geometry.coordinates)
      })

      it('should extract first polygon from MultiPolygon', () => {
        const layer = createBuildingLayer({ data: [mockMultiPolygonBuilding] })
        const getPolygon = layer.props.getPolygon as (
          feature: Feature<MultiPolygon, BuildingFeatureProperties>
        ) => number[][][]

        const result = getPolygon(mockMultiPolygonBuilding)
        expect(result).toEqual(mockMultiPolygonBuilding.geometry.coordinates[0])
      })
    })

    describe('getElevation accessor', () => {
      it('should use custom getHeight when provided', () => {
        const customGetHeight = vi.fn().mockReturnValue(100)
        const layer = createBuildingLayer({
          data: mockBuildings,
          getHeight: customGetHeight,
          elevationScale: 2,
        })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => number

        const result = getElevation(mockBuildings[0])
        expect(customGetHeight).toHaveBeenCalledWith(mockBuildings[0])
        expect(result).toBe(200) // 100 * 2
      })

      it('should use height from properties as default', () => {
        const layer = createBuildingLayer({ data: mockBuildings, elevationScale: 1 })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => number

        const result = getElevation(mockBuildings[0]) // height: 10
        expect(result).toBe(10)
      })

      it('should apply elevation scale', () => {
        const layer = createBuildingLayer({ data: mockBuildings, elevationScale: 3 })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => number

        const result = getElevation(mockBuildings[0]) // height: 10
        expect(result).toBe(30) // 10 * 3
      })

      it('should return default 10 when height is not defined', () => {
        const featureWithoutHeight: Feature<Polygon, BuildingFeatureProperties> = {
          type: 'Feature',
          properties: { id: 'no-height' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.6, -23.51],
                [-46.61, -23.51],
                [-46.6, -23.5],
              ],
            ],
          },
        }
        const layer = createBuildingLayer({ data: mockBuildings })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => number

        const result = getElevation(featureWithoutHeight)
        expect(result).toBe(10) // default
      })
    })

    describe('getFillColor accessor', () => {
      it('should use custom getFillColor when provided', () => {
        const customColor: [number, number, number, number] = [255, 0, 0, 255]
        const customGetFillColor = vi.fn().mockReturnValue(customColor)
        const layer = createBuildingLayer({ data: mockBuildings, getFillColor: customGetFillColor })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(mockBuildings[0])
        expect(customGetFillColor).toHaveBeenCalledWith(mockBuildings[0])
        expect(result).toEqual(customColor)
      })

      it('should get color by use_type', () => {
        const layer = createBuildingLayer({ data: mockBuildings, opacity: 1 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(mockBuildings[0]) // use_type: 'residential'
        expect(result).toHaveLength(4)
        expect(result[3]).toBe(255) // opacity * 255
      })

      it('should use default use_type when not specified', () => {
        const featureWithoutUseType: Feature<Polygon, BuildingFeatureProperties> = {
          type: 'Feature',
          properties: { id: 'no-use-type', height: 20 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-46.6, -23.5],
                [-46.6, -23.51],
                [-46.61, -23.51],
                [-46.6, -23.5],
              ],
            ],
          },
        }
        const layer = createBuildingLayer({ data: mockBuildings, opacity: 1 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(featureWithoutUseType)
        expect(result).toHaveLength(4)
      })

      it('should return color for commercial use_type', () => {
        const layer = createBuildingLayer({ data: mockBuildings, opacity: 1 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(mockBuildings[1]) // use_type: 'commercial'
        expect(result).toHaveLength(4)
      })

      it('should return color for mixed use_type', () => {
        const layer = createBuildingLayer({ data: mockBuildings, opacity: 1 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, BuildingFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(mockBuildings[2]) // use_type: 'mixed'
        expect(result).toHaveLength(4)
      })

      it('should return color for industrial use_type', () => {
        const layer = createBuildingLayer({ data: [mockMultiPolygonBuilding], opacity: 1 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<MultiPolygon, BuildingFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(mockMultiPolygonBuilding) // use_type: 'industrial'
        expect(result).toHaveLength(4)
      })
    })

    describe('getLineColor accessor', () => {
      it('should return default line color', () => {
        const layer = createBuildingLayer({ data: mockBuildings })
        const getLineColor = layer.props.getLineColor as () => [number, number, number, number]

        const result = getLineColor()
        expect(result).toEqual([255, 255, 255, 100])
      })

      it('should return custom line color', () => {
        const customLineColor: [number, number, number, number] = [0, 0, 255, 200]
        const layer = createBuildingLayer({ data: mockBuildings, getLineColor: customLineColor })
        const getLineColor = layer.props.getLineColor as () => [number, number, number, number]

        const result = getLineColor()
        expect(result).toEqual(customLineColor)
      })
    })
  })

  describe('createMaxHeightLayer accessors', () => {
    it('should get elevation from maxHeights map', () => {
      const maxHeights = new Map([
        ['ZR1', 15],
        ['ZC1', 50],
      ])
      const buildingWithZone: Feature<Polygon, BuildingFeatureProperties> = {
        type: 'Feature',
        properties: { id: 'test', zone_code: 'ZR1', height: 10 },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.6, -23.5],
              [-46.6, -23.51],
              [-46.61, -23.51],
              [-46.6, -23.5],
            ],
          ],
        },
      }
      const layer = createMaxHeightLayer({ data: [buildingWithZone], maxHeights })
      const getElevation = layer.props.getElevation as (
        feature: Feature<Polygon, BuildingFeatureProperties>
      ) => number

      const result = getElevation(buildingWithZone)
      expect(result).toBe(15)
    })

    it('should apply elevation scale to max height', () => {
      const maxHeights = new Map([['ZR1', 20]])
      const buildingWithZone: Feature<Polygon, BuildingFeatureProperties> = {
        type: 'Feature',
        properties: { id: 'test', zone_code: 'ZR1', height: 10 },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.6, -23.5],
              [-46.6, -23.51],
              [-46.61, -23.51],
              [-46.6, -23.5],
            ],
          ],
        },
      }
      const layer = createMaxHeightLayer({
        data: [buildingWithZone],
        maxHeights,
        elevationScale: 2,
      })
      const getElevation = layer.props.getElevation as (
        feature: Feature<Polygon, BuildingFeatureProperties>
      ) => number

      const result = getElevation(buildingWithZone)
      expect(result).toBe(40) // 20 * 2
    })

    it('should use default max height when zone not in map', () => {
      const maxHeights = new Map<string, number>()
      const buildingWithUnknownZone: Feature<Polygon, BuildingFeatureProperties> = {
        type: 'Feature',
        properties: { id: 'test', zone_code: 'UNKNOWN', height: 10 },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.6, -23.5],
              [-46.6, -23.51],
              [-46.61, -23.51],
              [-46.6, -23.5],
            ],
          ],
        },
      }
      const layer = createMaxHeightLayer({ data: [buildingWithUnknownZone], maxHeights })
      const getElevation = layer.props.getElevation as (
        feature: Feature<Polygon, BuildingFeatureProperties>
      ) => number

      const result = getElevation(buildingWithUnknownZone)
      expect(result).toBe(50) // default max height
    })

    it('should use default max height when zone_code not specified', () => {
      const maxHeights = new Map([['ZR1', 15]])
      const buildingWithoutZone: Feature<Polygon, BuildingFeatureProperties> = {
        type: 'Feature',
        properties: { id: 'test', height: 10 },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.6, -23.5],
              [-46.6, -23.51],
              [-46.61, -23.51],
              [-46.6, -23.5],
            ],
          ],
        },
      }
      const layer = createMaxHeightLayer({ data: [buildingWithoutZone], maxHeights })
      const getElevation = layer.props.getElevation as (
        feature: Feature<Polygon, BuildingFeatureProperties>
      ) => number

      const result = getElevation(buildingWithoutZone)
      expect(result).toBe(50) // default max height
    })

    it('should get polygon coordinates for max height layer', () => {
      const maxHeights = new Map<string, number>()
      const layer = createMaxHeightLayer({ data: mockBuildings, maxHeights })
      const getPolygon = layer.props.getPolygon as (
        feature: Feature<Polygon, BuildingFeatureProperties>
      ) => number[][][]

      const result = getPolygon(mockBuildings[0])
      expect(result).toEqual(mockBuildings[0].geometry.coordinates)
    })
  })
})
