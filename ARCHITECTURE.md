# Architecture

This document describes the internal architecture of
`@raphaeltorquat0/map-3d-deck`.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │    React    │  │    Vue      │  │   Angular   │  │  Vanilla JS │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          └─────────────────┴─────────────────┴───────────────┘              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────────────────┐
│                         map-3d-deck Library                                  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                            Public API                                │   │
│   │  ┌─────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │   │
│   │  │  Map3D  │  │  Layer Factories │  │  ElevationController      │  │   │
│   │  └────┬────┘  └────────┬─────────┘  └─────────────┬─────────────┘  │   │
│   └───────┼────────────────┼──────────────────────────┼─────────────────┘   │
│           │                │                          │                      │
│   ┌───────┴────────────────┴──────────────────────────┴─────────────────┐   │
│   │                         Internal Modules                             │   │
│   │                                                                      │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│   │  │    Types    │  │   Layers    │  │  Controls   │  │   Utils    │ │   │
│   │  │             │  │             │  │             │  │            │ │   │
│   │  │ • Elevation │  │ • Zoning    │  │ • Elevation │  │ • Colors   │ │   │
│   │  │ • Layers    │  │ • Building  │  │   Controller│  │ • Geometry │ │   │
│   │  │ • Map       │  │ • Subsurface│  │             │  │            │ │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────────────────┐
│                          External Dependencies                               │
│                                                                              │
│   ┌───────────────────────────────┐  ┌───────────────────────────────────┐  │
│   │          Deck.gl              │  │           MapLibre GL             │  │
│   │                               │  │                                   │  │
│   │  • WebGL Layer Rendering      │  │  • Base Map Tiles                 │  │
│   │  • GPU Acceleration           │  │  • Map Controls                   │  │
│   │  • Picking / Interaction      │  │  • Projection                     │  │
│   │  • MapboxOverlay Integration  │  │  • Style Specification            │  │
│   └───────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Structure

```
src/
├── index.ts                 # Public entry point - exports all public APIs
│
├── core/
│   ├── index.ts
│   └── Map3D.ts             # Main map class
│
├── layers/
│   ├── index.ts
│   ├── ZoningLayer.ts       # GeoJsonLayer for zoning polygons
│   ├── BuildingLayer.ts     # PolygonLayer for 3D buildings
│   └── SubsurfaceLayer.ts   # PathLayer for underground networks
│
├── controls/
│   ├── index.ts
│   └── ElevationController.ts  # Elevation range state management
│
├── types/
│   ├── index.ts
│   ├── elevation.ts         # Elevation types and constants
│   ├── layers.ts            # Layer configuration types
│   └── map.ts               # Map configuration types
│
└── utils/
    ├── index.ts
    ├── colors.ts            # Color conversion utilities
    └── geometry.ts          # Geometry calculation utilities
```

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GeoJSON    │────▶│    Layer     │────▶│   Deck.gl    │
│    Data      │     │   Factory    │     │    Layer     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   MapLibre   │◀────│  MapboxOver  │◀────│    Map3D     │
│   GL Map     │     │    lay       │     │    Class     │
└──────────────┘     └──────────────┘     └──────────────┘
        │                                        ▲
        │                                        │
        ▼                                        │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    WebGL     │────▶│   Browser    │────▶│    User      │
│   Context    │     │   Canvas     │     │ Interaction  │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Elevation System

The elevation system provides a unified way to visualize data at different
vertical levels.

```
                    Elevation Range

    +200m ─┬────────────────────────────────────┐
           │                                    │
           │     HIGH_ELEVATION                 │  Skyscrapers
           │     (50m - 200m)                   │  Towers
           │                                    │
    +50m  ─┼────────────────────────────────────┤
           │                                    │
           │     MEDIUM_ELEVATION               │  Mid-rise
           │     (15m - 50m)                    │  Buildings
           │                                    │
    +15m  ─┼────────────────────────────────────┤
           │                                    │
           │     LOW_ELEVATION                  │  Low-rise
           │     (0m - 15m)                     │  Buildings
           │                                    │
     0m   ═╪════════════════════════════════════╡  SURFACE
           │                                    │
           │     SHALLOW_SUBSURFACE             │  Utilities
           │     (-20m - 0m)                    │  (Water, Gas)
           │                                    │
    -20m  ─┼────────────────────────────────────┤
           │                                    │
           │     DEEP_SUBSURFACE                │  Metro
           │     (-50m - -20m)                  │  Foundations
           │                                    │
    -50m  ─┴────────────────────────────────────┘
```

### Presets

| Preset       | Min  | Max  | Use Case                   |
| ------------ | ---- | ---- | -------------------------- |
| `subsurface` | -50m | 0m   | Underground infrastructure |
| `surface`    | -5m  | 5m   | Ground-level features      |
| `buildings`  | 0m   | 200m | Above-ground structures    |
| `all`        | -50m | 200m | Complete vertical profile  |

## Layer Rendering Order

Layers are rendered in a specific order to ensure proper visual hierarchy:

