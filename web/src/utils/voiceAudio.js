/**
 * 语音录制 / PCM 编码相关纯函数（供 App.vue 等调用）
 */

/**
 * @param {Float32Array[]} chunks
 * @returns {Float32Array}
 */
export function mergeFloat32Chunks(chunks) {
  const total = chunks.reduce((sum, arr) => sum + arr.length, 0)
  const merged = new Float32Array(total)
  let offset = 0
  for (const arr of chunks) {
    merged.set(arr, offset)
    offset += arr.length
  }
  return merged
}

/**
 * 将任意采样率的单声道 float32 下采样到 16kHz（简单均值降采样）
 * @param {Float32Array} input
 * @param {number} sampleRate 输入采样率（如 48000）
 * @returns {Float32Array}
 */
export function downsampleTo16k(input, sampleRate) {
  if (sampleRate === 16000) return input
  const ratio = sampleRate / 16000
  const len = Math.round(input.length / ratio)
  const output = new Float32Array(len)
  let outPos = 0
  let inPos = 0
  while (outPos < len) {
    const next = Math.round((outPos + 1) * ratio)
    let sum = 0
    let count = 0
    for (let i = inPos; i < next && i < input.length; i++) {
      sum += input[i]
      count++
    }
    output[outPos] = count > 0 ? sum / count : 0
    outPos++
    inPos = next
  }
  return output
}

/**
 * @param {Float32Array} float32Array
 * @returns {Uint8Array} little-endian 16-bit PCM
 */
export function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Uint8Array(buffer)
}

/**
 * @param {Uint8Array} uint8Arr
 * @returns {string} base64
 */
export function uint8ArrayToBase64(uint8Arr) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < uint8Arr.length; i += chunk) {
    binary += String.fromCharCode(...uint8Arr.subarray(i, i + chunk))
  }
  return btoa(binary)
}
