import { createSeededRandom } from './filters/utils.js'

const toId = label => label.replace(/\W+/g, '-').toLowerCase().replace(/-$/, '')
import { applyPixelize } from './filters/pixelize.js'
import { applyDuotone } from './filters/duotone.js'
import { applyChannelSwap } from './filters/channelSwap.js'
import { applyNoise, applyRgbNoise } from './filters/noise.js'
import { applySoftGlow, applyNeonGlow, applyBloomHdr, applyDreamyGlow, applyEdgeGlow, applyTintedBloom, applyHaloGlow } from './filters/bloom.js'
import { applyDitherBayer, applyDitherAtkinson, applyDitherBlueNoise, applyDitherClusteredDot, applyDitherRiemersma, applyDitherRandomNoise } from './filters/dither.js'
import { applyRetroSplit, applyNeonSplit, applyChromaticSplit, applyAnaglyphSplit } from './filters/split.js'
import { applyRgbShift, applyNegativeBands, applyHorizontalBandShift, applyVerticalBandShift, applyBlocksShift, applyHorizontalByteShift, applyVerticalByteShift } from './filters/shift.js'
import { applyPixelPalette } from './filters/palettePixel.js'
import { applyBitcrush, applyBitcrushStripes } from './filters/bitcrush.js'
import { applyCinemaTone, applyChromaticAberration, applyCrtScreen, applyRetroSciFi, applyOscilloscope } from './filters/screen.js'
import { applyVhs } from './filters/vhs.js'
import { applyDataLoss, applyDataLossStream, applyDataLossFreeze, applyDataLossBitplane, applyRowCorruption, applyJpegArtifact, applyBlockCorruption } from './filters/dataLoss.js'
import { applyPixelMelt } from './filters/pixelMelt.js'
import { applyRgbGlitch, applyRgbDrift } from './filters/rgbGlitch.js'

export const RANDOM_FILTER_IDS = [
  'rgb-noise',
  'rgb-shift',
  'anaglyph-split',
  'data-loss',
  'data-loss-stream',
  'rgb-drift',
  'data-loss-freeze',
  'data-loss-bitplane',
  'bitcrush-3',
  'bitcrush-stripes',
  'horizontal-band-shift',
  'vertical-band-shift',
  'blocks-shift',
  'channel-swap',
  'retro-sci-fi',
  'horizontal-byte-shift',
  'vertical-byte-shift',
  'row-corruption',
  'jpeg-artifacts',
  'pixel-melt',
  'block-corruption',
  'negative-bands',
  'vhs',
]

