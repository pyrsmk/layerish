const FILTER_PRESETS = [
  {
    id: 'nano-pixel',
    label: 'Nano Pixel',
    icon: 'grid_4x4',
    engine: 'pixelize',
    params: { size: 4 },
  },
  {
    id: 'micro-pixel',
    label: 'Micro Pixel',
    icon: 'grid_4x4',
    engine: 'pixelize',
    params: { size: 8 },
  },
  {
    id: 'dot-print',
    label: 'Dot Print',
    icon: 'grid_4x4',
    engine: 'halftone',
    params: { cell: 2.2, maxRadius: 3.5 },
  },
  {
    id: 'film-grain',
    label: 'Film Grain',
    icon: 'blur_on',
    engine: 'noise',
    params: { amount: 14 },
  },
  {
    id: 'dusty-grain',
    label: 'Dusty Grain',
    icon: 'blur_on',
    engine: 'noise',
    params: { amount: 28 },
  },
  {
    id: 'rgb-grain',
    label: 'RGB Grain',
    icon: 'blur_on',
    engine: 'rgbGrains',
    params: { amount: 0.3, scale: 0.012, edgeBoost: 2.9, saturation: 1.05 },
  },
  {
    id: 'soft-glow',
    label: 'Soft Glow',
    icon: 'auto_awesome',
    engine: 'bloom',
    params: { radius: 20, intensity: 0.9 },
  },
  {
    id: 'neon-glow',
    label: 'Neon Glow',
    icon: 'auto_awesome',
    engine: 'dualSplitBase',
    params: {
      magenta: { x: -4, y: -2 },
      cyan: { x: 4, y: 2 },
      strength: 0.55,
    },
  },
  {
    id: 'mono-dither',
    label: 'Mono Dither',
    icon: 'grain',
    engine: 'ditherFS',
    params: { levels: 2 },
  },
  {
    id: 'matrix-dither',
    label: 'Matrix Dither',
    icon: 'grain',
    engine: 'ditherBayer',
    params: { matrixSize: 4, levels: 4 },
  },
  {
    id: 'chromatic-split',
    label: 'Chromatic Split',
    icon: 'broken_image',
    engine: 'chroma',
    params: { offset: 4, offsetY: 2 },
  },
  {
    id: 'retro-split',
    label: 'Retro Split',
    icon: 'broken_image',
    engine: 'neonSplit',
    params: {
      r: { x: -10, y: -6 },
      g: { x: 2, y: -2 },
      b: { x: 10, y: 6 },
    },
  },
  {
    id: 'neon-split',
    label: 'Neon Split',
    icon: 'broken_image',
    engine: 'dualSplitOnly',
    params: {
      magenta: { x: -5, y: -5 },
      cyan: { x: 5, y: 5 },
      strength: 0.95,
    },
  },
  {
    id: 'anaglyph-split',
    label: 'Anaglyph Split',
    icon: 'broken_image',
    engine: 'anaglyphSplit',
    params: { minOffset: 25, maxOffset: 75 },
  },
  {
    id: 'horizontal-shift',
    label: 'Horizontal Shift',
    icon: 'texture',
    engine: 'glitchTear',
    params: { bandCount: 7, minHeight: 10, maxHeight: 100, maxOffset: 30 },
  },
  {
    id: 'vertical-shift',
    label: 'Vertical Shift',
    icon: 'texture',
    engine: 'glitchTearVertical',
    params: { bandCount: 7, minHeight: 10, maxHeight: 100, maxOffset: 30 },
  },
  {
    id: 'blocks-shift',
    label: 'Blocks Shift',
    icon: 'texture',
    engine: 'glitchBlocks',
    params: { blockCount: 64, minSize: 10, maxSize: 100, maxOffset: 24 },
  },
  {
    id: 'negative-bands',
    label: 'Negative Bands',
    icon: 'texture',
    engine: 'colorShift',
    params: {
      bandCountMin: 3,
      bandCountMax: 8,
      minHeight: 10,
      maxHeight: 100,
      hueMin: 0,
      hueMax: 360,
      saturationMin: 2,
      saturationMax: 3,
      lightnessMin: -1,
      lightnessMax: 0,
      bandOpacity: 0.99,
      bandNegative: 0.4,
      channelOffset: 6,
      channelOffsetY: 0,
    },
  },
  {
    id: 'rgb-shift-bands',
    label: 'RGB Shift',
    icon: 'texture',
    engine: 'rgbShiftBands',
    params: {
      bandCountMin: 3,
      bandCountMax: 8,
      minHeight: 10,
      maxHeight: 100,
      maxOffset: 100,
      maxOffsetY: 100,
    },
  },
  {
    id: 'palette-gameboy',
    label: 'Gameboy',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-rgb',
    label: 'RGB',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-cym',
    label: 'CYM',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [0, 255, 255], [255, 255, 0], [255, 0, 255]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-cga',
    label: 'CGA',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [85, 255, 85], [255, 85, 85], [255, 255, 85]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-virtual-boy',
    label: 'Virtual Boy',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [85, 0, 0], [170, 0, 0], [255, 0, 0]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-nes',
    label: 'NES',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[15, 15, 15], [252, 252, 252], [216, 40, 0], [0, 88, 248], [0, 168, 0], [248, 184, 0], [252, 0, 120], [60, 188, 252]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-zx-spectrum',
    label: 'ZX Spectrum',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [0, 0, 215], [215, 0, 0], [215, 0, 215], [0, 215, 0], [0, 215, 215], [215, 215, 0], [215, 215, 215], [0, 0, 255], [255, 0, 0], [255, 0, 255], [0, 255, 0], [0, 255, 255], [255, 255, 0], [255, 255, 255]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-mono-amber',
    label: 'Mono Amber',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [85, 52, 0], [170, 105, 0], [255, 176, 0]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-sepia',
    label: 'Sépia',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[44, 30, 15], [100, 70, 40], [180, 140, 100], [240, 220, 190]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-cyberpunk',
    label: 'Cyberpunk',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [255, 0, 128], [0, 255, 255], [128, 0, 255]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-vaporwave',
    label: 'Vaporwave',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[255, 113, 206], [121, 189, 255], [185, 137, 255], [0, 255, 195]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-bw',
    label: 'Noir & Blanc',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [255, 255, 255]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-blueprint',
    label: 'Blueprint',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[10, 30, 80], [40, 80, 160], [120, 160, 220], [220, 230, 255]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-infrared',
    label: 'Infrarouge',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 32], [140, 0, 140], [255, 40, 0], [255, 255, 0]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-sunset',
    label: 'Sunset',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[20, 0, 20], [180, 40, 30], [255, 120, 0], [255, 220, 50]],
      pixelSize: 4,
    },
  },
  {
    id: 'palette-newsprint',
    label: 'Journal',
    icon: 'terminal',
    engine: 'palettePixel',
    params: {
      palette: [[35, 31, 25], [120, 110, 95], [200, 190, 170], [240, 235, 220]],
      pixelSize: 4,
    },
  },
  {
    id: 'cinema-tone',
    label: 'Cinema Tone',
    icon: 'tv',
    engine: 'cinemaTone',
    params: {
      contrast: 1.2,
      gamma: 1.05,
      bloom: 0.12,
      vignette: 0.2,
      saturation: 1.05,
      liftBlack: 0.04,
      tint: 0.08,
    },
  },
  {
    id: 'chromatic-aberration',
    label: 'Chromatic Aberration',
    icon: 'tv',
    engine: 'chromaticAberration',
    params: {
      strength: 8,
      falloff: 2,
    },
  },
  {
    id: 'crt-screen',
    label: 'CRT Screen',
    icon: 'tv',
    engine: 'crtScreen',
    params: {
      barrel: 0.08,
      aberration: 2,
      scanlineFreq: 800,
      scanlineIntensity: 0.5,
      brightness: 0.9,
      contrast: 1.1,
      desaturation: 0.15,
      noise: 0.04,
      bloom: 0.25,
    },
  },
  {
    id: 'vhs',
    label: 'VHS',
    icon: 'tv',
    engine: 'vhs',
    params: {
      lumaSmear: 0.55,
      chromaBlur: 0.65,
      chromaDelayX: 2.5,
      chromaDelayY: 1,
      chromaVertBlend: 0.45,
      edgeWave: 0.3,
      edgeWaveFrequency: 0.025,
      edgeWaveAmplitude: 4.5,
      headSwitchingHeight: 0.18,
      headSwitchingShift: 6,
      chromaLoss: 0.12,
      noise: 0.08,
      snow: 0.01,
      trackingNoiseHeight: 0.14,
      trackingNoiseWave: 6,
      trackingNoiseSnow: 0.03,
      trackingNoiseNoise: 0.18,
    },
  },
  {
    id: 'retro-sci-fi',
    label: 'Retro Sci-fi',
    icon: 'tv',
    engine: 'retroSciFi',
    params: {
      lineFrequency: 0.38,
      warpFrequency: 0.045,
      warpAmplitude: 8,
      ripple: 0.02,
      intensity: 1.2,
      glow: 0.55,
      tint: { r: 40, g: 255, b: 120 },
    },
  },
  {
    id: 'oscilloscope',
    label: 'Oscilloscope',
    icon: 'tv',
    engine: 'oscilloscope',
    params: {
      rowStep: 11,
      xStep: 2,
      amplitude: 18,
      thickness: 1,
      intensity: 1.1,
      glow: 1,
      tint: { r: 25, g: 255, b: 70 },
    },
  },
  {
    id: 'data-loss',
    label: 'Data Loss',
    icon: 'barcode',
    engine: 'dataLoss',
    params: {
      bandCountMin: 3,
      bandCountMax: 8,
      minHeight: 4,
      maxHeight: 64,
      noiseDensity: 0.65,
    },
  },
  {
    id: 'dropout',
    label: 'Dropout',
    icon: 'barcode',
    engine: 'dropout',
    params: { heightMin: 8, heightMax: 32, gapMin: 8, gapHeight: 32 },
  },
  {
    id: 'rgb-glitch',
    label: 'RGB Glitch',
    icon: 'barcode',
    engine: 'hueDistortionRgb',
    params: { amount: 1.2, scale: 0.022, threshold: 0.3, maxOffset: 14, edgeBoost: 1.1 },
  },
  {
    id: 'bitcrush-1',
    label: 'Bitcrush 1',
    icon: 'palette',
    engine: 'bitcrush',
    params: { levelMin: 2, levelMax: 2 },
  },
  {
    id: 'bitcrush-2',
    label: 'Bitcrush 2',
    icon: 'palette',
    engine: 'bitcrush',
    params: { levelMin: 3, levelMax: 3 },
  },
  {
    id: 'bitcrush-3',
    label: 'Bitcrush 3',
    icon: 'palette',
    engine: 'bitcrush',
    params: { levelMin: 4, levelMax: 7 },
  },
  {
    id: 'quantize-stripes',
    label: 'Quantize Stripes',
    icon: 'palette',
    engine: 'quantizeStripes',
    params: { minHeight: 10, maxHeight: 100, levelMin: 2, levelMax: 6 },
  },
  {
    id: 'checksum-glitch',
    label: 'Checksum Glitch',
    icon: 'palette',
    engine: 'checksumGlitch',
    params: {
      mask: 90,
      maskMin: 70,
      maskMax: 110,
      period: 11,
      periodMin: 9,
      periodMax: 13,
      threshold: 3,
      thresholdMin: 2,
      thresholdMax: 4,
    },
  },
]

