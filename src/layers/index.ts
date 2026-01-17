// Re-export deck.gl layer classes for consumers
export { GeoJsonLayer, PathLayer, ScatterplotLayer, PolygonLayer, IconLayer } from '@deck.gl/layers'

// Zoning Layer
export { createZoningLayer, filterZoningByElevation, type ZoningLayerOptions } from './ZoningLayer'

// Building Layer
export {
  createBuildingLayer,
  createMaxHeightLayer,
  filterBuildingsByElevation,
  groupBuildingsByHeight,
  type BuildingLayerOptions,
} from './BuildingLayer'

// Subsurface Layer
export {
  createSubsurfaceLayer,
  createAccessPointLayer,
  filterSubsurfaceByElevation,
  groupSubsurfaceByNetwork,
  groupSubsurfaceByDepth,
  type SubsurfaceLayerOptions,
  type AccessPointLayerOptions,
} from './SubsurfaceLayer'
