/**
 * Gera GeoJSON de Santos a partir dos shapefiles locais
 * Baseado no código de /Documents/iptu-saas/frontend/src/app/api/geo/[cidade]/zoneamento/route.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// === Conversão UTM Zone 23S para Lat/Lon (WGS84) ===
function utmToLatLon(x: number, y: number): [number, number] {
  const k0 = 0.9996
  const a = 6378137.0 // WGS84 semi-major axis
  const e2 = 0.00669438 // WGS84 eccentricity squared
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const lon0 = (-45.0 * Math.PI) / 180 // Meridiano central Zone 23 em RADIANOS

  const xAdj = x - 500000.0 // Remove false easting
  const yAdj = y - 10000000.0 // Remove false northing (Hemisfério Sul)

  const M = yAdj / k0
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256))

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32) * Math.sin(4 * mu) +
    ((151 * e1 * e1 * e1) / 96) * Math.sin(6 * mu)

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1))
  const T1 = Math.tan(phi1) * Math.tan(phi1)
  const C1 = (e2 / (1 - e2)) * Math.cos(phi1) * Math.cos(phi1)
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5)
  const D = xAdj / (N1 * k0)

  const lat =
    phi1 -
    ((N1 * Math.tan(phi1)) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * (e2 / (1 - e2))) * D * D * D * D) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * (e2 / (1 - e2)) - 3 * C1 * C1) *
          D *
          D *
          D *
          D *
          D *
          D) /
          720)

  const lon =
    lon0 +
    (D -
      ((1 + 2 * T1 + C1) * D * D * D) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * (e2 / (1 - e2)) + 24 * T1 * T1) *
        D *
        D *
        D *
        D *
        D) /
        120) /
      Math.cos(phi1)

  return [(lat * 180) / Math.PI, (lon * 180) / Math.PI]
}

// Converter coordenadas de um polígono UTM para Lat/Lon
function convertPolygonToLatLon(coordinates: number[][][]): number[][][] {
  return coordinates.map((ring) =>
    ring.map((point) => {
      const [lat, lon] = utmToLatLon(point[0], point[1])
      return [lon, lat] // GeoJSON usa [lon, lat]
    })
  )
}

// === Leitura de DBF ===
function readDbfRecords(dbfPath: string): any[] {
  const buffer = readFileSync(dbfPath)

  // Header
  const numRecords = buffer.readUInt32LE(4)
  const headerLength = buffer.readUInt16LE(8)
  const recordLength = buffer.readUInt16LE(10)

  // Fields
  const fields: { name: string; type: string; length: number }[] = []
  let offset = 32
  while (offset < headerLength - 1 && buffer[offset] !== 0x0d) {
    const name = buffer
      .subarray(offset, offset + 11)
      .toString('latin1')
      .replace(/\0/g, '')
      .trim()
    const type = String.fromCharCode(buffer[offset + 11])
    const length = buffer[offset + 16]
    fields.push({ name, type, length })
    offset += 32
  }

  // Records
  const records: any[] = []
  let recordOffset = headerLength

  for (let i = 0; i < numRecords; i++) {
    if (buffer[recordOffset] === 0x2a) {
      // Deleted record
      recordOffset += recordLength
      continue
    }

    const record: any = {}
    let fieldOffset = recordOffset + 1

    for (const field of fields) {
      let value: any = buffer
        .subarray(fieldOffset, fieldOffset + field.length)
        .toString('latin1')
        .trim()

      // Fix encoding (UTF-8 stored as Latin-1)
      try {
        value = Buffer.from(value, 'latin1').toString('utf8')
      } catch {
        // ignore
      }

      if (field.type === 'N') {
        value = value ? parseFloat(value) : 0
      }

      record[field.name] = value
      fieldOffset += field.length
    }

    records.push(record)
    recordOffset += recordLength
  }

  return records
}

// === Leitura de SHP ===
function readShpPolygons(shpPath: string): number[][][][] {
  const buffer = readFileSync(shpPath)
  const polygons: number[][][][] = []

  let offset = 100 // Skip header

  while (offset < buffer.length - 8) {
    // Record header
    const contentLength = buffer.readInt32BE(offset + 4) * 2
    offset += 8

    if (offset + contentLength > buffer.length) break

    const shapeType = buffer.readInt32LE(offset)

    if (shapeType === 0) {
      // Null
      polygons.push([])
      continue
    }

    if (shapeType !== 5 && shapeType !== 15) {
      // Not Polygon
      offset += contentLength
      polygons.push([])
      continue
    }

    // Skip bounding box (32 bytes)
    let polyOffset = offset + 4 + 32

    const numParts = buffer.readInt32LE(polyOffset)
    const numPoints = buffer.readInt32LE(polyOffset + 4)
    polyOffset += 8

    // Part indices
    const parts: number[] = []
    for (let i = 0; i < numParts; i++) {
      parts.push(buffer.readInt32LE(polyOffset + i * 4))
    }
    polyOffset += numParts * 4

    // Points
    const points: [number, number][] = []
    for (let i = 0; i < numPoints; i++) {
      const x = buffer.readDoubleLE(polyOffset + i * 16)
      const y = buffer.readDoubleLE(polyOffset + i * 16 + 8)
      points.push([x, y])
    }

    // Split into rings
    const rings: number[][][] = []
    for (let i = 0; i < parts.length; i++) {
      const start = parts[i]
      const end = i + 1 < parts.length ? parts[i + 1] : numPoints
      rings.push(points.slice(start, end))
    }

    polygons.push(rings)
    offset += contentLength
  }

  return polygons
}

// === Parâmetros urbanísticos de Santos (LC 1187/2022) ===
const SANTOS_ZONE_PARAMS: Record<
  string,
  {
    max_height: number
    max_floors: number
    max_far: number
    max_coverage: number
    min_setback: number
    allowed_uses: string[]
    color: string
  }
> = {
  ZR1: {
    max_height: 9,
    max_floors: 2,
    max_far: 1.0,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['residencial unifamiliar'],
    color: '#22C55E',
  },
  ZR2: {
    max_height: 15,
    max_floors: 4,
    max_far: 1.5,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['residencial', 'comércio local'],
    color: '#4ADE80',
  },
  ZR3: {
    max_height: 36,
    max_floors: 12,
    max_far: 2.5,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['residencial', 'comércio', 'serviços'],
    color: '#86EFAC',
  },
  ZM1: {
    max_height: 60,
    max_floors: 20,
    max_far: 3.0,
    max_coverage: 0.6,
    min_setback: 4,
    allowed_uses: ['residencial', 'comércio', 'serviços', 'institucional'],
    color: '#FCD34D',
  },
  ZM2: {
    max_height: 100,
    max_floors: 30,
    max_far: 4.0,
    max_coverage: 0.7,
    min_setback: 5,
    allowed_uses: ['residencial', 'comércio', 'serviços', 'hotelaria'],
    color: '#FBBF24',
  },
  ZC: {
    max_height: 120,
    max_floors: 40,
    max_far: 4.5,
    max_coverage: 0.8,
    min_setback: 0,
    allowed_uses: ['comércio', 'serviços', 'residencial', 'institucional'],
    color: '#F97316',
  },
  ZI: {
    max_height: 25,
    max_floors: 3,
    max_far: 1.0,
    max_coverage: 0.6,
    min_setback: 10,
    allowed_uses: ['industrial', 'logística', 'comércio atacadista'],
    color: '#6B7280',
  },
  ZPM: {
    max_height: 40,
    max_floors: 8,
    max_far: 1.5,
    max_coverage: 0.7,
    min_setback: 5,
    allowed_uses: ['portuário', 'logística', 'industrial'],
    color: '#1E3A5F',
  },
  ZUT: {
    max_height: 80,
    max_floors: 25,
    max_far: 3.5,
    max_coverage: 0.5,
    min_setback: 6,
    allowed_uses: ['hotelaria', 'turismo', 'comércio', 'residencial'],
    color: '#8B5CF6',
  },
  ZOR: {
    max_height: 45,
    max_floors: 15,
    max_far: 2.0,
    max_coverage: 0.4,
    min_setback: 8,
    allowed_uses: ['turismo', 'comércio', 'serviços', 'residencial'],
    color: '#06B6D4',
  },
  ZEIS: {
    max_height: 36,
    max_floors: 12,
    max_far: 2.5,
    max_coverage: 0.6,
    min_setback: 3,
    allowed_uses: ['habitação social', 'comércio local', 'equipamentos'],
    color: '#A16207',
  },
  ZPA: {
    max_height: 9,
    max_floors: 2,
    max_far: 0.2,
    max_coverage: 0.1,
    min_setback: 15,
    allowed_uses: ['preservação', 'ecoturismo'],
    color: '#166534',
  },
  ZEE: {
    max_height: 50,
    max_floors: 15,
    max_far: 2.5,
    max_coverage: 0.6,
    min_setback: 5,
    allowed_uses: ['comércio', 'serviços', 'industrial não poluente'],
    color: '#EF4444',
  },
}

function getZoneParams(sigla: string) {
  const normalized = sigla?.toUpperCase().trim() || ''

  // Busca exata
  if (SANTOS_ZONE_PARAMS[normalized]) {
    return SANTOS_ZONE_PARAMS[normalized]
  }

  // Busca parcial (ex: ZR1-A -> ZR1)
  for (const key of Object.keys(SANTOS_ZONE_PARAMS)) {
    if (normalized.startsWith(key)) {
      return SANTOS_ZONE_PARAMS[key]
    }
  }

  // Default
  return {
    max_height: 15,
    max_floors: 5,
    max_far: 1.0,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['diversos'],
    color: '#9CA3AF',
  }
}

// === Main ===
async function main() {
  const santosDataDir = '/Users/rbuchler/Documents/iptu-saas/data/shapefiles/santos'
  const outputDir = join(__dirname, '..', 'examples', 'basic', 'data')

  mkdirSync(outputDir, { recursive: true })

  console.log('=== Gerando dados de Santos ===\n')

  // 1. Converter zoneamento
  console.log('1. Convertendo zoneamento...')
  const shpPath = join(santosDataDir, 'ZONEAMENTO_LC1187-2022_SIR.shp')
  const dbfPath = join(santosDataDir, 'ZONEAMENTO_LC1187-2022_SIR.dbf')

  const records = readDbfRecords(dbfPath)
  const polygons = readShpPolygons(shpPath)

  console.log(`   Registros DBF: ${records.length}`)
  console.log(`   Polígonos SHP: ${polygons.length}`)

  const zoningFeatures = records
    .map((record, index) => {
      const geometry = polygons[index] || []
      if (geometry.length === 0) return null

      const convertedCoords = convertPolygonToLatLon(geometry)
      const params = getZoneParams(record.SIGLA)

      return {
        type: 'Feature',
        properties: {
          id: `zone-${index}`,
          zone_code: record.SIGLA || '',
          zone_name: record.NOME || `Zona ${record.SIGLA}`,
          ...params,
        },
        geometry: {
          type: 'Polygon',
          coordinates: convertedCoords,
        },
      }
    })
    .filter(Boolean)

  const zoningGeoJson = {
    type: 'FeatureCollection',
    features: zoningFeatures,
  }

  const zoningPath = join(outputDir, 'santos_zoneamento.json')
  writeFileSync(zoningPath, JSON.stringify(zoningGeoJson))
  console.log(`   Salvo: ${zoningPath} (${zoningFeatures.length} zonas)\n`)

  // 2. Copiar limite municipal (já está em WGS84)
  console.log('2. Copiando limite municipal...')
  const limitePath = join(santosDataDir, 'limite_municipal.geojson')
  const limiteContent = readFileSync(limitePath, 'utf-8')
  const limiteOutputPath = join(outputDir, 'santos_limite.json')
  writeFileSync(limiteOutputPath, limiteContent)
  console.log(`   Salvo: ${limiteOutputPath}\n`)

  // 3. Gerar infraestrutura baseada nas bordas dos polígonos (seguindo ruas reais)
  console.log('3. Gerando infraestrutura baseada no traçado urbano...')

  // Função para calcular distância entre pontos
  function distance(p1: number[], p2: number[]): number {
    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Extrair arestas longas e únicas dos polígonos de zoneamento
  const edgeSet = new Set<string>()
  const edges: number[][][] = []
  const minEdgeLength = 0.0005 // ~50m no equador

  zoningFeatures.forEach((f: any) => {
    const coords = f.geometry.coordinates[0]

    // Simplificar: pegar apenas vértices principais (a cada N pontos)
    const simplified: number[][] = []
    for (let i = 0; i < coords.length; i += 3) {
      simplified.push(coords[i])
    }
    if (simplified.length < 2) return

    // Criar arestas do polígono simplificado
    for (let i = 0; i < simplified.length; i++) {
      const p1 = simplified[i]
      const p2 = simplified[(i + 1) % simplified.length]

      // Filtrar arestas muito curtas
      if (distance(p1, p2) < minEdgeLength) continue

      // Criar chave única para evitar duplicatas
      const key = [p1, p2]
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`)
        .join('|')

      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push([p1, p2])
      }
    }
  })

  console.log(`   Extraídas ${edges.length} arestas principais do zoneamento`)

  // Tipos de infraestrutura com probabilidade de estar em cada rua
  const infraTypes = [
    { type: 'electricity', depth: -2, color: '#FACC15', label: 'Elétrica', probability: 0.9 },
    { type: 'water', depth: -8, color: '#0096FF', label: 'Água', probability: 0.8 },
    { type: 'sewage', depth: -12, color: '#8B5A2B', label: 'Esgoto', probability: 0.7 },
    { type: 'telecom', depth: -3, color: '#A855F7', label: 'Telecom', probability: 0.6 },
    { type: 'drainage', depth: -15, color: '#00C8C8', label: 'Drenagem', probability: 0.45 },
    { type: 'gas', depth: -4, color: '#FFB400', label: 'Gás', probability: 0.35 },
    { type: 'fiber', depth: -1, color: '#22D3EE', label: 'Fibra Óptica', probability: 0.3 },
  ]

  const infraFeatures: any[] = []

  // Para cada tipo de infraestrutura, selecionar um subconjunto das arestas
  for (const infra of infraTypes) {
    console.log(`   Gerando ${infra.label}...`)

    let count = 0
    edges.forEach((edge, idx) => {
      // Usar hash do índice para consistência
      const hash = (idx * 31 + infra.type.charCodeAt(0)) % 100
      if (hash < infra.probability * 100) {
        infraFeatures.push({
          type: 'Feature',
          properties: {
            id: `${infra.type}-${idx}`,
            infra_type: infra.type,
            depth: infra.depth,
            color: infra.color,
            label: infra.label,
          },
          geometry: {
            type: 'LineString',
            coordinates: edge,
          },
        })
        count++
      }
    })

    console.log(`      → ${count} segmentos`)
  }

  const infraGeoJson = {
    type: 'FeatureCollection',
    features: infraFeatures,
  }

  const infraPath = join(outputDir, 'santos_infraestrutura.json')
  writeFileSync(infraPath, JSON.stringify(infraGeoJson))
  console.log(`   Salvo: ${infraPath} (${infraFeatures.length} total)\n`)

  console.log('=== Conversão concluída ===')
  console.log(`\nArquivos gerados em: ${outputDir}`)
}

main().catch(console.error)