const FILTER_PRESET_BY_ID = new Map(
  FILTER_PRESETS.map((preset) => [preset.id, preset])
)

export const RANDOM_FILTER_IDS = [
  'negative-bands',
  'rgb-grain',
  'rgb-shift-bands',
  'anaglyph-split',
  'data-loss',
  'bitcrush-3',
  'quantize-stripes',
  'dropout',
  'checksum-glitch',
  'horizontal-shift',
  'vertical-shift',
  'blocks-shift',
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const hashString = (value) => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed) => {
  let t = seed >>> 0
  return () => {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const createCanvasClone = (canvas) => {
  const clone = document.createElement('canvas')
  clone.width = canvas.width
  clone.height = canvas.height
  const ctx = clone.getContext('2d')
  if (!ctx) return clone
  ctx.drawImage(canvas, 0, 0)
  return clone
}

const getImageData = (ctx, width, height) => {
  try {
    return ctx.getImageData(0, 0, width, height)
  } catch (error) {
    return null
  }
}

const applyPixelize = (canvas, { size }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const scale = Math.max(1, Math.round(size))
  const w = Math.max(1, Math.floor(width / scale))
  const h = Math.max(1, Math.floor(height / scale))
  const temp = document.createElement('canvas')
  temp.width = w
  temp.height = h
  const tctx = temp.getContext('2d')
  if (!tctx) return
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(canvas, 0, 0, w, h)
  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(temp, 0, 0, width, height)
}

const applyRgbShift = (canvas, { r, g, b }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  const rdx = r?.x ?? 0
  const rdy = r?.y ?? 0
  const gdx = g?.x ?? 0
  const gdy = g?.y ?? 0
  const bdx = b?.x ?? 0
  const bdy = b?.y ?? 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      dst[i] = read(x + rdx, y + rdy, 0)
      dst[i + 1] = read(x + gdx, y + gdy, 1)
      dst[i + 2] = read(x + bdx, y + bdy, 2)
      dst[i + 3] = read(x, y, 3)
    }
  }

  ctx.putImageData(output, 0, 0)
}



const applyVaporwaveToneToShifted = (canvas, originalCanvas, strength = 0.6) => {
  const ctx = canvas.getContext('2d')
  const originalCtx = originalCanvas.getContext('2d')
  if (!ctx || !originalCtx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  const original = getImageData(originalCtx, width, height)
  if (!image || !original) return
  const data = image.data
  const base = original.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const or = base[i]
    const og = base[i + 1]
    const ob = base[i + 2]
    const diff = (Math.abs(r - or) + Math.abs(g - og) + Math.abs(b - ob)) / (3 * 255)
    const weight = clamp(diff * 1.6, 0, 1) * strength
    const tintR = r * 0.5 + b * 0.5
    const tintG = g * 0.25 + b * 0.1
    const tintB = b * 0.85 + r * 0.15
    data[i] = clamp(r + (tintR - r) * weight, 0, 255)
    data[i + 1] = clamp(g + (tintG - g) * weight, 0, 255)
    data[i + 2] = clamp(b + (tintB - b) * weight, 0, 255)
  }

  ctx.putImageData(image, 0, 0)
}

const applyNeonSplit = (canvas, { r, g, b }) => {
  const original = createCanvasClone(canvas)
  applyRgbShift(canvas, { r, g, b })
  applyVaporwaveToneToShifted(canvas, original)
}

const applyDualSplit = (canvas, { magenta, cyan, strength = 0.6, mode = 'base' } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const baseImage = getImageData(ctx, width, height)
  if (!baseImage) return
  const base = baseImage.data
  const output = ctx.createImageData(width, height)
  const out = output.data

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return base[(y * width + x) * 4 + channel]
  }

  const mx = magenta?.x ?? -4
  const my = magenta?.y ?? -2
  const cx = cyan?.x ?? 4
  const cy = cyan?.y ?? 2
  const isNeon = mode === 'neon'
  const gamma = 0.7

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4

      const mr = read(x + mx, y + my, 0)
      const mg = read(x + mx, y + my, 1)
      const mb = read(x + mx, y + my, 2)
      const cr = read(x + cx, y + cy, 0)
      const cg = read(x + cx, y + cy, 1)
      const cb = read(x + cx, y + cy, 2)

      const lumMagenta = (mr * 0.299 + mg * 0.587 + mb * 0.114) / 255
      const lumCyan = (cr * 0.299 + cg * 0.587 + cb * 0.114) / 255

      if (isNeon) {
        const magentaBoost = clamp(Math.pow(lumMagenta, gamma) * 255 * strength, 0, 255)
        const cyanBoost = clamp(Math.pow(lumCyan, gamma) * 255 * strength, 0, 255)
        out[i] = magentaBoost
        out[i + 1] = cyanBoost
        out[i + 2] = clamp(magentaBoost + cyanBoost, 0, 255)
        out[i + 3] = base[i + 3]
      } else {
        const magentaBoost = 255 * lumMagenta * strength
        const cyanBoost = 255 * lumCyan * strength
        out[i] = clamp(base[i] + magentaBoost, 0, 255)
        out[i + 1] = clamp(base[i + 1] + cyanBoost, 0, 255)
        out[i + 2] = clamp(base[i + 2] + magentaBoost + cyanBoost, 0, 255)
        out[i + 3] = base[i + 3]
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyDualSplitBase = (canvas, params = {}) => {
  applyDualSplit(canvas, { ...params, mode: 'base' })
}

const applyDualSplitOnly = (canvas, params = {}) => {
  applyDualSplit(canvas, { strength: 0.95, ...params, mode: 'neon' })
}

const applyGlitchTear = (canvas, { bandCount, minHeight, maxHeight, maxOffset, seed = null } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = createCanvasClone(canvas)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)

  const rand = Number.isFinite(seed) ? createSeededRandom(seed) : Math.random
  const bands = Math.max(1, bandCount)
  for (let i = 0; i < bands; i += 1) {
    const bandHeight = Math.floor(
      minHeight + rand() * Math.max(1, maxHeight - minHeight)
    )
    const y = Math.floor(rand() * Math.max(1, height - bandHeight))
    const dx = Math.floor((rand() * 2 - 1) * maxOffset)
    ctx.drawImage(source, 0, y, width, bandHeight, dx, y, width, bandHeight)
  }
}

const applyGlitchTearVertical = (canvas, { bandCount, minHeight, maxHeight, maxOffset, seed = null } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = createCanvasClone(canvas)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)

  const rand = Number.isFinite(seed) ? createSeededRandom(seed) : Math.random
  const bands = Math.max(1, bandCount)
  for (let i = 0; i < bands; i += 1) {
    const bandWidth = Math.floor(
      minHeight + rand() * Math.max(1, maxHeight - minHeight)
    )
    const x = Math.floor(rand() * Math.max(1, width - bandWidth))
    const dy = Math.floor((rand() * 2 - 1) * maxOffset)
    ctx.drawImage(source, x, 0, bandWidth, height, x, dy, bandWidth, height)
  }
}

const applyGlitchBlocks = (canvas, { blockCount, minSize, maxSize, maxOffset, seed = null } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = createCanvasClone(canvas)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${blockCount}|${minSize}|${maxSize}|${maxOffset}`)
  const rand = createSeededRandom(seedValue)
  const blocks = Math.max(1, blockCount)
  for (let i = 0; i < blocks; i += 1) {
    const size = Math.floor(minSize + rand() * Math.max(1, maxSize - minSize))
    const x = Math.floor(rand() * Math.max(1, width - size))
    const y = Math.floor(rand() * Math.max(1, height - size))
    const dx = Math.floor((rand() * 2 - 1) * maxOffset)
    const dy = Math.floor((rand() * 2 - 1) * maxOffset)
    ctx.drawImage(source, x, y, size, size, x + dx, y + dy, size, size)
  }
}

const applyNoise = (canvas, { amount }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const intensity = clamp(amount, 0, 60)

  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() * 2 - 1) * intensity
    data[i] = clamp(data[i] + n, 0, 255)
    data[i + 1] = clamp(data[i + 1] + n, 0, 255)
    data[i + 2] = clamp(data[i + 2] + n, 0, 255)
  }

  ctx.putImageData(image, 0, 0)
}

const applyDitherFS = (canvas, { levels }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const lvls = Math.max(2, Math.round(levels))
  const step = 255 / (lvls - 1)
  const error = new Float32Array(width * height)

  const getGray = (i) => (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x
      const i = idx * 4
      const oldValue = clamp(getGray(i) + error[idx], 0, 255)
      const newValue = Math.round(oldValue / step) * step
      const err = oldValue - newValue
      data[i] = newValue
      data[i + 1] = newValue
      data[i + 2] = newValue

      if (x + 1 < width) error[idx + 1] += err * (7 / 16)
      if (x > 0 && y + 1 < height) error[idx + width - 1] += err * (3 / 16)
      if (y + 1 < height) error[idx + width] += err * (5 / 16)
      if (x + 1 < width && y + 1 < height) error[idx + width + 1] += err * (1 / 16)
    }
  }

  ctx.putImageData(image, 0, 0)
}

const BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]

const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
]

const applyDitherBayer = (canvas, { matrixSize, levels }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const size = matrixSize === 8 ? 8 : 4
  const matrix = size === 8 ? BAYER_8 : BAYER_4
  const lvls = Math.max(2, Math.round(levels))
  const maxIndex = size * size

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      const threshold = (matrix[(y % size) * size + (x % size)] + 0.5) / maxIndex
      const value = clamp(gray + (threshold - 0.5) / lvls, 0, 1)
      const quant = Math.round(value * (lvls - 1))
      const out = (quant / (lvls - 1)) * 255
      data[i] = out
      data[i + 1] = out
      data[i + 2] = out
    }
  }

  ctx.putImageData(image, 0, 0)
}

const applyHalftone = (canvas, { cell, maxRadius }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const srcImage = getImageData(ctx, width, height)
  if (!srcImage) return
  const src = srcImage.data
  const cellSize = Math.max(2, Math.round(cell))
  const maxR = Math.max(1, Math.min(cellSize / 2, maxRadius))

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#000000'

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const i = (y * width + x) * 4
      const gray = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255
      const radius = maxR * (1 - gray)
      if (radius <= 0) continue
      ctx.beginPath()
      ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const applyChromatic = (canvas, { offset, offsetY }) => {
  applyRgbShift(canvas, {
    r: { x: -offset, y: -offsetY },
    g: { x: 0, y: 0 },
    b: { x: offset, y: offsetY },
  })
}

const applyAnaglyphSplit = (
  canvas,
  { minOffset = 10, maxOffset = 100, seed = null } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data
  dst.set(src)

  const offsetMaxX = Math.max(0, Math.round(maxOffset))
  const offsetMinX = Math.min(offsetMaxX, Math.max(0, Math.round(minOffset)))
  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${minOffset}|${maxOffset}`)
  const rand = createSeededRandom(seedValue)
  const magnitude =
    offsetMaxX === 0
      ? 0
      : offsetMinX + rand() * Math.max(0, offsetMaxX - offsetMinX)
  const dx = Math.round(magnitude)
  const channelIndex = Math.floor(rand() * 3)

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      dst[i + channelIndex] = read(x + dx, y, channelIndex)
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyDataLoss = (
  canvas,
  {
    bandCountMin = 2,
    bandCountMax = 6,
    minHeight = 4,
    maxHeight = 26,
    noiseDensity = 0.65,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data
  dst.set(src)

  const countMin = Math.max(1, Math.round(bandCountMin))
  const countMax = Math.max(countMin, Math.round(bandCountMax))
  const minH = Math.max(1, Math.round(minHeight))
  const maxH = Math.max(minH, Math.round(maxHeight))
  const density = clamp(noiseDensity, 0, 1)

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${bandCountMin}|${bandCountMax}|${minHeight}|${maxHeight}|${noiseDensity}`
      )
  const rand = createSeededRandom(seedValue)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const setGray = (i, value) => {
    const val = clamp(value, 0, 255)
    dst[i] = val
    dst[i + 1] = val
    dst[i + 2] = val
    dst[i + 3] = src[i + 3]
  }

  for (let b = 0; b < bands; b += 1) {
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(Math.round(rand() * (height - bandHeight)), 0, height - bandHeight)
    const modeRoll = rand()
    const bandMode = modeRoll < 0.34 ? 'noise' : modeRoll < 0.67 ? 'barcode' : 'barcodeCompress'
    const isCompress = bandMode === 'barcodeCompress'
    const blockSize = (isCompress ? 18 : 6) + Math.floor(rand() * (isCompress ? 40 : 22))
    const phase = Math.floor(rand() * blockSize)
    const flipChance = (isCompress ? 0.03 : 0.08) + rand() * (isCompress ? 0.05 : 0.08)

    for (let y = bandY; y < bandY + bandHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4
        if (bandMode === 'noise') {
          const val = rand() < density ? 0 : 255
          setGray(i, val)
          continue
        }

        const blockIndex = Math.floor((x + phase) / blockSize) % 2
        let val = blockIndex === 0 ? 0 : 255
        if (rand() < flipChance) {
          val = 255 - val
        }
        setGray(i, val)
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyBitcrush = (
  canvas,
  { levelMin = null, levelMax = null, seed = null } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data

  const minL = Number.isFinite(levelMin) ? Math.max(2, Math.round(levelMin)) : 2
  const maxL = Number.isFinite(levelMax) ? Math.max(minL, Math.round(levelMax)) : minL

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${minL}|${maxL}`)
  const rand = createSeededRandom(seedValue)
  const lvl = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
  const step = 255 / (lvl - 1)

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step
    data[i + 1] = Math.round(data[i + 1] / step) * step
    data[i + 2] = Math.round(data[i + 2] / step) * step
  }

  ctx.putImageData(image, 0, 0)
}

