import type { Feature, FeatureCollection, BBox, Position } from 'geojson'

/**
 * Utilitários de geometria para o framework
 */

/**
 * Calcula o bounding box de uma FeatureCollection
 */
export function calculateBounds(features: Feature[] | FeatureCollection): BBox | null {
  const featureArray = Array.isArray(features) ? features : features.features

  if (featureArray.length === 0) return null

  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  function processCoord(coord: Position): void {
    const [lng, lat] = coord
    minLng = Math.min(minLng, lng)
    minLat = Math.min(minLat, lat)
    maxLng = Math.max(maxLng, lng)
    maxLat = Math.max(maxLat, lat)
  }

  function processCoords(coords: Position[] | Position[][] | Position[][][]): void {
    if (typeof coords[0] === 'number') {
      processCoord(coords as unknown as Position)
    } else if (typeof (coords as Position[][])[0]?.[0] === 'number') {
      ;(coords as Position[]).forEach(processCoord)
    } else if (Array.isArray((coords as Position[][][])[0]?.[0])) {
      ;(coords as Position[][]).forEach((ring) => ring.forEach(processCoord))
    } else {
      ;(coords as Position[][][]).forEach((poly) =>
        poly.forEach((ring) => ring.forEach(processCoord))
      )
    }
  }

  featureArray.forEach((feature) => {
    const geometry = feature.geometry
    if (!geometry) return

    switch (geometry.type) {
      case 'Point':
        processCoord(geometry.coordinates)
        break
      case 'MultiPoint':
      case 'LineString':
        processCoords(geometry.coordinates)
        break
      case 'MultiLineString':
      case 'Polygon':
        processCoords(geometry.coordinates)
        break
      case 'MultiPolygon':
        processCoords(geometry.coordinates)
        break
    }
  })

  if (minLng === Infinity) return null

  return [minLng, minLat, maxLng, maxLat]
}

/**
 * Calcula o centro de um bounding box
 */
export function getBoundsCenter(bounds: BBox): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = bounds
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
}

/**
 * Calcula o zoom apropriado para um bounding box
 */
export function getZoomForBounds(
  bounds: BBox,
  viewportWidth: number,
  viewportHeight: number,
  padding = 50
): number {
  const [minLng, minLat, maxLng, maxLat] = bounds

  const lngDiff = maxLng - minLng
  const latDiff = maxLat - minLat

  const effectiveWidth = viewportWidth - padding * 2
  const effectiveHeight = viewportHeight - padding * 2

  // Aproximação simples para zoom
  const lngZoom = Math.log2(((360 / lngDiff) * effectiveWidth) / 256)
  const latZoom = Math.log2(((180 / latDiff) * effectiveHeight) / 256)

  return Math.min(lngZoom, latZoom, 20)
}

/**
 * Simplifica uma linha usando o algoritmo Douglas-Peucker
 */
export function simplifyLine(coords: Position[], tolerance: number): Position[] {
  if (coords.length <= 2) return coords

  function perpendicularDistance(point: Position, lineStart: Position, lineEnd: Position): number {
    const [x, y] = point
    const [x1, y1] = lineStart
    const [x2, y2] = lineEnd

    const dx = x2 - x1
    const dy = y2 - y1

    if (dx === 0 && dy === 0) {
      return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2)
    }

    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    const nearestX = x1 + t * dx
    const nearestY = y1 + t * dy

    return Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2)
  }

  function simplify(
    coords: Position[],
    start: number,
    end: number,
    tolerance: number,
    result: Position[]
  ): void {
    let maxDist = 0
    let maxIndex = 0

    for (let i = start + 1; i < end; i++) {
      const dist = perpendicularDistance(coords[i], coords[start], coords[end])
      if (dist > maxDist) {
        maxDist = dist
        maxIndex = i
      }
    }

    if (maxDist > tolerance) {
      simplify(coords, start, maxIndex, tolerance, result)
      simplify(coords, maxIndex, end, tolerance, result)
    } else {
      if (!result.includes(coords[start])) result.push(coords[start])
      if (!result.includes(coords[end])) result.push(coords[end])
    }
  }

  const result: Position[] = []
  simplify(coords, 0, coords.length - 1, tolerance, result)
  return result
}

/**
 * Calcula a área de um polígono (em graus quadrados)
 */
export function calculatePolygonArea(coords: Position[]): number {
  let area = 0
  const n = coords.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += coords[i][0] * coords[j][1]
    area -= coords[j][0] * coords[i][1]
  }

  return Math.abs(area / 2)
}

/**
 * Verifica se um ponto está dentro de um polígono
 */
export function pointInPolygon(point: Position, polygon: Position[]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}
