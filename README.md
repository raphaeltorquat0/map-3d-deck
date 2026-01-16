# @raphaeltorquat0/map-3d-deck

Framework agnóstico para mapas 3D multi-nível com Deck.gl + MapLibre.

## Características

- **Framework Agnóstico**: Funciona com React, Vue, Angular, Svelte ou Vanilla
  JS
- **Multi-Nível**: Visualização de subsolo até arranha-céus (-50m a +200m)
- **Deck.gl + MapLibre**: Arquitetura híbrida para alto desempenho
- **TypeScript**: Tipagem completa para melhor DX
- **Camadas Prontas**: Zoneamento, edifícios, infraestrutura subterrânea
- **Controle de Elevação**: Sistema completo de filtro por níveis

## Instalação

```bash
npm install @raphaeltorquat0/map-3d-deck
# ou
yarn add @raphaeltorquat0/map-3d-deck
# ou
pnpm add @raphaeltorquat0/map-3d-deck
```

## Uso Básico

```typescript
import {
  Map3D,
  createZoningLayer,
  ElevationController,
} from '@raphaeltorquat0/map-3d-deck'

// Criar o mapa
const map = new Map3D({
  container: 'map', // ID do elemento ou elemento DOM
  initialViewState: {
    longitude: -46.6333,
    latitude: -23.5505,
    zoom: 12,
    pitch: 45,
  },
  onClick: (info) => {
    if (info.object) {
      console.log('Feature clicada:', info.object.properties)
    }
  },
})

// Criar camada de zoneamento
const zoningLayer = createZoningLayer({
  id: 'zoning',
  data: zoningGeoJSON,
  extruded: true,
  pickable: true,
})

// Adicionar ao mapa
map.addLayer(zoningLayer)

// Controlar elevação
const elevation = new ElevationController({
  onChange: (range) => {
    console.log('Range:', range.min, 'a', range.max)
    // Atualizar camadas conforme necessário
  },
})

// Aplicar preset
elevation.applyPreset('surface') // Mostra apenas superfície (-5m a 5m)
```

## Camadas Disponíveis

### Zoneamento (ZoningLayer)

```typescript
import { createZoningLayer } from '@raphaeltorquat0/map-3d-deck'

const layer = createZoningLayer({
  id: 'zoning',
  data: zoningGeoJSON,
  extruded: true, // Extrusão 3D
  opacity: 0.7,
  pickable: true,
  // Customização
  getFillColor: (feature) => {
    // Retorna [R, G, B, A]
    return [100, 150, 200, 180]
  },
  getHeight: (feature) => {
    return feature.properties.max_height
  },
})
```

### Edifícios (BuildingLayer)

```typescript
import { createBuildingLayer } from '@raphaeltorquat0/map-3d-deck'

const layer = createBuildingLayer({
  id: 'buildings',
  data: buildingsGeoJSON,
  extruded: true,
  elevationScale: 1,
  pickable: true,
})
```

### Infraestrutura Subterrânea (SubsurfaceLayer)

```typescript
import { createSubsurfaceLayer } from '@raphaeltorquat0/map-3d-deck'

const layer = createSubsurfaceLayer({
  id: 'subsurface',
  data: networksGeoJSON,
  networkTypes: ['water', 'sewage', 'gas'], // Filtrar tipos
  widthMinPixels: 2,
  pickable: true,
})
```

## Controle de Elevação

```typescript
import {
  ElevationController,
  ELEVATION_PRESETS,
} from '@raphaeltorquat0/map-3d-deck'

const controller = new ElevationController({
  initialRange: { min: -50, max: 200 },
  onChange: (range) => {
    // Callback quando o range muda
  },
})

// Métodos disponíveis
controller.setRange({ min: 0, max: 50 })
controller.setMin(-10)
controller.setMax(100)
controller.applyPreset('buildings')
controller.reset()

// Consultas
controller.getRange() // { min, max }
controller.isVisible(25) // true/false
controller.getVisibleLevels() // ElevationLevel[]
controller.getCurrentPreset() // ElevationPreset | null

// Conversões
controller.heightToPercent(50) // 40 (% no range total)
controller.percentToHeight(40) // 50
```