const applyQuantizeStripes = (
  canvas,
  {
    minHeight = 10,
    maxHeight = 100,
    levelMin = 2,
    levelMax = 6,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data

  const minH = Math.max(1, Math.round(minHeight))
  const maxH = Math.max(minH, Math.round(maxHeight))
  const minL = Math.max(2, Math.round(levelMin))
  const maxL = Math.max(minL, Math.round(levelMax))

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${minHeight}|${maxHeight}|${levelMin}|${levelMax}`)
  const rand = createSeededRandom(seedValue)

  for (let y = 0; y < height; ) {
    const stripeHeight = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const stripeEnd = Math.min(height, y + stripeHeight)
    const lvl = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    const step = 255 / (lvl - 1)

    for (let yy = y; yy < stripeEnd; yy += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (yy * width + x) * 4
        data[i] = Math.round(data[i] / step) * step
        data[i + 1] = Math.round(data[i + 1] / step) * step
        data[i + 2] = Math.round(data[i + 2] / step) * step
      }
    }

    y = stripeEnd
  }

  ctx.putImageData(image, 0, 0)
}

const applyDropout = (
  canvas,
  {
    heightMin = 8,
    heightMax = 16,
    gapMin = 12,
    gapHeight = 32,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const sourceData = getImageData(ctx, width, height)
  if (!sourceData) return
  const output = ctx.createImageData(width, height)
  const src = sourceData.data
  const dst = output.data
  dst.set(src)

  const minH = Math.max(1, Math.round(heightMin))
  const maxH = Math.max(minH, Math.round(heightMax))
  const minGap = Math.max(1, Math.round(gapMin))
  const maxGap = Math.max(minGap, Math.round(gapHeight))

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${heightMin}|${heightMax}|${gapMin}|${gapHeight}`)
  const rand = createSeededRandom(seedValue)

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let y = 0; y < height; ) {
    const bandH = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const gap = Math.max(1, Math.round(minGap + rand() * (maxGap - minGap)))
    const sourceY = clamp(y + Math.floor(bandH / 2), 0, height - 1)
    const yEnd = Math.min(height, y + bandH)
    for (let yy = y; yy < yEnd; yy += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (yy * width + x) * 4
        dst[i] = read(x, sourceY, 0)
        dst[i + 1] = read(x, sourceY, 1)
        dst[i + 2] = read(x, sourceY, 2)
        dst[i + 3] = read(x, sourceY, 3)
      }
    }
    y = yEnd + gap
  }

  ctx.putImageData(output, 0, 0)
}

