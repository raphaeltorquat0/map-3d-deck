import { Map3D, createElevationController } from '../../src'
import { createZoningLayer } from '../../src/layers'
import { PathLayer } from '@deck.gl/layers'
import type { ElevationRange } from '../../src/types'

// Carregar dados de Santos
import santosZoningData from './data/santos_zoneamento.json'
import santosInfraData from './data/santos_infraestrutura.json'

// === STATE ===
let map3d: Map3D
let elevationController: ReturnType<typeof createElevationController>

const state = {
  is3D: true,
  showZones: true,
  showBuildings: true,
  showInfra: true,
  activeInfraTypes: new Set([
    'water',
    'sewage',
    'gas',
    'drainage',
    'electricity',
    'telecom',
    'fiber',
  ]),
}

// === INFRA STYLES (Clean, professional look) ===
const INFRA_STYLES: Record<
  string,
  {
    color: [number, number, number]
    glow: [number, number, number]
    width: number
    depth: number
    label: string
  }
> = {
  electricity: {
    color: [250, 204, 21],
    glow: [255, 220, 80],
    width: 3,
    depth: -2,
    label: 'Elétrica',
  },
  fiber: {
    color: [34, 211, 238],
    glow: [80, 220, 250],
    width: 2,
    depth: -1,
    label: 'Fibra',
  },
  telecom: {
    color: [168, 85, 247],
    glow: [180, 120, 255],
    width: 2,
    depth: -3,
    label: 'Telecom',
  },
  gas: {
    color: [255, 180, 0],
    glow: [255, 200, 60],
    width: 4,
    depth: -4,
    label: 'Gás',
  },
  water: {
    color: [0, 150, 255],
    glow: [60, 180, 255],
    width: 5,
    depth: -8,
    label: 'Água',
  },
  sewage: {
    color: [139, 90, 43],
    glow: [160, 110, 60],
    width: 6,
    depth: -12,
    label: 'Esgoto',
  },
  drainage: {
    color: [0, 180, 180],
    glow: [60, 200, 200],
    width: 7,
    depth: -15,
    label: 'Drenagem',
  },
}

// === PROCESS INFRA DATA ===
interface InfraPath {
  path: number[][]
  infraType: string
  depth: number
  width: number
  color: [number, number, number]
  glow: [number, number, number]
  id: string
}

function flattenInfraData(data: any): InfraPath[] {
  const paths: InfraPath[] = []
  data.features.forEach((feature: any, idx: number) => {
    const infraType = feature.properties?.infra_type || 'water'
    const style = INFRA_STYLES[infraType] || INFRA_STYLES.water
    if (feature.geometry.type === 'MultiLineString') {
      feature.geometry.coordinates.forEach((line: number[][], lineIdx: number) => {
        paths.push({
          path: line,
          infraType,
          depth: style.depth,
          width: style.width,
          color: style.color,
          glow: style.glow,
          id: `${infraType}-${idx}-${lineIdx}`,
        })
      })
    } else if (feature.geometry.type === 'LineString') {
      paths.push({
        path: feature.geometry.coordinates,
        infraType,
        depth: style.depth,
        width: style.width,
        color: style.color,
        glow: style.glow,
        id: `${infraType}-${idx}`,
      })
    }
  })
  return paths
}

let infraPaths: InfraPath[] = []

// === DOM ELEMENTS ===
const view2DBtn = document.getElementById('view-2d') as HTMLButtonElement
const view3DBtn = document.getElementById('view-3d') as HTMLButtonElement
const viewToggles = document.querySelector('.view-toggles') as HTMLElement
const layerZonesBtn = document.getElementById('layer-zones') as HTMLButtonElement
const layerBuildingsBtn = document.getElementById('layer-buildings') as HTMLButtonElement
const layerInfraBtn = document.getElementById('layer-infra') as HTMLButtonElement
const infraLegend = document.getElementById('infra-legend') as HTMLElement
const infraItems = document.querySelectorAll('.infra-item')
const presetBtns = document.querySelectorAll('.preset-btn')
const minElevationInput = document.getElementById('min-elevation') as HTMLInputElement
const maxElevationInput = document.getElementById('max-elevation') as HTMLInputElement
const infoContent = document.getElementById('info-content') as HTMLElement
const statsEl = document.getElementById('stats') as HTMLElement
const statsBadge = document.querySelector('.stats-badge') as HTMLElement

// === LAYER TRANSITION CONFIG ===
const TRANSITION_DURATION = 300

