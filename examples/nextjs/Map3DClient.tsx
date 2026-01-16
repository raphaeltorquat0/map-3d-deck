/**
 * Next.js Example: Map3D Client Component
 *
 * This component must be used with dynamic import to avoid SSR issues.
 *
 * Usage in a page:
 * ```tsx
 * // app/map/page.tsx
 * import dynamic from 'next/dynamic'
 *
 * const Map3D = dynamic(() => import('@/components/Map3DClient'), {
 *   ssr: false,
 *   loading: () => <div className="h-screen animate-pulse bg-gray-800" />,
 * })
 *
 * export default function MapPage() {
 *   return (
 *     <main className="h-screen">
 *       <Map3D />
 *     </main>
 *   )
 * }
 * ```
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Map3D,
  createZoningLayer,
  createBuildingLayer,
  createSubsurfaceLayer,
  ElevationController,
  ELEVATION_PRESETS,
} from '@raphaeltorquat0/map-3d-deck'
import type { FeatureCollection } from 'geojson'
import type { ElevationRange, ElevationPreset } from '@raphaeltorquat0/map-3d-deck'
import 'maplibre-gl/dist/maplibre-gl.css'

// Props
interface Map3DClientProps {
  /** Initial map center [longitude, latitude] */
  initialCenter?: [number, number]
  /** Initial zoom level */
  initialZoom?: number
  /** URL to fetch zoning data from */
  zoningDataUrl?: string
  /** URL to fetch building data from */
  buildingDataUrl?: string
  /** URL to fetch infrastructure data from */
  infrastructureDataUrl?: string
  /** Callback when a feature is clicked */
  onFeatureClick?: (feature: unknown) => void
}

export default function Map3DClient({
  initialCenter = [-46.3289, -23.9608],
  initialZoom = 14,
  zoningDataUrl = '/data/zoning.geojson',
  buildingDataUrl,
  infrastructureDataUrl,
  onFeatureClick,
}: Map3DClientProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map3D | null>(null)
  const elevationRef = useRef<ElevationController | null>(null)

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [is3D, setIs3D] = useState(true)
  const [showBuildings, setShowBuildings] = useState(false)
  const [showInfra, setShowInfra] = useState(false)
  const [currentPreset, setCurrentPreset] = useState<string>('all')
  const [hoveredFeature, setHoveredFeature] = useState<unknown | null>(null)

  // Data state
  const [zoningData, setZoningData] = useState<FeatureCollection | null>(null)
  const [buildingData, setBuildingData] = useState<FeatureCollection | null>(null)
  const [infraData, setInfraData] = useState<FeatureCollection | null>(null)

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch zoning data
        if (zoningDataUrl) {
          const res = await fetch(zoningDataUrl)
          const data = await res.json()
          setZoningData(data)
        }

        // Fetch building data
        if (buildingDataUrl) {
          const res = await fetch(buildingDataUrl)
          const data = await res.json()
          setBuildingData(data)
        }

        // Fetch infrastructure data
        if (infrastructureDataUrl) {
          const res = await fetch(infrastructureDataUrl)
          const data = await res.json()
          setInfraData(data)
        }
      } catch (error) {
        console.error('Failed to fetch map data:', error)
      }
    }

    fetchData()
  }, [zoningDataUrl, buildingDataUrl, infrastructureDataUrl])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return

    mapRef.current = new Map3D({
      container: containerRef.current,
      initialViewState: {
        longitude: initialCenter[0],
        latitude: initialCenter[1],
        zoom: initialZoom,
        pitch: 45,
        bearing: 0,
      },
      onClick: (info) => {
        if (info.object && onFeatureClick) {
          onFeatureClick(info.object)
        }
      },
      onHover: (info) => {
        setHoveredFeature(info.object ?? null)
      },
      onLoad: () => {
        setIsLoading(false)
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
  }, [initialCenter, initialZoom, onFeatureClick])

  // Update layers when data or settings change
  useEffect(() => {
    if (!mapRef.current || isLoading) return

    const layers = []

    // Infrastructure layer (underground)
    if (showInfra && infraData) {
      layers.push(
        createSubsurfaceLayer({
          id: 'infrastructure',
          data: infraData,
          pickable: true,
        })
      )
    }

    // Zoning layer
    if (zoningData) {
      layers.push(
        createZoningLayer({
          id: 'zoning',
          data: zoningData,
          extruded: is3D,
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
  }, [zoningData, buildingData, infraData, is3D, showBuildings, showInfra, isLoading])

  // Handle preset change
  const handlePresetChange = useCallback((presetId: string) => {
    setCurrentPreset(presetId)
    elevationRef.current?.applyPreset(presetId)
  }, [])

  // Handle 3D toggle
  const handleToggle3D = useCallback(() => {
    setIs3D((prev) => {
      const newValue = !prev
      mapRef.current?.toggle3D(newValue)
      return newValue
    })
  }, [])

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <span className="text-white">Loading map...</span>
          </div>
        </div>
      )}

      {/* Controls Panel */}
      {!isLoading && (
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {/* View Toggle */}
          <button
            onClick={handleToggle3D}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              is3D ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-800'
            }`}
          >
            {is3D ? '3D View' : '2D View'}
          </button>

          {/* Layer Toggles */}
          <div className="flex flex-col gap-1 rounded-lg bg-white/90 p-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showBuildings}
                onChange={(e) => setShowBuildings(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              3D Buildings
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showInfra}
                onChange={(e) => setShowInfra(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Infrastructure
            </label>
          </div>

          {/* Elevation Presets */}
          <div className="flex flex-col gap-1 rounded-lg bg-white/90 p-2">
            <span className="text-xs font-medium text-gray-500">Elevation</span>
            {ELEVATION_PRESETS.map((preset: ElevationPreset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                className={`rounded px-3 py-1 text-left text-sm transition-colors ${
                  currentPreset === preset.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredFeature && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-white/95 p-3 shadow-lg">
          <pre className="max-h-40 max-w-xs overflow-auto text-xs text-gray-800">
            {JSON.stringify((hoveredFeature as { properties?: unknown }).properties, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