const applyChecksumGlitch = (
  canvas,
  {
    mask = 0x5a,
    maskMin = null,
    maskMax = null,
    period = 11,
    periodMin = null,
    periodMax = null,
    threshold = 3,
    thresholdMin = null,
    thresholdMax = null,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${mask}|${maskMin}|${maskMax}|${period}|${periodMin}|${periodMax}|${threshold}|${thresholdMin}|${thresholdMax}`
      )
  const rand = createSeededRandom(seedValue)
  const periodRoll = rand()
  const thresholdRoll = rand()
  const maskRoll = rand()

  const basePeriod = Math.max(1, Math.round(period))
  const minPeriod = Number.isFinite(periodMin) ? Math.max(1, Math.round(periodMin)) : basePeriod
  const maxPeriod = Number.isFinite(periodMax) ? Math.max(minPeriod, Math.round(periodMax)) : minPeriod
  const p = Math.max(1, Math.round(minPeriod + periodRoll * (maxPeriod - minPeriod)))

  const baseThreshold = clamp(Math.round(threshold), 0, p)
  const minThreshold = Number.isFinite(thresholdMin)
    ? clamp(Math.round(thresholdMin), 0, p)
    : baseThreshold
  const maxThreshold = Number.isFinite(thresholdMax)
    ? clamp(Math.round(thresholdMax), minThreshold, p)
    : minThreshold
  const t = clamp(Math.round(minThreshold + thresholdRoll * (maxThreshold - minThreshold)), 0, p)

  const baseMask = clamp(Math.round(mask), 0, 255)
  const minMask = Number.isFinite(maskMin) ? clamp(Math.round(maskMin), 0, 255) : baseMask
  const maxMask = Number.isFinite(maskMax) ? clamp(Math.round(maskMax), minMask, 255) : minMask
  const m = clamp(Math.round(minMask + maskRoll * (maxMask - minMask)), 0, 255)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const hit = ((x * 3 + y * 5) % p) < t
      if (!hit) continue
      data[i] = data[i] ^ m
      data[i + 1] = data[i + 1] ^ m
      data[i + 2] = data[i + 2] ^ m
    }
  }

  ctx.putImageData(image, 0, 0)
}

const applyCinemaTone = (
  canvas,
  {
    contrast = 1.2,
    gamma = 1.05,
    bloom = 0.12,
    vignette = 0.2,
    saturation = 1.05,
    liftBlack = 0.04,
    tint = 0.08,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const src = image.data
  const output = ctx.createImageData(width, height)
  const dst = output.data

  const sCurveStrength = 1 + (Math.max(0, contrast) - 1) * 2.5
  const gammaAmount = Math.max(0.1, gamma)
  const bloomAmount = clamp(bloom, 0, 0.6)
  const vignetteAmount = clamp(vignette, 0, 0.8)
  const sat = Math.max(0, saturation)
  const lift = clamp(liftBlack, 0, 0.2)
  const liftScale = 1 - lift
  const tintAmount = clamp(tint, 0, 0.3)
  const cx = width * 0.5
  const cy = height * 0.5
  const invCx = 1 / Math.max(1, cx)
  const invCy = 1 / Math.max(1, cy)

  const sCurve = (v) => {
    if (v <= 0) return 0
    if (v >= 1) return 1
    if (v <= 0.5) return 0.5 * Math.pow(2 * v, sCurveStrength)
    return 1 - 0.5 * Math.pow(2 * (1 - v), sCurveStrength)
  }

  for (let y = 0; y < height; y += 1) {
    const ny = (y - cy) * invCy
    for (let x = 0; x < width; x += 1) {
      const nx = (x - cx) * invCx
      const vignetteFactor = clamp(1 - vignetteAmount * (nx * nx + ny * ny), 0, 1)
      const i = (y * width + x) * 4
      let r = src[i] / 255
      let g = src[i + 1] / 255
      let b = src[i + 2] / 255

      r = Math.pow(r, 1 / gammaAmount)
      g = Math.pow(g, 1 / gammaAmount)
      b = Math.pow(b, 1 / gammaAmount)

      r = sCurve(r)
      g = sCurve(g)
      b = sCurve(b)

      const l = r * 0.299 + g * 0.587 + b * 0.114
      r = l + (r - l) * sat
      g = l + (g - l) * sat
      b = l + (b - l) * sat

      if (tintAmount > 0) {
        const shadowWeight = (1 - l) * tintAmount
        const highlightWeight = l * tintAmount
        r += -0.02 * shadowWeight + 0.03 * highlightWeight
        g += 0.01 * shadowWeight + 0.01 * highlightWeight
        b += 0.03 * shadowWeight + -0.02 * highlightWeight
      }

      r = lift + clamp(r, 0, 1) * liftScale
      g = lift + clamp(g, 0, 1) * liftScale
      b = lift + clamp(b, 0, 1) * liftScale

      dst[i] = clamp(r * 255 * vignetteFactor, 0, 255)
      dst[i + 1] = clamp(g * 255 * vignetteFactor, 0, 255)
      dst[i + 2] = clamp(b * 255 * vignetteFactor, 0, 255)
      dst[i + 3] = src[i + 3]
    }
  }

  ctx.putImageData(output, 0, 0)

  if (bloomAmount > 0) {
    const bloomRadius = Math.max(2, Math.round(Math.max(width, height) * 0.015))
    const bloomCanvas = document.createElement('canvas')
    bloomCanvas.width = width
    bloomCanvas.height = height
    const bctx = bloomCanvas.getContext('2d')
    if (bctx) {
      bctx.filter = `blur(${bloomRadius}px)`
      bctx.drawImage(canvas, 0, 0)
      bctx.filter = 'none'
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = bloomAmount
      ctx.drawImage(bloomCanvas, 0, 0)
      ctx.restore()
    }
  }
}

const applyChromaticAberration = (
  canvas,
  { strength = 8, falloff = 2 } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  const cx = width * 0.5
  const cy = height * 0.5
  const maxDist = Math.sqrt(cx * cx + cy * cy)
  const invMaxDist = 1 / Math.max(1, maxDist)
  const amount = Math.max(0, strength)
  const power = Math.max(0.1, falloff)

  const sampleChannel = (sx, sy, channel) => {
    const x0 = Math.floor(sx)
    const y0 = Math.floor(sy)
    const tx = sx - x0
    const ty = sy - y0
    const cx0 = Math.max(0, Math.min(width - 1, x0))
    const cy0 = Math.max(0, Math.min(height - 1, y0))
    const cx1 = Math.max(0, Math.min(width - 1, x0 + 1))
    const cy1 = Math.max(0, Math.min(height - 1, y0 + 1))
    const v00 = src[(cy0 * width + cx0) * 4 + channel]
    const v10 = src[(cy0 * width + cx1) * 4 + channel]
    const v01 = src[(cy1 * width + cx0) * 4 + channel]
    const v11 = src[(cy1 * width + cx1) * 4 + channel]
    return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const normDist = dist * invMaxDist
      const offset = amount * Math.pow(normDist, power)

      let dirX = 0
      let dirY = 0
      if (dist > 0.001) {
        dirX = dx / dist
        dirY = dy / dist
      }

      dst[i] = sampleChannel(x + dirX * offset, y + dirY * offset, 0)
      dst[i + 1] = src[i + 1]
      dst[i + 2] = sampleChannel(x - dirX * offset, y - dirY * offset, 2)
      dst[i + 3] = src[i + 3]
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyPalettePixel = (canvas, { palette, pixelSize = 4 } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const scale = Math.max(1, Math.round(pixelSize))
  const w = Math.max(1, Math.floor(width / scale))
  const h = Math.max(1, Math.floor(height / scale))

  const temp = document.createElement('canvas')
  temp.width = w
  temp.height = h
  const tctx = temp.getContext('2d')
  if (!tctx) return
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(canvas, 0, 0, w, h)

  const image = tctx.getImageData(0, 0, w, h)
  const data = image.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    let minDist = Infinity
    let bestR = 0
    let bestG = 0
    let bestB = 0
    for (let p = 0; p < palette.length; p += 1) {
      const pr = palette[p][0]
      const pg = palette[p][1]
      const pb = palette[p][2]
      const dr = r - pr
      const dg = g - pg
      const db = b - pb
      const dist = dr * dr + dg * dg + db * db
      if (dist < minDist) {
        minDist = dist
        bestR = pr
        bestG = pg
        bestB = pb
      }
    }
    data[i] = bestR
    data[i + 1] = bestG
    data[i + 2] = bestB
  }

  tctx.putImageData(image, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(temp, 0, 0, width, height)
}

const applyCrtScreen = (
  canvas,
  {
    barrel = 0.08,
    aberration = 2,
    scanlineFreq = 800,
    scanlineIntensity = 0.5,
    brightness = 0.9,
    contrast = 1.1,
    desaturation = 0.15,
    noise = 0.04,
    bloom = 0.25,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const src = image.data
  const output = ctx.createImageData(width, height)
  const dst = output.data

  const barrelAmount = Math.max(0, barrel)
  const abPixels = Math.max(0, aberration)
  const scanFreq = Math.max(0, scanlineFreq)
  const scanIntensity = clamp(scanlineIntensity, 0, 1)
  const bright = Math.max(0, brightness)
  const cont = Math.max(0, contrast)
  const desat = clamp(desaturation, 0, 1)
  const noiseAmount = clamp(noise, 0, 0.5)
  const bloomAmount = clamp(bloom, 0, 0.8)

  // Bilinear sample from source data
  const sampleChannel = (fx, fy, ch) => {
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const cx0 = clamp(x0, 0, width - 1)
    const cy0 = clamp(y0, 0, height - 1)
    const cx1 = clamp(x0 + 1, 0, width - 1)
    const cy1 = clamp(y0 + 1, 0, height - 1)
    const v00 = src[(cy0 * width + cx0) * 4 + ch]
    const v10 = src[(cy0 * width + cx1) * 4 + ch]
    const v01 = src[(cy1 * width + cx0) * 4 + ch]
    const v11 = src[(cy1 * width + cx1) * 4 + ch]
    return (v00 + (v10 - v00) * tx) * (1 - ty) + (v01 + (v11 - v01) * tx) * ty
  }

  // Static noise hash (same approach as CRTFilter.js shader)
  const noiseHash = (u, v) => {
    const d = u * 12.9898 + v * 78.233
    const s = Math.sin(d) * 43758.5453
    return s - Math.floor(s)
  }

  // Smoothstep for glow bloom on highlights
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }

  // 2×2 SSAA sub-pixel offsets for anti-aliased barrel distortion
  const ssOffsets = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4

      // Supersample barrel distortion + chromatic aberration (4 sub-samples)
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0
      let insideCount = 0

      for (let s = 0; s < 4; s += 1) {
        const su = (x + ssOffsets[s][0]) / width
        const sv = (y + ssOffsets[s][1]) / height

        const cu = su - 0.5
        const cv = sv - 0.5
        const dist = cu * cu + cv * cv
        const du = su + cu * dist * barrelAmount
        const dv = sv + cv * dist * barrelAmount

        if (du < 0 || du >= 1 || dv < 0 || dv >= 1) continue

        const sx = du * width
        const sy = dv * height

        rSum += sampleChannel(sx + abPixels, sy, 0) / 255
        gSum += sampleChannel(sx, sy, 1) / 255
        bSum += sampleChannel(sx - abPixels, sy, 2) / 255
        aSum += sampleChannel(sx, sy, 3)
        insideCount += 1
      }

      // Fully outside CRT curved area → transparent
      if (insideCount === 0) {
        dst[i] = 0
        dst[i + 1] = 0
        dst[i + 2] = 0
        dst[i + 3] = 0
        continue
      }

      // Average color from inside samples, alpha weighted by coverage
      let r = rSum / insideCount
      let g = gSum / insideCount
      let b = bSum / insideCount
      const a = aSum / 4

      const u = x / width
      const v = y / height

      // Static noise
      if (noiseAmount > 0) {
        const n = (noiseHash(u, v) - 0.5) * noiseAmount
        r += n
        g += n
        b += n
      }

      // Per-pixel glow on highlights (smoothstep boost like shader)
      r += 0.15 * smoothstep(0.5, 1.0, r)
      g += 0.15 * smoothstep(0.5, 1.0, g)
      b += 0.15 * smoothstep(0.5, 1.0, b)

      // Scanlines — sine-based modulation with brightness compensation
      const scanline = 1.3 + scanIntensity * Math.sin(v * scanFreq)
      r *= scanline
      g *= scanline
      b *= scanline

      // Desaturation — fade toward grayscale
      if (desat > 0) {
        const gray = r * 0.299 + g * 0.587 + b * 0.114
        r = gray + (r - gray) * (1 - desat)
        g = gray + (g - gray) * (1 - desat)
        b = gray + (b - gray) * (1 - desat)
      }

      // Contrast
      r = (r - 0.5) * cont + 0.5
      g = (g - 0.5) * cont + 0.5
      b = (b - 0.5) * cont + 0.5

      // Brightness
      r *= bright
      g *= bright
      b *= bright

      dst[i] = clamp(r * 255, 0, 255)
      dst[i + 1] = clamp(g * 255, 0, 255)
      dst[i + 2] = clamp(b * 255, 0, 255)
      dst[i + 3] = a
    }
  }

  ctx.putImageData(output, 0, 0)

  // Bloom post-pass — phosphor glow via Gaussian blur + screen composite
  if (bloomAmount > 0) {
    const bloomRadius = Math.max(2, Math.round(Math.max(width, height) * 0.012))
    const bloomCanvas = document.createElement('canvas')
    bloomCanvas.width = width
    bloomCanvas.height = height
    const bctx = bloomCanvas.getContext('2d')
    if (bctx) {
      bctx.filter = `blur(${bloomRadius}px)`
      bctx.drawImage(canvas, 0, 0)
      bctx.filter = 'none'
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = bloomAmount
      ctx.drawImage(bloomCanvas, 0, 0)
      ctx.restore()
    }
  }
}

// ---------------------------------------------------------------------------
// IIR Transfer‑Function filter – ported from ntsc‑rs filter.rs
// Supports up to 4 numerator and 3 denominator coefficients (order ≤ 3).
// ---------------------------------------------------------------------------

class TransferFunction {
  /**
   * @param {number[]} num – numerator coefficients (max 4)
   * @param {number[]} den – denominator coefficients WITHOUT the implicit leading 1 (max 3)
   */
  constructor(num, den) {
    this.num = Float64Array.from(num)
    this.den = Float64Array.from(den)
    this.order = den.length + 1 // includes implicit leading 1
  }

  /** Return initial filter state so the output starts at steady‑state `value`. */
  _initialCondition(value) {
    const n = this.order
    const zi = new Float64Array(n)
    if (Math.abs(value) === 0) return zi
    const { num, den } = this
    let bSum = 0
    for (let i = 1; i < n; i++) {
      const ni = i < num.length ? num[i] : 0
      const di = i - 1 < den.length ? den[i - 1] : 0
      bSum += ni - di * num[0]
    }
    let denSum = 0
    for (let i = 0; i < den.length; i++) denSum += den[i]
    zi[0] = bSum / (denSum + 1)
    let aSum = 1
    let cSum = 0
    for (let i = 1; i < n - 1; i++) {
      const ni = i < num.length ? num[i] : 0
      const di = i - 1 < den.length ? den[i - 1] : 0
      aSum += di
      cSum += ni - di * num[0]
      zi[i] = (aSum * zi[0] - cSum) * value
    }
    zi[0] *= value
    return zi
  }

  /**
   * Filter a 1‑D signal in‑place.
   * @param {Float32Array} signal
   * @param {number} initial  – steady‑state initial value (0 = zero, or first sample value)
   * @param {number} delay    – shift output left by this many samples
   */
  filterInPlace(signal, initial, delay) {
    const len = signal.length
    if (len === 0) return
    const { num, den, order } = this
    const z = this._initialCondition(initial)
    const nCoeffs = order
    for (let i = 0; i < len + delay; i++) {
      const sample = signal[Math.min(i, len - 1)]
      let filtered = z[0] + num[0] * sample
      for (let k = 0; k < nCoeffs - 1; k++) {
        const nk1 = k + 1 < num.length ? num[k + 1] : 0
        const dk = k < den.length ? den[k] : 0
        z[k] = z[k + 1] + nk1 * sample - dk * filtered
      }
      if (i >= delay) signal[i - delay] = filtered
    }
  }

  /** Return a new TF whose output is `scale * (this - identity) + identity`. */
  withScale(scale) {
    const newNum = new Float64Array(this.order)
    newNum[0] = scale * this.num[0] + (1 - scale)
    for (let i = 1; i < this.order; i++) {
      const ni = i < this.num.length ? this.num[i] : 0
      const di = i - 1 < this.den.length ? this.den[i - 1] : 0
      newNum[i] = scale * ni + (1 - scale) * di
    }
    return new TransferFunction(
      Array.from(newNum),
      Array.from(this.den)
    )
  }

  /** Multiply two transfer functions (polynomial multiplication). */
  mul(other) {
    const polyMul = (a, b) => {
      const out = new Float64Array(a.length + b.length - 1)
      for (let ai = 0; ai < a.length; ai++)
        for (let bi = 0; bi < b.length; bi++)
          out[ai + bi] += a[ai] * b[bi]
      return out
    }
    const trimZeros = (arr) => {
      let end = arr.length
      while (end > 0 && arr[end - 1] === 0) end--
      return arr.subarray(0, end)
    }
    // Denominator with leading 1 restored
    const aDenFull = new Float64Array(this.order)
    aDenFull[0] = 1
    for (let i = 0; i < this.den.length; i++) aDenFull[i + 1] = this.den[i]
    const bDenFull = new Float64Array(other.order)
    bDenFull[0] = 1
    for (let i = 0; i < other.den.length; i++) bDenFull[i + 1] = other.den[i]

    let newNum = trimZeros(polyMul(this.num, other.num))
    let newDen = trimZeros(polyMul(aDenFull, bDenFull))
    // Remove leading 1 from denominator
    newDen = newDen.subarray(1)
    return new TransferFunction(Array.from(newNum), Array.from(newDen))
  }

  /** Cascade this filter with itself `n` times. */
  cascadeSelf(n) {
    let f = this
    for (let i = 1; i < n; i++) f = f.mul(this)
    return f
  }
}

// --- Filter factories (ported from ntsc‑rs ntsc.rs) --------------------------

const NTSC_RATE = (315000000 / 88) * 4 // ≈ 14.318 MHz

const makeLowpass = (cutoff, rate) => {
  const dt = 1 / rate
  const tau = 1 / (cutoff * 2 * Math.PI)
  const alpha = dt / (tau + dt)
  return new TransferFunction([alpha], [-(1 - alpha)])
}

const makeLowpassTriple = (cutoff, rate) => makeLowpass(cutoff, rate).cascadeSelf(3)

const makeButterworth = (cutoff, rate) => {
  const freq = Math.min(2 * cutoff, rate) / rate * Math.PI
  const omegaS = Math.sin(freq)
  const omegaC = Math.cos(freq)
  const FRAC_1_SQRT_2 = Math.SQRT1_2
  const alpha = omegaS / (2 * FRAC_1_SQRT_2)
  const gain = 1 / (1 + alpha)
  return new TransferFunction(
    [(1 - omegaC) * 0.5 * gain, (1 - omegaC) * gain, (1 - omegaC) * 0.5 * gain],
    [-2 * omegaC * gain, (1 - alpha) * gain]
  )
}

const makeNotchFilter = (freq, quality) => {
  const bandwidth = (freq / quality) * Math.PI
  const freqRad = freq * Math.PI
  const beta = Math.tan(bandwidth * 0.5)
  const gain = 1 / (1 + beta)
  return new TransferFunction(
    [gain, -2 * Math.cos(freqRad) * gain, gain],
    [-2 * Math.cos(freqRad) * gain, 2 * gain - 1]
  )
}

/**
 * Apply an IIR filter to each row of a plane (width × height stored flat).
 * @param {Float32Array} plane
 * @param {number} w – row width
 * @param {TransferFunction} tf
 * @param {string} initialMode – 'zero' | 'first'
 * @param {number} delay
 */
const filterPlane = (plane, w, tf, initialMode, delay) => {
  const rows = plane.length / w
  for (let r = 0; r < rows; r++) {
    const row = plane.subarray(r * w, (r + 1) * w)
    const init = initialMode === 'first' ? row[0] : 0
    tf.filterInPlace(row, init, delay)
  }
}

// ---------------------------------------------------------------------------
// VHS – proper NTSC / VHS signal pipeline from ntsc‑rs
// ---------------------------------------------------------------------------

const applyVhs = (
  canvas,
  {
    lumaSmear = 0.55,
    chromaBlur = 0.65,
    chromaDelayX = 2.5,
    chromaDelayY = 1,
    chromaVertBlend = 0.45,
    edgeWave = 0.4,
    edgeWaveFrequency = 0.025,
    edgeWaveAmplitude = 4.5,
    headSwitchingHeight = 0.18,
    headSwitchingShift = 6,
    chromaLoss = 0.12,
    noise = 0.08,
    snow = 0.02,
    trackingNoiseHeight = 0.14,
    trackingNoiseWave = 6,
    trackingNoiseSnow = 0.08,
    trackingNoiseNoise = 0.18,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const src = image.data
  const output = ctx.createImageData(width, height)
  const dst = output.data
  const size = width * height

  // Horizontal bandwidth scale – normalise so filters behave as if 640 px wide
  const hScale = Math.max(0.125, width / 640)
  const rate = NTSC_RATE * hScale

  // ── helpers ──────────────────────────────────────────────────────────────
  const clampCoord = (v, max) => Math.max(0, Math.min(max, v))
  const hash = (a, b) => {
    const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
    return s - Math.floor(s)
  }
  const samplePlane = (plane, x, y) => {
    const cx = clamp(x, 0, width - 1)
    const cy = clamp(y, 0, height - 1)
    const x0 = Math.floor(cx)
    const y0 = Math.floor(cy)
    const x1 = Math.min(width - 1, x0 + 1)
    const y1 = Math.min(height - 1, y0 + 1)
    const tx = cx - x0
    const ty = cy - y0
    const i00 = y0 * width + x0
    const i10 = y0 * width + x1
    const i01 = y1 * width + x0
    const i11 = y1 * width + x1
    const v0 = plane[i00] + (plane[i10] - plane[i00]) * tx
    const v1 = plane[i01] + (plane[i11] - plane[i01]) * tx
    return v0 + (v1 - v0) * ty
  }

  /**
   * Shift a row of `srcPlane` horizontally by `shift` px using linear
   * interpolation, writing into `dstPlane` at the same row.  Ported from
   * ntsc‑rs shift.rs – uses the same decomposition into integer + fractional
   * parts with boundary extension.
   */
  const shiftRow = (srcPlane, dstPlane, y, shift) => {
    const rowOff = y * width
    // Decompose shift into integer + fraction matching ntsc-rs shift.rs:
    //   Rust: shift_int = shift as isize - if shift < 0 { 1 } else { 0 }
    //   Rust: shift_frac = if shift < 0 { 1 - shift.fract().abs() } else { shift.fract() }
    const shiftInt = shift < 0
      ? Math.trunc(shift) - 1
      : Math.trunc(shift)
    const shiftFrac = shift < 0
      ? 1 - Math.abs(shift - Math.ceil(shift))
      : shift - Math.trunc(shift)

    for (let x = 0; x < width; x++) {
      const leftIdx = x - shiftInt - 1
      const rightIdx = leftIdx + 1
      const boundaryVal = shift >= 0
        ? srcPlane[rowOff]                       // extend left edge
        : srcPlane[rowOff + width - 1]           // extend right edge
      const left = (leftIdx >= 0 && leftIdx < width)
        ? srcPlane[rowOff + leftIdx]
        : boundaryVal
      const right = (rightIdx >= 0 && rightIdx < width)
        ? srcPlane[rowOff + rightIdx]
        : boundaryVal
      dstPlane[rowOff + x] = left * shiftFrac + right * (1 - shiftFrac)
    }
  }

  /** Shift a plane row in‑place. */
  const shiftTmp = new Float32Array(width)

  const shiftRowInPlace = (plane, y, shift) => {
    const rowOff = y * width
    shiftTmp.set(plane.subarray(rowOff, rowOff + width))
    const shiftInt = shift < 0 ? Math.trunc(shift) - 1 : Math.trunc(shift)
    const shiftFrac = shift < 0 ? 1 - Math.abs(shift - Math.ceil(shift)) : shift - Math.trunc(shift)
    const boundaryVal = shift >= 0 ? shiftTmp[0] : shiftTmp[width - 1]
    for (let x = 0; x < width; x++) {
      const leftIdx = x - shiftInt - 1
      const rightIdx = leftIdx + 1
      const left = (leftIdx >= 0 && leftIdx < width) ? shiftTmp[leftIdx] : boundaryVal
      const right = (rightIdx >= 0 && rightIdx < width) ? shiftTmp[rightIdx] : boundaryVal
      plane[rowOff + x] = left * shiftFrac + right * (1 - shiftFrac)
    }
  }

  const seed = hashString(`${width}x${height}|ntsc-vhs`)

  const I_MULT = [1, 0, -1, 0]
  const Q_MULT = [0, 1, 0, -1]
  const I_MULT_INV = [-1, 0, 1, 0]
  const Q_MULT_INV = [0, -1, 0, 1]

  // ── 1. RGB → YIQ ────────────────────────────────────────────────────────
  const yPlane = new Float32Array(size)
  const iPlane = new Float32Array(size)
  const qPlane = new Float32Array(size)

  for (let p = 0; p < size; p++) {
    const idx = p * 4
    const r = src[idx] / 255
    const g = src[idx + 1] / 255
    const b = src[idx + 2] / 255
    yPlane[p] = r * 0.299 + g * 0.587 + b * 0.114
    iPlane[p] = r * 0.596 - g * 0.274 - b * 0.322
    qPlane[p] = r * 0.211 - g * 0.523 + b * 0.312
  }

  // ── 2. Input luma prefilter (notch at ½ Nyquist – reduces rainbows) ─────
  {
    const notch = makeNotchFilter(0.5, 2.0)
    filterPlane(yPlane, width, notch, 'first', 0)
  }

  // ── 3. Chroma input low‑pass (NTSC I≈1.3 MHz, Q≈0.6 MHz bandwidth) ─────
  {
    const iFilter = makeButterworth(1300000, rate)
    const qFilter = makeButterworth(600000, rate)
    filterPlane(iPlane, width, iFilter, 'zero', 2)
    filterPlane(qPlane, width, qFilter, 'zero', 4)
  }

  // ── 4. Modulate chroma into luma → composite ────────────────────────────
  const composite = new Float32Array(size)
  for (let y = 0; y < height; y++) {
    const phaseOffset = (y & 1) ? 2 : 0
    const rowOff = y * width
    for (let x = 0; x < width; x++) {
      const p = rowOff + x
      const phase = (x + phaseOffset) & 3
      composite[p] = yPlane[p] + iPlane[p] * I_MULT[phase] + qPlane[p] * Q_MULT[phase]
    }
  }

  // ── 5. Composite pre‑emphasis (sharpening) ──────────────────────────────
  {
    const sharpenAmount = 1.0
    if (sharpenAmount !== 0) {
      const preemph = makeLowpass(
        (315000000 / 88 / 2) * hScale,
        rate
      ).withScale(-sharpenAmount)
      filterPlane(composite, width, preemph, 'zero', 0)
    }
  }

  // ── 6. Composite noise ──────────────────────────────────────────────────
  const noiseAmount = clamp(noise, 0, 1)
  if (noiseAmount > 0) {
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      for (let x = 0; x < width; x++) {
        composite[rowOff + x] += (hash(x * 0.7, y * 1.3 + seed) - 0.5) * noiseAmount * 0.12
      }
    }
  }

  // ── 7. Snow (transient speckles via geometric distribution) ─────────────
  const snowAmount = clamp(snow, 0, 1)
  const snowOpacity = 0.4

  const addRowSpeckles = (row, rng, intensity, anisotropy) => {
    if (intensity <= 0) return
    const logistic = ((rng() - intensity) / Math.max(1e-5, intensity * (1 - intensity) * (1 - anisotropy)))
    let lineIntensity = anisotropy / (1 + Math.exp(logistic)) + intensity * (1 - anisotropy)
    lineIntensity = Math.min(1, lineIntensity * 0.125)
    if (lineIntensity <= 0) return
    const p = lineIntensity
    const inv = Math.log(1 - p)
    let x = -64
    while (x < row.length) {
      const step = Math.max(1, Math.floor(Math.log(1 - rng()) / inv))
      x += step
      if (x >= row.length) break
      const transientLen = 8 + rng() * 56
      const freq = transientLen * (3 + rng() * 2)
      const end = Math.min(row.length, Math.ceil(x + transientLen))
      const localSeed = rng()
      for (let i = Math.max(0, x); i < end; i++) {
        const t = i - x
        const amp = Math.cos((t * Math.PI) / freq) * Math.pow(1 - t / transientLen, 2)
        row[i] += amp * (localSeed * 3 - 1)
      }
      x += 1
    }
  }

  if (snowAmount > 0) {
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      const row = composite.subarray(rowOff, rowOff + width)
      const rowSeed = hashString(`${seed}|snow|${y}`)
      const rng = createSeededRandom(rowSeed)
      addRowSpeckles(row, rng, snowAmount * snowOpacity, 0.5)
    }
  }

  // ── 8. Head switching ───────────────────────────────────────────────────
  if (headSwitchingHeight > 0 && headSwitchingShift !== 0) {
    const hsRows = Math.floor(height * clamp(headSwitchingHeight, 0, 1))
    const hsStart = Math.max(0, height - hsRows)
    const shifted = new Float32Array(size)
    for (let y = 0; y < height; y++) {
      if (y < hsStart) {
        const off = y * width
        shifted.set(composite.subarray(off, off + width), off)
        continue
      }
      const t = hsRows > 1 ? (y - hsStart) / (hsRows - 1) : 1
      const shift = Math.pow(t, 1.5) * headSwitchingShift + (hash(y * 1.31, seed) - 0.5) * 1.2
      shiftRow(composite, shifted, y, shift)
    }
    composite.set(shifted)
  }

  // ── 9. Tracking noise ──────────────────────────────────────────────────
  const trackingHeight = Math.floor(height * clamp(trackingNoiseHeight, 0, 1))
  if (trackingHeight > 0) {
    const trackingStart = Math.max(0, height - trackingHeight)
    const trackingComposite = new Float32Array(size)
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      if (y < trackingStart) {
        trackingComposite.set(composite.subarray(rowOff, rowOff + width), rowOff)
        continue
      }
      const t = trackingHeight > 1 ? (y - trackingStart) / (trackingHeight - 1) : 1
      const intensityScale = t * t
      const wave =
        (Math.sin(y * 0.15 + seed * 0.003) +
          (hash(y * 1.1, seed * 0.37) - 0.5) * 0.5) *
        trackingNoiseWave * intensityScale
      shiftRow(composite, trackingComposite, y, wave)

      const row = trackingComposite.subarray(rowOff, rowOff + width)
      if (trackingNoiseNoise > 0) {
        const noiseScale = trackingNoiseNoise * 0.2 * intensityScale
        for (let x = 0; x < width; x++) {
          row[x] += (hash(x * 0.9, y * 1.3 + seed * 0.5) - 0.5) * noiseScale
        }
      }
      if (trackingNoiseSnow > 0) {
        const rowSeed = hashString(`${seed}|tracking|${y}`)
        const rng = createSeededRandom(rowSeed)
        addRowSpeckles(row, rng, trackingNoiseSnow * intensityScale, 0.25)
      }
    }
    composite.set(trackingComposite)
  }

  // ── 10. Chroma demodulation (notch filter – from ntsc‑rs) ───────────────
  //   1) Extract luma from composite via notch filter (removes chroma carrier)
  //   2) Chroma = composite − filtered luma
  //   3) Demodulate I/Q from chroma using carrier phase lookup
  const yDemod = new Float32Array(size)
  const iDemod = new Float32Array(size)
  const qDemod = new Float32Array(size)

  // Copy composite into yDemod, then apply notch filter in‑place
  yDemod.set(composite)
  {
    const notch = makeNotchFilter(0.5, 2.0)
    filterPlane(yDemod, width, notch, 'zero', 0)
  }

  // Demodulate chroma: for each pixel, chroma = composite − filteredLuma,
  // then multiply by inverse carrier to recover I and Q.
  for (let y = 0; y < height; y++) {
    const phaseOffset = (y & 1) ? 2 : 0
    const rowOff = y * width
    for (let x = 0; x < width; x++) {
      const p = rowOff + x
      const offsetC = (x + phaseOffset) & 3
      const chromaC = composite[p] - yDemod[p]
      let iMod = chromaC * I_MULT_INV[offsetC]
      let qMod = chromaC * Q_MULT_INV[offsetC]

      if (x < width - 1) {
        const offsetR = (x + 1 + phaseOffset) & 3
        const chromaR = composite[p + 1] - yDemod[p + 1]
        iMod += chromaR * I_MULT_INV[offsetR] * 0.5
        qMod += chromaR * Q_MULT_INV[offsetR] * 0.5
      }
      if (x > 0) {
        const offsetL = (x - 1 + phaseOffset) & 3
        const chromaL = composite[p - 1] - yDemod[p - 1]
        iMod += chromaL * I_MULT_INV[offsetL] * 0.5
        qMod += chromaL * Q_MULT_INV[offsetL] * 0.5
      }
      iDemod[p] = iMod
      qDemod[p] = qMod
    }
  }

  // ── 11. Luma smear (IIR low‑pass, from ntsc‑rs `luma_smear`) ───────────
  if (lumaSmear > 0) {
    const cutoff = Math.pow(2, -4 * lumaSmear) * 0.25
    const lpf = makeLowpass(cutoff, hScale)
    filterPlane(yDemod, width, lpf, 'zero', 0)
  }

  // ── 12. Ringing (notch filter artefact) ─────────────────────────────────
  {
    const ringingFreq = 0.45
    const ringingPower = 4.0
    const ringingIntensity = 4.0
    const ringing = makeNotchFilter(
      clamp(ringingFreq / hScale, 0, 1),
      ringingPower
    ).withScale(ringingIntensity)
    filterPlane(yDemod, width, ringing, 'first', 1)
  }

  // ── 13. Post‑demod luma noise ───────────────────────────────────────────
  if (noiseAmount > 0) {
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      for (let x = 0; x < width; x++) {
        yDemod[rowOff + x] += (hash(x * 2.1, y * 0.7 + seed) - 0.5) * noiseAmount * 0.06
      }
    }
  }

  // ── 14. Edge wave (VHS horizontal wobble) ───────────────────────────────
  const waveAmp = Math.max(0, edgeWaveAmplitude) * clamp(edgeWave, 0, 1)
  if (waveAmp > 0) {
    const waveFreq = Math.max(0.001, edgeWaveFrequency) * Math.PI * 2
    const phaseBase = (seed % 1024) / 1024 * Math.PI * 2
    for (const plane of [yDemod, iDemod, qDemod]) {
      for (let y = 0; y < height; y++) {
        const baseWave = Math.sin(y * waveFreq + phaseBase)
        const jitter = (hash(y, seed) - 0.5) * 0.5
        const shift = (baseWave + jitter) * waveAmp * hScale
        shiftRowInPlace(plane, y, shift)
      }
    }
  }

  // ── 15. Chroma delay ───────────────────────────────────────────────────
  const delayX = chromaDelayX * hScale
  const delayYVal = chromaDelayY
  if (Math.abs(delayX) > 0 || Math.abs(delayYVal) > 0) {
    const delayedI = new Float32Array(size)
    const delayedQ = new Float32Array(size)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        delayedI[p] = samplePlane(iDemod, x + delayX, y + delayYVal)
        delayedQ[p] = samplePlane(qDemod, x + delayX, y + delayYVal)
      }
    }
    iDemod.set(delayedI)
    qDemod.set(delayedQ)
  }

  // ── 16. VHS tape‑speed low‑pass (LP mode: luma 1.9 MHz, chroma 300 kHz)
  {
    const lumaCut = 1900000
    const chromaCut = 300000
    const chromaFilterDelay = 5

    const lumaLPF = makeButterworth(lumaCut, rate)
    filterPlane(yDemod, width, lumaLPF, 'zero', 0)

    const chromaLPF = makeButterworth(chromaCut, rate)
    filterPlane(iDemod, width, chromaLPF, 'zero', chromaFilterDelay)
    filterPlane(qDemod, width, chromaLPF, 'zero', chromaFilterDelay)

    // VHS sharpening (pre‑emphasis on luma, like ntsc‑rs vhs_sharpen)
    const sharpenIntensity = 0.25
    const sharpenFreq = 1.0
    const lumaSharpen = makeButterworth(
      lumaCut * sharpenFreq,
      rate
    ).withScale(-sharpenIntensity * 2.0 * sharpenFreq)
    filterPlane(yDemod, width, lumaSharpen, 'zero', 0)
  }

  // ── 17. Chroma output low‑pass (full NTSC bandwidth) ───────────────────
  {
    const chromaBlurAmount = clamp(chromaBlur, 0, 1)
    if (chromaBlurAmount > 0) {
      const iCut = 1300000 * (1.1 - chromaBlurAmount)
      const qCut = 600000 * (1.1 - chromaBlurAmount)
      const iLP = makeButterworth(iCut, rate)
      const qLP = makeButterworth(qCut, rate)
      filterPlane(iDemod, width, iLP, 'zero', 2)
      filterPlane(qDemod, width, qLP, 'zero', 4)
    }
  }

  // ── 18. Chroma vertical blend ──────────────────────────────────────────
  const vertBlend = clamp(chromaVertBlend, 0, 1)
  if (vertBlend > 0 && height > 1) {
    // Proper VHS‑style: average current row with previous (delay line)
    const delayI = new Float32Array(width)
    const delayQ = new Float32Array(width)
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      for (let x = 0; x < width; x++) {
        const idx = rowOff + x
        const ci = iDemod[idx]
        const cq = qDemod[idx]
        iDemod[idx] = ci * (1 - vertBlend) + delayI[x] * vertBlend
        qDemod[idx] = cq * (1 - vertBlend) + delayQ[x] * vertBlend
        delayI[x] = ci
        delayQ[x] = cq
      }
    }
  }

  // ── 19. Chroma loss ────────────────────────────────────────────────────
  const loss = clamp(chromaLoss, 0, 1)
  if (loss > 0) {
    for (let y = 0; y < height; y++) {
      if (hash(y, seed * 0.37) < loss) {
        const rowOff = y * width
        iDemod.fill(0, rowOff, rowOff + width)
        qDemod.fill(0, rowOff, rowOff + width)
      }
    }
  }

  // ── 20. Clamp chroma & convert YIQ → RGB ───────────────────────────────
  const iMax = 0.5957
  const qMax = 0.5226
  for (let p = 0; p < size; p++) {
    const yVal = yDemod[p]
    const iVal = clamp(iDemod[p], -iMax, iMax)
    const qVal = clamp(qDemod[p], -qMax, qMax)
    const r = yVal + iVal * 0.956 + qVal * 0.621
    const g = yVal - iVal * 0.272 - qVal * 0.647
    const b = yVal - iVal * 1.106 + qVal * 1.703
    const o = p * 4
    dst[o]     = clamp(r, 0, 1) * 255
    dst[o + 1] = clamp(g, 0, 1) * 255
    dst[o + 2] = clamp(b, 0, 1) * 255
    dst[o + 3] = src[o + 3]
  }

  ctx.putImageData(output, 0, 0)
}

const hslToRgb = (h, s, l) => {
  const hue = ((h % 360) + 360) % 360
  const hn = hue / 360
  if (s === 0) {
    const val = Math.round(l * 255)
    return [val, val, val]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const r = hue2rgb(hn + 1 / 3)
  const g = hue2rgb(hn)
  const b = hue2rgb(hn - 1 / 3)
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

const applyColorShift = (
  canvas,
  {
    bandCountMin = 2,
    bandCountMax = 6,
    minHeight = 20,
    maxHeight = 90,
    hueMin = 0,
    hueMax = 360,
    saturationMin = 1,
    saturationMax = 1.4,
    lightnessMin = -0.05,
    lightnessMax = 0.05,
    channelOffset = 6,
    channelOffsetY = 0,
    bandOpacity = 0.75,
    bandNegative = 0.5,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data
  dst.set(src)

  const countMin = Math.max(1, Math.round(bandCountMin))
  const countMax = Math.max(countMin, Math.round(bandCountMax))
  const minH = Math.max(1, Math.round(minHeight))
  const maxH = Math.max(minH, Math.round(maxHeight))
  const hueMinValue = Math.min(hueMin, hueMax)
  const hueMaxValue = Math.max(hueMin, hueMax)
  const satMin = clamp(Math.min(saturationMin, saturationMax), 0.2, 3)
  const satMax = clamp(Math.max(saturationMin, saturationMax), 0.2, 3)
  const lightMin = clamp(Math.min(lightnessMin, lightnessMax), -1, 1)
  const lightMax = clamp(Math.max(lightnessMin, lightnessMax), -1, 1)
  const offsetX = Math.max(0, Math.round(channelOffset))
  const offsetY = Math.round(channelOffsetY)
  const opacity = clamp(bandOpacity, 0, 1)
  const invOpacity = 1 - opacity
  const negative = clamp(bandNegative, 0, 1)

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${bandCountMin}|${bandCountMax}|${minHeight}|${maxHeight}|${hueMin}|${hueMax}|${saturationMin}|${saturationMax}|${lightnessMin}|${lightnessMax}|${channelOffset}|${channelOffsetY}|${bandOpacity}|${bandNegative}`
      )
  const rand = createSeededRandom(seedValue)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let b = 0; b < bands; b += 1) {
    const r1 = rand()
    const r2 = rand()
    const r3 = rand()
    const r4 = rand()
    const r5 = rand()
    const bandHeight = Math.round(minH + r1 * (maxH - minH))
    const bandY = clamp(Math.round(r2 * (height - bandHeight)), 0, height - bandHeight)
    const hueValue = hueMinValue + r3 * (hueMaxValue - hueMinValue)
    const satBoost = clamp(satMin + r4 * (satMax - satMin), 0.2, 3)
    const lightShift = clamp(lightMin + r5 * (lightMax - lightMin), -1, 1)

    for (let y = bandY; y < bandY + bandHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4
        const r = read(x + offsetX, y + offsetY, 0)
        const g = read(x, y, 1)
        const bch = read(x - offsetX, y - offsetY, 2)
        const lum = (r * 0.299 + g * 0.587 + bch * 0.114) / 255
        let h = hueValue
        let s = clamp(satBoost, 0, 1)
        const negR = 255 - src[i]
        const negG = 255 - src[i + 1]
        const negB = 255 - src[i + 2]
        const negL = (Math.max(negR, negG, negB) + Math.min(negR, negG, negB)) / 510
        const blendL = clamp(negL + lightShift, 0, 1)
        const [cr, cg, cb] = hslToRgb(h, s, blendL)
        const overlayR =
          negR < 128 ? (2 * negR * cr) / 255 : 255 - (2 * (255 - negR) * (255 - cr)) / 255
        const overlayG =
          negG < 128 ? (2 * negG * cg) / 255 : 255 - (2 * (255 - negG) * (255 - cg)) / 255
        const overlayB =
          negB < 128 ? (2 * negB * cb) / 255 : 255 - (2 * (255 - negB) * (255 - cb)) / 255
        const tintR = Math.round(negR * (1 - negative) + overlayR * negative)
        const tintG = Math.round(negG * (1 - negative) + overlayG * negative)
        const tintB = Math.round(negB * (1 - negative) + overlayB * negative)
        dst[i] = Math.round(src[i] * invOpacity + tintR * opacity)
        dst[i + 1] = Math.round(src[i + 1] * invOpacity + tintG * opacity)
        dst[i + 2] = Math.round(src[i + 2] * invOpacity + tintB * opacity)
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyRgbShiftBands = (
  canvas,
  {
    bandCountMin = 3,
    bandCountMax = 8,
    minHeight = 10,
    maxHeight = 100,
    maxOffset = 12,
    maxOffsetY = 6,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data
  dst.set(src)

  const countMin = Math.max(1, Math.round(bandCountMin))
  const countMax = Math.max(countMin, Math.round(bandCountMax))
  const minH = Math.max(1, Math.round(minHeight))
  const maxH = Math.max(minH, Math.round(maxHeight))
  const offsetMaxX = Math.max(0, Math.round(maxOffset))
  const offsetMaxY = Math.max(0, Math.round(maxOffsetY))

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${bandCountMin}|${bandCountMax}|${minHeight}|${maxHeight}|${maxOffset}|${maxOffsetY}`
      )
  const rand = createSeededRandom(seedValue)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let b = 0; b < bands; b += 1) {
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(Math.round(rand() * (height - bandHeight)), 0, height - bandHeight)
    const channel = Math.floor(rand() * 3)
    const dx = Math.round((rand() * 2 - 1) * offsetMaxX)
    const dy = Math.round((rand() * 2 - 1) * offsetMaxY)

    for (let y = bandY; y < bandY + bandHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4 + channel
        dst[i] = read(x + dx, y + dy, channel)
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyRgbGrains = (
  canvas,
  {
    amount = 0.7,
    scale = 0.015,
    edgeBoost = 0.9,
    saturation = 1.2,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${amount}|${scale}|${edgeBoost}|${saturation}`
      )
  const rand = createSeededRandom(seedValue)
  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return s - Math.floor(s)
  }
  const hueOffset = rand() * 360
  const DEG2RAD = Math.PI / 180

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = r * 0.299 + g * 0.587 + b * 0.114
      const right = x + 1 < width ? i + 4 : i
      const down = y + 1 < height ? i + width * 4 : i
      const lumRight =
        data[right] * 0.299 + data[right + 1] * 0.587 + data[right + 2] * 0.114
      const lumDown =
        data[down] * 0.299 + data[down + 1] * 0.587 + data[down + 2] * 0.114
      const edge = clamp((Math.abs(lum - lumRight) + Math.abs(lum - lumDown)) / 255, 0, 1)

      const wave =
        Math.sin(x * scale + y * scale * 1.1) * 0.5 +
        Math.sin(x * scale * 2.0 - y * scale * 1.6) * 0.5
      const noise = (hash(x, y) - 0.5) * 2
      const hueShift = (wave * 0.6 + noise * 0.4) * amount * 180 + edge * edgeBoost * 200
      const lightJitter = noise * 0.04 * 255

      // Hue rotation via RGB matrix (avoids costly HSL round-trip)
      const angle = (hueShift + hueOffset) * DEG2RAD
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const rr = r * (0.299 + 0.701 * cosA + 0.168 * sinA)
            + g * (0.587 - 0.587 * cosA + 0.330 * sinA)
            + b * (0.114 - 0.114 * cosA - 0.497 * sinA)
      const rg = r * (0.299 - 0.299 * cosA - 0.328 * sinA)
            + g * (0.587 + 0.413 * cosA + 0.035 * sinA)
            + b * (0.114 - 0.114 * cosA + 0.292 * sinA)
      const rb = r * (0.299 - 0.300 * cosA + 1.250 * sinA)
            + g * (0.587 - 0.588 * cosA - 1.050 * sinA)
            + b * (0.114 + 0.886 * cosA - 0.203 * sinA)

      // Saturation boost in RGB space (scale deviation from luminance)
      const lumRot = rr * 0.299 + rg * 0.587 + rb * 0.114
      const satFactor = clamp(saturation + edge * 0.7, 0, 3)
      const sr = lumRot + (rr - lumRot) * satFactor
      const sg = lumRot + (rg - lumRot) * satFactor
      const sb = lumRot + (rb - lumRot) * satFactor

      data[i] = clamp(sr + lightJitter, 0, 255)
      data[i + 1] = clamp(sg + lightJitter, 0, 255)
      data[i + 2] = clamp(sb + lightJitter, 0, 255)
    }
  }

  ctx.putImageData(image, 0, 0)
}

