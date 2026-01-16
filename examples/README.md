# Examples

This directory contains example implementations of
`@raphaeltorquat0/map-3d-deck` for different frameworks.

## Available Examples

| Framework  | Directory              | Description                      |
| ---------- | ---------------------- | -------------------------------- |
| Vanilla JS | [`basic/`](./basic/)   | Pure JavaScript implementation   |
| React      | [`react/`](./react/)   | React 18+ component              |
| Vue 3      | [`vue/`](./vue/)       | Vue 3 composition API component  |
| Next.js    | [`nextjs/`](./nextjs/) | Next.js 14+ App Router component |

## Running Examples

### Vanilla JS (Basic)

```bash
# From project root
npm run example

# Or directly
cd examples/basic
npm install
npm run dev
```

Visit `http://localhost:5173` to see the demo.

### React

```tsx
// Copy Map3DComponent.tsx to your React project
import { Map3DComponent } from './Map3DComponent'

function App() {
  return (
    <Map3DComponent
      data={zoningGeoJSON}
      center={[-46.3289, -23.9608]}
      zoom={14}
      extruded
    />
  )
}
```

### Vue 3

```vue
<template>
  <Map3D
    :data="zoningData"
    :center="[-46.3289, -23.9608]"
    :zoom="14"
    extruded
    @feature-click="handleClick"
  />
</template>

<script setup>
import Map3D from './Map3D.vue'
</script>
```

### Next.js

```tsx
// app/map/page.tsx
import dynamic from 'next/dynamic'

const Map3D = dynamic(() => import('@/components/Map3DClient'), {
  ssr: false,
  loading: () => <div className="h-screen animate-pulse bg-gray-800" />,
})

export default function MapPage() {
  return <Map3D />
}
```

## Live Demo

The basic example is deployed to GitHub Pages:

**[https://raphaeltorquat0.github.io/map-3d-deck/](https://raphaeltorquat0.github.io/map-3d-deck/)**

## Data Format

All examples expect GeoJSON data with the following structure:

### Zoning Data

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      },
      "properties": {
        "zone_code": "ZR1",
        "zone_name": "Residential Zone 1",
        "max_height": 15,
        "color": "#22C55E"
      }
    }
  ]
}
```

### Infrastructure Data

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[lng, lat], ...]
      },
      "properties": {
        "type": "water",
        "depth": -8
      }
    }
  ]
}
```

## Customization

All examples support the following customization:

- **Colors**: Override default zone colors via `getFillColor`
- **Heights**: Override extrusion heights via `getHeight`
- **Filters**: Filter visible elevation via `elevationRange`
- **Events**: Handle clicks/hovers via callbacks

See individual example files for detailed prop documentation.
