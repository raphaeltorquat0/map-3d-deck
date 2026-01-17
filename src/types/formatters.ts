/**
 * Sistema de formatação de propriedades de features
 * Permite configuração declarativa para exibição de dados
 */

/**
 * Configuração de um campo formatável
 */
export interface FieldConfig<T = unknown> {
  /** Label de exibição do campo */
  label: string
  /** Função de formatação do valor */
  format?: (value: T) => string
  /** Unidade de medida (opcional) */
  unit?: string
  /** Se deve ocultar o campo quando o valor for null/undefined */
  hideEmpty?: boolean
  /** Ordem de exibição (menor = primeiro) */
  order?: number
}

/**
 * Mapa de configurações de campos
 * A chave é o nome da propriedade original
 */
export type FieldFormatters = Record<string, FieldConfig>

/**
 * Resultado da formatação de uma propriedade
 */
export interface FormattedField {
  /** Nome original da propriedade */
  key: string
  /** Label de exibição */
  label: string
  /** Valor formatado como string */
  value: string
  /** Valor original */
  rawValue: unknown
  /** Ordem de exibição */
  order: number
}

/**
 * Opções para formatação de propriedades
 */
export interface FormatOptions {
  /** Se deve incluir campos não configurados */
  includeUnformatted?: boolean
  /** Label padrão para campos não configurados (usa a chave se não fornecido) */
  defaultLabel?: (key: string) => string
  /** Se deve filtrar campos com valores vazios */
  filterEmpty?: boolean
}

/**
 * Formatadores pré-definidos para tipos comuns
 */
export type PredefinedFormatter =
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'meters'
  | 'millimeters'
  | 'squareMeters'

/**
 * Mapa de labels de status comuns
 */
export const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  maintenance: 'Em Manutenção',
  planned: 'Planejado',
  under_construction: 'Em Construção',
  decommissioned: 'Descomissionado',
}

/**
 * Mapa de labels de tipos de rede
 */
export const NETWORK_TYPE_LABELS: Record<string, string> = {
  water: 'Água',
  sewage: 'Esgoto',
  gas: 'Gás',
  electric: 'Elétrica',
  telecom: 'Telecomunicações',
  drainage: 'Drenagem',
  metro: 'Metrô',
}

/**
 * Mapa de labels de tipos de uso de edificação
 */
export const BUILDING_USE_LABELS: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  mixed: 'Misto',
  industrial: 'Industrial',
  institutional: 'Institucional',
}

/**
 * Mapa de labels de níveis de risco
 */
export const RISK_LEVEL_LABELS: Record<string, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico',
}