const applyHueDistortion = (
  canvas,
  { amount = 1.4, scale = 0.022, threshold = 0.3, maxOffset = 14, edgeBoost = 1.1 } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return s - Math.floor(s)
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const lum = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114
      const right = x + 1 < width ? i + 4 : i
      const down = y + 1 < height ? i + width * 4 : i
      const lumRight =
        src[right] * 0.299 + src[right + 1] * 0.587 + src[right + 2] * 0.114
      const lumDown =
        src[down] * 0.299 + src[down + 1] * 0.587 + src[down + 2] * 0.114
      const edge = clamp((Math.abs(lum - lumRight) + Math.abs(lum - lumDown)) / 255, 0, 1)

      const nx = x * scale
      const ny = y * scale
      const wave =
        Math.sin(nx * 1.7 + ny * 1.1) * 0.6 +
        Math.sin(nx * 0.7 - ny * 2.1) * 0.4
      const noise = (hash(Math.floor(nx * 10), Math.floor(ny * 10)) - 0.5) * 0.35
      const field = clamp(wave * 0.5 + 0.5 + noise, 0, 1)

      const mask = clamp((field + edge * edgeBoost - threshold) / (1 - threshold), 0, 1)
      const offset = Math.round(mask * maxOffset * amount)

      if (offset === 0) {
        dst[i] = src[i]
        dst[i + 1] = src[i + 1]
        dst[i + 2] = src[i + 2]
        dst[i + 3] = src[i + 3]
        continue
      }

      const ox = Math.round(Math.sin(y * 0.05 + x * 0.02) * offset)
      const oy = Math.round(Math.cos(x * 0.04 - y * 0.03) * offset)
      const gx = x + Math.round(ox * 0.3)
      const gy = y + Math.round(oy * 0.3)

      dst[i] = read(x + ox, y + oy, 0)
      dst[i + 1] = read(gx, gy, 1)
      dst[i + 2] = read(x - ox, y - oy, 2)
      dst[i + 3] = src[i + 3]
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyRetroSciFi = (
  canvas,
  {
    lineFrequency = 0.38,
    warpFrequency = 0.045,
    warpAmplitude = 8,
    ripple = 0.02,
    intensity = 1.2,
    glow = 0.55,
    tint = { r: 40, g: 255, b: 120 },
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  for (let i = 0; i < src.length; i += 4) {
    dst[i] = 0
    dst[i + 1] = 0
    dst[i + 2] = 0
    dst[i + 3] = src[i + 3]
  }

  const freq = Math.max(0.01, lineFrequency)
  const warpFreq = Math.max(0.001, warpFrequency)
  const warpAmp = Math.max(0, warpAmplitude)
  const rippleFreq = Math.max(0.001, ripple)
  const bright = clamp(intensity, 0, 3)
  const glowAmount = clamp(glow, 0, 1)
  const tintR = clamp(tint?.r ?? 40, 0, 255)
  const tintG = clamp(tint?.g ?? 255, 0, 255)
  const tintB = clamp(tint?.b ?? 120, 0, 255)

  for (let y = 0; y < height; y += 1) {
    const rowPhase = y * freq
    const rowWarp = Math.sin(rowPhase * warpFreq) * warpAmp
    for (let x = 0; x < width; x += 1) {
      const sampleX = Math.round(
        clamp(x + rowWarp + Math.sin(x * rippleFreq + y * 0.01) * warpAmp, 0, width - 1)
      )
      const si = (y * width + sampleX) * 4
      const a = src[si + 3]
      if (a === 0) continue
      const r = src[si]
      const g = src[si + 1]
      const b = src[si + 2]
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255

      const wave = Math.sin(rowPhase + x * warpFreq + Math.sin(x * rippleFreq) * 0.6)
      const stripe = 0.35 + 0.65 * (0.5 + 0.5 * wave)
      const value = clamp(lum * stripe * bright, 0, 1)

      const base = value * 255
      const oi = (y * width + x) * 4
      dst[oi] = base * (tintR / 255)
      dst[oi + 1] = base * (tintG / 255)
      dst[oi + 2] = base * (tintB / 255)
      dst[oi + 3] = a
    }
  }

  ctx.putImageData(output, 0, 0)

  if (glowAmount > 0) {
    const glowRadius = 2.5 + glowAmount * 10
    const glowAlpha = clamp(0.44 + glowAmount * 0.75, 0, 1)
    const sourceGlow = createCanvasClone(canvas)
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = width
    glowCanvas.height = height
    const gctx = glowCanvas.getContext('2d')
    if (gctx) {
      gctx.filter = `blur(${glowRadius}px)`
      gctx.drawImage(sourceGlow, 0, 0)
      gctx.filter = 'none'
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = glowAlpha
      ctx.drawImage(glowCanvas, 0, 0)
      ctx.restore()
    }
  }
}

const applyOscilloscope = (
  canvas,
  {
    rowStep = 10,
    xStep = 2,
    amplitude = 18,
    thickness = 1,
    intensity = 1.1,
    glow = 0.4,
    tint = { r: 25, g: 255, b: 70 },
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  for (let i = 0; i < src.length; i += 4) {
    dst[i] = 0
    dst[i + 1] = 0
    dst[i + 2] = 0
    dst[i + 3] = src[i + 3]
  }

  const stepY = Math.max(1, Math.round(rowStep))
  const stepX = Math.max(1, Math.round(xStep))
  const amp = Math.max(0, amplitude)
  const thick = Math.max(1, Math.round(thickness))
  const bright = clamp(intensity, 0, 3)
  const glowAmount = clamp(glow, 0, 1)
  const tintR = clamp(tint?.r ?? 40, 0, 255)
  const tintG = clamp(tint?.g ?? 255, 0, 255)
  const tintB = clamp(tint?.b ?? 120, 0, 255)

  const addPixel = (x, y, r, g, b, a, weight = 1) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const oi = (y * width + x) * 4
    dst[oi] = clamp(dst[oi] + r * weight, 0, 255)
    dst[oi + 1] = clamp(dst[oi + 1] + g * weight, 0, 255)
    dst[oi + 2] = clamp(dst[oi + 2] + b * weight, 0, 255)
    dst[oi + 3] = Math.max(dst[oi + 3], a)
  }

  const drawLine = (x0, y0, x1, y1, r, g, b, a) => {
    const dx = x1 - x0
    const dy = y1 - y0
    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    if (steps === 0) {
      for (let k = -thick; k <= thick; k += 1) {
        addPixel(x0, y0 + k, r, g, b, a)
      }

      return
    }

    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps
      const x = Math.round(x0 + dx * t)
      const y = Math.round(y0 + dy * t)
      for (let k = -thick; k <= thick; k += 1) {
        addPixel(x, y + k, r, g, b, a)
      }

    }
  }

  for (let y = 0; y < height; y += stepY) {
    let prevX = null
    let prevY = null
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4
      const a = src[i + 3]
      if (a === 0) continue
      const r = src[i]
      const g = src[i + 1]
      const b = src[i + 2]
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
      const wobble = Math.sin(x * 0.02 + y * 0.03) * (amp * 0.15)
      const offset = (lum - 0.5) * amp + wobble
      const yy = Math.round(clamp(y + offset, 0, height - 1))

      const base = clamp(lum * 255 * bright, 0, 255)
      const outR = base * (tintR / 255)
      const outG = base * (tintG / 255)
      const outB = base * (tintB / 255)

      if (prevX !== null) {
        drawLine(prevX, prevY, x, yy, outR, outG, outB, a)
      }

      prevX = x
      prevY = yy
    }
  }

  ctx.putImageData(output, 0, 0)
  if (glowAmount > 0) {
    const glowRadius = 2.5 + glowAmount * 10
    const glowAlpha = clamp(0.44 + glowAmount * 0.75, 0, 1)
    const sourceGlow = createCanvasClone(canvas)
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = width
    glowCanvas.height = height
    const gctx = glowCanvas.getContext('2d')
    if (gctx) {
      gctx.filter = `blur(${glowRadius}px)`
      gctx.drawImage(sourceGlow, 0, 0)
      gctx.filter = 'none'
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = glowAlpha
      ctx.drawImage(glowCanvas, 0, 0)
      ctx.restore()
    }
  }
}



