<p align="center">
  <img src="https://raw.githubusercontent.com/raphaeltorquat0/map-3d-deck/main/docs/assets/logo.svg" alt="map-3d-deck" width="120" />
</p>

<h1 align="center">@raphaeltorquat0/map-3d-deck</h1>

<p align="center">
  <strong>Enterprise-grade 3D multi-level map visualization framework</strong>
</p>

<p align="center">
  <a href="https://github.com/raphaeltorquat0/map-3d-deck/actions/workflows/ci.yml">
    <img src="https://github.com/raphaeltorquat0/map-3d-deck/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://codecov.io/gh/raphaeltorquat0/map-3d-deck">
    <img src="https://codecov.io/gh/raphaeltorquat0/map-3d-deck/branch/main/graph/badge.svg" alt="Coverage" />
  </a>
  <a href="https://www.npmjs.com/package/@raphaeltorquat0/map-3d-deck">
    <img src="https://img.shields.io/npm/v/@raphaeltorquat0/map-3d-deck.svg" alt="npm version" />
  </a>
  <a href="https://bundlephobia.com/package/@raphaeltorquat0/map-3d-deck">
    <img src="https://img.shields.io/bundlephobia/minzip/@raphaeltorquat0/map-3d-deck" alt="Bundle Size" />
  </a>
  <a href="https://github.com/raphaeltorquat0/map-3d-deck/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@raphaeltorquat0/map-3d-deck.svg" alt="License" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.4-blue.svg" alt="TypeScript" />
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Docs</a> •
  <a href="#examples">Examples</a> •
  <a href="#contributing">Contributing</a>
</p>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/raphaeltorquat0/map-3d-deck/main/docs/assets/demo-santos.gif" alt="3D Urban Visualization Demo" width="800" />
</p>

<p align="center">
  <em>Demo: 3D urban visualization with zoning, buildings, and underground infrastructure</em>
</p>

---

## Overview

