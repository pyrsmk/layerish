import { hashString, createSeededRandom } from './filters/utils.js'
import { applyPixelize } from './filters/pixelize.js'
import { applyRgbShift, applyNeonSplit, applyDualSplitBase, applyDualSplitOnly, applyChromatic } from './filters/split.js'
import { applyGlitchTear, applyGlitchTearVertical, applyGlitchBlocks } from './filters/glitch.js'
import { applyNoise } from './filters/noise.js'
import { applyDitherBayer, applyDitherAtkinson, applyDitherBlueNoise, applyDitherClusteredDot, applyDitherRiemersma, applyDitherRandomNoise } from './filters/dither.js'
import { applyAnaglyphSplit } from './filters/anaglyph.js'
import {
  applyDataLoss,
  applyDataLossStreamByteOffset,
  applyDataLossChannelCascadeDrift,
  applyDataLossRowFreezeDecay,
  applyDataLossBitPlaneCascade,
} from './filters/dataLoss.js'
import { applyBitcrush, applyBitcrushStripes } from './filters/bitcrush.js'
import { applyCinemaTone } from './filters/cinemaTone.js'
import { applyChromaticAberration } from './filters/chromaticAberration.js'
import { applyPalettePixel } from './filters/palettePixel.js'
import { applyCrtScreen } from './filters/crtScreen.js'
import { applyVhs } from './filters/vhs.js'
import { applyColorShift } from './filters/colorShift.js'
import { applyRgbShiftBands } from './filters/rgbShiftBands.js'
import { applyRgbNoise } from './filters/rgbNoise.js'
import { applyHueDistortion } from './filters/hueDistortion.js'
import { applyRetroSciFi } from './filters/retroSciFi.js'
import { applyOscilloscope } from './filters/oscilloscope.js'
import { applyBloom, applyBloomHdr, applyDreamyGlow, applyEdgeGlow, applyTintedBloom, applyHaloGlow } from './filters/bloom.js'
import { applyDuotone } from './filters/duotone.js'
import { applyChannelSwap } from './filters/channelSwap.js'
import { applyHorizontalByteShift, applyVerticalByteShift } from './filters/byteShift.js'
import { applyRowCorruption } from './filters/rowCorruption.js'
import { applyJpegArtifact } from './filters/jpegArtifact.js'
import { applyPixelMelt } from './filters/pixelMelt.js'
import { applyBlockCorruption } from './filters/blockCorruption.js'