const applyBloom = (canvas, { radius, intensity }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = createCanvasClone(canvas)
  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bctx = blurCanvas.getContext('2d')
  if (!bctx) return
  bctx.filter = `blur(${Math.max(0, radius)}px)`
  bctx.drawImage(source, 0, 0)
  bctx.filter = 'none'

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = clamp(intensity, 0, 1)
  ctx.drawImage(blurCanvas, 0, 0)
  ctx.restore()
}

const FILTER_ENGINES = {
  pixelize: applyPixelize,
  rgbShift: applyRgbShift,
  neonSplit: applyNeonSplit,
  dualSplitBase: applyDualSplitBase,
  dualSplitOnly: applyDualSplitOnly,
  glitchTear: applyGlitchTear,
  glitchTearVertical: applyGlitchTearVertical,
  glitchBlocks: applyGlitchBlocks,
  noise: applyNoise,
  ditherFS: applyDitherFS,
  ditherBayer: applyDitherBayer,
  halftone: applyHalftone,
  chroma: applyChromatic,
  anaglyphSplit: applyAnaglyphSplit,
  dataLoss: applyDataLoss,
  bitcrush: applyBitcrush,
  quantizeStripes: applyQuantizeStripes,
  dropout: applyDropout,
  checksumGlitch: applyChecksumGlitch,
  cinemaTone: applyCinemaTone,
  chromaticAberration: applyChromaticAberration,
  palettePixel: applyPalettePixel,
  crtScreen: applyCrtScreen,
  vhs: applyVhs,
  rgbGrains: applyRgbGrains,
  rgbShiftBands: applyRgbShiftBands,
  colorShift: applyColorShift,
  hueDistortionRgb: applyHueDistortion,
  retroSciFi: applyRetroSciFi,
  oscilloscope: applyOscilloscope,
  bloom: applyBloom,
}

