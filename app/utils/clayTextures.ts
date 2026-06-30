import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three'

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * alpha
    data[i] = Math.min(255, Math.max(0, data[i]! + n))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1]! + n))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2]! + n))
  }
  ctx.putImageData(imageData, 0, 0)
}

export function createClayTexture(): Texture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#a84828')
  grad.addColorStop(0.35, '#c45a32')
  grad.addColorStop(0.65, '#b84e2a')
  grad.addColorStop(1, '#9a3f22')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random() * 2.2 + 0.3
    const a = Math.random() * 0.14
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,210,170,${a})` : `rgba(60,20,8,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  noise(ctx, size, size, 18)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

export function createRunoffTexture(): Texture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#7a3318'
  ctx.fillRect(0, 0, size, size)
  noise(ctx, size, size, 22)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(3, 3)
  return texture
}