export const filterPresets = [
  {
    label: 'Nano Pixel',
    function: applyPixelize,
    params: { size: 2 }
  },
  {
    label: 'Micro Pixel',
    function: applyPixelize,
    params: { size: 4 }
  },
  {
    label: 'Duotone',
    function: applyDuotone,
    params: {
      dark: { r: 20, g: 0, b: 80 },
      light: { r: 255, g: 200, b: 50 },
    }
  },
  {
    label: 'Channel Swap',
    function: applyChannelSwap,
    params: { shift: 1 }
  },
  {
    label: 'Film Grain',
    function: applyNoise,
    params: { amount: 14 }
  },
  {
    label: 'Dusty Grain',
    function: applyNoise,
    params: { amount: 28 }
  },
  {
    label: 'RGB Noise',
    function: applyRgbNoise,
    params: {
      amount: 0.3,
      scale: 0.012,
      edgeBoost: 2.9,
      saturation: 1.05,
    }
  },
  {
    label: 'Soft Glow',
    function: applySoftGlow,
    params: {
      radiusRatio: 0.02,
      intensity: 0.9,
    }
  },
  {
    label: 'Neon Glow',
    function: applyNeonGlow,
    params: {
      magenta: { xRatio: -0.004, yRatio: -0.002 },
      cyan: { xRatio: 0.004, yRatio: 0.002 },
      strength: 0.55,
    }
  },
  {
    label: 'Bloom HDR',
    function: applyBloomHdr,
    params: {
      radiusRatio: 0.02,
      intensity: 0.7,
      threshold: 0.6,
    }
  },
  {
    label: 'Dreamy Glow',
    function: applyDreamyGlow,
    params: {
      radiusRatio: 0.03,
      intensity: 0.6,
      desaturation: 0.4
    }
  },
  {
    label: 'Edge Glow',
    function: applyEdgeGlow,
    params: {
      radiusRatio: 0.012,
      intensity: 0.8,
      edgeStrength: 1.5,
    }
  },
  {
    label: 'Warm Glow',
    function: applyTintedBloom,
    params: {
      radiusRatio: 0.025,
      intensity: 0.5,
      tint: { r: 255, g: 180, b: 80 },
    }
  },
  {
    label: 'Cold Glow',
    function: applyTintedBloom,
    params: {
      radiusRatio: 0.025,
      intensity: 0.5,
      tint: { r: 80, g: 160, b: 255 },
    }
  },
  {
    label: 'Halo Glow',
    function: applyHaloGlow,
    params: {
      radiusRatio: 0.06,
      intensity: 0.35,
    }
  },
  {
    label: 'Random Noise Dither',
    function: applyDitherRandomNoise,
    params: { levels: 2 }
  },
  {
    label: 'Riemersma Dither',
    function: applyDitherRiemersma,
    params: { levels: 2 }
  },
  {
    label: 'Atkinson Dither',
    function: applyDitherAtkinson,
    params: { levels: 2 }
  },
  {
    label: 'Bayer Dither',
    function: applyDitherBayer,
    params: { matrixSize: 3, levels: 2 }
  },
  {
    label: 'Blue Noise Dither',
    function: applyDitherBlueNoise,
    params: { levels: 2 }
  },
  {
    label: 'Clustered Dot Dither',
    function: applyDitherClusteredDot,
    params: { levels: 2 }
  },
  {
    label: 'Chromatic Split',
    function: applyChromaticSplit,
    params: {
      offsetRatio: 0.004,
      offsetYRatio: 0.002,
    }
  },
  {
    label: 'Retro Split',
    function: applyRetroSplit,
    params: {
      r: { xRatio: -0.01, yRatio: -0.006 },
      g: { xRatio: 0.002, yRatio: -0.002 },
      b: { xRatio: 0.01, yRatio: 0.006 },
    }
  },
  {
    label: 'Neon Split',
    function: applyNeonSplit,
    params: {
      magenta: { xRatio: -0.0025, yRatio: -0.0025 },
      cyan: { xRatio: 0.0025, yRatio: 0.0025 },
      strength: 0.95,
    }
  },
  {
    label: 'Anaglyph Split',
    function: applyAnaglyphSplit,
    params: { offsetRatio: [0.025, 0.075] }
  },
  {
    label: 'RGB Shift',
    function: applyRgbShift,
    params: {
      bandCount: [3, 8],
      heightRatio: [0.01, 0.1],
      maxOffsetRatio: 0.1,
      maxOffsetYRatio: 0.1,
    }
  },
  {
    label: 'Negative Bands',
    function: applyNegativeBands,
    params: {
      bands: [3, 7],
      heightRatio: [0.01, 0.12],
      hue: [0, 360],
      saturation: [2, 3],
      lightness: [-1, 0],
      channelOffsetXRatio: 0.006,
      channelOffsetYRatio: 0,
      bandOpacity: 0.99,
      bandNegative: 0.4,
    }
  },
  {
    label: 'Horizontal Band Shift',
    function: applyHorizontalBandShift,
    params: {
      bandCount: 7,
      heightRatio: [0.01, 0.1],
      maxOffsetRatio: 0.03,
    }
  },
  {
    label: 'Vertical Band Shift',
    function: applyVerticalBandShift,
    params: {
      bandCount: 7,
      heightRatio: [0.01, 0.1],
      maxOffsetRatio: 0.03,
    }
  },
  {
    label: 'Blocks Shift',
    function: applyBlocksShift,
    params: {
      blockCount: 64,
      sizeRatio: [0.01, 0.1],
      maxOffsetRatio: 0.024,
    }
  },
  {
    label: 'Horizontal Byte Shift',
    function: applyHorizontalByteShift,
    params: { offsetRatio: [0.1, 0.5] }
  },
  {
    label: 'Vertical Byte Shift',
    function: applyVerticalByteShift,
    params: { offsetRatio: [0.1, 0.5] }
  },
  {
    label: 'Gameboy',
    function: applyPixelPalette,
    params: {
      palette: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
      size: 3,
    }
  },
  {
    label: 'RGB',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255]],
      size: 3,
    }
  },
  {
    label: 'CYM',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [0, 255, 255], [255, 255, 0], [255, 0, 255]],
      size: 3,
    }
  },
  {
    label: 'CGA',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [85, 255, 85], [255, 85, 85], [255, 255, 85]],
      size: 3,
    }
  },
  {
    label: 'Virtual Boy',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [85, 0, 0], [170, 0, 0], [255, 0, 0]],
      size: 3,
    }
  },
  {
    label: 'NES',
    function: applyPixelPalette,
    params: {
      palette: [[15, 15, 15], [252, 252, 252], [216, 40, 0], [0, 88, 248], [0, 168, 0], [248, 184, 0], [252, 0, 120], [60, 188, 252]],
      size: 3,
    }
  },
  {
    label: 'ZX Spectrum',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [0, 0, 215], [215, 0, 0], [215, 0, 215], [0, 215, 0], [0, 215, 215], [215, 215, 0], [215, 215, 215], [0, 0, 255], [255, 0, 0], [255, 0, 255], [0, 255, 0], [0, 255, 255], [255, 255, 0], [255, 255, 255]],
      size: 3,
    }
  },
  {
    label: 'Mono Amber',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [85, 52, 0], [170, 105, 0], [255, 176, 0]],
      size: 3,
    }
  },
  {
    label: 'Sepia',
    function: applyPixelPalette,
    params: {
      palette: [[44, 30, 15], [100, 70, 40], [180, 140, 100], [240, 220, 190]],
      size: 3,
    }
  },
  {
    label: 'Cyberpunk',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [255, 0, 128], [0, 255, 255], [128, 0, 255]],
      size: 3,
    }
  },
  {
    label: 'B&W',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 0], [255, 255, 255]],
      size: 3,
    }
  },
  {
    label: 'Blueprint',
    function: applyPixelPalette,
    params: {
      palette: [[10, 30, 80], [40, 80, 160], [120, 160, 220], [220, 230, 255]],
      size: 3,
    }
  },
  {
    label: 'Infrared',
    function: applyPixelPalette,
    params: {
      palette: [[0, 0, 32], [140, 0, 140], [255, 40, 0], [255, 255, 0]],
      size: 3,
    }
  },
  {
    label: 'Sunset',
    function: applyPixelPalette,
    params: {
      palette: [[20, 0, 20], [180, 40, 30], [255, 120, 0], [255, 220, 50]],
      size: 3,
    }
  },
  {
    label: 'Journal',
    function: applyPixelPalette,
    params: {
      palette: [[35, 31, 25], [120, 110, 95], [200, 190, 170], [240, 235, 220]],
      size: 3,
    }
  },
  {
    label: 'Bitcrush 1',
    function: applyBitcrush,
    params: { level: [2, 2] }
  },
  {
    label: 'Bitcrush 2',
    function: applyBitcrush,
    params: { level: [3, 3] }
  },
  {
    label: 'Bitcrush 3',
    function: applyBitcrush,
    params: { level: [4, 7] }
  },
  {
    label: 'Bitcrush Stripes',
    function: applyBitcrushStripes,
    params: { heightRatio: [0.01, 0.1], level: [2, 6] }
  },
  {
    label: 'Cinema Tone',
    function: applyCinemaTone,
    params: {
      contrast: 1.2,
      gamma: 1.05,
      bloom: 0.12,
      vignette: 0.2,
      saturation: 1.05,
      liftBlack: 0.04,
      tint: 0.08,
    }
  },
  {
    label: 'Chromatic Aberration',
    function: applyChromaticAberration,
    params: {
      strengthRatio: 0.008,
      falloff: 2,
    }
  },
  {
    label: 'CRT Screen',
    function: applyCrtScreen,
    params: {
      barrel: 0.07,
      aberrationRatio: 0.002,
      scanlineFreq: 800,
      scanlineIntensity: 0.5,
      brightness: 0.9,
      contrast: 1.1,
      desaturation: 0.15,
      noise: 0.04,
      bloom: 0.25,
    }
  },
  {
    label: 'VHS',
    function: applyVhs,
    params: {
      lumaSmear: [0.3, 0.8],
      chromaBlur: [0.4, 0.9],
      chromaDelayX: [1.0, 4.5],
      chromaDelayY: [0, 2],
      chromaVertBlend: [0.2, 0.7],
      edgeWave: [0.1, 0.6],
      edgeWaveFrequency: 0.025,
      edgeWaveAmplitude: [2.0, 7.0],
      headSwitchingHeight: [0.08, 0.28],
      headSwitchingShift: [3, 10],
      chromaLoss: [0.04, 0.25],
      noise: [0.03, 0.15],
      snow: [0.005, 0.04],
      snowOpacity: [0.2, 0.6],
      trackingNoiseHeight: [0.06, 0.25],
      trackingNoiseWave: [3, 10],
      trackingNoiseSnow: [0.01, 0.08],
      trackingNoiseNoise: [0.08, 0.3],
      chromaDegradation: [0.6, 1.0],
      sharpen: [0.5, 1.5],
      ringingFreq: [0.3, 0.6],
      ringingPower: [2.0, 6.0],
      ringingIntensity: [2.0, 6.0],
      vhsSharpen: [0.1, 0.5],
    }
  },
  {
    label: 'Retro Sci-fi',
    function: applyRetroSciFi,
    params: {
      lineFrequency: 0.38,
      warpFrequency: [0.025, 0.08],
      warpAmplitudeRatio: [0.004, 0.015],
      ripple: [0.01, 0.04],
      intensity: [0.9, 1.6],
      glow: [0.3, 0.85],
      tint: { r: 40, g: 255, b: 120 },
    }
  },
  {
    label: 'Oscilloscope',
    function: applyOscilloscope,
    params: {
      rowStepRatio: 0.011,
      xStepRatio: 0.002,
      amplitudeRatio: 0.018,
      thicknessRatio: 0.001,
      intensity: 1.1,
      glow: 1,
      tint: { r: 25, g: 255, b: 70 },
    }
  },
  {
    label: 'Data Loss',
    function: applyDataLoss,
    params: {
      heightRatio: [0.15, 0.50],
      noiseDensity: 0.65,
      rgbNoise: 0.6,
      lineRatio: 1 / 12,
    }
  },
  {
    label: 'Data Loss Stream',
    function: applyDataLossStream,
    params: {
      heightRatio: [0.15, 0.50],
      blockSizeRatio: 0.001,
      artifactOpacity: 0.9,
      artifactModeWeights: { gray: 0.2, gradient: 0.2, pixelChecker: 0.2, colorLines: 0.2, bwLines: 0.2 },
    }
  },
  {
    label: 'Data Loss Bitplane',
    function: applyDataLossBitplane,
    params: { heightRatio: [0.15, 0.50] }
  },
  {
    label: 'Row Corruption',
    function: applyRowCorruption,
    params: {
      bandCount: [5, 20],
      heightRatio: [0.001, 0.006],
      maxShiftRatio: 0.2,
    }
  },
  {
    label: 'JPEG Artifacts',
    function: applyJpegArtifact,
    params: {
      quality: [1, 4],
      blockShift: [0.01, 0.02],
      colorSmear: [0.3, 0.8],
      blockSizeRatio: [0.006, 0.012],
    }
  },
  {
    label: 'Block Corruption',
    function: applyBlockCorruption,
    params: {
      blockSizeRatio: [0.006, 0.012],
      intensity: [0.005, 0.11],
      levels: [2, 5],
      saturation: [0.2, 2],
    }
  },
  {
    label: 'Data Loss Freeze',
    function: applyDataLossFreeze,
    params: { startRatio: [0.10, 0.70] }
  },
  {
    label: 'Pixel Melt',
    function: applyPixelMelt,
    params: {
      threshold: 0.45,
      lengthRatio: [0.02, 0.06],
      brightnessMode: 0,
    }
  },
  {
    label: 'RGB Glitch',
    function: applyRgbGlitch,
    params: {
      amount: 1.2,
      scale: 0.022,
      threshold: 0.3,
      maxOffsetRatio: 0.014,
      edgeBoost: 1.1
    }
  },
  {
    label: 'RGB Drift',
    function: applyRgbDrift,
    params: {
      startRatio: [0.10, 0.70],
      maxDriftRatio: [0.15, 0.45],
    }
  },
].map(filter => ({ ...filter, id: toId(filter.label) }))