**map-3d-deck** is a framework-agnostic library for building immersive 3D map
visualizations with multi-level support. It combines the power of
[Deck.gl](https://deck.gl) for high-performance WebGL rendering with
[MapLibre GL](https://maplibre.org) for beautiful base maps.

Built for **urban planning**, **smart city applications**, and **geospatial
analysis**, it enables visualization of data from underground infrastructure
(-50m) to skyscrapers (+200m) in a single, unified view.

> **Works anywhere in the world** — Just provide GeoJSON data following the
> documented schema. The library handles coordinates, projections, and rendering
> automatically for any geographic location.

### Why map-3d-deck?

| Challenge                                 | Solution                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Complex urban data at multiple elevations | **Unified elevation system** from -50m to +200m                        |
| Framework lock-in                         | **Framework-agnostic** — works with React, Vue, Angular, or Vanilla JS |
| Performance with large datasets           | **WebGL-powered** rendering via Deck.gl handles 100k+ features         |
| Learning curve                            | **Simple API** — get started in 3 lines of code                        |

---

## Features

### Core Capabilities

- **Multi-Level Visualization** — Seamlessly navigate from underground utilities
  to surface zoning to aerial building views
- **Framework Agnostic** — First-class support for React, Vue, Angular, Svelte,
  and Vanilla JavaScript
- **High Performance** — WebGL-accelerated rendering handles 100,000+ features
  at 60fps
- **Type-Safe** — Full TypeScript support with comprehensive type definitions
- **Customizable** — Extensive styling options and callback hooks for complete
  control

### Layer Types

| Layer             | Description                             | Use Case                                 |
| ----------------- | --------------------------------------- | ---------------------------------------- |
| `ZoningLayer`     | Urban zoning polygons with 3D extrusion | Land use visualization, urban planning   |
| `BuildingLayer`   | 3D building footprints with height data | Skyline analysis, shadow studies         |
| `SubsurfaceLayer` | Underground network lines               | Utility mapping, infrastructure planning |

### Elevation Presets

| Preset       | Range       | Content                             |
| ------------ | ----------- | ----------------------------------- |
| `subsurface` | -50m → 0m   | Metro lines, utilities, foundations |
| `surface`    | -5m → 5m    | Zoning, lots, geotechnical data     |
| `buildings`  | 0m → 200m   | Building heights, aerial structures |
| `all`        | -50m → 200m | Complete vertical profile           |

---

## Demo

### Live Demo

**[View Live Demo →](https://raphaeltorquat0.github.io/map-3d-deck/)**

### Screenshots

<table>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/raphaeltorquat0/map-3d-deck/main/docs/assets/screenshot-zoning.png" width="400" alt="Zoning View" />
      <br />
      <em>Urban Zoning</em>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/raphaeltorquat0/map-3d-deck/main/docs/assets/screenshot-buildings.png" width="400" alt="3D Buildings" />
      <br />
      <em>3D Buildings</em>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/raphaeltorquat0/map-3d-deck/main/docs/assets/screenshot-infrastructure.png" width="400" alt="Underground Infrastructure" />
      <br />
      <em>Underground Infrastructure</em>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/raphaeltorquat0/map-3d-deck/main/docs/assets/screenshot-combined.png" width="400" alt="Combined View" />
      <br />
      <em>Combined Multi-Level View</em>
    </td>
  </tr>
</table>

---

## Quick Start

### Installation

```bash
npm install @raphaeltorquat0/map-3d-deck maplibre-gl
```

### Basic Usage

```typescript
import { Map3D, createZoningLayer } from '@raphaeltorquat0/map-3d-deck'
import 'maplibre-gl/dist/maplibre-gl.css'

// Create the map
const map = new Map3D({
  container: 'map',
  initialViewState: {
    longitude: -46.3289,
    latitude: -23.9608,
    zoom: 14,
    pitch: 45,
  },
})

// Add a zoning layer with 3D extrusion
const zoningLayer = createZoningLayer({
  id: 'zoning',
  data: '/data/zoning.geojson',
  extruded: true,
  pickable: true,
})

map.addLayer(zoningLayer)
```

**That's it!** You now have an interactive 3D map with extruded zoning polygons.

---

## Documentation

### API Reference

#### Map3D

The main class for creating and managing 3D maps.

```typescript
const map = new Map3D({
  // Required
  container: string | HTMLElement,

  // View State
  initialViewState: {
    longitude: number,
    latitude: number,
    zoom: number,        // default: 12
    pitch: number,       // default: 0 (2D), 45+ for 3D
    bearing: number,     // default: 0
  },

  // Styling
  mapStyle?: string,     // MapLibre style URL

  // Events
  onClick?: (info: PickInfo) => void,
  onHover?: (info: PickInfo) => void,
  onViewStateChange?: (viewState: MapViewState) => void,
  onLoad?: () => void,
  onError?: (error: Error) => void,
})
```

**Methods:**

| Method                     | Description                    |
| -------------------------- | ------------------------------ |
| `addLayer(layer)`          | Add a layer to the map         |
| `removeLayer(id)`          | Remove a layer by ID           |
| `setLayers(layers)`        | Replace all layers             |
| `setElevationRange(range)` | Filter visible elevation range |
| `flyTo(options)`           | Animate to a location          |
| `toggle3D(enabled)`        | Switch between 2D/3D view      |
| `destroy()`                | Clean up resources             |

#### Layer Factories

```typescript
// Zoning polygons with optional 3D extrusion
createZoningLayer({
  id: string,
  data: FeatureCollection | string,
  extruded?: boolean,      // default: false
  opacity?: number,        // default: 0.7
  elevationScale?: number, // default: 1
  getFillColor?: (f) => [r, g, b, a],
  getHeight?: (f) => number,
})

// 3D building footprints
createBuildingLayer({
  id: string,
  data: FeatureCollection | string,
  extruded?: boolean,      // default: true
  wireframe?: boolean,     // default: false
})

// Underground utility networks
createSubsurfaceLayer({
  id: string,
  data: FeatureCollection | string,
  networkTypes?: string[], // filter: ['water', 'sewage', ...]
  widthMinPixels?: number, // default: 2
})
```

#### ElevationController

Manage visible elevation ranges programmatically.

```typescript
import { ElevationController } from '@raphaeltorquat0/map-3d-deck'

const controller = new ElevationController({
  onChange: (range) => map.setElevationRange(range),
})

// Apply presets
controller.applyPreset('subsurface') // -50m to 0m
controller.applyPreset('surface') // -5m to 5m
controller.applyPreset('buildings') // 0m to 200m
controller.applyPreset('all') // -50m to 200m

// Custom range
controller.setRange({ min: -20, max: 50 })

// Query
controller.isVisible(25) // true
controller.getVisibleLevels() // ElevationLevel[]
controller.getCurrentPreset() // 'surface' | null
```

---

## Examples

### React

```tsx
import { useEffect, useRef } from 'react'
import { Map3D, createZoningLayer } from '@raphaeltorquat0/map-3d-deck'

export function MapComponent({ data }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map3D | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    mapRef.current = new Map3D({
      container: containerRef.current,
      initialViewState: {
        longitude: -46.63,
        latitude: -23.55,
        zoom: 12,
        pitch: 45,
      },
    })

    return () => mapRef.current?.destroy()
  }, [])

  useEffect(() => {
    if (!mapRef.current || !data) return

    mapRef.current.setLayers([
      createZoningLayer({ id: 'zoning', data, extruded: true }),
    ])
  }, [data])

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
```

### Vue 3

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Map3D, createZoningLayer } from '@raphaeltorquat0/map-3d-deck'

const props = defineProps<{ data: FeatureCollection }>()
const container = ref<HTMLDivElement>()
let map: Map3D | null = null

onMounted(() => {
  if (!container.value) return

  map = new Map3D({
    container: container.value,
    initialViewState: {
      longitude: -46.63,
      latitude: -23.55,
      zoom: 12,
      pitch: 45,
    },
  })
})

onUnmounted(() => map?.destroy())

watch(
  () => props.data,
  (data) => {
    map?.setLayers([createZoningLayer({ id: 'zoning', data, extruded: true })])
  }
)
</script>

<template>
  <div ref="container" class="w-full h-screen" />
</template>
```

### Next.js (App Router)

```tsx
'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./Map'), { ssr: false })