// === UPDATE LAYERS ===
function updateLayers() {
  const range = elevationController.getRange()
  const layers: any[] = []

  console.log('updateLayers:', {
    showZones: state.showZones,
    showBuildings: state.showBuildings,
    is3D: state.is3D,
    showInfra: state.showInfra,
  })

  // Infrastructure layers FIRST (rendered at bottom/underground)
  if (state.showInfra) {
    const filteredPaths = infraPaths.filter((p) => {
      if (!state.activeInfraTypes.has(p.infraType)) return false
      return p.depth >= range.min && p.depth <= range.max
    })

    const pathsByType: Record<string, InfraPath[]> = {}
    filteredPaths.forEach((p) => {
      if (!pathsByType[p.infraType]) pathsByType[p.infraType] = []
      pathsByType[p.infraType].push(p)
    })

    Object.entries(pathsByType).forEach(([infraType, paths]) => {
      const style = INFRA_STYLES[infraType] || INFRA_STYLES.water

      // Subtle glow
      const glowAlpha = state.showBuildings ? 50 : 25

      layers.push(
        new PathLayer({
          id: `infra-glow-${infraType}`,
          data: paths,
          pickable: false,
          widthUnits: 'meters',
          widthMinPixels: 2,
          widthMaxPixels: 8,
          getPath: (d: InfraPath) => d.path.map((p) => [p[0], p[1], state.is3D ? d.depth * 5 : 0]),
          getWidth: style.width * 3,
          getColor: [...style.glow, glowAlpha] as [number, number, number, number],
          capRounded: true,
          jointRounded: true,
          transitions: {
            getPath: TRANSITION_DURATION,
          },
        })
      )

      // Main pipe (clean, solid)
      layers.push(
        new PathLayer({
          id: `infra-pipe-${infraType}`,
          data: paths,
          pickable: true,
          widthUnits: 'meters',
          widthMinPixels: 1,
          widthMaxPixels: 4,
          getPath: (d: InfraPath) => d.path.map((p) => [p[0], p[1], state.is3D ? d.depth * 5 : 0]),
          getWidth: style.width * 2,
          getColor: [...style.color, 220] as [number, number, number, number],
          capRounded: true,
          jointRounded: true,
          onClick: (info: any) => info.object && showInfraInfo(info.object),
          onHover: (info: any) => info.object && showInfraInfo(info.object),
          transitions: {
            getPath: TRANSITION_DURATION,
          },
        })
      )
    })
  }

  // Zoning layer ON TOP (with transparency to see infrastructure below)
  if (state.showZones) {
    const zoningOpacity = state.showInfra ? 0.4 : 0.7
    const zoningLayer = createZoningLayer({
      id: 'zoning-layer',
      data: santosZoningData as any,
      visible: true,
      opacity: zoningOpacity,
      extruded: state.showBuildings,
      wireframe: state.showBuildings, // Show edges on extruded buildings
      elevationScale: 5, // Amplify height for visibility
      getHeight: (f) => {
        const height = state.showBuildings ? f.properties?.max_height || 10 : 0
        return height
      },
      getFillColor: (f) => {
        // More transparent when showing both buildings and infrastructure (to see underground)
        let alpha: number
        if (state.showBuildings && state.showInfra) {
          alpha = 140 // Semi-transparent to see pipes underneath
        } else if (state.showBuildings) {
          alpha = 200
        } else if (state.showInfra) {
          alpha = 100 // Very transparent in 2D with infra
        } else {
          alpha = 220
        }

        // Use explicit color if available, otherwise derive from zone code
        if (f.properties?.color && f.properties.color !== '#9CA3AF') {
          return hexToRgba(f.properties.color, alpha)
        }
        return getZoneColor(f.properties?.zone_code || '', alpha)
      },
      getLineColor: () =>
        state.showBuildings
          ? ([255, 255, 255, 120] as [number, number, number, number]) // Subtle white wireframe
          : ([255, 255, 255, 80] as [number, number, number, number]), // Very subtle 2D borders
      lineWidthMinPixels: state.showBuildings ? 1 : 1,
      onClick: (info) => info.object && showZoneInfo(info.object.properties),
      onHover: (info) => info.object && showZoneInfo(info.object.properties),
    })
    layers.push(zoningLayer)
  }

  map3d.setLayers(layers)
}

// === HELPERS ===
function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), alpha]
  }
  return [150, 150, 150, alpha]
}

