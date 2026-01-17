## [1.0.0](https://github.com/raphaeltorquat0/map-3d-deck/compare/v0.1.0...v1.0.0) (2026-01-17)


### ⚠ BREAKING CHANGES

* telemetry requires POSTHOG_API_KEY env var to be set

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### Features

* add infrastructure layer, popup, legend, formatters and presets ([7e58049](https://github.com/raphaeltorquat0/map-3d-deck/commit/7e580496111d7b38a47e37bbc1d8a33a05af47da))


### Bug Fixes

* **ci:** disable body-max-line-length for semantic-release compatibility ([83d1685](https://github.com/raphaeltorquat0/map-3d-deck/commit/83d168536ea1752aa19d118566a7d03e47646de7))
* **ci:** use gh_token for semantic-release to bypass branch protection ([5485066](https://github.com/raphaeltorquat0/map-3d-deck/commit/54850669888eb140a082b9d435f62156daf4bc0c))
* use environment variable for posthog api key ([1ea2809](https://github.com/raphaeltorquat0/map-3d-deck/commit/1ea280917c056128921260fbec2b234a8a56f6ad))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_No unreleased changes._

---

## [0.2.0] - 2025-01-17

### Added

#### InfrastructureLayer

- New `createInfrastructureLayer` factory for unified infrastructure network
  visualization (water, gas, sewage, electric, telecom, drainage, metro)
- New `createInfrastructurePointLayer` for access points (valves, manholes)
- `INFRASTRUCTURE_NETWORK_COLORS` and `INFRASTRUCTURE_NETWORK_LABELS` constants
- Helper functions: `groupInfrastructureByNetwork`, `filterInfrastructureByElevation`,
  `getInfrastructureStats`
- Support for style presets via `preset` option

#### PopupController

- New `PopupController` class integrated into `Map3D`
- Framework-agnostic popup/tooltip system
- Hover tooltips with configurable delay
- Click popups with programmatic control
- Reverse geocoding support via Nominatim
- Custom content formatting via `formatContent` callback
- Event callbacks: `onOpen`, `onClose`
- Programmatic API: `open()`, `close()`, `isOpen()`, `getInfo()`

#### LegendController

- New `LegendController` class integrated into `Map3D`
- Auto-updating legend based on registered layers
- Configurable position: `top-left`, `top-right`, `bottom-left`, `bottom-right`
- Feature count display per layer
- Visibility toggle support
- Event callbacks: `onChange`, `onToggle`
- Programmatic API: `registerLayer()`, `unregisterLayer()`, `toggleLayer()`,
  `showAll()`, `hideAll()`, `getItems()`

#### Field Formatters

- New `createFieldFormatters` for declarative field configuration
- New `formatFeatureProperties` for batch formatting
- Pre-built formatters: `formatDepth`, `formatDiameter`, `formatArea`,
  `formatHeight`, `formatYear`, `formatValue`
- Pre-configured formatter sets: `SUBSURFACE_FORMATTERS`, `BUILDING_FORMATTERS`,
  `ZONING_FORMATTERS`
- Status label maps: `STATUS_LABELS`, `NETWORK_TYPE_LABELS`, `BUILDING_USE_LABELS`,
  `RISK_LEVEL_LABELS`
- Utility functions: `keyToLabel`, `formattedFieldsToObject`, `createStatusFormatter`

#### Style Presets

- New preset system for consistent layer styling
- Available presets: `utility-line`, `utility-point`, `risk-area`, `building-3d`,
  `building-flat`, `zoning-3d`, `zoning-flat`
- `LAYER_PRESETS` map with all preset configurations
- Helper functions: `getPreset`, `getLinePreset`, `getPointPreset`,
  `getPolygonPreset`, `listPresets`, `listPresetsByType`, `mergePresetWithOptions`
- `DEFAULT_3D_MATERIAL` for consistent 3D rendering

#### Map3D Enhancements

- New `popup` configuration option in `Map3DConfig`
- New `legend` configuration option in `Map3DConfig`
- `map.popup` property for PopupController access
- `map.legend` property for LegendController access
- Automatic popup handling on click/hover events

### Changed

- Updated `VERSION` constant to `0.2.0`
- Extended `Map3DConfig` interface with popup and legend options
- Enhanced architecture to support integrated controllers

### Documentation

- Updated README with comprehensive v0.2.0 documentation
- Added complete usage example demonstrating all new features
- Documented PopupController, LegendController, Formatters, and Presets APIs
- Updated architecture diagram to reflect new modules
- Added new sections: "Integrated Controllers", "Field Formatters", "Style Presets"

### Tests

- Added 161 new tests across 5 new test files
- `tests/utils/formatters.test.ts` - 41 tests for formatter utilities
- `tests/layers/InfrastructureLayer.test.ts` - 24 tests for infrastructure layers
- `tests/styles/presets.test.ts` - 27 tests for style presets
- `tests/controls/PopupController.test.ts` - 35 tests for popup controller
- `tests/controls/LegendController.test.ts` - 34 tests for legend controller
- Total test count: 270 tests (109 existing + 161 new)

---

## [0.1.0] - 2025-01-10

### Added

- Initial release of @raphaeltorquat0/map-3d-deck
- Core `Map3D` class wrapping Deck.gl + MapLibre
- Layer factories: `createZoningLayer`, `createBuildingLayer`,
  `createSubsurfaceLayer`
- `ElevationController` for managing vertical level visibility
- Utility functions for colors and geometry
- TypeScript types for all features
- Comprehensive test suite with 80%+ coverage
- GitHub Actions CI/CD pipeline
- Semantic Release for automated versioning
- TypeDoc API documentation
- Enterprise-grade configuration (ESLint, Prettier, Husky, Commitlint)

### Security

- npm audit integration in CI
- Dependabot configuration for automated dependency updates
- Security policy for vulnerability reporting

---

_This changelog is automatically updated by semantic-release._
