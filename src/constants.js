export const version = __APP_VERSION__

export const DEFAULT_VIEWPORT = Object.freeze({ width: 960, height: 640 })
export const DEFAULT_BRUSH_SIZE = 32
export const DEFAULT_BRUSH_MIN = 4
export const DEFAULT_BRUSH_MAX = 128
export const DEFAULT_MASK_FEATHER_MIN = 0
export const DEFAULT_MASK_FEATHER_MAX = 100
export const DEFAULT_MASK_FEATHER_SIZE = 12
export const DEFAULT_MASK_FEATHER_EDGE_CLAMP = false
export const DEFAULT_ZOOM = 1
export const DEFAULT_PAN = Object.freeze({ x: 0, y: 0 })
export const DEFAULT_SNAP_TOLERANCE = 8
export const DEFAULT_SNAP_ENABLED = true
export const DEFAULT_SHOW_FINAL_COMPOSITE = false
export const DEFAULT_LAYERS_OPEN = true

export const blendModes = [
  { label: 'Normal', value: 'source-over' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Hue', value: 'hue' },
  { label: 'Saturation', value: 'saturation' },
  { label: 'Color', value: 'color' },
  { label: 'Luminosity', value: 'luminosity' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
]