## Presets de Elevação

| Preset       | Range       | Descrição      |
| ------------ | ----------- | -------------- |
| `subsurface` | -50m a 0m   | Apenas subsolo |
| `surface`    | -5m a 5m    | Superfície     |
| `buildings`  | 0m a 200m   | Edifícios      |
| `all`        | -50m a 200m | Tudo visível   |

## Níveis de Elevação

| Nível            | Range       | Cor     | Conteúdo          |
| ---------------- | ----------- | ------- | ----------------- |
| Subsolo Profundo | -50m a -20m | #1E3A5F | Metrô, fundações  |
| Subsolo Raso     | -20m a 0m   | #3B82F6 | Água, esgoto, gás |
| Superfície       | 0m          | #22C55E | Zoneamento, lotes |
| Baixa Elevação   | 0m a 15m    | #F59E0B | Edifícios baixos  |
| Média Elevação   | 15m a 50m   | #EF4444 | Edifícios médios  |
| Alta Elevação    | 50m a 200m  | #8B5CF6 | Torres            |

## Utilitários

```typescript
import {
  // Cores
  hexToRgba,
  rgbaToHex,
  interpolateColor,
  createColorScale,

  // Geometria
  calculateBounds,
  getBoundsCenter,
  getZoomForBounds,
  simplifyLine,
  pointInPolygon,
} from '@raphaeltorquat0/map-3d-deck'

// Converter cor
hexToRgba('#3B82F6', 200) // [59, 130, 246, 200]

// Criar escala de cores
const colorScale = createColorScale(
  [0, 100],
  [
    [0, 255, 0, 255],
    [255, 0, 0, 255],
  ]
)
colorScale(50) // [127, 127, 0, 255]

// Calcular bounds
const bounds = calculateBounds(features)
const center = getBoundsCenter(bounds)
```

## Integração com Frameworks

### React

```tsx
import { useEffect, useRef } from 'react'
import { Map3D, createZoningLayer } from '@raphaeltorquat0/map-3d-deck'

function MapComponent({ data }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map3D | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    mapRef.current = new Map3D({
      container: containerRef.current,
      initialViewState: { longitude: -46.63, latitude: -23.55, zoom: 12 },
    })

    return () => mapRef.current?.destroy()
  }, [])

  useEffect(() => {
    if (!mapRef.current || !data) return

    const layer = createZoningLayer({ data, extruded: true })
    mapRef.current.setLayers([layer])
  }, [data])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
```

### Vue

```vue
<template>
  <div ref="mapContainer" class="map"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Map3D, createZoningLayer } from '@raphaeltorquat0/map-3d-deck'

const props = defineProps(['data'])
const mapContainer = ref(null)
let map = null

onMounted(() => {
  map = new Map3D({
    container: mapContainer.value,
    initialViewState: { longitude: -46.63, latitude: -23.55, zoom: 12 },
  })
})

onUnmounted(() => map?.destroy())

watch(
  () => props.data,
  (data) => {
    if (!map || !data) return
    const layer = createZoningLayer({ data, extruded: true })
    map.setLayers([layer])
  }
)
</script>
```

## API Reference

### Map3D

```typescript
class Map3D {
  constructor(config: MapConfig & MapEvents)

  // Camadas
  addLayer(layer: Layer): void
  removeLayer(layerId: string): void
  updateLayer(layer: Layer): void
  getLayer(layerId: string): Layer | undefined
  getLayers(): Layer[]
  setLayers(layers: Layer[]): void

  // Elevação
  setElevationRange(range: ElevationRange): void
  getElevationRange(): ElevationRange

  // Navegação
  flyTo(options: FlyToOptions): void
  fitBounds(bounds: Bounds, options?: FitBoundsOptions): void
  getViewState(): MapViewState
  setViewState(viewState: Partial<MapViewState>): void
  toggle3D(enabled: boolean): void

  // Utilitários
  isReady(): boolean
  getMapInstance(): maplibregl.Map | null
  getDeckOverlay(): MapboxOverlay | null
  resize(): void
  destroy(): void
}
```

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run typecheck
```

## Licença

MIT