const filtersMap = new Map(filterPresets.map(filter => [filter.id, filter]))

const randomFilterIds = new Set(RANDOM_FILTER_IDS)

export const generateFilterSeed = () => (
  Math.floor(Math.random() * 0xffffffff)
)

export const determineFilterParams = (filterId, seed) => {
  const rand = createSeededRandom(seed)
  const filter = filtersMap.get(filterId)

  if (!filter.params) {
    return {}
  }

  return Object.entries(filter.params).reduce(
    (params, [name, value]) => {
      params[name] = Array.isArray(value) && Number.isFinite(value[0]) && Number.isFinite(value[1])
        ? rand() * (value[1] - value[0]) + value[0]
        : value
      return params
    },
    {}
  )
}

export const toggleFilterOnLayer = (layer, filterId) => {
  if (!Array.isArray(layer.filters)) {
    layer.filters = []
  }
  if (!layer.filterSeeds || typeof layer.filterSeeds !== 'object') {
    layer.filterSeeds = {}
  }

  const index = layer.filters.indexOf(filterId)
  if (index == -1) {
    layer.filters.push(filterId)
    if (randomFilterIds.has(filterId)) {
      layer.filterSeeds[filterId] = generateFilterSeed()
    }
  } else {
    layer.filters.splice(index, 1)
    if (randomFilterIds.has(filterId)) {
      delete layer.filterSeeds[filterId]
    }
  }
}

export const reseedFilterOnLayer = (layer, filterId) => {
  if (!randomFilterIds.has(filterId)) {
    throw new Error(`${filterId} is not marked as random`)
  }
  if (!layer.filters?.includes(filterId)) {
    throw new Error(`${filterId} is not applied yet`)
  }
  if (!layer.filterSeeds || typeof layer.filterSeeds !== 'object') {
    layer.filterSeeds = {}
  }

  const previousSeed = layer.filterSeeds[filterId]
  let nextSeed
  let attempts = 0
  do {
    nextSeed = generateFilterSeed()
    attempts += 1
  } while (attempts < 12 && nextSeed === previousSeed)

  layer.filterSeeds[filterId] = nextSeed
}

export const applyFiltersToCanvas = (filterIds, layer, canvas) => {
  filterIds.forEach(filterId => {
    const filter = filtersMap.get(filterId)
    let seed = null

    if (randomFilterIds.has(filterId)) {
      seed = layer.filterSeeds[filterId]
    } else {
      seed = generateFilterSeed()
    }

    filter.function(canvas, { ...determineFilterParams(filterId, seed), seed })
  })
}
