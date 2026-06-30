<script setup lang="ts">
import { ACESFilmicToneMapping, SRGBColorSpace, TextureLoader, type Texture, type WebGLRenderer } from 'three'
import { lerp, easeInOutCubic, easeOutCubic } from '~/composables/useScrollProgress'

const props = defineProps<{
  progress: number
}>()

const COURT_TEXTURE = '/images/tennis-court-isometric.jpg'
const ASPECT = 5500 / 3800
const PLANE_H = 7.2
const PLANE_W = PLANE_H * ASPECT

const courtTexture = shallowRef<Texture | null>(null)

onMounted(async () => {
  const loader = new TextureLoader()
  const tex = await loader.loadAsync(COURT_TEXTURE)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  courtTexture.value = tex
})

onUnmounted(() => {
  courtTexture.value?.dispose()
})

function onCanvasReady({ renderer: gl }: { renderer: WebGLRenderer }) {
  gl.toneMapping = ACESFilmicToneMapping
  gl.toneMappingExposure = 1.05
}

const orbit = computed(() => easeInOutCubic(Math.min(props.progress / 0.88, 1)))
const zoom = computed(() => easeOutCubic(Math.max(0, (props.progress - 0.06) / 0.94)))

const groupRotationY = computed(() => lerp(-0.32, 0.42, orbit.value))
const groupRotationX = computed(() => lerp(0.04, -0.1, zoom.value))
const groupScale = computed(() => lerp(1, 1.12, zoom.value))

const cameraPosition = computed<[number, number, number]>(() => {
  const yaw = lerp(0.18, 0.42, orbit.value)
  const dist = lerp(13.5, 5.8, zoom.value)
  const height = lerp(2.8, 1.6, zoom.value)
  return [
    Math.sin(yaw) * dist,
    height,
    Math.cos(yaw) * dist,
  ]
})

const cameraLookAt = computed<[number, number, number]>(() => [
  0,
  lerp(0.2, 0.55, zoom.value),
  lerp(0, -0.35, zoom.value),
])

const sceneFade = computed(() => lerp(1, 0.35, Math.max(0, (props.progress - 0.8) / 0.2)))
const baseDepth = 0.55
const shadowRotation = -Math.PI / 2
</script>

<template>
  <TresCanvas
    class="court-canvas"
    :alpha="true"
    :antialias="true"
    :clear-color="0x000000"
    :clear-alpha="0"
    :power-preference="'high-performance'"
    :dpr="[1, 2]"
    @ready="onCanvasReady"
  >
    <TresPerspectiveCamera
      :position="cameraPosition"
      :fov="34"
      :near="0.1"
      :far="80"
      :look-at="cameraLookAt"
    />

    <TresAmbientLight :intensity="1.1" color="#ffffff" />
    <TresDirectionalLight :position="[4, 8, 6]" :intensity="0.35" color="#ffffff" />

    <TresGroup
      :rotation-x="groupRotationX"
      :rotation-y="groupRotationY"
      :scale="[groupScale, groupScale, groupScale]"
    >
      <!-- Isometric red platform (depth under illustration) -->
      <TresMesh :position="[0, -baseDepth / 2 - 0.02, 0.45]" receive-shadow>
        <TresBoxGeometry :args="[PLANE_W * 0.92, baseDepth, PLANE_H * 0.52]" />
        <TresMeshStandardMaterial
          color="#c0392b"
          :roughness="0.82"
          :metalness="0.04"
          :transparent="true"
          :opacity="sceneFade"
        />
      </TresMesh>

      <!-- Main isometric court illustration -->
      <TresMesh :position="[0, 0, 0]">
        <TresPlaneGeometry :args="[PLANE_W, PLANE_H]" />
        <TresMeshBasicMaterial
          v-if="courtTexture"
          :map="courtTexture"
          :transparent="true"
          :opacity="sceneFade"
        />
      </TresMesh>

      <!-- Soft ground shadow -->
      <TresMesh :position="[0, -baseDepth - 0.08, 0.55]" :rotation-x="shadowRotation">
        <TresPlaneGeometry :args="[PLANE_W * 1.05, PLANE_H * 0.65]" />
        <TresMeshBasicMaterial color="#000000" :transparent="true" :opacity="0.22 * sceneFade" />
      </TresMesh>
    </TresGroup>
  </TresCanvas>
</template>

<style scoped>
.court-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: pan-y;
}
</style>