export default function Page() {
  return <Map />
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         map-3d-deck                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Map3D     │  │  Layers     │  │  ElevationController    │ │
│  │   (Core)    │  │  (Factory)  │  │  (State Management)     │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
│         │                │                      │              │
│         └────────────────┼──────────────────────┘              │
│                          │                                     │
│  ┌───────────────────────┴───────────────────────────────────┐ │
│  │                    Deck.gl + MapLibre                     │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  WebGL Rendering | GPU Acceleration | Interleaving  │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Elevation Levels:
  +200m ┤ ████████ High Elevation (Skyscrapers)
   +50m ┤ ████████ Medium Elevation
   +15m ┤ ████████ Low Elevation (Buildings)
     0m ┤ ████████ Surface (Zoning, Lots)
   -20m ┤ ████████ Shallow Subsurface (Utilities)
   -50m ┤ ████████ Deep Subsurface (Metro, Foundations)
```

---

## Performance

### Rendering Performance

Benchmarked on MacBook Pro M1 (2021):

| Features | FPS | Memory |
| -------- | --- | ------ |
| 10,000   | 60  | 45 MB  |
| 50,000   | 60  | 120 MB |
| 100,000  | 55  | 250 MB |
| 250,000  | 35  | 480 MB |

### Layer Creation Benchmarks

Run with `npm run benchmark`:

| Operation                         | Features | ops/sec   | Mean (ms) |
| --------------------------------- | -------- | --------- | --------- |
| **Zoning Layer Creation**         | 1,000    | 749,458   | 0.0013    |
| **Zoning Layer Creation**         | 10,000   | 752,929   | 0.0013    |
| **Building Layer Creation**       | 1,000    | 2,008,615 | 0.0005    |
| **Building Layer Creation**       | 10,000   | 1,999,642 | 0.0005    |
| **Subsurface Layer Creation**     | 1,000    | 1,958,089 | 0.0005    |
| **Subsurface Layer Creation**     | 10,000   | 1,954,733 | 0.0005    |
| **Elevation Filtering**           | 10,000   | 2,850     | 0.35      |
| **Group by Network**              | 10,000   | 3,544     | 0.28      |
| **ElevationController setRange**  | -        | 5,284,545 | 0.0002    |
| **isFeatureVisible (10k checks)** | -        | 220,372   | 0.0045    |

**Key Takeaways:**

- Layer creation is O(1) relative to data size (Deck.gl handles data internally)
- Filtering 10,000 features takes ~0.35ms
- ElevationController operations are extremely fast (<1 microsecond)

### Optimization Tips

- Use `elevationRange` to filter non-visible features
- Simplify geometries at lower zoom levels
- Use `minZoom`/`maxZoom` on layers for LOD

---

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 90+     |
| Firefox | 88+     |
| Safari  | 14+     |
| Edge    | 90+     |

Requires WebGL 2.0 support.

---

## Telemetry

This library collects anonymous usage data to help improve the product. We
track:

- Library initialization and configuration
- Layer types used (not layer data)
- Errors and exceptions
- General usage patterns

**What we DON'T collect:**

- Geographic coordinates or locations
- User data or personally identifiable information
- Layer content or GeoJSON data
- IP addresses (PostHog anonymizes these)

### Opting Out

You can disable telemetry in several ways:

```typescript
// Option 1: Disable globally
import { disableTelemetry } from '@raphaeltorquat0/map-3d-deck'
disableTelemetry()

// Option 2: Via localStorage (persists across sessions)
localStorage.setItem('map3d_telemetry_optout', 'true')

// Option 3: Browser Do Not Track
// Telemetry respects navigator.doNotTrack
```

### Optional Dependency

Telemetry requires `posthog-js`. If not installed, telemetry is automatically
disabled with no impact on library functionality.

```bash
# To enable telemetry, install posthog-js
npm install posthog-js
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md)
for details.

```bash
# Clone the repository
git clone https://github.com/raphaeltorquat0/map-3d-deck.git
cd map-3d-deck

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Build
npm run build
```

---

## License

MIT © [Raphael Torquato](https://github.com/raphaeltorquat0)

---

<p align="center">
  <sub>Built with Deck.gl, MapLibre GL, and TypeScript</sub>
</p>

<p align="center">
  <a href="https://deck.gl">
    <img src="https://img.shields.io/badge/Deck.gl-9.0-blue?logo=webgl" alt="Deck.gl" />
  </a>
  <a href="https://maplibre.org">
    <img src="https://img.shields.io/badge/MapLibre-4.0-blue?logo=mapbox" alt="MapLibre" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript" alt="TypeScript" />
  </a>
</p>