// Color by zone code (Santos zoning codes)
function getZoneColor(zoneCode: string, alpha: number): [number, number, number, number] {
  const code = (zoneCode || '').toUpperCase()

  // ZPPA - Proteção Paisagística e Ambiental (Environmental)
  if (code.includes('ZPPA') || code.includes('APC')) return [16, 185, 129, alpha] // Teal/Green

  // ZP - Zona Portuária (Port)
  if (code === 'ZP') return [249, 115, 22, alpha] // Deep orange

  // ZO - Orla (Waterfront)
  if (code === 'ZO' || code.includes('ZNO')) return [6, 182, 212, alpha] // Cyan

  // ZC - Comercial (Commercial)
  if (code.startsWith('ZC')) return [59, 130, 246, alpha] // Blue

  // ZM - Misto (Mixed use)
  if (code.startsWith('ZM')) return [168, 85, 247, alpha] // Purple

  // ZI / ZIR - Industrial
  if (code.startsWith('ZI')) return [245, 158, 11, alpha] // Orange

  // ZEIS - Social Interest
  if (code.includes('ZEIS')) return [236, 72, 153, alpha] // Pink

  // ZEP / ZERU - Special/Renewal
  if (code.includes('ZE')) return [239, 68, 68, alpha] // Red

  // AAS / AEM / FA - Special Areas
  if (code === 'AAS' || code === 'AEM' || code === 'FA') return [34, 197, 94, alpha] // Green

  // NIDE - Industrial Development
  if (code === 'NIDE') return [251, 191, 36, alpha] // Yellow/Amber

  return [107, 114, 128, alpha] // Gray default
}

// Debounce utility for smooth updates
let infoUpdateTimeout: number | null = null

function updateInfoWithTransition(html: string) {
  if (infoUpdateTimeout) {
    clearTimeout(infoUpdateTimeout)
  }

  infoContent.classList.add('updating')

  infoUpdateTimeout = window.setTimeout(() => {
    infoContent.innerHTML = html
    infoContent.classList.remove('updating')
  }, 150)
}

function showZoneInfo(props: any) {
  const uses = props.allowed_uses || []
  const html = `
    <div class="info-zone-name">${props.zone_name || 'Zona'}</div>
    <div class="info-zone-code">
      <span class="info-zone-color" style="background: ${props.color}"></span>
      ${props.zone_code}
    </div>
    <div class="info-grid">
      <div class="info-stat">
        <div class="info-stat-label">Gabarito</div>
        <div class="info-stat-value">${props.max_height}<span class="info-stat-unit">m</span></div>
      </div>
      <div class="info-stat">
        <div class="info-stat-label">Pavimentos</div>
        <div class="info-stat-value">${props.max_floors}</div>
      </div>
      <div class="info-stat">
        <div class="info-stat-label">CA Máx</div>
        <div class="info-stat-value">${props.max_far}</div>
      </div>
      <div class="info-stat">
        <div class="info-stat-label">Ocupação</div>
        <div class="info-stat-value">${(props.max_coverage * 100).toFixed(0)}<span class="info-stat-unit">%</span></div>
      </div>
    </div>
    ${
      uses.length
        ? `
    <div class="info-uses">
      <div class="info-uses-label">Usos permitidos</div>
      <div class="info-uses-tags">
        ${uses.map((u: string) => `<span class="info-use-tag">${u}</span>`).join('')}
      </div>
    </div>
    `
        : ''
    }
  `
  updateInfoWithTransition(html)
}

function showInfraInfo(obj: InfraPath) {
  const style = INFRA_STYLES[obj.infraType] || INFRA_STYLES.water
  const html = `
    <div class="info-zone-name" style="color: rgb(${style.color.join(',')})">${style.label}</div>
    <div class="info-zone-code">
      <span class="info-zone-color" style="background: rgb(${style.color.join(',')})"></span>
      Rede subterrânea
    </div>
    <div class="info-grid">
      <div class="info-stat">
        <div class="info-stat-label">Profundidade</div>
        <div class="info-stat-value">${Math.abs(obj.depth)}<span class="info-stat-unit">m</span></div>
      </div>
      <div class="info-stat">
        <div class="info-stat-label">Diâmetro</div>
        <div class="info-stat-value">${style.width * 10}<span class="info-stat-unit">mm</span></div>
      </div>
    </div>
  `
  updateInfoWithTransition(html)
}

function updatePresetUI() {
  const currentPreset = elevationController.getCurrentPreset()
  presetBtns.forEach((btn) => {
    const preset = (btn as HTMLElement).dataset.preset
    btn.classList.toggle('active', preset === currentPreset?.id)
  })
}

function updateElevationInputs(range: ElevationRange) {
  minElevationInput.value = String(range.min)
  maxElevationInput.value = String(range.max)
  updatePresetUI()
}

function updateStats() {
  const zonesCount = (santosZoningData as any).features?.length || 0
  const infraCount = infraPaths.length
  statsEl.textContent = `${zonesCount} zonas • ${infraCount} tubulações`

  // Trigger animation
  statsBadge.classList.remove('updated')
  void statsBadge.offsetWidth // Force reflow
  statsBadge.classList.add('updated')
}

function calculateBounds(geojson: any) {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity
  geojson.features?.forEach((f: any) => {
    const coords = f.geometry?.coordinates
    if (!coords) return
    if (f.geometry.type === 'Polygon') {
      coords[0]?.forEach((c: number[]) => {
        minLng = Math.min(minLng, c[0])
        maxLng = Math.max(maxLng, c[0])
        minLat = Math.min(minLat, c[1])
        maxLat = Math.max(maxLat, c[1])
      })
    }
  })
  return { centerLng: (minLng + maxLng) / 2, centerLat: (minLat + maxLat) / 2 }
}

