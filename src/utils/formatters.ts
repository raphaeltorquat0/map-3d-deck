/**
 * Utilitários de formatação de propriedades de features
 */

import type {
  FieldFormatters,
  FormattedField,
  FormatOptions,
  PredefinedFormatter,
} from '../types/formatters'

/**
 * Cria um mapa de formatadores de campos
 */
export function createFieldFormatters(config: FieldFormatters): FieldFormatters {
  return config
}

/**
 * Formata um valor único usando um formatador pré-definido
 */
export function formatValue(value: unknown, formatter?: PredefinedFormatter): string {
  if (value === null || value === undefined) {
    return '-'
  }

  if (!formatter) {
    return String(value)
  }

  switch (formatter) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value)

    case 'currency':
      return typeof value === 'number'
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : String(value)

    case 'percent':
      return typeof value === 'number'
        ? `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
        : String(value)

    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('pt-BR')
      }
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value)
        return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR')
      }
      return String(value)

    case 'datetime':
      if (value instanceof Date) {
        return value.toLocaleString('pt-BR')
      }
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value)
        return isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR')
      }
      return String(value)

    case 'boolean':
      return value ? 'Sim' : 'Não'

    case 'meters':
      return typeof value === 'number' ? `${value.toLocaleString('pt-BR')} m` : String(value)

    case 'millimeters':
      return typeof value === 'number' ? `${value.toLocaleString('pt-BR')} mm` : String(value)

    case 'squareMeters':
      return typeof value === 'number' ? `${value.toLocaleString('pt-BR')} m²` : String(value)

    default:
      return String(value)
  }
}

/**
 * Formata o ano de instalação
 */
export function formatYear(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'string') {
    const year = parseInt(value, 10)
    return isNaN(year) ? value : year.toString()
  }
  return String(value)
}

/**
 * Formata profundidade (valor absoluto em metros)
 */
export function formatDepth(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return `${Math.abs(value).toLocaleString('pt-BR')} m`
  }
  return String(value)
}

/**
 * Formata diâmetro em milímetros
 */
export function formatDiameter(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return `${value.toLocaleString('pt-BR')} mm`
  }
  return String(value)
}

/**
 * Formata área em metros quadrados
 */
export function formatArea(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return `${value.toLocaleString('pt-BR')} m²`
  }
  return String(value)
}

/**
 * Formata altura em metros
 */
export function formatHeight(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return `${value.toLocaleString('pt-BR')} m`
  }
  return String(value)
}

/**
 * Verifica se um valor é considerado vazio
 */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

/**
 * Converte chave de propriedade para label legível
 * Ex: "year_installed" -> "Year Installed"
 */
export function keyToLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Formata as propriedades de uma feature usando os formatadores configurados
 */
export function formatFeatureProperties(
  properties: Record<string, unknown>,
  formatters: FieldFormatters,
  options: FormatOptions = {}
): FormattedField[] {
  const { includeUnformatted = false, defaultLabel, filterEmpty = true } = options

  const result: FormattedField[] = []
  const processedKeys = new Set<string>()

  // Processa campos configurados
  for (const [key, config] of Object.entries(formatters)) {
    processedKeys.add(key)
    const rawValue = properties[key]

    // Pula campos vazios se configurado
    if (filterEmpty && config.hideEmpty !== false && isEmpty(rawValue)) {
      continue
    }

    const formattedValue = config.format ? config.format(rawValue) : String(rawValue ?? '-')

    result.push({
      key,
      label: config.label,
      value: formattedValue,
      rawValue,
      order: config.order ?? 999,
    })
  }

  // Inclui campos não formatados se solicitado
  if (includeUnformatted) {
    for (const [key, rawValue] of Object.entries(properties)) {
      if (processedKeys.has(key)) continue
      if (filterEmpty && isEmpty(rawValue)) continue

      result.push({
        key,
        label: defaultLabel ? defaultLabel(key) : keyToLabel(key),
        value: String(rawValue ?? '-'),
        rawValue,
        order: 9999,
      })
    }
  }

  // Ordena por ordem
  result.sort((a, b) => a.order - b.order)

  return result
}

/**
 * Converte FormattedField[] para objeto simples { label: value }
 */
export function formattedFieldsToObject(fields: FormattedField[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const field of fields) {
    result[field.label] = field.value
  }
  return result
}

/**
 * Cria um formatador de status usando um mapa de labels
 */
export function createStatusFormatter(labels: Record<string, string>): (value: unknown) => string {
  return (value: unknown) => {
    if (value === null || value === undefined) return '-'
    const key = String(value)
    return labels[key] ?? key
  }
}

/**
 * Formatadores pré-configurados para infraestrutura subterrânea
 */
export const SUBSURFACE_FORMATTERS: FieldFormatters = {
  network_type: {
    label: 'Tipo de Rede',
    format: createStatusFormatter({
      water: 'Água',
      sewage: 'Esgoto',
      gas: 'Gás',
      electric: 'Elétrica',
      telecom: 'Telecomunicações',
      drainage: 'Drenagem',
      metro: 'Metrô',
    }),
    order: 1,
  },
  diameter: {
    label: 'Diâmetro',
    format: formatDiameter,
    order: 2,
  },
  depth: {
    label: 'Profundidade',
    format: formatDepth,
    order: 3,
  },
  material: {
    label: 'Material',
    order: 4,
  },
  year_installed: {
    label: 'Ano de Instalação',
    format: formatYear,
    order: 5,
  },
  status: {
    label: 'Status',
    format: createStatusFormatter({
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Em Manutenção',
    }),
    order: 6,
  },
  owner: {
    label: 'Proprietário',
    order: 7,
  },
}

/**
 * Formatadores pré-configurados para edificações
 */
export const BUILDING_FORMATTERS: FieldFormatters = {
  name: {
    label: 'Nome',
    order: 1,
  },
  height: {
    label: 'Altura',
    format: formatHeight,
    order: 2,
  },
  floors: {
    label: 'Pavimentos',
    order: 3,
  },
  use_type: {
    label: 'Uso',
    format: createStatusFormatter({
      residential: 'Residencial',
      commercial: 'Comercial',
      mixed: 'Misto',
      industrial: 'Industrial',
      institutional: 'Institucional',
    }),
    order: 4,
  },
  area_m2: {
    label: 'Área',
    format: formatArea,
    order: 5,
  },
  year_built: {
    label: 'Ano de Construção',
    format: formatYear,
    order: 6,
  },
  zone_code: {
    label: 'Zona',
    order: 7,
  },
}

/**
 * Formatadores pré-configurados para zoneamento
 */
export const ZONING_FORMATTERS: FieldFormatters = {
  zone_code: {
    label: 'Código da Zona',
    order: 1,
  },
  zone_name: {
    label: 'Nome da Zona',
    order: 2,
  },
  max_height: {
    label: 'Gabarito Máximo',
    format: formatHeight,
    order: 3,
  },
  max_floors: {
    label: 'Pavimentos Máx.',
    order: 4,
  },
  max_far: {
    label: 'Coef. Aproveitamento',
    order: 5,
  },
  max_coverage: {
    label: 'Taxa de Ocupação',
    format: (v) => (typeof v === 'number' ? `${(v * 100).toFixed(0)}%` : String(v)),
    order: 6,
  },
  min_setback: {
    label: 'Recuo Mínimo',
    format: formatHeight,
    order: 7,
  },
}
