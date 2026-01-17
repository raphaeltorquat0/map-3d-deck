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
})
