import { clamp, createSeededRandom, getImageData } from './utils.js'

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

export const applyVhs = (
  canvas,
  {
    lumaSmear,
    chromaBlur,
    chromaDelayX,
    chromaDelayY,
    chromaVertBlend,
    edgeWave,
    edgeWaveFrequency,
    edgeWaveAmplitude,
    headSwitchingHeight,
    headSwitchingShift,
    chromaLoss,
    noise,
    snow,
    snowOpacity,
    trackingNoiseHeight,
    trackingNoiseWave,
    trackingNoiseSnow,
    trackingNoiseNoise,
    chromaDegradation,
    sharpen,
    ringingFreq,
    ringingPower,
    ringingIntensity,
    vhsSharpen,
    seed,
  }
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

  const vhsSeed = seed ?? 0

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
    const sharpenAmount = sharpen
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
      const rowSeed = ((vhsSeed ^ (y * 2654435761)) >>> 0)
      const rng = createSeededRandom(rowSeed)
      addRowSpeckles(row, rng, snowAmount * clamp(snowOpacity, 0, 1), 0.5)
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
      const wave = (Math.sin(y * 0.15 + seed * 0.003) +
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
        const rowSeed = ((vhsSeed ^ (y * 2246822519)) >>> 0)
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
  const delayY = chromaDelayY
  if (Math.abs(delayX) > 0 || Math.abs(delayY) > 0) {
    const delayedI = new Float32Array(size)
    const delayedQ = new Float32Array(size)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        delayedI[p] = samplePlane(iDemod, x + delayX, y + delayY)
        delayedQ[p] = samplePlane(qDemod, x + delayX, y + delayY)
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
    const lumaSharpen = makeButterworth(
      lumaCut * 1.0,
      rate
    ).withScale(-vhsSharpen * 2.0)
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
  const chromaDeg = clamp(chromaDegradation, 0, 1)
  const chromaDegInv = 1 - chromaDeg
  for (let p = 0; p < size; p++) {
    const o = p * 4
    const yVal = yDemod[p]
    let iVal, qVal
    if (chromaDegInv > 0) {
      const rOrig = src[o] / 255
      const gOrig = src[o + 1] / 255
      const bOrig = src[o + 2] / 255
      const iOrig = rOrig * 0.596 - gOrig * 0.274 - bOrig * 0.322
      const qOrig = rOrig * 0.211 - gOrig * 0.523 + bOrig * 0.312
      iVal = clamp(iDemod[p] * chromaDeg + iOrig * chromaDegInv, -iMax, iMax)
      qVal = clamp(qDemod[p] * chromaDeg + qOrig * chromaDegInv, -qMax, qMax)
    } else {
      iVal = clamp(iDemod[p], -iMax, iMax)
      qVal = clamp(qDemod[p], -qMax, qMax)
    }
    const r = yVal + iVal * 0.956 + qVal * 0.621
    const g = yVal - iVal * 0.272 - qVal * 0.647
    const b = yVal - iVal * 1.106 + qVal * 1.703
    dst[o]     = clamp(r, 0, 1) * 255
    dst[o + 1] = clamp(g, 0, 1) * 255
    dst[o + 2] = clamp(b, 0, 1) * 255
    dst[o + 3] = src[o + 3]
  }

  ctx.putImageData(output, 0, 0)
}

// ---------------------------------------------------------------------------
// VHS 2 – same NTSC pipeline as applyVhs, with two additions from ntsc‑rs:
//   • Chroma phase error + per‑scanline phase noise  (hue instability)
//   • Per‑channel I/Q multi‑octave noise             (organic color noise)
// ---------------------------------------------------------------------------

export const applyVhs2 = (
  canvas,
  {
    lumaSmear,
    chromaPhaseError,
    chromaPhaseNoise,
    chromaBlur,
    chromaDelayX,
    chromaDelayY,
    chromaVertBlend,
    edgeWave,
    edgeWaveFrequency,
    edgeWaveAmplitude,
    headSwitchingHeight,
    headSwitchingShift,
    chromaLoss,
    noise,
    chromaNoise,
    snow,
    snowOpacity,
    trackingNoiseHeight,
    trackingNoiseWave,
    trackingNoiseSnow,
    trackingNoiseNoise,
    chromaDegradation,
    sharpen,
    ringingFreq,
    ringingPower,
    ringingIntensity,
    vhsSharpen,
    seed,
  }
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

  const hScale = Math.max(0.125, width / 640)
  const rate = NTSC_RATE * hScale

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
  const shiftRow = (srcPlane, dstPlane, y, shift) => {
    const rowOff = y * width
    const shiftInt = shift < 0 ? Math.trunc(shift) - 1 : Math.trunc(shift)
    const shiftFrac = shift < 0 ? 1 - Math.abs(shift - Math.ceil(shift)) : shift - Math.trunc(shift)
    const boundaryVal = shift >= 0 ? srcPlane[rowOff] : srcPlane[rowOff + width - 1]
    for (let x = 0; x < width; x++) {
      const leftIdx = x - shiftInt - 1
      const rightIdx = leftIdx + 1
      const left = (leftIdx >= 0 && leftIdx < width) ? srcPlane[rowOff + leftIdx] : boundaryVal
      const right = (rightIdx >= 0 && rightIdx < width) ? srcPlane[rowOff + rightIdx] : boundaryVal
      dstPlane[rowOff + x] = left * shiftFrac + right * (1 - shiftFrac)
    }
  }
  const shiftTmp2 = new Float32Array(width)
  const shiftRowInPlace = (plane, y, shift) => {
    const rowOff = y * width
    shiftTmp2.set(plane.subarray(rowOff, rowOff + width))
    const shiftInt = shift < 0 ? Math.trunc(shift) - 1 : Math.trunc(shift)
    const shiftFrac = shift < 0 ? 1 - Math.abs(shift - Math.ceil(shift)) : shift - Math.trunc(shift)
    const boundaryVal = shift >= 0 ? shiftTmp2[0] : shiftTmp2[width - 1]
    for (let x = 0; x < width; x++) {
      const leftIdx = x - shiftInt - 1
      const rightIdx = leftIdx + 1
      const left = (leftIdx >= 0 && leftIdx < width) ? shiftTmp2[leftIdx] : boundaryVal
      const right = (rightIdx >= 0 && rightIdx < width) ? shiftTmp2[rightIdx] : boundaryVal
      plane[rowOff + x] = left * shiftFrac + right * (1 - shiftFrac)
    }
  }

  const vhsSeed = seed ?? 0

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

  // ── 2. Input luma notch prefilter ────────────────────────────────────────
  {
    const notch = makeNotchFilter(0.5, 2.0)
    filterPlane(yPlane, width, notch, 'first', 0)
  }

  // ── 3. Chroma input LPF ──────────────────────────────────────────────────
  {
    const iFilter = makeButterworth(1300000, rate)
    const qFilter = makeButterworth(600000, rate)
    filterPlane(iPlane, width, iFilter, 'zero', 2)
    filterPlane(qPlane, width, qFilter, 'zero', 4)
  }

  // ── 4. Modulate → composite ──────────────────────────────────────────────
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

  // ── 5. Pre‑emphasis ──────────────────────────────────────────────────────
  if (sharpen !== 0) {
    const preemph = makeLowpass((315000000 / 88 / 2) * hScale, rate).withScale(-sharpen)
    filterPlane(composite, width, preemph, 'zero', 0)
  }

  // ── 6. Composite noise ───────────────────────────────────────────────────
  const noiseAmount = clamp(noise, 0, 1)
  if (noiseAmount > 0) {
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      for (let x = 0; x < width; x++) {
        composite[rowOff + x] += (hash(x * 0.7, y * 1.3 + seed) - 0.5) * noiseAmount * 0.12
      }
    }
  }

  // ── 7. Snow ──────────────────────────────────────────────────────────────
  const snowAmount = clamp(snow, 0, 1)
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
      const rowSeed = ((vhsSeed ^ (y * 2654435761)) >>> 0)
      const rng = createSeededRandom(rowSeed)
      addRowSpeckles(row, rng, snowAmount * clamp(snowOpacity, 0, 1), 0.5)
    }
  }

  // ── 8. Head switching ────────────────────────────────────────────────────
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

  // ── 9. Tracking noise ────────────────────────────────────────────────────
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
      const wave = (Math.sin(y * 0.15 + seed * 0.003) +
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
        const rowSeed = ((vhsSeed ^ (y * 2246822519)) >>> 0)
        const rng = createSeededRandom(rowSeed)
        addRowSpeckles(row, rng, trackingNoiseSnow * intensityScale, 0.25)
      }
    }
    composite.set(trackingComposite)
  }

  // ── 10. Chroma demodulation (notch) ──────────────────────────────────────
  const yDemod = new Float32Array(size)
  const iDemod = new Float32Array(size)
  const qDemod = new Float32Array(size)

  yDemod.set(composite)
  {
    const notch = makeNotchFilter(0.5, 2.0)
    filterPlane(yDemod, width, notch, 'zero', 0)
  }

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

  // ── 10b. Chroma phase error + per‑scanline noise (ntsc‑rs chroma_phase_error) ──
  // Rotates the I/Q vector by a global angle plus per‑scanline jitter.
  // This creates visible hue instability across rows, characteristic of
  // degraded VHS chroma circuitry.
  const phaseBase = clamp(chromaPhaseError, 0, 1) * Math.PI * 2
  const phaseJitter = clamp(chromaPhaseNoise, 0, 1) * Math.PI * 2
  if (phaseBase !== 0 || phaseJitter !== 0) {
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      const jitter = (hash(y * 3.71, vhsSeed * 0.19 + 7.3) - 0.5) * 2
      const angle = phaseBase + jitter * phaseJitter
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      for (let x = 0; x < width; x++) {
        const p = rowOff + x
        const iv = iDemod[p]
        const qv = qDemod[p]
        iDemod[p] = iv * cosA - qv * sinA
        qDemod[p] = iv * sinA + qv * cosA
      }
    }
  }

  // ── 11. Luma smear ───────────────────────────────────────────────────────
  if (lumaSmear > 0) {
    const cutoff = Math.pow(2, -4 * lumaSmear) * 0.25
    const lpf = makeLowpass(cutoff, hScale)
    filterPlane(yDemod, width, lpf, 'zero', 0)
  }

  // ── 12. Ringing ──────────────────────────────────────────────────────────
  {
    const ringing = makeNotchFilter(
      clamp(ringingFreq / hScale, 0, 1),
      ringingPower
    ).withScale(ringingIntensity)
    filterPlane(yDemod, width, ringing, 'first', 1)
  }

  // ── 13. Post‑demod luma noise ─────────────────────────────────────────────
  if (noiseAmount > 0) {
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      for (let x = 0; x < width; x++) {
        yDemod[rowOff + x] += (hash(x * 2.1, y * 0.7 + seed) - 0.5) * noiseAmount * 0.06
      }
    }
  }

  // ── 13b. Per‑channel I/Q noise (ntsc‑rs chroma noise, two‑octave FBM) ────
  // Adds organic color noise independently on I and Q planes.
  // Two octaves of value noise give a more film-like texture than white noise.
  const chromaNoiseAmt = clamp(chromaNoise, 0, 1)
  if (chromaNoiseAmt > 0) {
    for (let y = 0; y < height; y++) {
      const rowOff = y * width
      for (let x = 0; x < width; x++) {
        const p = rowOff + x
        const ni = (hash(x * 0.61 + 11.3, y * 1.73 + seed * 0.43) - 0.5)
                 + (hash(x * 1.22 + 22.6, y * 3.46 + seed * 0.86) - 0.5) * 0.5
        const nq = (hash(x * 0.83 + 33.9, y * 1.17 + seed * 0.67) - 0.5)
                 + (hash(x * 1.66 + 67.8, y * 2.34 + seed * 1.34) - 0.5) * 0.5
        iDemod[p] += ni * chromaNoiseAmt * 0.10
        qDemod[p] += nq * chromaNoiseAmt * 0.10
      }
    }
  }

  // ── 14. Edge wave ─────────────────────────────────────────────────────────
  const waveAmp = Math.max(0, edgeWaveAmplitude) * clamp(edgeWave, 0, 1)
  if (waveAmp > 0) {
    const waveFreq = Math.max(0.001, edgeWaveFrequency) * Math.PI * 2
    const phaseBase2 = (seed % 1024) / 1024 * Math.PI * 2
    for (const plane of [yDemod, iDemod, qDemod]) {
      for (let y = 0; y < height; y++) {
        const baseWave = Math.sin(y * waveFreq + phaseBase2)
        const jitter2 = (hash(y, seed) - 0.5) * 0.5
        const shift = (baseWave + jitter2) * waveAmp * hScale
        shiftRowInPlace(plane, y, shift)
      }
    }
  }

  // ── 15. Chroma delay ──────────────────────────────────────────────────────
  const delayX = chromaDelayX * hScale
  const delayY = chromaDelayY
  if (Math.abs(delayX) > 0 || Math.abs(delayY) > 0) {
    const delayedI = new Float32Array(size)
    const delayedQ = new Float32Array(size)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        delayedI[p] = samplePlane(iDemod, x + delayX, y + delayY)
        delayedQ[p] = samplePlane(qDemod, x + delayX, y + delayY)
      }
    }
    iDemod.set(delayedI)
    qDemod.set(delayedQ)
  }

  // ── 16. VHS tape‑speed LPF + sharpening ──────────────────────────────────
  {
    const lumaCut = 1900000
    const chromaCut = 300000
    const chromaFilterDelay = 5
    const lumaLPF = makeButterworth(lumaCut, rate)
    filterPlane(yDemod, width, lumaLPF, 'zero', 0)
    const chromaLPF = makeButterworth(chromaCut, rate)
    filterPlane(iDemod, width, chromaLPF, 'zero', chromaFilterDelay)
    filterPlane(qDemod, width, chromaLPF, 'zero', chromaFilterDelay)
    const lumaSharpen = makeButterworth(lumaCut * 1.0, rate).withScale(-vhsSharpen * 2.0)
    filterPlane(yDemod, width, lumaSharpen, 'zero', 0)
  }

  // ── 17. Chroma output LPF ─────────────────────────────────────────────────
  {
    const chromaBlurAmount = clamp(chromaBlur, 0, 1)
    if (chromaBlurAmount > 0) {
      const iCut = 1300000 * (1.1 - chromaBlurAmount)
      const qCut = 600000 * (1.1 - chromaBlurAmount)
      filterPlane(iDemod, width, makeButterworth(iCut, rate), 'zero', 2)
      filterPlane(qDemod, width, makeButterworth(qCut, rate), 'zero', 4)
    }
  }

  // ── 18. Chroma vertical blend ─────────────────────────────────────────────
  const vertBlend = clamp(chromaVertBlend, 0, 1)
  if (vertBlend > 0 && height > 1) {
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

  // ── 19. Chroma loss ───────────────────────────────────────────────────────
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

  // ── 20. YIQ → RGB ────────────────────────────────────────────────────────
  const iMax = 0.5957
  const qMax = 0.5226
  const chromaDeg = clamp(chromaDegradation, 0, 1)
  const chromaDegInv = 1 - chromaDeg
  for (let p = 0; p < size; p++) {
    const o = p * 4
    const yVal = yDemod[p]
    let iVal, qVal
    if (chromaDegInv > 0) {
      const rOrig = src[o] / 255
      const gOrig = src[o + 1] / 255
      const bOrig = src[o + 2] / 255
      const iOrig = rOrig * 0.596 - gOrig * 0.274 - bOrig * 0.322
      const qOrig = rOrig * 0.211 - gOrig * 0.523 + bOrig * 0.312
      iVal = clamp(iDemod[p] * chromaDeg + iOrig * chromaDegInv, -iMax, iMax)
      qVal = clamp(qDemod[p] * chromaDeg + qOrig * chromaDegInv, -qMax, qMax)
    } else {
      iVal = clamp(iDemod[p], -iMax, iMax)
      qVal = clamp(qDemod[p], -qMax, qMax)
    }
    const r = yVal + iVal * 0.956 + qVal * 0.621
    const g = yVal - iVal * 0.272 - qVal * 0.647
    const b = yVal - iVal * 1.106 + qVal * 1.703
    dst[o]     = clamp(r, 0, 1) * 255
    dst[o + 1] = clamp(g, 0, 1) * 255
    dst[o + 2] = clamp(b, 0, 1) * 255
    dst[o + 3] = src[o + 3]
  }

  ctx.putImageData(output, 0, 0)
}
