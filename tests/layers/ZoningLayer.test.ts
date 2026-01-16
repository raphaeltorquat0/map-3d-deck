import { describe, it, expect, vi } from 'vitest'
import type { Feature, Polygon, FeatureCollection } from 'geojson'
import {
  createZoningLayer,
  filterZoningByElevation,
} from '../../src/layers/ZoningLayer'
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

      expect(layer.props.getFillColor).toBe(getFillColor)
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
      // Only ZR1 (max_height: 15) should be included
      const filtered = filterZoningByElevation(features, { min: 0, max: 20 })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].properties.zone_code).toBe('ZR1')
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
})
