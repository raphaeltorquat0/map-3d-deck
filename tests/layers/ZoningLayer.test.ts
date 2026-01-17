import { describe, it, expect, vi } from 'vitest'
import type { Feature, Polygon, FeatureCollection } from 'geojson'
import { createZoningLayer, filterZoningByElevation } from '../../src/layers/ZoningLayer'
import type { ZoningFeatureProperties } from '../../src/types/layers'

// Mock deck.gl
vi.mock('@deck.gl/layers', () => ({
  GeoJsonLayer: vi.fn().mockImplementation((props) => ({
    id: props.id,
    props,
  })),
}))

describe('ZoningLayer', () => {
  const mockFeatures: FeatureCollection<Polygon, ZoningFeatureProperties> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: '1',
          zone_code: 'ZR1',
          zone_name: 'Zona Residencial 1',
          max_height: 15,
          max_floors: 5,
          max_far: 1.0,
          max_coverage: 0.5,
          min_setback: 5,
          allowed_uses: ['residential'],
          color: '#22C55E',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.64, -23.55],
              [-46.63, -23.55],
              [-46.63, -23.54],
              [-46.64, -23.54],
              [-46.64, -23.55],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          id: '2',
          zone_code: 'ZC1',
          zone_name: 'Zona Comercial 1',
          max_height: 50,
          max_floors: 15,
          max_far: 2.0,
          max_coverage: 0.7,
          min_setback: 3,
          allowed_uses: ['commercial', 'residential'],
          color: '#3B82F6',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.63, -23.55],
              [-46.62, -23.55],
              [-46.62, -23.54],
              [-46.63, -23.54],
              [-46.63, -23.55],
            ],
          ],
        },
      },
    ],
  }

  describe('createZoningLayer', () => {
    it('should create a layer with default options', () => {
      const layer = createZoningLayer({ data: mockFeatures })

      expect(layer.id).toBe('zoning-layer')
      expect(layer.props.data).toBe(mockFeatures)
      expect(layer.props.visible).toBe(true)
      expect(layer.props.opacity).toBe(0.7)
      expect(layer.props.pickable).toBe(true)
    })

    it('should accept custom id', () => {
      const layer = createZoningLayer({
        id: 'custom-zoning',
        data: mockFeatures,
      })

      expect(layer.id).toBe('custom-zoning')
    })

    it('should accept custom visibility and opacity', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        visible: false,
        opacity: 0.5,
      })

      expect(layer.props.visible).toBe(false)
      expect(layer.props.opacity).toBe(0.5)
    })

    it('should enable extrusion when specified', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        extruded: true,
      })

      expect(layer.props.extruded).toBe(true)
    })

    it('should accept custom getFillColor function', () => {
      const customColor: [number, number, number, number] = [255, 0, 0, 255]
      const getFillColor = vi.fn().mockReturnValue(customColor)

      const layer = createZoningLayer({
        data: mockFeatures,
        getFillColor,
      })

      // The layer wraps getFillColor, so we check it exists
      expect(layer.props.getFillColor).toBeDefined()
      expect(typeof layer.props.getFillColor).toBe('function')
    })

    it('should accept custom getHeight function', () => {
      const getHeight = vi.fn().mockReturnValue(100)

      const layer = createZoningLayer({
        data: mockFeatures,
        getHeight,
      })

      expect(layer.props).toHaveProperty('getElevation')
    })

    it('should accept onClick and onHover callbacks', () => {
      const onClick = vi.fn()
      const onHover = vi.fn()

      const layer = createZoningLayer({
        data: mockFeatures,
        onClick,
        onHover,
      })

      expect(layer.props.onClick).toBe(onClick)
      expect(layer.props.onHover).toBe(onHover)
    })
  })

  describe('filterZoningByElevation', () => {
    const features = mockFeatures.features as Feature<Polygon, ZoningFeatureProperties>[]

    it('should return all features for full range', () => {
      const filtered = filterZoningByElevation(features, { min: -50, max: 200 })

      expect(filtered).toHaveLength(2)
    })

    it('should filter features by max_height', () => {
      // Only ZR1 (max_height: 15) should be excluded when range is above 15
      const filtered = filterZoningByElevation(features, { min: 16, max: 60 })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].properties.zone_code).toBe('ZC1')
    })

    it('should include features that overlap range', () => {
      // Both features overlap this range
      const filtered = filterZoningByElevation(features, { min: 10, max: 60 })

      expect(filtered).toHaveLength(2)
    })

    it('should exclude features completely outside range', () => {
      // No features below surface
      const filtered = filterZoningByElevation(features, { min: -50, max: -10 })

      expect(filtered).toHaveLength(0)
    })

    it('should handle features without max_height', () => {
      const featuresWithoutHeight = [
        {
          type: 'Feature' as const,
          properties: {
            id: '3',
            zone_code: 'ZE1',
            zone_name: 'Zona Especial',
            max_floors: 0,
            max_far: 0,
            max_coverage: 0,
            min_setback: 0,
            allowed_uses: [],
            color: '#888888',
          } as ZoningFeatureProperties,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [-46.62, -23.55],
                [-46.61, -23.55],
                [-46.61, -23.54],
                [-46.62, -23.54],
                [-46.62, -23.55],
              ],
            ],
          },
        },
      ]

      const filtered = filterZoningByElevation(featuresWithoutHeight, { min: 0, max: 10 })

      // Should use 0 as default max_height
      expect(filtered).toHaveLength(1)
    })
  })

  describe('createZoningLayer additional options', () => {
    it('should accept wireframe option', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        wireframe: true,
      })

      expect(layer.props.wireframe).toBe(true)
    })

    it('should accept stroked option', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        stroked: false,
      })

      expect(layer.props.stroked).toBe(false)
    })

    it('should accept filled option', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        filled: false,
      })

      expect(layer.props.filled).toBe(false)
    })

    it('should accept elevationScale option', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        extruded: true,
        elevationScale: 2,
      })

      expect(layer.props.getElevation).toBeDefined()
    })

    it('should accept lineWidthMinPixels option', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        lineWidthMinPixels: 3,
      })

      expect(layer.props.lineWidthMinPixels).toBe(3)
    })

    it('should accept elevationRange for filtering', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        elevationRange: { min: 0, max: 100 },
      })

      expect(layer.props.filterRange).toBeDefined()
    })

    it('should have material when extruded', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        extruded: true,
      })

      expect(layer.props.material).toBeDefined()
    })

    it('should not have material when not extruded', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
        extruded: false,
      })

      expect(layer.props.material).toBeUndefined()
    })

    it('should accept custom getLineColor function', () => {
      const getLineColor = vi.fn().mockReturnValue([0, 0, 0, 255])
      const layer = createZoningLayer({
        data: mockFeatures,
        getLineColor,
      })

      expect(layer.props.getLineColor).toBeDefined()
    })

    it('should accept URL string data', () => {
      const layer = createZoningLayer({
        data: '/api/zoning.geojson',
      })

      expect(layer.props.data).toBe('/api/zoning.geojson')
    })

    it('should have transitions', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
      })

      expect(layer.props.transitions).toBeDefined()
      expect(layer.props.transitions.getElevation).toBe(500)
      expect(layer.props.transitions.getFillColor).toBe(300)
    })

    it('should have updateTriggers', () => {
      const layer = createZoningLayer({
        data: mockFeatures,
      })

      expect(layer.props.updateTriggers).toBeDefined()
      expect(layer.props.updateTriggers.getFillColor).toBeDefined()
      expect(layer.props.updateTriggers.getElevation).toBeDefined()
    })
  })

  describe('default zone colors', () => {
    it('should return color for residential zone (ZR)', () => {
      const residentialFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'ZR1' },
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
        ],
      }
      const layer = createZoningLayer({ data: residentialFeature })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should return color for commercial zone (ZC)', () => {
      const commercialFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'ZC1' },
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
        ],
      }
      const layer = createZoningLayer({ data: commercialFeature })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should return color for mixed zone (ZM)', () => {
      const mixedFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'ZM1' },
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
        ],
      }
      const layer = createZoningLayer({ data: mixedFeature })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should return color for industrial zone (ZI)', () => {
      const industrialFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'ZI1' },
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
        ],
      }
      const layer = createZoningLayer({ data: industrialFeature })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should return color for special zone (ZE)', () => {
      const specialFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'ZE1' },
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
        ],
      }
      const layer = createZoningLayer({ data: specialFeature })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should return color for preservation zone (ZP)', () => {
      const preservationFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'ZP1' },
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
        ],
      }
      const layer = createZoningLayer({ data: preservationFeature })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should return gray for unknown zone code', () => {
      const unknownFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'UNKNOWN' },
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
        ],
      }
      const layer = createZoningLayer({ data: unknownFeature })
      expect(layer.props.getFillColor).toBeDefined()
    })

    it('should use hex color from properties when available', () => {
      const featureWithColor: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { zone_code: 'ZR1', color: '#FF0000' },
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
        ],
      }
      const layer = createZoningLayer({ data: featureWithColor })
      expect(layer.props.getFillColor).toBeDefined()
    })
  })

  describe('accessor functions', () => {
    const testFeature = mockFeatures.features[0] as Feature<Polygon, ZoningFeatureProperties>

    describe('getFillColor accessor', () => {
      it('should use custom getFillColor when provided', () => {
        const customColor: [number, number, number, number] = [255, 0, 0, 255]
        const customGetFillColor = vi.fn().mockReturnValue(customColor)
        const layer = createZoningLayer({ data: mockFeatures, getFillColor: customGetFillColor })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(testFeature)
        expect(customGetFillColor).toHaveBeenCalledWith(testFeature)
        expect(result).toEqual(customColor)
      })

      it('should use hex color from feature properties', () => {
        const layer = createZoningLayer({ data: mockFeatures, opacity: 0.7 })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        // testFeature has color: '#22C55E'
        const result = getFillColor(testFeature)
        expect(result[0]).toBe(34) // 0x22
        expect(result[1]).toBe(197) // 0xC5
        expect(result[2]).toBe(94) // 0x5E
      })

      it('should use default zone color when no hex color', () => {
        const featureWithoutColor: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'ZR1',
            zone_name: 'Test Zone',
            max_height: 10,
            max_floors: 3,
            max_far: 1.0,
            max_coverage: 0.5,
            min_setback: 5,
            allowed_uses: [],
          },
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(featureWithoutColor)
        // Should return residential green [34, 197, 94, 180]
        expect(result).toEqual([34, 197, 94, 180])
      })

      it('should return commercial blue for ZC zone', () => {
        const commercialFeature: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'ZC1',
            zone_name: 'Commercial',
            max_height: 50,
            max_floors: 15,
            max_far: 2,
            max_coverage: 0.7,
            min_setback: 3,
            allowed_uses: [],
          },
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(commercialFeature)
        expect(result).toEqual([59, 130, 246, 180])
      })

      it('should return purple for mixed zone (ZM)', () => {
        const mixedFeature: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'ZM1',
            zone_name: 'Mixed',
            max_height: 30,
            max_floors: 10,
            max_far: 1.5,
            max_coverage: 0.6,
            min_setback: 4,
            allowed_uses: [],
          },
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(mixedFeature)
        expect(result).toEqual([139, 92, 246, 180])
      })

      it('should return orange for industrial zone (ZI)', () => {
        const industrialFeature: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'ZI1',
            zone_name: 'Industrial',
            max_height: 20,
            max_floors: 5,
            max_far: 1.0,
            max_coverage: 0.8,
            min_setback: 10,
            allowed_uses: [],
          },
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(industrialFeature)
        expect(result).toEqual([245, 158, 11, 180])
      })

      it('should return red for special zone (ZE)', () => {
        const specialFeature: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'ZE1',
            zone_name: 'Special',
            max_height: 0,
            max_floors: 0,
            max_far: 0,
            max_coverage: 0,
            min_setback: 0,
            allowed_uses: [],
          },
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(specialFeature)
        expect(result).toEqual([239, 68, 68, 180])
      })

      it('should return dark green for preservation zone (ZP)', () => {
        const preservationFeature: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'ZP1',
            zone_name: 'Preservation',
            max_height: 0,
            max_floors: 0,
            max_far: 0,
            max_coverage: 0,
            min_setback: 0,
            allowed_uses: [],
          },
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(preservationFeature)
        expect(result).toEqual([16, 185, 129, 180])
      })

      it('should return gray for unknown zone code', () => {
        const unknownFeature: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'UNKNOWN',
            zone_name: 'Unknown',
            max_height: 0,
            max_floors: 0,
            max_far: 0,
            max_coverage: 0,
            min_setback: 0,
            allowed_uses: [],
          },
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getFillColor(unknownFeature)
        expect(result).toEqual([128, 128, 128, 180])
      })

      it('should handle alternative zone prefixes (R, C, M, etc)', () => {
        const layer = createZoningLayer({ data: mockFeatures })
        const getFillColor = layer.props.getFillColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const makeFeature = (zoneCode: string): Feature<Polygon, ZoningFeatureProperties> => ({
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: zoneCode,
            zone_name: 'Test',
            max_height: 0,
            max_floors: 0,
            max_far: 0,
            max_coverage: 0,
            min_setback: 0,
            allowed_uses: [],
          },
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
        })

        expect(getFillColor(makeFeature('R1'))).toEqual([34, 197, 94, 180]) // Residential
        expect(getFillColor(makeFeature('C1'))).toEqual([59, 130, 246, 180]) // Commercial
        expect(getFillColor(makeFeature('M1'))).toEqual([139, 92, 246, 180]) // Mixed
        expect(getFillColor(makeFeature('I1'))).toEqual([245, 158, 11, 180]) // Industrial
        expect(getFillColor(makeFeature('E1'))).toEqual([239, 68, 68, 180]) // Special
        expect(getFillColor(makeFeature('P1'))).toEqual([16, 185, 129, 180]) // Preservation
      })
    })

    describe('getLineColor accessor', () => {
      it('should use custom getLineColor when provided', () => {
        const customColor: [number, number, number, number] = [0, 0, 0, 255]
        const customGetLineColor = vi.fn().mockReturnValue(customColor)
        const layer = createZoningLayer({ data: mockFeatures, getLineColor: customGetLineColor })
        const getLineColor = layer.props.getLineColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getLineColor(testFeature)
        expect(customGetLineColor).toHaveBeenCalledWith(testFeature)
        expect(result).toEqual(customColor)
      })

      it('should return white as default line color', () => {
        const layer = createZoningLayer({ data: mockFeatures })
        const getLineColor = layer.props.getLineColor as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => [number, number, number, number]

        const result = getLineColor(testFeature)
        expect(result).toEqual([255, 255, 255, 200])
      })
    })

    describe('getElevation accessor', () => {
      it('should use custom getHeight when provided', () => {
        const customGetHeight = vi.fn().mockReturnValue(100)
        const layer = createZoningLayer({
          data: mockFeatures,
          getHeight: customGetHeight,
          elevationScale: 2,
        })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => number

        const result = getElevation(testFeature)
        expect(customGetHeight).toHaveBeenCalledWith(testFeature)
        expect(result).toBe(200) // 100 * 2
      })

      it('should use max_height from properties as default', () => {
        const layer = createZoningLayer({ data: mockFeatures, elevationScale: 1 })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => number

        const result = getElevation(testFeature) // max_height: 15
        expect(result).toBe(15)
      })

      it('should apply elevation scale', () => {
        const layer = createZoningLayer({ data: mockFeatures, elevationScale: 3 })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => number

        const result = getElevation(testFeature) // max_height: 15
        expect(result).toBe(45) // 15 * 3
      })

      it('should return 0 when max_height is not defined', () => {
        const featureWithoutHeight: Feature<Polygon, ZoningFeatureProperties> = {
          type: 'Feature',
          properties: {
            id: 'test',
            zone_code: 'ZR1',
            zone_name: 'Test',
            max_floors: 0,
            max_far: 0,
            max_coverage: 0,
            min_setback: 0,
            allowed_uses: [],
          } as ZoningFeatureProperties,
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
        const layer = createZoningLayer({ data: mockFeatures })
        const getElevation = layer.props.getElevation as (
          feature: Feature<Polygon, ZoningFeatureProperties>
        ) => number

        const result = getElevation(featureWithoutHeight)
        expect(result).toBe(0)
      })
    })
  })
})