export const filterPresets = FILTER_PRESETS

export const getFilterPreset = (id) => FILTER_PRESET_BY_ID.get(id)

export const applyFiltersToCanvas = (canvas, filterIds, context = {}) => {
  if (!canvas || !Array.isArray(filterIds) || filterIds.length === 0) return
  const layer = context?.layer ?? null
  const layerId = layer?.id ?? null
  filterIds.forEach((filterId) => {
    const preset = FILTER_PRESET_BY_ID.get(filterId)
    if (!preset) return
    const engine = FILTER_ENGINES[preset.engine]
    if (!engine) return
    let params = preset.params ?? {}
    if (
      preset.engine === 'colorShift' ||
      preset.engine === 'rgbGrains' ||
      preset.engine === 'rgbShiftBands' ||
      preset.engine === 'anaglyphSplit' ||
      preset.engine === 'dataLoss' ||
      preset.engine === 'bitcrush' ||
      preset.engine === 'quantizeStripes' ||
      preset.engine === 'dropout' ||
      preset.engine === 'checksumGlitch' ||
      preset.engine === 'glitchTear' ||
      preset.engine === 'glitchTearVertical' ||
      preset.engine === 'glitchBlocks'
    ) {
      if (layer && (!layer.filterSeeds || typeof layer.filterSeeds !== 'object')) {
        layer.filterSeeds = {}
      }
      let layerSeed = layer?.filterSeeds?.[filterId]
      if (!Number.isFinite(layerSeed) && layer) {
        if (globalThis.crypto?.getRandomValues) {
          const seedData = new Uint32Array(1)
          globalThis.crypto.getRandomValues(seedData)
          layerSeed = seedData[0]
        } else {
          layerSeed = Math.floor(Math.random() * 0xffffffff)
        }
        layer.filterSeeds[filterId] = layerSeed
      }
      if (Number.isFinite(layerSeed)) {
        params = { ...params, seed: layerSeed }
      } else if (layerId) {
        const seed = hashString(`${layerId}|${canvas.width}x${canvas.height}|${filterId}`)
        params = { ...params, seed }
      }
    }
    engine(canvas, params)
  })
}
