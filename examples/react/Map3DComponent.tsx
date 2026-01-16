/**
 * React Example: Map3D Component
 *
 * A reusable React component for displaying 3D multi-level maps.
 *
 * Usage:
 * ```tsx
 * import { Map3DComponent } from './Map3DComponent'
 *
 * function App() {
 *   const [data, setData] = useState<FeatureCollection | null>(null)
 *
 *   useEffect(() => {
 *     fetch('/data/zoning.geojson')
 *       .then(r => r.json())
 *       .then(setData)
 *   }, [])
 *
 *   return (
 *     <Map3DComponent
 *       data={data}
 *       center={[-46.3289, -23.9608]}
 *       zoom={14}
 *       extruded
 *       onFeatureClick={(feature) => console.log(feature)}
 *     />
 *   )
 * }
 * ```
 */

import { useEffect, useRef, useCallback, useState } from 'react'
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

// Types
interface Map3DComponentProps {
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
  /** Callback when a feature is clicked */
  onFeatureClick?: (feature: unknown) => void
  /** Callback when a feature is hovered */
  onFeatureHover?: (feature: unknown | null) => void
  /** Callback when map is loaded */
  onLoad?: () => void
  /** Additional CSS class names */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

export function Map3DComponent({
  data,
  infrastructureData,
  buildingData,
  center = [-46.3289, -23.9608],
  zoom = 14,
  pitch = 45,
  bearing = 0,
  extruded = true,
  showBuildings = false,
  showInfrastructure = false,
  elevationPreset,
  elevationRange,
  onFeatureClick,
  onFeatureHover,
  onLoad,
  className,
  style,
}: Map3DComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map3D | null>(null)
  const elevationRef = useRef<ElevationController | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return

    mapRef.current = new Map3D({
      container: containerRef.current,
      initialViewState: {
        longitude: center[0],
        latitude: center[1],
        zoom,
        pitch,
        bearing,
      },
      onClick: (info) => {
        if (info.object && onFeatureClick) {
          onFeatureClick(info.object)
        }
      },
      onHover: (info) => {
        if (onFeatureHover) {
          onFeatureHover(info.object ?? null)
        }
      },
      onLoad: () => {
        setIsLoaded(true)
        onLoad?.()
      },
    })

    // Initialize elevation controller
    elevationRef.current = new ElevationController({
      onChange: (range) => {
        mapRef.current?.setElevationRange(range)
      },
    })

    return () => {
      mapRef.current?.destroy()
      mapRef.current = null
      elevationRef.current = null
    }
  }, []) // Only run once on mount

  // Update layers when data changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    const layers = []

    // Infrastructure layer (underground)
    if (showInfrastructure && infrastructureData) {
      layers.push(
        createSubsurfaceLayer({
          id: 'infrastructure',
          data: infrastructureData,
          pickable: true,
        })
      )
    }

    // Zoning layer
    if (data) {
      layers.push(
        createZoningLayer({
          id: 'zoning',
          data,
          extruded,
          pickable: true,
          opacity: 0.7,
        })
      )
    }

    // Building layer
    if (showBuildings && buildingData) {
      layers.push(
        createBuildingLayer({
          id: 'buildings',
          data: buildingData,
          extruded: true,
          pickable: true,
        })
      )
    }

    mapRef.current.setLayers(layers)
  }, [
    data,
    infrastructureData,
    buildingData,
    extruded,
    showBuildings,
    showInfrastructure,
    isLoaded,
  ])

  // Update elevation preset
  useEffect(() => {
    if (!elevationRef.current || !isLoaded) return

    if (elevationPreset) {
      elevationRef.current.applyPreset(elevationPreset)
    } else if (elevationRange) {
      elevationRef.current.setRange(elevationRange)
    }
  }, [elevationPreset, elevationRange, isLoaded])

  // Update view state
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    mapRef.current.setViewState({
      longitude: center[0],
      latitude: center[1],
      zoom,
      pitch,
      bearing,
    })
  }, [center, zoom, pitch, bearing, isLoaded])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  )
}

// Hook for imperative map control
export function useMap3D() {
  const mapRef = useRef<Map3D | null>(null)

  const setMapRef = useCallback((map: Map3D | null) => {
    mapRef.current = map
  }, [])

  const flyTo = useCallback(
    (options: { longitude: number; latitude: number; zoom?: number; pitch?: number }) => {
      mapRef.current?.flyTo(options)
    },
    []
  )

  const toggle3D = useCallback((enabled: boolean) => {
    mapRef.current?.toggle3D(enabled)
  }, [])

  const setElevationRange = useCallback((range: ElevationRange) => {
    mapRef.current?.setElevationRange(range)
  }, [])

  return {
    setMapRef,
    flyTo,
    toggle3D,
    setElevationRange,
    map: mapRef.current,
  }
}

export default Map3DComponent