const FILTER_PRESETS = [
  {
    id: 'nano-pixel',
    label: 'Nano Pixel',
    engine: 'pixelize',
    params: { sizeRatio: 0.0025 },
  },
  {
    id: 'micro-pixel',
    label: 'Micro Pixel',
    engine: 'pixelize',
    params: { sizeRatio: 0.004 },
  },
  {
    id: 'duotone',
    label: 'Duotone',
    engine: 'duotone',
    params: { dark: { r: 20, g: 0, b: 80 }, light: { r: 255, g: 200, b: 50 } },
  },
  {
    id: 'channel-swap',
    label: 'Channel Swap',
    engine: 'channelSwap',
    params: { shift: 1 },
  },
  {
    id: 'film-grain',
    label: 'Film Grain',
    engine: 'noise',
    params: { amount: 14 },
  },
  {
    id: 'dusty-grain',
    label: 'Dusty Grain',
    engine: 'noise',
    params: { amount: 28 },
  },
  {
    id: 'rgb-noise',
    label: 'RGB Noise',
    engine: 'rgbNoise',
    params: { amount: 0.3, scale: 0.012, edgeBoost: 2.9, saturation: 1.05 },
  },
  {
    id: 'soft-glow',
    label: 'Soft Glow',
    engine: 'bloom',
    params: { radiusRatio: 0.02, intensity: 0.9 },
  },
  {
    id: 'neon-glow',
    label: 'Neon Glow',
    engine: 'dualSplitBase',
    params: {
      magenta: { xRatio: -0.004, yRatio: -0.002 },
      cyan: { xRatio: 0.004, yRatio: 0.002 },
      strength: 0.55,
    },
  },
  {
    id: 'bloom-hdr',
    label: 'Bloom HDR',
    engine: 'bloomHdr',
    params: { radiusRatio: 0.02, intensity: 0.7, threshold: 0.6 },
  },
  {
    id: 'dreamy-glow',
    label: 'Dreamy Glow',
    engine: 'dreamyGlow',
    params: { radiusRatio: 0.03, intensity: 0.6, desaturation: 0.4 },
  },
  {
    id: 'edge-glow',
    label: 'Edge Glow',
    engine: 'edgeGlow',
    params: { radiusRatio: 0.012, intensity: 0.8, edgeStrength: 1.5 },
  },
  {
    id: 'warm-glow',
    label: 'Warm Glow',
    engine: 'tintedBloom',
    params: { radiusRatio: 0.025, intensity: 0.5, tint: { r: 255, g: 180, b: 80 } },
  },
  {
    id: 'cold-glow',
    label: 'Cold Glow',
    engine: 'tintedBloom',
    params: { radiusRatio: 0.025, intensity: 0.5, tint: { r: 80, g: 160, b: 255 } },
  },
  {
    id: 'halo-glow',
    label: 'Halo Glow',
    engine: 'haloGlow',
    params: { radiusRatio: 0.06, intensity: 0.35 },
  },
  {
    id: 'random-noise-dither',
    label: 'Random Noise Dither',
    engine: 'ditherRandomNoise',
    params: { levels: 2 },
  },
  {
    id: 'riemersma-dither',
    label: 'Riemersma Dither',
    engine: 'ditherRiemersma',
    params: { levels: 2 },
  },
  {
    id: 'atkinson-dither',
    label: 'Atkinson Dither',
    engine: 'ditherAtkinson',
    params: { levels: 2 },
  },
  {
    id: 'bayer-dither',
    label: 'Bayer Dither',
    engine: 'ditherBayer',
    params: { matrixSize: 4, levels: 2 },
  },
  {
    id: 'blue-noise-dither',
    label: 'Blue Noise Dither',
    engine: 'ditherBlueNoise',
    params: { levels: 2 },
  },
  {
    id: 'clustered-dot-dither',
    label: 'Clustered Dot Dither',
    engine: 'ditherClusteredDot',
    params: { levels: 2 },
  },
  {
    id: 'chromatic-split',
    label: 'Chromatic Split',
    engine: 'chroma',
    params: { offsetRatio: 0.004, offsetYRatio: 0.002 },
  },
  {
    id: 'retro-split',
    label: 'Retro Split',
    engine: 'neonSplit',
    params: {
      r: { xRatio: -0.01, yRatio: -0.006 },
      g: { xRatio: 0.002, yRatio: -0.002 },
      b: { xRatio: 0.01, yRatio: 0.006 },
    },
  },
  {
    id: 'neon-split',
    label: 'Neon Split',
    engine: 'dualSplitOnly',
    params: {
      magenta: { xRatio: -0.0025, yRatio: -0.0025 },
      cyan: { xRatio: 0.0025, yRatio: 0.0025 },
      strength: 0.95,
    },
  },
  {
    id: 'anaglyph-split',
    label: 'Anaglyph Split',
    engine: 'anaglyphSplit',
    params: { offsetRatio: [0.025, 0.075] },
  },
  {
    id: 'rgb-shift-bands',
    label: 'RGB Shift',
    engine: 'rgbShiftBands',
    params: {
      bandCount: [3, 8],
      heightRatio: [0.01, 0.1],
      maxOffsetRatio: 0.1,
      maxOffsetYRatio: 0.1,
    },
  },
  {
    id: 'negative-bands',
    label: 'Negative Bands',
    engine: 'colorShift',
    params: {
      bandCount: [3, 7],
      heightRatio: [0.01, 0.12],
      hue: [0, 360],
      saturation: [2, 3],
      lightness: [-1, 0],
      bandOpacity: 0.99,
      bandNegative: 0.4,
      channelOffsetRatio: [0.006, 0],
    },
  },
  {
    id: 'jpeg-artifact',
    label: 'JPEG Artifacts',
    engine: 'jpegArtifact',
    params: {
      quality: [2, 5],
      blockShift: [0.08, 0.25],
      colorSmear: [0.3, 0.8],
      blockSizeRatio: [0.006, 0.012],
    },
  },
  {
    id: 'block-corruption',
    label: 'Block Corruption',
    engine: 'blockCorruption',
    params: {
      blockSizeRatio: [0.006, 0.012],
      intensity: [0.005, 0.11],
      levels: [2, 5],
      saturation: [0.2, 2],
    },
  },
  {
    id: 'horizontal-shift',
    label: 'Horizontal Shift',
    engine: 'glitchTear',
    params: { bandCount: 7, heightRatio: [0.01, 0.1], maxOffsetRatio: 0.03 },
  },
  {
    id: 'vertical-shift',
    label: 'Vertical Shift',
    engine: 'glitchTearVertical',
    params: { bandCount: 7, heightRatio: [0.01, 0.1], maxOffsetRatio: 0.03 },
  },
  {
    id: 'blocks-shift',
    label: 'Blocks Shift',
    engine: 'glitchBlocks',
    params: { blockCount: 64, sizeRatio: [0.01, 0.1], maxOffsetRatio: 0.024 },
  },
  {
    id: 'horizontal-byte-shift',
    label: 'Horizontal Byte Shift',
    engine: 'horizontalByteShift',
    params: { offsetRatio: [0.1, 0.5] },
  },
  {
    id: 'vertical-byte-shift',
    label: 'Vertical Byte Shift',
    engine: 'verticalByteShift',
    params: { offsetRatio: [0.1, 0.5] },
  },
  {
    id: 'palette-gameboy',
    label: 'Gameboy',
    engine: 'palettePixel',
    params: {
      palette: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
      pixelSizeRatio: 0.004,
    },
  },
  {
    id: 'palette-rgb',
    label: 'RGB',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-cym',
    label: 'CYM',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [0, 255, 255], [255, 255, 0], [255, 0, 255]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-cga',
    label: 'CGA',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [85, 255, 85], [255, 85, 85], [255, 255, 85]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-virtual-boy',
    label: 'Virtual Boy',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [85, 0, 0], [170, 0, 0], [255, 0, 0]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-nes',
    label: 'NES',
    engine: 'palettePixel',
    params: {
      palette: [[15, 15, 15], [252, 252, 252], [216, 40, 0], [0, 88, 248], [0, 168, 0], [248, 184, 0], [252, 0, 120], [60, 188, 252]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-zx-spectrum',
    label: 'ZX Spectrum',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [0, 0, 215], [215, 0, 0], [215, 0, 215], [0, 215, 0], [0, 215, 215], [215, 215, 0], [215, 215, 215], [0, 0, 255], [255, 0, 0], [255, 0, 255], [0, 255, 0], [0, 255, 255], [255, 255, 0], [255, 255, 255]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-mono-amber',
    label: 'Mono Amber',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [85, 52, 0], [170, 105, 0], [255, 176, 0]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-sepia',
    label: 'Sepia',
    engine: 'palettePixel',
    params: {
      palette: [[44, 30, 15], [100, 70, 40], [180, 140, 100], [240, 220, 190]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-cyberpunk',
    label: 'Cyberpunk',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [255, 0, 128], [0, 255, 255], [128, 0, 255]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-vaporwave',
    label: 'Vaporwave',
    engine: 'palettePixel',
    params: {
      palette: [[255, 113, 206], [121, 189, 255], [185, 137, 255], [0, 255, 195]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-bw',
    label: 'B&W',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 0], [255, 255, 255]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-blueprint',
    label: 'Blueprint',
    engine: 'palettePixel',
    params: {
      palette: [[10, 30, 80], [40, 80, 160], [120, 160, 220], [220, 230, 255]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-infrared',
    label: 'Infrared',
    engine: 'palettePixel',
    params: {
      palette: [[0, 0, 32], [140, 0, 140], [255, 40, 0], [255, 255, 0]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-sunset',
    label: 'Sunset',
    engine: 'palettePixel',
    params: {
      palette: [[20, 0, 20], [180, 40, 30], [255, 120, 0], [255, 220, 50]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'palette-newsprint',
    label: 'Journal',
    engine: 'palettePixel',
    params: {
      palette: [[35, 31, 25], [120, 110, 95], [200, 190, 170], [240, 235, 220]],
      pixelSizeRatio: 0.003,
    },
  },
  {
    id: 'bitcrush-1',
    label: 'Bitcrush 1',
    engine: 'bitcrush',
    params: { level: [2, 2] },
  },
  {
    id: 'bitcrush-2',
    label: 'Bitcrush 2',
    engine: 'bitcrush',
    params: { level: [3, 3] },
  },
  {
    id: 'bitcrush-3',
    label: 'Bitcrush 3',
    engine: 'bitcrush',
    params: { level: [4, 7] },
  },
  {
    id: 'bitcrush-stripes',
    label: 'Bitcrush Stripes',
    engine: 'bitcrushStripes',
    params: { heightRatio: [0.01, 0.1], level: [2, 6] },
  },
  {
    id: 'cinema-tone',
    label: 'Cinema Tone',
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
    engine: 'chromaticAberration',
    params: {
      strengthRatio: 0.008,
      falloff: 2,
    },
  },
  {
    id: 'crt-screen',
    label: 'CRT Screen',
    engine: 'crtScreen',
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
    },
  },
  {
    id: 'vhs',
    label: 'VHS',
    engine: 'vhs',
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
    },
  },
  {
    id: 'retro-sci-fi',
    label: 'Retro Sci-fi',
    engine: 'retroSciFi',
    params: {
      lineFrequency: 0.38,
      warpFrequency: [0.025, 0.08],
      warpAmplitudeRatio: [0.004, 0.015],
      ripple: [0.01, 0.04],
      intensity: [0.9, 1.6],
      glow: [0.3, 0.85],
      tint: { r: 40, g: 255, b: 120 },
    },
  },
  {
    id: 'oscilloscope',
    label: 'Oscilloscope',
    engine: 'oscilloscope',
    params: {
      rowStepRatio: 0.011,
      xStepRatio: 0.002,
      amplitudeRatio: 0.018,
      thicknessRatio: 0.001,
      intensity: 1.1,
      glow: 1,
      tint: { r: 25, g: 255, b: 70 },
    },
  },
  {
    id: 'data-loss',
    label: 'Data Loss',
    engine: 'dataLoss',
    params: { heightRatio: [0.15, 0.50], noiseDensity: 0.65, rgbNoise: 0.6, lineRatio: 1/12 },
  },
  {
    id: 'data-loss-stream',
    label: 'Data Loss Stream',
    engine: 'dataLossStream',
    params: {
      heightRatio: [0.15, 0.50],
      blockSizeRatio: 0.001,
      artifactOpacity: 0.9,
      artifactModeWeights: { gray: 0.2, gradient: 0.2, pixelChecker: 0.2, colorLines: 0.2, bwLines: 0.2 },
    },
  },
  {
    id: 'data-loss-freeze',
    label: 'Data Loss Freeze',
    engine: 'dataLossFreeze',
    params: { startRatio: [0.10, 0.70] },
  },
  {
    id: 'data-loss-bitplane',
    label: 'Data Loss Bitplane',
    engine: 'dataLossBitplane',
    params: { heightRatio: [0.15, 0.50] },
  },
  {
    id: 'row-corruption',
    label: 'Row Corruption',
    engine: 'rowCorruption',
    params: { bandCount: [5, 20], heightRatio: [0.001, 0.006], maxShiftRatio: 0.2 },
  },
  {
    id: 'rgb-glitch',
    label: 'RGB Glitch',
    engine: 'hueDistortionRgb',
    params: { amount: 1.2, scale: 0.022, threshold: 0.3, maxOffsetRatio: 0.014, edgeBoost: 1.1 },
  },
  {
    id: 'data-loss-drift',
    label: 'RGB Drift',
    engine: 'dataLossDrift',
    params: { startRatio: [0.10, 0.70], maxDriftRatio: [0.15, 0.45] },
  },
  {
    id: 'pixel-melt',
    label: 'Pixel Melt',
    engine: 'pixelMelt',
    params: {
      threshold: 0.45,
      lengthRatio: [0.02, 0.06],
      brightnessMode: 0,
    },
  },
]

const FILTER_PRESET_BY_ID = new Map(
  FILTER_PRESETS.map((preset) => [preset.id, preset])
)

export const RANDOM_FILTER_IDS = [
  'vhs',
  'negative-bands',
  'rgb-noise',
  'rgb-shift-bands',
  'anaglyph-split',
  'data-loss',
  'data-loss-stream',
  'data-loss-drift',
  'data-loss-freeze',
  'data-loss-bitplane',
  'bitcrush-3',
  'bitcrush-stripes',
  'horizontal-shift',
  'vertical-shift',
  'blocks-shift',
  'channel-swap',
  'retro-sci-fi',
  'horizontal-byte-shift',
  'vertical-byte-shift',
  'row-corruption',
  'jpeg-artifact',
  'pixel-melt',
  'block-corruption',
]

export const FILTER_ENGINES = {
  pixelize: applyPixelize,
  rgbShift: applyRgbShift,
  neonSplit: applyNeonSplit,
  dualSplitBase: applyDualSplitBase,
  dualSplitOnly: applyDualSplitOnly,
  glitchTear: applyGlitchTear,
  glitchTearVertical: applyGlitchTearVertical,
  glitchBlocks: applyGlitchBlocks,
  noise: applyNoise,
  ditherBayer: applyDitherBayer,
  ditherAtkinson: applyDitherAtkinson,
  ditherBlueNoise: applyDitherBlueNoise,
  ditherClusteredDot: applyDitherClusteredDot,
  ditherRiemersma: applyDitherRiemersma,
  ditherRandomNoise: applyDitherRandomNoise,
  bloomHdr: applyBloomHdr,
  dreamyGlow: applyDreamyGlow,
  edgeGlow: applyEdgeGlow,
  tintedBloom: applyTintedBloom,
  haloGlow: applyHaloGlow,
  chroma: applyChromatic,
  anaglyphSplit: applyAnaglyphSplit,
  dataLoss: applyDataLoss,
  dataLossStream: applyDataLossStreamByteOffset,
  dataLossDrift: applyDataLossChannelCascadeDrift,
  dataLossFreeze: applyDataLossRowFreezeDecay,
  dataLossBitplane: applyDataLossBitPlaneCascade,
  bitcrush: applyBitcrush,
  bitcrushStripes: applyBitcrushStripes,
  cinemaTone: applyCinemaTone,
  chromaticAberration: applyChromaticAberration,
  palettePixel: applyPalettePixel,
  crtScreen: applyCrtScreen,
  vhs: applyVhs,
  rgbNoise: applyRgbNoise,
  rgbShiftBands: applyRgbShiftBands,
  colorShift: applyColorShift,
  hueDistortionRgb: applyHueDistortion,
  retroSciFi: applyRetroSciFi,
  oscilloscope: applyOscilloscope,
  bloom: applyBloom,
  duotone: applyDuotone,
  channelSwap: applyChannelSwap,
  horizontalByteShift: applyHorizontalByteShift,
  verticalByteShift: applyVerticalByteShift,
  rowCorruption: applyRowCorruption,
  jpegArtifact: applyJpegArtifact,
  pixelMelt: applyPixelMelt,
  blockCorruption: applyBlockCorruption,
}

export const filterPresets = FILTER_PRESETS

export const getFilterPreset = (id) => FILTER_PRESET_BY_ID.get(id)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const round = (value, precision = 2) => {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export const generateFilterSeed = () => {
  if (globalThis.crypto?.getRandomValues) {
    const seedData = new Uint32Array(1)
    globalThis.crypto.getRandomValues(seedData)
    return seedData[0]
  }
  return Math.floor(Math.random() * 0xffffffff)
}

export const getFilterSignature = (filterId, seed, layer) => {
  if (!Number.isFinite(seed)) return 'seed:none'
  const preset = FILTER_PRESET_BY_ID.get(filterId)
  if (!preset) return `seed:${seed}`
  const params = preset.params ?? {}
  const rand = createSeededRandom(seed)
  const width = layer?.width ?? 0
  const height = layer?.height ?? 0

  if (filterId === 'bitcrush-3') {
    const [l0, l1] = Array.isArray(params.level) ? params.level : [params.level ?? 2, params.level ?? 7]
    const minL = Math.max(2, Math.round(l0))
    const maxL = Math.max(minL, Math.round(l1))
    const lvl = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    return `lvl:${lvl}`
  }

  if (filterId === 'bitcrush-stripes') {
    const hr = params.heightRatio ?? [0.01, 0.1]
    const [h0, h1] = Array.isArray(hr) ? hr : [hr, hr]
    const [l0, l1] = Array.isArray(params.level) ? params.level : [params.level ?? 2, params.level ?? 6]
    const minH = Math.max(1, Math.round(h0 * height))
    const maxH = Math.max(minH, Math.round(h1 * height))
    const minL = Math.max(2, Math.round(l0))
    const maxL = Math.max(minL, Math.round(l1))
    const stripeHeight1 = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const lvl1 = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    const stripeHeight2 = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const lvl2 = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    return `h1:${stripeHeight1}|l1:${lvl1}|h2:${stripeHeight2}|l2:${lvl2}`
  }

  if (filterId === 'anaglyph-split') {
    const or = params.offsetRatio ?? [0.025, 0.075]
    const [off0, off1] = Array.isArray(or) ? or : [or, or]
    const minOffset = Math.min(Math.max(0, Math.round(off0 * width)), Math.max(0, Math.round(off1 * width)))
    const maxOffset = Math.max(0, Math.round(off1 * width))
    const magnitude = maxOffset === 0 ? 0 : minOffset + rand() * Math.max(0, maxOffset - minOffset)
    const dx = Math.round(magnitude)
    const channel = Math.floor(rand() * 3)
    return `dx:${dx}|ch:${channel}`
  }

  if (filterId === 'rgb-noise') {
    const hueOffset = rand() * 360
    return `hue:${Math.round(hueOffset)}`
  }

  if (filterId === 'rgb-shift-bands') {
    const [bc0, bc1] = Array.isArray(params.bandCount) ? params.bandCount : [params.bandCount ?? 3, params.bandCount ?? 8]
    const hr = params.heightRatio ?? [0.01, 0.1]
    const [h0, h1] = Array.isArray(hr) ? hr : [hr, hr]
    const countMin = Math.max(1, Math.round(bc0))
    const countMax = Math.max(countMin, Math.round(bc1))
    const minH = Math.max(1, Math.round(h0 * height))
    const maxH = Math.max(minH, Math.round(h1 * height))
    const offsetMaxX = Math.max(0, Math.round((params.maxOffsetRatio ?? 0.012) * width))
    const offsetMaxY = Math.max(0, Math.round((params.maxOffsetYRatio ?? 0.006) * height))
    const bands = Math.round(countMin + rand() * (countMax - countMin))
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(Math.round(rand() * (height - bandHeight)), 0, height - bandHeight)
    const channel = Math.floor(rand() * 3)
    const dx = Math.round((rand() * 2 - 1) * offsetMaxX)
    const dy = Math.round((rand() * 2 - 1) * offsetMaxY)
    return `bands:${bands}|h:${bandHeight}|y:${bandY}|ch:${channel}|dx:${dx}|dy:${dy}`
  }

  if (filterId === 'negative-bands') {
    const [bc0, bc1] = Array.isArray(params.bandCount) ? params.bandCount : [params.bandCount ?? 2, params.bandCount ?? 6]
    const hr = params.heightRatio ?? [0.02, 0.09]
    const [h0, h1] = Array.isArray(hr) ? hr : [hr, hr]
    const [hue0, hue1] = Array.isArray(params.hue) ? params.hue : [params.hue ?? 0, params.hue ?? 360]
    const [sat0, sat1] = Array.isArray(params.saturation) ? params.saturation : [params.saturation ?? 1, params.saturation ?? 1.4]
    const [light0, light1] = Array.isArray(params.lightness) ? params.lightness : [params.lightness ?? -0.05, params.lightness ?? 0.05]
    const countMin = Math.max(1, Math.round(bc0))
    const countMax = Math.max(countMin, Math.round(bc1))
    const minH = Math.max(1, Math.round(h0 * height))
    const maxH = Math.max(minH, Math.round(h1 * height))
    const hueMinValue = Math.min(hue0, hue1)
    const hueMaxValue = Math.max(hue0, hue1)
    const satMin = clamp(Math.min(sat0, sat1), 0.2, 3)
    const satMax = clamp(Math.max(sat0, sat1), 0.2, 3)
    const lightMin = clamp(Math.min(light0, light1), -1, 1)
    const lightMax = clamp(Math.max(light0, light1), -1, 1)
    const bands = Math.round(countMin + rand() * (countMax - countMin))
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
    return `bands:${bands}|h:${bandHeight}|y:${bandY}|hue:${Math.round(hueValue)}|sat:${round(satBoost)}|light:${round(lightShift)}`
  }

  if (filterId === 'data-loss') {
    const [h0, h1] = Array.isArray(params.heightRatio)
      ? params.heightRatio
      : [params.heightRatio ?? params.minHeightRatio ?? 0.15, params.heightRatio ?? params.maxHeightRatio ?? 0.50]
    const blockSize = Math.max(10, Math.floor(Math.min(width, height) * 0.035))
    const rawH = Math.max(2 * blockSize, Math.round((h0 + rand() * (h1 - h0)) * height))
    const numBlockRows = Math.max(2, Math.floor(rawH / blockSize))
    const xCut = Math.floor(rand() * width)
    const modeRoll = rand()
    const bandMode = modeRoll < 0.34 ? 'noise' : modeRoll < 0.67 ? 'barcode' : 'barcodeCompress'
    const isCompress = bandMode === 'barcodeCompress'
    const stripeSize = (isCompress ? 18 : 6) + Math.floor(rand() * (isCompress ? 40 : 22))
    const phase = Math.floor(rand() * stripeSize)
    return `rows:${numBlockRows}|xcut:${xCut}|mode:${bandMode}|stripe:${stripeSize}|phase:${phase}`
  }

  if (filterId === 'horizontal-shift' || filterId === 'vertical-shift') {
    const bandCount = Math.max(1, Math.round(params.bandCount ?? 1))
    const hr = params.heightRatio ?? [0.001, 0.1]
    const [h0, h1] = Array.isArray(hr) ? hr : [hr, hr]
    const dim = filterId === 'horizontal-shift' ? height : width
    const offsetDim = filterId === 'horizontal-shift' ? width : height
    const minHeight = Math.round(h0 * dim)
    const maxHeight = Math.round(h1 * dim)
    const maxOffset = Math.round((params.maxOffsetRatio ?? 0.03) * offsetDim)
    const bandHeight = Math.floor(minHeight + rand() * Math.max(1, maxHeight - minHeight))
    const limit = dim
    const pos = Math.floor(rand() * Math.max(1, limit - bandHeight))
    const offset = Math.floor((rand() * 2 - 1) * maxOffset)
    return `bands:${bandCount}|h:${bandHeight}|pos:${pos}|off:${offset}`
  }

  if (filterId === 'blocks-shift') {
    const blocks = Math.max(1, Math.round(params.blockCount ?? 1))
    const ref = Math.min(width, height)
    const sr = params.sizeRatio ?? [0.01, 0.1]
    const [s0, s1] = Array.isArray(sr) ? sr : [sr, sr]
    const minSize = Math.round(s0 * ref)
    const maxSize = Math.round(s1 * ref)
    const maxOffset = Math.round((params.maxOffsetRatio ?? 0.024) * ref)
    const size = Math.floor(minSize + rand() * Math.max(1, maxSize - minSize))
    const x = Math.floor(rand() * Math.max(1, width - size))
    const y = Math.floor(rand() * Math.max(1, height - size))
    const dx = Math.floor((rand() * 2 - 1) * maxOffset)
    const dy = Math.floor((rand() * 2 - 1) * maxOffset)
    return `blocks:${blocks}|size:${size}|x:${x}|y:${y}|dx:${dx}|dy:${dy}`
  }

  if (filterId === 'channel-swap') {
    const PERM_LABELS = ['RGB', 'RBG', 'GRB', 'GBR', 'BRG', 'BGR']
    const index = 1 + Math.floor(rand() * 5)
    return `perm:${PERM_LABELS[index]}`
  }

  if (filterId === 'horizontal-byte-shift' || filterId === 'vertical-byte-shift') {
    const dim = filterId === 'horizontal-byte-shift' ? width : height
    const or = params.offsetRatio ?? [0.1, 0.5]
    const [off0, off1] = Array.isArray(or) ? or : [or, or]
    const minOff = Math.max(1, Math.round(off0 * dim))
    const maxOff = Math.max(minOff, Math.round(off1 * dim))
    const magnitude = Math.round(minOff + rand() * (maxOff - minOff))
    const direction = rand() < 0.5 ? 1 : -1
    return `off:${magnitude}|dir:${direction}`
  }

  if (filterId === 'row-corruption') {
    const [bc0, bc1] = Array.isArray(params.bandCount) ? params.bandCount : [params.bandCount ?? 3, params.bandCount ?? 20]
    const hr = params.heightRatio ?? [0.001, 0.006]
    const [h0, h1] = Array.isArray(hr) ? hr : [hr, hr]
    const countMin = Math.max(1, Math.round(bc0))
    const countMax = Math.max(countMin, Math.round(bc1))
    const minH = Math.max(1, Math.round(h0 * height))
    const maxH = Math.max(minH, Math.round(h1 * height))
    const bands = Math.round(countMin + rand() * (countMax - countMin))
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(Math.round(rand() * (height - bandHeight)), 0, height - bandHeight)
    const modeRoll = rand()
    const mode = modeRoll < 0.3 ? 'dup' : modeRoll < 0.55 ? 'shift' : modeRoll < 0.75 ? 'rev' : 'choff'
    return `bands:${bands}|h:${bandHeight}|y:${bandY}|mode:${mode}`
  }

  if (filterId === 'jpeg-artifact') {
    const q = params.quality ?? [2, 5]
    const ref = Math.min(width, height)
    const bsr = params.blockSizeRatio ?? [0.006, 0.012]
    const sh = params.blockShift ?? [0.08, 0.25]
    const sm = params.colorSmear ?? [0.3, 0.8]
    const qMin = Array.isArray(q) ? q[0] : q
    const qMax = Array.isArray(q) ? q[1] : q
    const bsMin = (Array.isArray(bsr) ? bsr[0] : bsr) * ref
    const bsMax = (Array.isArray(bsr) ? bsr[1] : bsr) * ref
    const shMin = Array.isArray(sh) ? sh[0] : sh
    const shMax = Array.isArray(sh) ? sh[1] : sh
    const smMin = Array.isArray(sm) ? sm[0] : sm
    const smMax = Array.isArray(sm) ? sm[1] : sm
    const quality = Math.round(qMin + rand() * (qMax - qMin))
    const blockSize = Math.round(bsMin + rand() * (bsMax - bsMin))
    const blockShift = round(shMin + rand() * (shMax - shMin), 3)
    const colorSmear = round(smMin + rand() * (smMax - smMin), 3)
    return `q:${quality}|bs:${blockSize}|sh:${blockShift}|sm:${colorSmear}`
  }

  if (filterId === 'block-corruption') {
    const ref = Math.min(width, height)
    const bsr = params.blockSizeRatio ?? [0.006, 0.012]
    const int = params.intensity ?? [0.4, 0.8]
    const lvl = params.levels ?? [2, 5]
    const bsMin = (Array.isArray(bsr) ? bsr[0] : bsr) * ref
    const bsMax = (Array.isArray(bsr) ? bsr[1] : bsr) * ref
    const intMin = Array.isArray(int) ? int[0] : int
    const intMax = Array.isArray(int) ? int[1] : int
    const lvlMin = Array.isArray(lvl) ? lvl[0] : lvl
    const lvlMax = Array.isArray(lvl) ? lvl[1] : lvl
    const blockSize = Math.round(bsMin + rand() * (bsMax - bsMin))
    const intensity = round(intMin + rand() * (intMax - intMin), 3)
    const levels = Math.round(lvlMin + rand() * (lvlMax - lvlMin))
    return `bs:${blockSize}|int:${intensity}|lvl:${levels}`
  }

  if (filterId === 'pixel-melt') {
    const dir = Math.floor(rand() * 4)
    const ref = Math.max(width, height)
    const lr = params.lengthRatio ?? [0.02, 0.06]
    const [len0, len1] = Array.isArray(lr) ? lr : [lr, lr]
    const minLen = Math.max(1, Math.round(len0 * ref))
    const maxLen = Math.max(minLen, Math.round(len1 * ref))
    const meltLen = Math.round(minLen + rand() * (maxLen - minLen))
    const DIR_LABELS = ['down', 'up', 'right', 'left']
    return `dir:${DIR_LABELS[dir]}|len:${meltLen}`
  }

  if (filterId === 'data-loss-stream') {
    const [h0, h1] = Array.isArray(params.heightRatio)
      ? params.heightRatio
      : [params.heightRatio ?? params.minHeightRatio ?? 0.15, params.heightRatio ?? params.maxHeightRatio ?? 0.50]
    const [bs0, bs1] = Array.isArray(params.blockSizeRatio)
      ? params.blockSizeRatio
      : [params.blockSizeRatio ?? 0.02, params.blockSizeRatio ?? 0.06]
    const blockSize = Math.max(10, Math.floor(Math.min(width, height) * (bs0 + rand() * (bs1 - bs0))))
    const rawH = Math.max(2 * blockSize, Math.round((h0 + rand() * (h1 - h0)) * height))
    const numBlockRows = Math.max(2, Math.floor(rawH / blockSize))
    const reverse = rand() < 0.5
    const fullWidth = rand() < 1 / 3
    const xCut = fullWidth ? 0 : Math.floor(rand() * width)
    const byteOffset = 1 + Math.floor(rand() * 3)
    return `rows:${numBlockRows}|rev:${reverse ? 1 : 0}|fw:${fullWidth ? 1 : 0}|xcut:${xCut}|off:${byteOffset}`
  }

  if (filterId === 'data-loss-bitplane') {
    const [h0, h1] = Array.isArray(params.heightRatio)
      ? params.heightRatio
      : [params.heightRatio ?? params.minHeightRatio ?? 0.15, params.heightRatio ?? params.maxHeightRatio ?? 0.50]
    const blockSize = Math.max(10, Math.floor(Math.min(width, height) * 0.035))
    const rawH = Math.max(2 * blockSize, Math.round((h0 + rand() * (h1 - h0)) * height))
    const numBlockRows = Math.max(2, Math.floor(rawH / blockSize))
    const reverse = rand() < 0.5
    const xCut = Math.floor(rand() * width)
    return `rows:${numBlockRows}|rev:${reverse ? 1 : 0}|xcut:${xCut}`
  }

  if (filterId === 'data-loss-drift' || filterId === 'data-loss-freeze') {
    const sr = params.startRatio ?? [0.15, 0.75]
    const [s0, s1] = Array.isArray(sr) ? sr : [sr, sr]
    const startRow = Math.round(
      Math.max(1, Math.min(height - 2, (s0 + rand() * (s1 - s0)) * height))
    )

    if (filterId === 'data-loss-drift') {
      // filter order: row, maxDrift, reverse
      const [d0, d1] = Array.isArray(params.maxDriftRatio ?? null)
        ? params.maxDriftRatio
        : [params.maxDriftRatio ?? 0.15, params.maxDriftRatio ?? 0.45]
      const maxDrift = Math.round((d0 + rand() * (d1 - d0)) * width)
      const reverse = rand() < 0.5
      return `start:${startRow}|drift:${maxDrift}|rev:${reverse ? 1 : 0}`
    }

    if (filterId === 'data-loss-freeze') {
      // filter order: row, reverse
      const reverse = rand() < 0.5
      return `start:${startRow}|rev:${reverse ? 1 : 0}`
    }
  }

  if (filterId === 'vhs') {
    const pick = (key) => {
      const v = params[key]
      if (!Array.isArray(v)) return v ?? 0
      return round(v[0] + rand() * (v[1] - v[0]), 3)
    }
    const lumaSmear = pick('lumaSmear')
    const chromaBlur = pick('chromaBlur')
    const chromaDelayX = pick('chromaDelayX')
    const chromaDelayY = pick('chromaDelayY')
    const chromaVertBlend = pick('chromaVertBlend')
    const edgeWave = pick('edgeWave')
    const edgeWaveAmplitude = pick('edgeWaveAmplitude')
    const headSwitchingHeight = pick('headSwitchingHeight')
    const headSwitchingShift = pick('headSwitchingShift')
    const chromaLoss = pick('chromaLoss')
    const noise = pick('noise')
    const snow = pick('snow')
    const trackingNoiseHeight = pick('trackingNoiseHeight')
    const trackingNoiseWave = pick('trackingNoiseWave')
    const trackingNoiseSnow = pick('trackingNoiseSnow')
    const trackingNoiseNoise = pick('trackingNoiseNoise')
    const sharpen = pick('sharpen')
    const ringingFreq = pick('ringingFreq')
    const ringingPower = pick('ringingPower')
    const ringingIntensity = pick('ringingIntensity')
    const vhsSharpen = pick('vhsSharpen')
    const chromaDegradation = pick('chromaDegradation')
    return `ls:${lumaSmear}|cb:${chromaBlur}`
      + `|cdx:${chromaDelayX}|cdy:${chromaDelayY}`
      + `|cvb:${chromaVertBlend}`
      + `|ew:${edgeWave}|ewa:${edgeWaveAmplitude}`
      + `|hsh:${headSwitchingHeight}|hss:${headSwitchingShift}`
      + `|cl:${chromaLoss}|n:${noise}|sn:${snow}`
      + `|tnh:${trackingNoiseHeight}|tnw:${trackingNoiseWave}`
      + `|tns:${trackingNoiseSnow}|tnn:${trackingNoiseNoise}`
      + `|sh:${sharpen}|rf:${ringingFreq}`
      + `|rp:${ringingPower}|ri:${ringingIntensity}`
      + `|vs:${vhsSharpen}|cd:${chromaDegradation}`
  }

  if (filterId === 'retro-sci-fi') {
    const pick = (key, fallback) => {
      const v = params[key] ?? fallback
      if (Array.isArray(v) && v.length === 2) return round(v[0] + rand() * (v[1] - v[0]), 4)
      return Array.isArray(v) ? v[0] : v
    }
    const warpFrequency = pick('warpFrequency', 0.045)
    const warpAmplitudeRatio = pick('warpAmplitudeRatio', 0.008)
    const ripple = pick('ripple', 0.02)
    const intensity = pick('intensity', 1.2)
    const glow = pick('glow', 0.55)
    return `wf:${warpFrequency}|wa:${warpAmplitudeRatio}|rp:${ripple}|int:${intensity}|glow:${glow}`
  }

  return `seed:${seed}`
}

export const toggleFilterOnLayer = (layer, filterId) => {
  if (!layer) return false
  if (!Array.isArray(layer.filters)) {
    layer.filters = []
  }
  if (!layer.filterSeeds || typeof layer.filterSeeds !== 'object') {
    layer.filterSeeds = {}
  }
  if (!layer.filterSeedSignatures || typeof layer.filterSeedSignatures !== 'object') {
    layer.filterSeedSignatures = {}
  }
  const index = layer.filters.indexOf(filterId)
  if (index === -1) {
    layer.filters.push(filterId)
    if (RANDOM_FILTER_IDS.includes(filterId)) {
      const nextSeed = generateFilterSeed()
      layer.filterSeeds[filterId] = nextSeed
      layer.filterSeedSignatures[filterId] = getFilterSignature(filterId, nextSeed, layer)
    }
  } else {
    layer.filters.splice(index, 1)
    if (RANDOM_FILTER_IDS.includes(filterId)) {
      delete layer.filterSeeds[filterId]
      delete layer.filterSeedSignatures[filterId]
    }
  }
  return true
}

export const reseedFilterOnLayer = (layer, filterId) => {
  if (!layer || !filterId) return false
  if (!RANDOM_FILTER_IDS.includes(filterId)) return false
  if (!layer.filters?.includes(filterId)) return false
  if (!layer.filterSeeds || typeof layer.filterSeeds !== 'object') {
    layer.filterSeeds = {}
  }
  if (!layer.filterSeedSignatures || typeof layer.filterSeedSignatures !== 'object') {
    layer.filterSeedSignatures = {}
  }
  const previousSeed = layer.filterSeeds[filterId]
  const previousSignature =
    layer.filterSeedSignatures[filterId] ??
    (Number.isFinite(previousSeed) ? getFilterSignature(filterId, previousSeed, layer) : null)
  let nextSeed = generateFilterSeed()
  let nextSignature = getFilterSignature(filterId, nextSeed, layer)
  let attempts = 0
  while (
    attempts < 12 &&
    (nextSignature === previousSignature ||
      (Number.isFinite(previousSeed) && nextSeed === previousSeed))
  ) {
    nextSeed = generateFilterSeed()
    nextSignature = getFilterSignature(filterId, nextSeed, layer)
    attempts += 1
  }
  if (Number.isFinite(previousSeed) && nextSeed === previousSeed) {
    nextSeed = (previousSeed + 1) >>> 0
    nextSignature = getFilterSignature(filterId, nextSeed, layer)
  }
  layer.filterSeeds[filterId] = nextSeed
  layer.filterSeedSignatures[filterId] = nextSignature
  return true
}

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
      preset.engine === 'rgbNoise' ||
      preset.engine === 'rgbShiftBands' ||
      preset.engine === 'anaglyphSplit' ||
      preset.engine === 'dataLoss' ||
      preset.engine === 'dataLossStream' ||
      preset.engine === 'dataLossDrift' ||
      preset.engine === 'dataLossFreeze' ||
      preset.engine === 'dataLossBitplane' ||
      preset.engine === 'bitcrush' ||
      preset.engine === 'bitcrushStripes' ||
      preset.engine === 'glitchTear' ||
      preset.engine === 'glitchTearVertical' ||
      preset.engine === 'glitchBlocks' ||
      preset.engine === 'channelSwap' ||
      preset.engine === 'horizontalByteShift' ||
      preset.engine === 'verticalByteShift' ||
      preset.engine === 'rowCorruption' ||
      preset.engine === 'jpegArtifact' ||
      preset.engine === 'pixelMelt' ||
      preset.engine === 'blockCorruption' ||
      preset.engine === 'vhs' ||
      preset.engine === 'retroSciFi'
    ) {
      if (layer && (!layer.filterSeeds || typeof layer.filterSeeds !== 'object')) {
        layer.filterSeeds = {}
      }
      let layerSeed = layer?.filterSeeds?.[filterId]
      if (!Number.isFinite(layerSeed) && layer) {
        layerSeed = generateFilterSeed()
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
