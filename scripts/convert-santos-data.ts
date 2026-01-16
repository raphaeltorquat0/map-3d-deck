/**
 * Script para converter dados de Santos (shapefiles) para GeoJSON
 * e preparar para uso no exemplo do map-3d-deck
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Constantes para conversão UTM Zone 23S (SIRGAS 2000) -> WGS84
const UTM_ZONE = 23
const UTM_SOUTH = true

/**
 * Converte coordenadas UTM para Lat/Lng (WGS84)
 * Baseado em formulas de Karney (2011)
 */
function utmToLatLng(easting: number, northing: number): [number, number] {
  const k0 = 0.9996
  const a = 6378137 // WGS84 semi-major axis
  const e = 0.0818191908426 // WGS84 eccentricity
  const e1sq = 0.006739496742
  const falseEasting = 500000
  const falseNorthing = UTM_SOUTH ? 10000000 : 0

  const x = easting - falseEasting
  const y = northing - falseNorthing

  const M = y / k0
  const mu = M / (a * (1 - (e * e) / 4 - (3 * e * e * e * e) / 64))

  const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e))

  const J1 = (3 * e1) / 2 - (27 * e1 * e1 * e1) / 32
  const J2 = (21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32
  const J3 = (151 * e1 * e1 * e1) / 96
  const J4 = (1097 * e1 * e1 * e1 * e1) / 512

  const fp =
    mu +
    J1 * Math.sin(2 * mu) +
    J2 * Math.sin(4 * mu) +
    J3 * Math.sin(6 * mu) +
    J4 * Math.sin(8 * mu)

  const C1 = e1sq * Math.cos(fp) * Math.cos(fp)
  const T1 = Math.tan(fp) * Math.tan(fp)
  const R1 = (a * (1 - e * e)) / Math.pow(1 - e * e * Math.sin(fp) * Math.sin(fp), 1.5)
  const N1 = a / Math.sqrt(1 - e * e * Math.sin(fp) * Math.sin(fp))
  const D = x / (N1 * k0)

  const Q1 = (N1 * Math.tan(fp)) / R1
  const Q2 = (D * D) / 2
  const Q3 = ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e1sq) * D * D * D * D) / 24
  const Q4 =
    ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e1sq - 3 * C1 * C1) * D * D * D * D * D * D) /
    720

  const lat = (fp - Q1 * (Q2 - Q3 + Q4)) * (180 / Math.PI)

  const Q5 = D
  const Q6 = ((1 + 2 * T1 + C1) * D * D * D) / 6
  const Q7 =
    ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e1sq + 24 * T1 * T1) * D * D * D * D * D) / 120

  const lonOrigin = (UTM_ZONE - 1) * 6 - 180 + 3
  const lng = lonOrigin + ((Q5 - Q6 + Q7) / Math.cos(fp)) * (180 / Math.PI)

  return [lng, lat]
}

/**
 * Transforma coordenadas de um array de rings
 */
function transformCoordinates(coords: number[][][]): number[][][] {
  return coords.map((ring) =>
    ring.map((point) => {
      const [lng, lat] = utmToLatLng(point[0], point[1])
      return [lng, lat]
    })
  )
}

/**
 * Transforma coordenadas de MultiLineString
 */
function transformMultiLineString(coords: number[][][]): number[][][] {
  return coords.map((line) =>
    line.map((point) => {
      const [lng, lat] = utmToLatLng(point[0], point[1])
      return [lng, lat]
    })
  )
}

