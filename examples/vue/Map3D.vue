<!--
  Vue 3 Example: Map3D Component

  A reusable Vue component for displaying 3D multi-level maps.

  Usage:
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

  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import Map3D from './Map3D.vue'

  const zoningData = ref(null)

  onMounted(async () => {
    const res = await fetch('/data/zoning.geojson')
    zoningData.value = await res.json()
  })

  const handleClick = (feature) => {
    console.log('Clicked:', feature)
  }
  </script>
  ```
-->

<template>
  <div ref="containerRef" :class="className" :style="containerStyle" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import {
  Map3D,
  createZoningLayer,
  createBuildingLayer,
  createSubsurfaceLayer,
  ElevationController,
} from '@raphaeltorquat0/map-3d-deck'
import type { FeatureCollection } from 'geojson'
import type { ElevationRange } from '@raphaeltorquat0/map-3d-deck'
import 'maplibre-gl/dist/maplibre-gl.css'

// Props
interface Props {
  /** GeoJSON data to display */
  data?: FeatureCollection | null
  /** Infrastructure data for underground networks */
  infrastructureData?: FeatureCollection | null
  /** Building data for 3D buildings */
  buildingData?: FeatureCollection | null
  /** Initial map center [longitude, latitude] */
  center?: [number, number]
  /** Initial zoom level */
  zoom?: number
  /** Initial pitch (0 = 2D, 45+ = 3D) */
  pitch?: number
  /** Initial bearing (rotation) */
  bearing?: number
  /** Enable 3D extrusion for zoning */
  extruded?: boolean
  /** Show 3D buildings */
  showBuildings?: boolean
  /** Show underground infrastructure */
  showInfrastructure?: boolean
  /** Elevation preset: 'subsurface' | 'surface' | 'buildings' | 'all' */
  elevationPreset?: string
  /** Custom elevation range */
  elevationRange?: ElevationRange
  /** Additional CSS class names */
  className?: string
  /** Container height */
  height?: string
  /** Container width */
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  infrastructureData: null,
  buildingData: null,
  center: () => [-46.3289, -23.9608],
  zoom: 14,
  pitch: 45,
  bearing: 0,
  extruded: true,
  showBuildings: false,
  showInfrastructure: false,
  elevationPreset: undefined,
  elevationRange: undefined,
  className: '',
  height: '100%',
  width: '100%',
})

// Emits
const emit = defineEmits<{
  (e: 'feature-click', feature: unknown): void
  (e: 'feature-hover', feature: unknown | null): void
  (e: 'load'): void
  (e: 'view-state-change', viewState: unknown): void
}>()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
let map: Map3D | null = null
let elevationController: ElevationController | null = null
const isLoaded = ref(false)

// Computed styles
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))

// Initialize map
onMounted(() => {
  if (!containerRef.value) return

  map = new Map3D({
    container: containerRef.value,
    initialViewState: {
      longitude: props.center[0],
      latitude: props.center[1],
      zoom: props.zoom,
      pitch: props.pitch,
      bearing: props.bearing,
    },
    onClick: (info) => {
      if (info.object) {
        emit('feature-click', info.object)
      }
    },
    onHover: (info) => {
      emit('feature-hover', info.object ?? null)
    },
    onViewStateChange: (viewState) => {
      emit('view-state-change', viewState)
    },
    onLoad: () => {
      isLoaded.value = true
      emit('load')
    },
  })

  // Initialize elevation controller
  elevationController = new ElevationController({
    onChange: (range) => {
      map?.setElevationRange(range)
    },
  })
})

// Cleanup
onUnmounted(() => {
  map?.destroy()
  map = null
  elevationController = null
})

// Watch for data changes
watch(
  () => [
    props.data,
    props.infrastructureData,
    props.buildingData,
    props.extruded,
    props.showBuildings,
    props.showInfrastructure,
  ],
  () => {
    if (!map || !isLoaded.value) return
    updateLayers()
  },
  { deep: true }
)

// Watch for elevation changes
watch(
  () => [props.elevationPreset, props.elevationRange],
  () => {
    if (!elevationController || !isLoaded.value) return

    if (props.elevationPreset) {
      elevationController.applyPreset(props.elevationPreset)
    } else if (props.elevationRange) {
      elevationController.setRange(props.elevationRange)
    }
  }
)

// Watch for view state changes
watch(
  () => [props.center, props.zoom, props.pitch, props.bearing],
  () => {
    if (!map || !isLoaded.value) return

    map.setViewState({
      longitude: props.center[0],
      latitude: props.center[1],
      zoom: props.zoom,
      pitch: props.pitch,
      bearing: props.bearing,
    })
  }
)

// Update layers
function updateLayers() {
  if (!map) return

  const layers = []

  // Infrastructure layer (underground)
  if (props.showInfrastructure && props.infrastructureData) {
    layers.push(
      createSubsurfaceLayer({
        id: 'infrastructure',
        data: props.infrastructureData,
        pickable: true,
      })
    )
  }

  // Zoning layer
  if (props.data) {
    layers.push(
      createZoningLayer({
        id: 'zoning',
        data: props.data,
        extruded: props.extruded,
        pickable: true,
        opacity: 0.7,
      })
    )
  }

  // Building layer
  if (props.showBuildings && props.buildingData) {
    layers.push(
      createBuildingLayer({
        id: 'buildings',
        data: props.buildingData,
        extruded: true,
        pickable: true,
      })
    )
  }

  map.setLayers(layers)
}

// Expose methods for imperative access
defineExpose({
  flyTo: (options: { longitude: number; latitude: number; zoom?: number; pitch?: number }) => {
    map?.flyTo(options)
  },
  toggle3D: (enabled: boolean) => {
    map?.toggle3D(enabled)
  },
  setElevationRange: (range: ElevationRange) => {
    map?.setElevationRange(range)
  },
  getMap: () => map,
})
</script>

<style scoped>
/* Ensure container fills parent */
div {
  position: relative;
}
</style>
