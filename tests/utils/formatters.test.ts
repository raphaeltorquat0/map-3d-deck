import { describe, it, expect } from 'vitest'
import {
  createFieldFormatters,
  formatValue,
  formatYear,
  formatDepth,
  formatDiameter,
  formatArea,
  formatHeight,
  keyToLabel,
  formatFeatureProperties,
  formattedFieldsToObject,
  createStatusFormatter,
  SUBSURFACE_FORMATTERS,
  BUILDING_FORMATTERS,
  ZONING_FORMATTERS,
} from '../../src/utils/formatters'

describe('formatters', () => {
  describe('createFieldFormatters', () => {
    it('should create field formatters config', () => {
      const formatters = createFieldFormatters({
        name: { label: 'Nome' },
        value: { label: 'Valor', format: (v) => `R$ ${v}` },
      })

      expect(formatters.name.label).toBe('Nome')
      expect(formatters.value.label).toBe('Valor')
      expect(formatters.value.format?.(100)).toBe('R$ 100')
    })
  })

  describe('formatValue', () => {
    it('should return "-" for null/undefined', () => {
      expect(formatValue(null)).toBe('-')
      expect(formatValue(undefined)).toBe('-')
    })

    it('should format numbers', () => {
      expect(formatValue(1234.56, 'number')).toBe('1.234,56')
    })

    it('should format currency', () => {
      const formatted = formatValue(1234.56, 'currency')
      expect(formatted).toContain('1.234,56')
      expect(formatted).toContain('R$')
    })

    it('should format percent', () => {
      expect(formatValue(0.5, 'percent')).toBe('50%')
      expect(formatValue(0.123, 'percent')).toBe('12,3%')
    })

    it('should format dates', () => {
      const date = new Date(2023, 5, 15)
      expect(formatValue(date, 'date')).toBe('15/06/2023')
    })

    it('should format boolean', () => {
      expect(formatValue(true, 'boolean')).toBe('Sim')
      expect(formatValue(false, 'boolean')).toBe('Não')
    })

    it('should format meters', () => {
      expect(formatValue(10, 'meters')).toBe('10 m')
    })

    it('should format millimeters', () => {
      expect(formatValue(150, 'millimeters')).toBe('150 mm')
    })

    it('should format square meters', () => {
      expect(formatValue(100, 'squareMeters')).toBe('100 m²')
    })

    it('should return string for unknown formatter', () => {
      expect(formatValue('test')).toBe('test')
    })
  })

  describe('formatYear', () => {
    it('should format number year', () => {
      expect(formatYear(2023)).toBe('2023')
    })

    it('should format string year', () => {
      expect(formatYear('2020')).toBe('2020')
    })

    it('should return "-" for null/undefined', () => {
      expect(formatYear(null)).toBe('-')
      expect(formatYear(undefined)).toBe('-')
    })
  })

  describe('formatDepth', () => {
    it('should format positive depth', () => {
      expect(formatDepth(5)).toBe('5 m')
    })

    it('should format negative depth as absolute', () => {
      expect(formatDepth(-10)).toBe('10 m')
    })

    it('should return "-" for null/undefined', () => {
      expect(formatDepth(null)).toBe('-')
    })
  })

  describe('formatDiameter', () => {
    it('should format diameter in mm', () => {
      expect(formatDiameter(150)).toBe('150 mm')
    })

    it('should return "-" for null/undefined', () => {
      expect(formatDiameter(null)).toBe('-')
    })
  })

  describe('formatArea', () => {
    it('should format area in m²', () => {
      expect(formatArea(1000)).toBe('1.000 m²')
    })

    it('should return "-" for null/undefined', () => {
      expect(formatArea(null)).toBe('-')
    })
  })

  describe('formatHeight', () => {
    it('should format height in m', () => {
      expect(formatHeight(25)).toBe('25 m')
    })

    it('should return "-" for null/undefined', () => {
      expect(formatHeight(null)).toBe('-')
    })
  })

  describe('keyToLabel', () => {
    it('should convert snake_case to Title Case', () => {
      expect(keyToLabel('year_installed')).toBe('Year Installed')
    })

    it('should convert camelCase to Title Case', () => {
      expect(keyToLabel('yearInstalled')).toBe('Year Installed')
    })

    it('should handle single words', () => {
      expect(keyToLabel('name')).toBe('Name')
    })
  })

  describe('formatFeatureProperties', () => {
    const formatters = createFieldFormatters({
      diameter: { label: 'Diâmetro', format: formatDiameter, order: 1 },
      depth: { label: 'Profundidade', format: formatDepth, order: 2 },
      status: { label: 'Status', order: 3 },
    })

    it('should format properties using formatters', () => {
      const properties = {
        diameter: 150,
        depth: -5,
        status: 'active',
      }

      const result = formatFeatureProperties(properties, formatters)

      expect(result).toHaveLength(3)
      expect(result[0].label).toBe('Diâmetro')
      expect(result[0].value).toBe('150 mm')
      expect(result[1].label).toBe('Profundidade')
      expect(result[1].value).toBe('5 m')
      expect(result[2].label).toBe('Status')
      expect(result[2].value).toBe('active')
    })

    it('should respect order', () => {
      const properties = {
        status: 'active',
        diameter: 150,
        depth: -5,
      }

      const result = formatFeatureProperties(properties, formatters)

      expect(result[0].key).toBe('diameter')
      expect(result[1].key).toBe('depth')
      expect(result[2].key).toBe('status')
    })

    it('should filter empty values by default', () => {
      const properties = {
        diameter: 150,
        depth: null,
        status: undefined,
      }

      const result = formatFeatureProperties(properties, formatters)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('diameter')
    })

    it('should include unformatted fields when requested', () => {
      const properties = {
        diameter: 150,
        extra_field: 'extra',
      }

      const result = formatFeatureProperties(properties, formatters, {
        includeUnformatted: true,
      })

      expect(result).toHaveLength(2)
      expect(result.some((f) => f.key === 'extra_field')).toBe(true)
    })

    it('should use custom label function for unformatted fields', () => {
      const properties = {
        diameter: 150,
        extra_field: 'extra',
      }

      const result = formatFeatureProperties(properties, formatters, {
        includeUnformatted: true,
        defaultLabel: (key) => `Custom: ${key}`,
      })

      const extraField = result.find((f) => f.key === 'extra_field')
      expect(extraField?.label).toBe('Custom: extra_field')
    })
  })

  describe('formattedFieldsToObject', () => {
    it('should convert formatted fields to object', () => {
      const fields = [
        { key: 'diameter', label: 'Diâmetro', value: '150 mm', rawValue: 150, order: 1 },
        { key: 'depth', label: 'Profundidade', value: '5 m', rawValue: -5, order: 2 },
      ]

      const result = formattedFieldsToObject(fields)

      expect(result).toEqual({
        Diâmetro: '150 mm',
        Profundidade: '5 m',
      })
    })
  })

  describe('createStatusFormatter', () => {
    it('should create a status formatter', () => {
      const formatter = createStatusFormatter({
        active: 'Ativo',
        inactive: 'Inativo',
      })

      expect(formatter('active')).toBe('Ativo')
      expect(formatter('inactive')).toBe('Inativo')
    })

    it('should return original value for unknown status', () => {
      const formatter = createStatusFormatter({
        active: 'Ativo',
      })

      expect(formatter('unknown')).toBe('unknown')
    })

    it('should return "-" for null/undefined', () => {
      const formatter = createStatusFormatter({})
      expect(formatter(null)).toBe('-')
      expect(formatter(undefined)).toBe('-')
    })
  })

  describe('Pre-configured formatters', () => {
    it('SUBSURFACE_FORMATTERS should have required fields', () => {
      expect(SUBSURFACE_FORMATTERS.network_type).toBeDefined()
      expect(SUBSURFACE_FORMATTERS.diameter).toBeDefined()
      expect(SUBSURFACE_FORMATTERS.depth).toBeDefined()
      expect(SUBSURFACE_FORMATTERS.status).toBeDefined()
    })

    it('BUILDING_FORMATTERS should have required fields', () => {
      expect(BUILDING_FORMATTERS.name).toBeDefined()
      expect(BUILDING_FORMATTERS.height).toBeDefined()
      expect(BUILDING_FORMATTERS.floors).toBeDefined()
      expect(BUILDING_FORMATTERS.use_type).toBeDefined()
    })

    it('ZONING_FORMATTERS should have required fields', () => {
      expect(ZONING_FORMATTERS.zone_code).toBeDefined()
      expect(ZONING_FORMATTERS.zone_name).toBeDefined()
      expect(ZONING_FORMATTERS.max_height).toBeDefined()
    })

    it('SUBSURFACE_FORMATTERS should format network_type correctly', () => {
      const formatter = SUBSURFACE_FORMATTERS.network_type.format
      expect(formatter?.('water')).toBe('Água')
      expect(formatter?.('sewage')).toBe('Esgoto')
    })

    it('ZONING_FORMATTERS should format max_coverage as percentage', () => {
      const formatter = ZONING_FORMATTERS.max_coverage.format
      expect(formatter?.(0.7)).toBe('70%')
    })
  })

  describe('formatValue additional cases', () => {
    it('should format datetime from Date object', () => {
      const date = new Date(2023, 5, 15, 14, 30)
      const formatted = formatValue(date, 'datetime')
      expect(formatted).toContain('15/06/2023')
      expect(formatted).toContain('14:30')
    })

    it('should format datetime from string', () => {
      const formatted = formatValue('2023-06-15T14:30:00', 'datetime')
      expect(formatted).toContain('15/06/2023')
    })

    it('should format date from string', () => {
      // Use full ISO string with time to avoid UTC midnight timezone shifts
      const formatted = formatValue('2023-06-15T12:00:00', 'date')
      expect(formatted).toContain('15/06/2023')
    })

    it('should handle invalid date string', () => {
      const formatted = formatValue('not-a-date', 'date')
      expect(formatted).toBe('not-a-date')
    })

    it('should handle invalid datetime string', () => {
      const formatted = formatValue('invalid', 'datetime')
      expect(formatted).toBe('invalid')
    })

    it('should format non-number with number formatter', () => {
      expect(formatValue('abc', 'number')).toBe('abc')
    })

    it('should format non-number with currency formatter', () => {
      expect(formatValue('abc', 'currency')).toBe('abc')
    })

    it('should format non-number with percent formatter', () => {
      expect(formatValue('abc', 'percent')).toBe('abc')
    })

    it('should format non-number with meters formatter', () => {
      expect(formatValue('abc', 'meters')).toBe('abc')
    })

    it('should format non-number with millimeters formatter', () => {
      expect(formatValue('abc', 'millimeters')).toBe('abc')
    })

    it('should format non-number with squareMeters formatter', () => {
      expect(formatValue('abc', 'squareMeters')).toBe('abc')
    })

    it('should handle date from number (timestamp)', () => {
      const timestamp = new Date(2023, 5, 15).getTime()
      const formatted = formatValue(timestamp, 'date')
      expect(formatted).toContain('15/06/2023')
    })
  })

  describe('formatYear additional cases', () => {
    it('should handle non-parseable string', () => {
      expect(formatYear('not-a-year')).toBe('not-a-year')
    })

    it('should handle other types', () => {
      expect(formatYear({ year: 2023 })).toBe('[object Object]')
    })
  })

  describe('formatDepth additional cases', () => {
    it('should handle non-number', () => {
      expect(formatDepth('deep')).toBe('deep')
    })

    it('should handle zero', () => {
      expect(formatDepth(0)).toBe('0 m')
    })
  })

  describe('formatDiameter additional cases', () => {
    it('should handle non-number', () => {
      expect(formatDiameter('large')).toBe('large')
    })
  })

  describe('formatArea additional cases', () => {
    it('should handle non-number', () => {
      expect(formatArea('big')).toBe('big')
    })
  })

  describe('formatHeight additional cases', () => {
    it('should handle non-number', () => {
      expect(formatHeight('tall')).toBe('tall')
    })
  })

  describe('formatFeatureProperties additional cases', () => {
    const formatters = createFieldFormatters({
      diameter: { label: 'Diâmetro', format: formatDiameter, order: 1 },
      optional: { label: 'Optional', hideEmpty: false, order: 2 },
    })

    it('should not filter empty when filterEmpty is false', () => {
      const properties = {
        diameter: null,
      }

      const result = formatFeatureProperties(properties, formatters, {
        filterEmpty: false,
      })

      expect(result).toHaveLength(2)
    })

    it('should include empty fields when hideEmpty is false', () => {
      const properties = {
        diameter: 100,
        optional: null,
      }

      const result = formatFeatureProperties(properties, formatters)

      // optional should be included because hideEmpty is false
      expect(result.some((f) => f.key === 'optional')).toBe(true)
    })

    it('should handle properties with empty string', () => {
      // Use separate formatters without hideEmpty: false to test empty string filtering
      const emptyStringFormatters = createFieldFormatters({
        diameter: { label: 'Diâmetro', format: formatDiameter, order: 1 },
      })
      const properties = {
        diameter: '',
      }

      const result = formatFeatureProperties(properties, emptyStringFormatters)
      expect(result).toHaveLength(0)
    })

    it('should sort unformatted fields to end', () => {
      // Use separate formatters to avoid hideEmpty: false field being included
      const sortFormatters = createFieldFormatters({
        diameter: { label: 'Diâmetro', format: formatDiameter, order: 1 },
      })
      const properties = {
        diameter: 150,
        zzzz_field: 'last',
        aaaa_field: 'first',
      }

      const result = formatFeatureProperties(properties, sortFormatters, {
        includeUnformatted: true,
      })

      // Formatted fields first (order 1), then unformatted (order 9999)
      expect(result[0].key).toBe('diameter')
      expect(result.length).toBe(3)
    })
  })

  describe('BUILDING_FORMATTERS use_type formatter', () => {
    it('should format residential', () => {
      const formatter = BUILDING_FORMATTERS.use_type.format
      expect(formatter?.('residential')).toBe('Residencial')
    })

    it('should format commercial', () => {
      const formatter = BUILDING_FORMATTERS.use_type.format
      expect(formatter?.('commercial')).toBe('Comercial')
    })

    it('should format mixed', () => {
      const formatter = BUILDING_FORMATTERS.use_type.format
      expect(formatter?.('mixed')).toBe('Misto')
    })

    it('should format industrial', () => {
      const formatter = BUILDING_FORMATTERS.use_type.format
      expect(formatter?.('industrial')).toBe('Industrial')
    })

    it('should format institutional', () => {
      const formatter = BUILDING_FORMATTERS.use_type.format
      expect(formatter?.('institutional')).toBe('Institucional')
    })
  })

  describe('SUBSURFACE_FORMATTERS all network types', () => {
    it('should format all network types', () => {
      const formatter = SUBSURFACE_FORMATTERS.network_type.format
      expect(formatter?.('gas')).toBe('Gás')
      expect(formatter?.('electric')).toBe('Elétrica')
      expect(formatter?.('telecom')).toBe('Telecomunicações')
      expect(formatter?.('drainage')).toBe('Drenagem')
      expect(formatter?.('metro')).toBe('Metrô')
    })

    it('should format status correctly', () => {
      const formatter = SUBSURFACE_FORMATTERS.status.format
      expect(formatter?.('active')).toBe('Ativo')
      expect(formatter?.('inactive')).toBe('Inativo')
      expect(formatter?.('maintenance')).toBe('Em Manutenção')
    })
  })

  describe('ZONING_FORMATTERS additional', () => {
    it('should format min_setback as height', () => {
      const formatter = ZONING_FORMATTERS.min_setback.format
      expect(formatter?.(5)).toBe('5 m')
    })

    it('should format max_height', () => {
      const formatter = ZONING_FORMATTERS.max_height.format
      expect(formatter?.(50)).toBe('50 m')
    })

    it('should format max_coverage with non-number', () => {
      const formatter = ZONING_FORMATTERS.max_coverage.format
      expect(formatter?.('high')).toBe('high')
    })
  })

  describe('formatValue edge cases for date/datetime', () => {
    it('should handle object value for date formatter', () => {
      // Object that is not Date, string, or number
      const result = formatValue({ year: 2023 }, 'date')
      expect(result).toBe('[object Object]')
    })

    it('should handle object value for datetime formatter', () => {
      // Object that is not Date, string, or number
      const result = formatValue({ timestamp: 123456 }, 'datetime')
      expect(result).toBe('[object Object]')
    })

    it('should handle array value for date formatter', () => {
      const result = formatValue([2023, 6, 15], 'date')
      expect(result).toBe('2023,6,15')
    })

    it('should handle array value for datetime formatter', () => {
      const result = formatValue([2023, 6, 15, 14, 30], 'datetime')
      expect(result).toBe('2023,6,15,14,30')
    })

    it('should handle boolean value for date formatter', () => {
      const result = formatValue(true, 'date')
      expect(result).toBe('true')
    })

    it('should handle boolean value for datetime formatter', () => {
      const result = formatValue(false, 'datetime')
      expect(result).toBe('false')
    })
  })

  describe('formatValue default case', () => {
    it('should return string for unknown formatter type', () => {
      // Force unknown formatter type
      const result = formatValue(42, 'unknown' as never)
      expect(result).toBe('42')
    })
  })

  describe('formatFeatureProperties order and unformatted fields', () => {
    it('should use default order (999) when not specified', () => {
      const formattersNoOrder = createFieldFormatters({
        name: { label: 'Nome' }, // No order specified
      })

      const properties = {
        name: 'Test',
      }

      const result = formatFeatureProperties(properties, formattersNoOrder)
      expect(result[0].order).toBe(999)
    })

    it('should filter empty unformatted fields when filterEmpty is true', () => {
      const formatters = createFieldFormatters({
        diameter: { label: 'Diâmetro', order: 1 },
      })

      const properties = {
        diameter: 150,
        empty_field: null,
        another_empty: '',
      }

      const result = formatFeatureProperties(properties, formatters, {
        includeUnformatted: true,
        filterEmpty: true,
      })

      // Should only have diameter, not the empty fields
      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('diameter')
    })

    it('should include empty unformatted fields when filterEmpty is false', () => {
      const formatters = createFieldFormatters({
        diameter: { label: 'Diâmetro', order: 1 },
      })

      const properties = {
        diameter: 150,
        empty_field: null,
      }

      const result = formatFeatureProperties(properties, formatters, {
        includeUnformatted: true,
        filterEmpty: false,
      })

      expect(result).toHaveLength(2)
    })

    it('should use String(rawValue ?? "-") for unformatted fields with null', () => {
      const formatters = createFieldFormatters({
        diameter: { label: 'Diâmetro', order: 1 },
      })

      const properties = {
        diameter: 150,
        null_field: null,
      }

      const result = formatFeatureProperties(properties, formatters, {
        includeUnformatted: true,
        filterEmpty: false,
      })

      const nullField = result.find((f) => f.key === 'null_field')
      expect(nullField?.value).toBe('-')
    })

    it('should skip already processed keys in unformatted section', () => {
      const formatters = createFieldFormatters({
        diameter: { label: 'Diâmetro', order: 1 },
      })

      const properties = {
        diameter: 150,
        extra: 'value',
      }

      const result = formatFeatureProperties(properties, formatters, {
        includeUnformatted: true,
      })

      // diameter should only appear once (not duplicated in unformatted)
      const diameterFields = result.filter((f) => f.key === 'diameter')
      expect(diameterFields).toHaveLength(1)
    })

    it('should use default order 9999 for unformatted fields', () => {
      const formatters = createFieldFormatters({
        diameter: { label: 'Diâmetro', order: 1 },
      })

      const properties = {
        diameter: 150,
        extra: 'value',
      }

      const result = formatFeatureProperties(properties, formatters, {
        includeUnformatted: true,
      })

      const extraField = result.find((f) => f.key === 'extra')
      expect(extraField?.order).toBe(9999)
    })
  })
})
