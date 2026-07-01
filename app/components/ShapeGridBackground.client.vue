<script setup lang="ts">
/**
 * Animated shape grid background — ported from React Bits ShapeGrid (MIT).
 * @see https://reactbits.dev/backgrounds/shape-grid
 */

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern
type GridDirection = 'diagonal' | 'up' | 'right' | 'down' | 'left'
type GridShape = 'square' | 'hexagon' | 'circle' | 'triangle'

interface GridOffset {
  x: number
  y: number
}

const props = withDefaults(
  defineProps<{
    direction?: GridDirection
    speed?: number
    borderColor?: CanvasStrokeStyle
    squareSize?: number
    hoverFillColor?: CanvasStrokeStyle
    shape?: GridShape
    hoverTrailAmount?: number
    vignetteColor?: string
    interactive?: boolean
  }>(),
  {
    direction: 'diagonal',
    speed: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    squareSize: 40,
    hoverFillColor: 'rgba(182, 138, 59, 0.35)',
    shape: 'square',
    hoverTrailAmount: 0,
    vignetteColor: '#4A1420',
    interactive: false,
  },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let requestId: number | null = null
let resizeObserver: ResizeObserver | null = null

const gridOffset: GridOffset = { x: 0, y: 0 }
let hoveredSquare: GridOffset | null = null
const trailCells: GridOffset[] = []
const cellOpacities = new Map<string, number>()

function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return () => {}

  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const {
    direction,
    speed,
    borderColor,
    hoverFillColor,
    squareSize,
    shape,
    hoverTrailAmount,
    vignetteColor,
    interactive,
  } = props

  const isHex = shape === 'hexagon'
  const isTri = shape === 'triangle'
  const hexHoriz = squareSize * 1.5
  const hexVert = squareSize * Math.sqrt(3)
  const reducedMotion = prefersReducedMotion()

  const resizeCanvas = () => {
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    if (width === 0 || height === 0) return
    canvas.width = width
    canvas.height = height
  }

  const drawHex = (cx: number, cy: number, size: number) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const vx = cx + size * Math.cos(angle)
      const vy = cy + size * Math.sin(angle)
      if (i === 0) ctx.moveTo(vx, vy)
      else ctx.lineTo(vx, vy)
    }
    ctx.closePath()
  }

  const drawCircle = (cx: number, cy: number, size: number) => {
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
    ctx.closePath()
  }

  const drawTriangle = (cx: number, cy: number, size: number, flip: boolean) => {
    ctx.beginPath()
    if (flip) {
      ctx.moveTo(cx, cy + size / 2)
      ctx.lineTo(cx + size / 2, cy - size / 2)
      ctx.lineTo(cx - size / 2, cy - size / 2)
    } else {
      ctx.moveTo(cx, cy - size / 2)
      ctx.lineTo(cx + size / 2, cy + size / 2)
      ctx.lineTo(cx - size / 2, cy + size / 2)
    }
    ctx.closePath()
  }

  const drawGrid = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz)
      const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz
      const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert
      const cols = Math.ceil(canvas.width / hexHoriz) + 3
      const rows = Math.ceil(canvas.height / hexVert) + 3

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * hexHoriz + offsetX
          const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY
          const cellKey = `${col},${row}`
          const alpha = cellOpacities.get(cellKey)
          if (alpha) {
            ctx.globalAlpha = alpha
            drawHex(cx, cy, squareSize)
            ctx.fillStyle = hoverFillColor
            ctx.fill()
            ctx.globalAlpha = 1
          }
          drawHex(cx, cy, squareSize)
          ctx.strokeStyle = borderColor
          ctx.stroke()
        }
      }
    } else if (isTri) {
      const halfW = squareSize / 2
      const colShift = Math.floor(gridOffset.x / halfW)
      const rowShift = Math.floor(gridOffset.y / squareSize)
      const offsetX = ((gridOffset.x % halfW) + halfW) % halfW
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
      const cols = Math.ceil(canvas.width / halfW) + 4
      const rows = Math.ceil(canvas.height / squareSize) + 4

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * halfW + offsetX
          const cy = row * squareSize + squareSize / 2 + offsetY
          const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0
          const cellKey = `${col},${row}`
          const alpha = cellOpacities.get(cellKey)
          if (alpha) {
            ctx.globalAlpha = alpha
            drawTriangle(cx, cy, squareSize, flip)
            ctx.fillStyle = hoverFillColor
            ctx.fill()
            ctx.globalAlpha = 1
          }
          drawTriangle(cx, cy, squareSize, flip)
          ctx.strokeStyle = borderColor
          ctx.stroke()
        }
      }
    } else if (shape === 'circle') {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
      const cols = Math.ceil(canvas.width / squareSize) + 3
      const rows = Math.ceil(canvas.height / squareSize) + 3

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * squareSize + squareSize / 2 + offsetX
          const cy = row * squareSize + squareSize / 2 + offsetY
          const cellKey = `${col},${row}`
          const alpha = cellOpacities.get(cellKey)
          if (alpha) {
            ctx.globalAlpha = alpha
            drawCircle(cx, cy, squareSize)
            ctx.fillStyle = hoverFillColor
            ctx.fill()
            ctx.globalAlpha = 1
          }
          drawCircle(cx, cy, squareSize)
          ctx.strokeStyle = borderColor
          ctx.stroke()
        }
      }
    } else {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
      const cols = Math.ceil(canvas.width / squareSize) + 3
      const rows = Math.ceil(canvas.height / squareSize) + 3

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const sx = col * squareSize + offsetX
          const sy = row * squareSize + offsetY
          const cellKey = `${col},${row}`
          const alpha = cellOpacities.get(cellKey)
          if (alpha) {
            ctx.globalAlpha = alpha
            ctx.fillStyle = hoverFillColor
            ctx.fillRect(sx, sy, squareSize, squareSize)
            ctx.globalAlpha = 1
          }
          ctx.strokeStyle = borderColor
          ctx.strokeRect(sx, sy, squareSize, squareSize)
        }
      }
    }

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2,
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, vignetteColor)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const updateCellOpacities = () => {
    const targets = new Map<string, number>()

    if (hoveredSquare) {
      targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1)
    }

    if (hoverTrailAmount > 0) {
      for (let i = 0; i < trailCells.length; i++) {
        const t = trailCells[i]
        const key = `${t.x},${t.y}`
        if (!targets.has(key)) {
          targets.set(key, (trailCells.length - i) / (trailCells.length + 1))
        }
      }
    }

    for (const [key] of targets) {
      if (!cellOpacities.has(key)) {
        cellOpacities.set(key, 0)
      }
    }

    for (const [key, opacity] of cellOpacities) {
      const target = targets.get(key) || 0
      const next = opacity + (target - opacity) * 0.15
      if (next < 0.005) {
        cellOpacities.delete(key)
      } else {
        cellOpacities.set(key, next)
      }
    }
  }

  const updateAnimation = () => {
    const effectiveSpeed = Math.max(speed, 0.1)
    const wrapX = isHex ? hexHoriz * 2 : squareSize
    const wrapY = isHex ? hexVert : isTri ? squareSize * 2 : squareSize

    switch (direction) {
      case 'right':
        gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX
        break
      case 'left':
        gridOffset.x = (gridOffset.x + effectiveSpeed + wrapX) % wrapX
        break
      case 'up':
        gridOffset.y = (gridOffset.y + effectiveSpeed + wrapY) % wrapY
        break
      case 'down':
        gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY
        break
      case 'diagonal':
        gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX
        gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY
        break
    }

    updateCellOpacities()
    drawGrid()
    requestId = requestAnimationFrame(updateAnimation)
  }

  const handleMouseMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz)
      const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz
      const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert
      const adjustedX = mouseX - offsetX
      const adjustedY = mouseY - offsetY
      const col = Math.round(adjustedX / hexHoriz)
      const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0
      const row = Math.round((adjustedY - rowOffset) / hexVert)

      if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
        if (hoveredSquare && hoverTrailAmount > 0) {
          trailCells.unshift({ ...hoveredSquare })
          if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount
        }
        hoveredSquare = { x: col, y: row }
      }
    } else if (isTri) {
      const halfW = squareSize / 2
      const offsetX = ((gridOffset.x % halfW) + halfW) % halfW
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
      const adjustedX = mouseX - offsetX
      const adjustedY = mouseY - offsetY
      const col = Math.round(adjustedX / halfW)
      const row = Math.floor(adjustedY / squareSize)

      if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
        if (hoveredSquare && hoverTrailAmount > 0) {
          trailCells.unshift({ ...hoveredSquare })
          if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount
        }
        hoveredSquare = { x: col, y: row }
      }
    } else if (shape === 'circle') {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
      const adjustedX = mouseX - offsetX
      const adjustedY = mouseY - offsetY
      const col = Math.round(adjustedX / squareSize)
      const row = Math.round(adjustedY / squareSize)

      if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
        if (hoveredSquare && hoverTrailAmount > 0) {
          trailCells.unshift({ ...hoveredSquare })
          if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount
        }
        hoveredSquare = { x: col, y: row }
      }
    } else {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize
      const adjustedX = mouseX - offsetX
      const adjustedY = mouseY - offsetY
      const col = Math.floor(adjustedX / squareSize)
      const row = Math.floor(adjustedY / squareSize)

      if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
        if (hoveredSquare && hoverTrailAmount > 0) {
          trailCells.unshift({ ...hoveredSquare })
          if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount
        }
        hoveredSquare = { x: col, y: row }
      }
    }
  }

  const handleMouseLeave = () => {
    if (hoveredSquare && hoverTrailAmount > 0) {
      trailCells.unshift({ ...hoveredSquare })
      if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount
    }
    hoveredSquare = null
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)

  if (interactive && !reducedMotion) {
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
  }

  if (reducedMotion) {
    drawGrid()
  } else {
    requestId = requestAnimationFrame(updateAnimation)
  }

  return () => {
    window.removeEventListener('resize', resizeCanvas)
    resizeObserver?.disconnect()
    resizeObserver = null
    if (requestId !== null) {
      cancelAnimationFrame(requestId)
      requestId = null
    }
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mouseleave', handleMouseLeave)
    hoveredSquare = null
    trailCells.length = 0
    cellOpacities.clear()
    gridOffset.x = 0
    gridOffset.y = 0
  }
}

let teardown: (() => void) | null = null

function restart() {
  teardown?.()
  teardown = setupCanvas()
}

onMounted(() => {
  restart()
})

onUnmounted(() => {
  teardown?.()
  teardown = null
})

watch(
  () => [
    props.direction,
    props.speed,
    props.borderColor,
    props.hoverFillColor,
    props.squareSize,
    props.shape,
    props.hoverTrailAmount,
    props.vignetteColor,
    props.interactive,
  ],
  () => restart(),
)
</script>

<template>
  <canvas
    ref="canvasRef"
    class="block h-full w-full border-none"
    :class="interactive ? '' : 'pointer-events-none'"
    aria-hidden="true"
  />
</template>