// === INIT ===
async function init() {
  infraPaths = flattenInfraData(santosInfraData)
  console.log(`Loaded ${infraPaths.length} infrastructure paths`)

  elevationController = createElevationController({
    onChange: (range) => {
      updateElevationInputs(range)
      updateLayers()
    },
  })

  const bounds = calculateBounds(santosZoningData)

  map3d = new Map3D({
    container: 'map-container',
    mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    initialViewState: {
      longitude: bounds.centerLng,
      latitude: bounds.centerLat,
      zoom: 14,
      pitch: 60,
      bearing: -20,
    },
    onLoad: () => {
      updateLayers()
      updateStats()
    },
    onHover: (info) => {
      document.getElementById('map-container')!.style.cursor = info.object ? 'pointer' : 'grab'
    },
  })

  // === EVENT LISTENERS ===

  // View toggles with smooth slide animation
  view2DBtn.addEventListener('click', () => {
    if (!state.is3D) return
    state.is3D = false
    view2DBtn.classList.add('active')
    view3DBtn.classList.remove('active')
    viewToggles.classList.remove('is-3d')
    map3d.toggle3D(false)
    updateLayers()
  })

  view3DBtn.addEventListener('click', () => {
    if (state.is3D) return
    state.is3D = true
    view3DBtn.classList.add('active')
    view2DBtn.classList.remove('active')
    viewToggles.classList.add('is-3d')
    map3d.toggle3D(true)
    updateLayers()
  })

  // Ripple effect helper
  function triggerRipple(element: HTMLElement) {
    element.classList.remove('clicked')
    void element.offsetWidth // Force reflow
    element.classList.add('clicked')
    setTimeout(() => element.classList.remove('clicked'), 600)
  }

  // Layer toggles with ripple effect
  layerZonesBtn.addEventListener('click', () => {
    triggerRipple(layerZonesBtn)
    state.showZones = !state.showZones
    layerZonesBtn.classList.toggle('active', state.showZones)
    updateLayers()
  })

  layerBuildingsBtn.addEventListener('click', () => {
    triggerRipple(layerBuildingsBtn)
    state.showBuildings = !state.showBuildings
    layerBuildingsBtn.classList.toggle('active', state.showBuildings)
    if (state.showBuildings && !state.is3D) {
      state.is3D = true
      view3DBtn.classList.add('active')
      view2DBtn.classList.remove('active')
      viewToggles.classList.add('is-3d')
      // Switch to 3D view with higher pitch and zoom for better building visibility
      map3d.getMapInstance()?.easeTo({
        pitch: 60,
        zoom: 14,
        duration: 1000,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      })
    }
    // Enable infrastructure when showing buildings (for underground view)
    if (state.showBuildings && !state.showInfra) {
      state.showInfra = true
      layerInfraBtn.classList.add('active')
      infraLegend.classList.remove('hidden')
    }
    updateLayers()
  })

  // Infra toggle with smooth legend show/hide
  layerInfraBtn.addEventListener('click', () => {
    triggerRipple(layerInfraBtn)
    state.showInfra = !state.showInfra
    layerInfraBtn.classList.toggle('active', state.showInfra)

    // Use CSS class for smooth animation
    if (state.showInfra) {
      infraLegend.classList.remove('hidden')
    } else {
      infraLegend.classList.add('hidden')
    }

    updateLayers()
  })

  // Infra type toggles with smooth feedback
  infraItems.forEach((item) => {
    item.addEventListener('click', () => {
      const type = (item as HTMLElement).dataset.type!

      // Toggle state
      if (state.activeInfraTypes.has(type)) {
        state.activeInfraTypes.delete(type)
        item.classList.remove('active')
        item.classList.add('disabled')
      } else {
        state.activeInfraTypes.add(type)
        item.classList.add('active')
        item.classList.remove('disabled')
      }

      // Smooth layer update
      requestAnimationFrame(() => {
        updateLayers()
      })
    })
  })

  // Elevation presets with active state animation
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = (btn as HTMLElement).dataset.preset!

      // Remove active from all buttons first
      presetBtns.forEach((b) => b.classList.remove('active'))

      // Add active to clicked button with slight delay for visual feedback
      requestAnimationFrame(() => {
        btn.classList.add('active')
        elevationController.applyPreset(preset)
      })
    })
  })

  // Elevation inputs
  minElevationInput.addEventListener('change', () => {
    elevationController.setMin(parseInt(minElevationInput.value))
  })

  maxElevationInput.addEventListener('change', () => {
    elevationController.setMax(parseInt(maxElevationInput.value))
  })
}

init()
