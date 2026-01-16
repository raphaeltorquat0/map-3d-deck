/**
 * Utilitários de cor para o framework
 */

/**
 * Converte cor hexadecimal para array RGBA
 */
export function hexToRgba(
  hex: string,
  alpha = 255
): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [128, 128, 128, alpha]
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    alpha,
  ]
}

/**
 * Converte array RGBA para hexadecimal
 */
export function rgbaToHex(rgba: [number, number, number, number?]): string {
  const [r, g, b] = rgba
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Interpola entre duas cores
 */
export function interpolateColor(
  color1: [number, number, number, number],
  color2: [number, number, number, number],
  t: number
): [number, number, number, number] {
  const clampedT = Math.max(0, Math.min(1, t))
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * clampedT),
    Math.round(color1[1] + (color2[1] - color1[1]) * clampedT),
    Math.round(color1[2] + (color2[2] - color1[2]) * clampedT),
    Math.round(color1[3] + (color2[3] - color1[3]) * clampedT),
  ]
}

/**
 * Cria uma escala de cores para valores numéricos
 */
export function createColorScale(
  domain: [number, number],
  colors: [number, number, number, number][]
): (value: number) => [number, number, number, number] {
  const [min, max] = domain
  const range = max - min

  return (value: number) => {
    if (colors.length === 0) return [128, 128, 128, 255]
    if (colors.length === 1) return colors[0]

    const t = Math.max(0, Math.min(1, (value - min) / range))
    const index = t * (colors.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)

    if (lower === upper) return colors[lower]

    const localT = index - lower
    return interpolateColor(colors[lower], colors[upper], localT)
  }
}

/**
 * Ajusta o brilho de uma cor
 */
export function adjustBrightness(
  color: [number, number, number, number],
  factor: number
): [number, number, number, number] {
  return [
    Math.min(255, Math.round(color[0] * factor)),
    Math.min(255, Math.round(color[1] * factor)),
    Math.min(255, Math.round(color[2] * factor)),
    color[3],
  ]
}

/**
 * Define a opacidade de uma cor
 */
export function setOpacity(
  color: [number, number, number, number],
  opacity: number
): [number, number, number, number] {
  return [color[0], color[1], color[2], Math.round(opacity * 255)]
}
