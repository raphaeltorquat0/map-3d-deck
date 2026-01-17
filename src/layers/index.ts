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

// Infrastructure Layer
export {
  createInfrastructureLayer,
  createInfrastructurePointLayer,
  groupInfrastructureByNetwork,
  filterInfrastructureByElevation,
  getInfrastructureStats,
  INFRASTRUCTURE_NETWORK_COLORS,
  INFRASTRUCTURE_NETWORK_LABELS,
  type InfrastructureLayerOptions,
  type InfrastructureFeatureProperties,
  type InfrastructureNetworkType,
  type InfrastructurePreset,
} from './InfrastructureLayer'