// Mapeamento de zonas de Santos para parâmetros urbanísticos
// Baseado na LC 1187/2022 (LUOS de Santos)
const SANTOS_ZONING_PARAMS: Record<
  string,
  {
    nome: string
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
    nome: 'Zona Residencial 1',
    max_height: 9,
    max_floors: 2,
    max_far: 1.0,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['residencial unifamiliar'],
    color: '#22C55E',
  },
  ZR2: {
    nome: 'Zona Residencial 2',
    max_height: 15,
    max_floors: 4,
    max_far: 1.5,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['residencial', 'comércio local'],
    color: '#4ADE80',
  },
  ZR3: {
    nome: 'Zona Residencial 3',
    max_height: 36,
    max_floors: 12,
    max_far: 2.5,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['residencial', 'comércio', 'serviços'],
    color: '#86EFAC',
  },
  ZM1: {
    nome: 'Zona Mista 1',
    max_height: 60,
    max_floors: 20,
    max_far: 3.0,
    max_coverage: 0.6,
    min_setback: 4,
    allowed_uses: ['residencial', 'comércio', 'serviços', 'institucional'],
    color: '#FCD34D',
  },
  ZM2: {
    nome: 'Zona Mista 2',
    max_height: 100,
    max_floors: 30,
    max_far: 4.0,
    max_coverage: 0.7,
    min_setback: 5,
    allowed_uses: ['residencial', 'comércio', 'serviços', 'hotelaria'],
    color: '#FBBF24',
  },
  ZC: {
    nome: 'Zona Central',
    max_height: 120,
    max_floors: 40,
    max_far: 4.5,
    max_coverage: 0.8,
    min_setback: 0,
    allowed_uses: ['comércio', 'serviços', 'residencial', 'institucional'],
    color: '#F97316',
  },
  ZI: {
    nome: 'Zona Industrial',
    max_height: 25,
    max_floors: 3,
    max_far: 1.0,
    max_coverage: 0.6,
    min_setback: 10,
    allowed_uses: ['industrial', 'logística', 'comércio atacadista'],
    color: '#6B7280',
  },
  ZPM: {
    nome: 'Zona Portuária e Marítima',
    max_height: 40,
    max_floors: 8,
    max_far: 1.5,
    max_coverage: 0.7,
    min_setback: 5,
    allowed_uses: ['portuário', 'logística', 'industrial'],
    color: '#1E3A5F',
  },
  ZUT: {
    nome: 'Zona de Uso Turístico',
    max_height: 80,
    max_floors: 25,
    max_far: 3.5,
    max_coverage: 0.5,
    min_setback: 6,
    allowed_uses: ['hotelaria', 'turismo', 'comércio', 'residencial'],
    color: '#8B5CF6',
  },
  ZOR: {
    nome: 'Zona de Orla',
    max_height: 45,
    max_floors: 15,
    max_far: 2.0,
    max_coverage: 0.4,
    min_setback: 8,
    allowed_uses: ['turismo', 'comércio', 'serviços', 'residencial'],
    color: '#06B6D4',
  },
  ZEIS: {
    nome: 'Zona Especial de Interesse Social',
    max_height: 36,
    max_floors: 12,
    max_far: 2.5,
    max_coverage: 0.6,
    min_setback: 3,
    allowed_uses: ['habitação social', 'comércio local', 'equipamentos'],
    color: '#A16207',
  },
  ZPA: {
    nome: 'Zona de Proteção Ambiental',
    max_height: 9,
    max_floors: 2,
    max_far: 0.2,
    max_coverage: 0.1,
    min_setback: 15,
    allowed_uses: ['preservação', 'ecoturismo'],
    color: '#166534',
  },
  ZEE: {
    nome: 'Zona de Especial Interesse Econômico',
    max_height: 50,
    max_floors: 15,
    max_far: 2.5,
    max_coverage: 0.6,
    min_setback: 5,
    allowed_uses: ['comércio', 'serviços', 'industrial não poluente'],
    color: '#EF4444',
  },
}

// Função para obter parâmetros de uma zona
function getZoneParams(sigla: string) {
  // Normaliza a sigla
  const normalized = sigla?.toUpperCase().trim() || ''

  // Busca exata
  if (SANTOS_ZONING_PARAMS[normalized]) {
    return { ...SANTOS_ZONING_PARAMS[normalized], zone_code: normalized }
  }

  // Busca parcial (ex: ZR1-A -> ZR1)
  for (const key of Object.keys(SANTOS_ZONING_PARAMS)) {
    if (normalized.startsWith(key)) {
      return { ...SANTOS_ZONING_PARAMS[key], zone_code: normalized }
    }
  }

  // Default para zonas não mapeadas
  return {
    zone_code: normalized || 'UNKNOWN',
    nome: `Zona ${normalized || 'Não Identificada'}`,
    max_height: 15,
    max_floors: 5,
    max_far: 1.0,
    max_coverage: 0.5,
    min_setback: 4,
    allowed_uses: ['diversos'],
    color: '#9CA3AF',
  }
}