```
                    Rendering Order (top to bottom)

    ┌─────────────────────────────────────────────────┐
    │                   UI Controls                    │  z-index: 1000
    │              (tooltips, popups)                  │
    └─────────────────────────────────────────────────┘
                            │
    ┌─────────────────────────────────────────────────┐
    │               Building Layer                     │  z-index: 3
    │         (extruded 3D buildings)                  │
    └─────────────────────────────────────────────────┘
                            │
    ┌─────────────────────────────────────────────────┐
    │                Zoning Layer                      │  z-index: 2
    │          (surface polygons)                      │
    └─────────────────────────────────────────────────┘
                            │
    ┌─────────────────────────────────────────────────┐
    │              Subsurface Layer                    │  z-index: 1
    │          (underground lines)                     │
    └─────────────────────────────────────────────────┘
                            │
    ┌─────────────────────────────────────────────────┐
    │               MapLibre Base                      │  z-index: 0
    │           (tiles, labels)                        │
    └─────────────────────────────────────────────────┘
```

## Performance Considerations

### GPU Acceleration

Deck.gl leverages WebGL for GPU-accelerated rendering:

```
┌─────────────────────────────────────────────────────────────┐
│                         CPU                                  │
│   ┌─────────────────┐                                       │
│   │  Data Transform │  • GeoJSON parsing                    │
│   │  (one-time)     │  • Coordinate projection              │
│   └────────┬────────┘  • Attribute computation              │
│            │                                                 │
└────────────┼─────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                         GPU                                  │
│   ┌─────────────────┐  ┌─────────────────┐                  │
│   │  Vertex Shader  │  │ Fragment Shader │                  │
│   │                 │  │                 │                  │
│   │ • Position      │  │ • Fill color    │                  │
│   │ • Elevation     │  │ • Lighting      │                  │
│   │ • Extrusion     │  │ • Transparency  │                  │
│   └────────┬────────┘  └────────┬────────┘                  │
│            └─────────┬──────────┘                           │
│                      ▼                                       │
│            ┌─────────────────┐                              │
│            │   Framebuffer   │  60 FPS rendering            │
│            └─────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### Optimization Strategies

1. **Viewport Culling**: Only render features visible in current viewport
2. **Level of Detail (LOD)**: Simplify geometries at lower zoom levels
3. **Binary Attributes**: Use typed arrays for large datasets
4. **Instanced Rendering**: Batch similar features together

## Type System

The library uses TypeScript for type safety:

```typescript
// Core types
interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

interface ElevationRange {
  min: number // -50 to 200
  max: number // -50 to 200
}

// Layer property types
interface ZoningFeatureProperties {
  id: string
  zone_code: string
  zone_name: string
  max_height: number
  max_floors: number
  max_far: number
  max_coverage: number
  min_setback: number
  allowed_uses: string[]
  color: string
}

interface SubsurfaceFeatureProperties {
  id: string
  network_type:
    | 'water'
    | 'sewage'
    | 'gas'
    | 'electric'
    | 'telecom'
    | 'drainage'
    | 'metro'
  depth: number
  diameter?: number
  status: 'active' | 'inactive' | 'maintenance'
}
```

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Pyramid                            │
│                                                              │
│                        ▲                                     │
│                       / \                                    │
│                      /   \      E2E Tests                    │
│                     /     \     (Playwright)                 │
│                    /───────\                                 │
│                   /         \   Integration Tests            │
│                  /           \  (Vitest + JSDOM)             │
│                 /─────────────\                              │
│                /               \ Unit Tests                  │
│               /                 \(Vitest)                    │
│              /───────────────────\                           │
│                                                              │
│   Coverage Target: 80%+                                      │
└─────────────────────────────────────────────────────────────┘
```

### Test Categories

| Type        | Location          | Framework | Coverage            |
| ----------- | ----------------- | --------- | ------------------- |
| Unit        | `tests/utils/`    | Vitest    | Colors, Geometry    |
| Unit        | `tests/types/`    | Vitest    | Elevation, Layers   |
| Unit        | `tests/controls/` | Vitest    | ElevationController |
| Integration | `tests/layers/`   | Vitest    | Layer factories     |

## Build Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │───▶│   tsup      │───▶│   Output    │───▶│   Publish   │
│   (src/)    │    │   (build)   │    │   (dist/)   │    │   (npm)     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │
      │                  │                  ├── index.js      (ESM)
      │                  │                  ├── index.cjs     (CJS)
      │                  │                  ├── index.d.ts    (Types)
      │                  │                  └── index.js.map  (Sourcemap)
      │                  │
      │                  ├── TypeScript compilation
      │                  ├── Tree shaking
      │                  ├── Minification
      │                  └── Declaration generation
      │
      └── 16 TypeScript files
```

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           GitHub Actions                                 │
│                                                                          │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │  Lint   │───▶│  Test   │───▶│  Build  │───▶│ Release │             │
│   │         │    │         │    │         │    │         │             │
│   │ ESLint  │    │ Vitest  │    │  tsup   │    │ semantic│             │
│   │Prettier │    │Coverage │    │         │    │-release │             │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│        │              │              │              │                    │
│        └──────────────┴──────────────┴──────────────┘                   │
│                              │                                           │
│                              ▼                                           │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                        Parallel Jobs                               │ │
│   │                                                                    │ │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │ │
│   │   │Security │  │  Docs   │  │  Pages  │  │  Size   │             │ │
│   │   │ Audit   │  │ TypeDoc │  │  Demo   │  │  Limit  │             │ │
│   │   └─────────┘  └─────────┘  └─────────┘  └─────────┘             │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **No Runtime Dependencies with Vulnerabilities**: Regular npm audit
2. **Input Validation**: GeoJSON data is validated before processing
3. **CSP Compliance**: No inline scripts or eval()
4. **Dependency Updates**: Dependabot configured for automatic PRs

---

_Last updated: January 2025_
