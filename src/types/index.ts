// Elevation types
export {
  type ElevationType,
  type ElevationLevel,
  type ElevationRange,
  type ElevationPreset,
  ELEVATION_LEVELS,
  ELEVATION_PRESETS,
  ELEVATION_BOUNDS,
  getElevationLevel,
  getElevationColor,
  isInElevationRange,
} from './elevation'

// Layer types
export {
  type LayerType,
  type SubsurfaceNetworkType,
  type LayerConfig,
  type ZoningFeatureProperties,
  type BuildingFeatureProperties,
  type SubsurfaceFeatureProperties,
  type LotFeatureProperties,
  type RiskFeatureProperties,
  type GeoFeatureProperties,
  type TypedFeature,
  type MapFeatureCollection,
  SUBSURFACE_NETWORK_COLORS,
  SUBSURFACE_NETWORK_LABELS,
  BUILDING_USE_COLORS,
  RISK_LEVEL_COLORS,
} from './layers'

// Map types
export {
  type MapViewState,
  type MapConfig,
  type ControllerConfig,
  type PickInfo,
  type MapEvents,
  MAP_STYLES,
  DEFAULT_VIEW_STATE,
  BRAZIL_BOUNDS,
} from './map'

// Formatter types
export {
  type FieldConfig,
  type FieldFormatters,
  type FormattedField,
  type FormatOptions,
  type PredefinedFormatter,
  STATUS_LABELS,
  NETWORK_TYPE_LABELS,
  BUILDING_USE_LABELS,
  RISK_LEVEL_LABELS,
} from './formatters'

// Preset types
export {
  type LayerPresetId,
  type Material3DConfig,
  type LinePresetConfig,
  type PointPresetConfig,
  type PolygonPresetConfig,
  type LayerPreset,
  type LayerPresetsMap,
} from './presets'

// Popup types
export {
  type PopupPosition,
  type PopupInfo,
  type PopupConfig,
  type PopupState,
  type PopupOpenCallback,
  type PopupCloseCallback,
  type OpenPopupOptions,
  type ReverseGeocodeResult,
} from './popup'

// Legend types
export {
  type LegendPosition,
  type LegendItem,
  type LegendConfig,
  type LegendChangeCallback,
  type LegendToggleCallback,
  type LegendState,
  type LayerLegendInfo,
} from './legend'
