/**
 * Performance benchmarks for layer creation
 *
 * Run with: npm run benchmark
 */
import { bench, describe } from 'vitest'
import type { Feature, Polygon, LineString, Point } from 'geojson'
import { createZoningLayer, filterZoningByElevation } from '../src/layers/ZoningLayer'
import { createBuildingLayer, filterBuildingsByElevation } from '../src/layers/BuildingLayer'
import {
  createSubsurfaceLayer,
  createAccessPointLayer,
  filterSubsurfaceByElevation,
  groupSubsurfaceByNetwork,
} from '../src/layers/SubsurfaceLayer'
import { ElevationController } from '../src/controls/ElevationController'
import type {
  ZoningFeatureProperties,
  BuildingFeatureProperties,
  SubsurfaceFeatureProperties,
} from '../src/types/layers'

// Generate mock zoning features
function generateZoningFeatures(count: number): Feature<Polygon, ZoningFeatureProperties>[] {
  return Array.from({ length: count }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-46.33 + (i % 100) * 0.001, -23.96 + Math.floor(i / 100) * 0.001],
          [-46.329 + (i % 100) * 0.001, -23.96 + Math.floor(i / 100) * 0.001],
          [-46.329 + (i % 100) * 0.001, -23.959 + Math.floor(i / 100) * 0.001],
          [-46.33 + (i % 100) * 0.001, -23.959 + Math.floor(i / 100) * 0.001],
          [-46.33 + (i % 100) * 0.001, -23.96 + Math.floor(i / 100) * 0.001],
        ],
      ],
    },
    properties: {
      id: `zone-${i}`,
      zone_code: `ZM-${i % 10}`,
      zone_name: `Zone ${i}`,
      max_height: 10 + (i % 20) * 5,
      max_floors: 3 + (i % 7),
      max_far: 1 + (i % 5) * 0.5,
      max_coverage: 0.5 + (i % 3) * 0.1,
      min_setback: 3,
      allowed_uses: ['residential', 'commercial'],
      color: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`,
    },
  }))
}

// Generate mock building features
function generateBuildingFeatures(count: number): Feature<Polygon, BuildingFeatureProperties>[] {
  return Array.from({ length: count }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-46.33 + (i % 100) * 0.0005, -23.96 + Math.floor(i / 100) * 0.0005],
          [-46.3298 + (i % 100) * 0.0005, -23.96 + Math.floor(i / 100) * 0.0005],
          [-46.3298 + (i % 100) * 0.0005, -23.9598 + Math.floor(i / 100) * 0.0005],
          [-46.33 + (i % 100) * 0.0005, -23.9598 + Math.floor(i / 100) * 0.0005],
          [-46.33 + (i % 100) * 0.0005, -23.96 + Math.floor(i / 100) * 0.0005],
        ],
      ],
    },
    properties: {
      id: `building-${i}`,
      name: `Building ${i}`,
      height: 10 + (i % 50) * 3,
      floors: 3 + (i % 15),
      year_built: 1990 + (i % 35),
      use_type: (['residential', 'commercial', 'mixed', 'industrial', 'institutional'] as const)[
        i % 5
      ],
      zone_code: `ZM-${i % 10}`,
      area_m2: 100 + (i % 10) * 50,
      elevation_base: 0,
      elevation_top: 10 + (i % 50) * 3,
    },
  }))
}

// Generate mock subsurface features
function generateSubsurfaceFeatures(
  count: number
): Feature<LineString, SubsurfaceFeatureProperties>[] {
  const networkTypes = [
    'water',
    'sewage',
    'gas',
    'electric',
    'telecom',
    'drainage',
    'metro',
  ] as const
  return Array.from({ length: count }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-46.33 + (i % 50) * 0.002, -23.96 + Math.floor(i / 50) * 0.002],
        [-46.328 + (i % 50) * 0.002, -23.958 + Math.floor(i / 50) * 0.002],
      ],
    },
    properties: {
      id: `pipe-${i}`,
      network_type: networkTypes[i % 7],
      depth: -(2 + (i % 20)),
      diameter: 100 + (i % 5) * 50,
      material: 'PVC',
      status: 'active',
    },
  }))
}

// Generate mock access point features
function generateAccessPoints(count: number): Feature<Point, SubsurfaceFeatureProperties>[] {
  const networkTypes = [
    'water',
    'sewage',
    'gas',
    'electric',
    'telecom',
    'drainage',
    'metro',
  ] as const
  return Array.from({ length: count }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-46.33 + (i % 50) * 0.002, -23.96 + Math.floor(i / 50) * 0.002],
    },
    properties: {
      id: `access-${i}`,
      network_type: networkTypes[i % 7],
      depth: -(2 + (i % 20)),
      diameter: 500,
      status: 'active',
    },
  }))
}

// Pre-generate datasets
const zoning100 = generateZoningFeatures(100)
const zoning1000 = generateZoningFeatures(1000)
const zoning10000 = generateZoningFeatures(10000)

const buildings100 = generateBuildingFeatures(100)
const buildings1000 = generateBuildingFeatures(1000)
const buildings10000 = generateBuildingFeatures(10000)

const subsurface100 = generateSubsurfaceFeatures(100)
const subsurface1000 = generateSubsurfaceFeatures(1000)
const subsurface10000 = generateSubsurfaceFeatures(10000)

const accessPoints100 = generateAccessPoints(100)
const accessPoints1000 = generateAccessPoints(1000)

describe('Zoning Layer Creation', () => {
  bench('100 features', () => {
    createZoningLayer({ data: zoning100 })
  })

  bench('1,000 features', () => {
    createZoningLayer({ data: zoning1000 })
  })

  bench('10,000 features', () => {
    createZoningLayer({ data: zoning10000 })
  })

  bench('with extrusion (1,000 features)', () => {
    createZoningLayer({ data: zoning1000, extruded: true })
  })
})

describe('Building Layer Creation', () => {
  bench('100 features', () => {
    createBuildingLayer({ data: buildings100 })
  })

  bench('1,000 features', () => {
    createBuildingLayer({ data: buildings1000 })
  })

  bench('10,000 features', () => {
    createBuildingLayer({ data: buildings10000 })
  })

  bench('with max height wireframe (1,000 features)', () => {
    createBuildingLayer({ data: buildings1000, showMaxHeight: true })
  })
})

describe('Subsurface Layer Creation', () => {
  bench('100 features', () => {
    createSubsurfaceLayer({ data: subsurface100 })
  })

  bench('1,000 features', () => {
    createSubsurfaceLayer({ data: subsurface1000 })
  })

  bench('10,000 features', () => {
    createSubsurfaceLayer({ data: subsurface10000 })
  })

  bench('filtered by network type', () => {
    createSubsurfaceLayer({ data: subsurface1000, networkTypes: ['water', 'sewage'] })
  })
})

describe('Access Point Layer Creation', () => {
  bench('100 features', () => {
    createAccessPointLayer({ data: accessPoints100 })
  })

  bench('1,000 features', () => {
    createAccessPointLayer({ data: accessPoints1000 })
  })
})

describe('Elevation Filtering', () => {
  const range = { min: 0, max: 50 }

  bench('filter zoning (10,000 features)', () => {
    filterZoningByElevation(zoning10000, range)
  })

  bench('filter buildings (10,000 features)', () => {
    filterBuildingsByElevation(buildings10000, range)
  })

  bench('filter subsurface (10,000 features)', () => {
    filterSubsurfaceByElevation(subsurface10000, { min: -20, max: 0 })
  })
})

describe('Data Grouping', () => {
  bench('group subsurface by network (10,000 features)', () => {
    groupSubsurfaceByNetwork(subsurface10000)
  })
})

describe('ElevationController Operations', () => {
  bench('create controller', () => {
    new ElevationController()
  })

  bench('setRange', () => {
    const controller = new ElevationController()
    controller.setRange({ min: -20, max: 100 })
  })

  bench('applyPreset', () => {
    const controller = new ElevationController()
    controller.applyPreset('subsurface')
    controller.applyPreset('buildings')
    controller.applyPreset('all')
  })

  bench('getVisibleLevels', () => {
    const controller = new ElevationController()
    controller.getVisibleLevels()
  })

  bench('isFeatureVisible (10,000 checks)', () => {
    const controller = new ElevationController({ initialRange: { min: 0, max: 50 } })
    for (let i = 0; i < 10000; i++) {
      controller.isFeatureVisible(-10 + (i % 60), (i % 100) + 10)
    }
  })
})