/**
 * Lê arquivo GeoJSON de infraestrutura e converte coordenadas
 */
async function processInfrastructureFile(
  inputPath: string,
  outputPath: string,
  type: string,
  depth: number
): Promise<void> {
  console.log(`Processing: ${inputPath}`)

  if (!existsSync(inputPath)) {
    console.log(`  File not found, skipping`)
    return
  }

  const content = readFileSync(inputPath, 'utf-8')
  const geojson = JSON.parse(content)

  // Limitar número de features para o exemplo (performance)
  const maxFeatures = 500
  const features = geojson.features.slice(0, maxFeatures).map((feature: any, idx: number) => {
    let transformedGeometry = feature.geometry

    if (feature.geometry.type === 'MultiLineString') {
      transformedGeometry = {
        type: 'MultiLineString',
        coordinates: transformMultiLineString(feature.geometry.coordinates),
      }
    } else if (feature.geometry.type === 'LineString') {
      transformedGeometry = {
        type: 'LineString',
        coordinates: feature.geometry.coordinates.map((point: number[]) => {
          const [lng, lat] = utmToLatLng(point[0], point[1])
          return [lng, lat]
        }),
      }
    } else if (feature.geometry.type === 'Polygon') {
      transformedGeometry = {
        type: 'Polygon',
        coordinates: transformCoordinates(feature.geometry.coordinates),
      }
    } else if (feature.geometry.type === 'Point') {
      const [lng, lat] = utmToLatLng(
        feature.geometry.coordinates[0],
        feature.geometry.coordinates[1]
      )
      transformedGeometry = {
        type: 'Point',
        coordinates: [lng, lat],
      }
    }

    return {
      type: 'Feature',
      properties: {
        id: feature.id || `${type}-${idx}`,
        type: type,
        depth: depth, // profundidade em metros (negativo = subsolo)
        ...feature.properties,
      },
      geometry: transformedGeometry,
    }
  })

  const outputGeojson = {
    type: 'FeatureCollection',
    features,
  }

  writeFileSync(outputPath, JSON.stringify(outputGeojson, null, 2))
  console.log(`  Written ${features.length} features to ${outputPath}`)
}

// Main
async function main() {
  const santosDataDir = '/Users/rbuchler/Documents/iptu-saas/data/shapefiles/santos'
  const outputDir = join(__dirname, '..', 'examples', 'basic', 'data')

  // Criar diretório de saída
  const { mkdirSync } = await import('fs')
  mkdirSync(outputDir, { recursive: true })

  console.log('=== Convertendo dados de Santos ===\n')

  // Processar infraestrutura subterrânea
  const infraFiles = [
    { file: 'rede_agua.geojson', type: 'water', depth: -3 },
    { file: 'rede_esgoto.geojson', type: 'sewage', depth: -5 },
    { file: 'rede_gas.geojson', type: 'gas', depth: -2 },
    { file: 'drenagem.geojson', type: 'drainage', depth: -4 },
  ]

  for (const { file, type, depth } of infraFiles) {
    await processInfrastructureFile(
      join(santosDataDir, 'infraestrutura', file),
      join(outputDir, `santos_${type}.json`),
      type,
      depth
    )
  }

  console.log('\n=== Conversão concluída ===')
  console.log(`\nDados salvos em: ${outputDir}`)
  console.log('\nNota: O zoneamento requer conversão de shapefile.')
  console.log('Use ogr2ogr ou biblioteca Python para converter o shapefile.')
}

main().catch(console.error)
