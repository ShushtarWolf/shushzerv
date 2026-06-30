<script setup lang="ts">
import { ACESFilmicToneMapping, PCFSoftShadowMap, type WebGLRenderer } from 'three'
import { lerp, easeInOutCubic, easeOutCubic } from '~/composables/useScrollProgress'
import { createClayTexture, createRunoffTexture } from '~/utils/clayTextures'

const props = defineProps<{
  progress: number
}>()

const clayMap = shallowRef<ReturnType<typeof createClayTexture> | null>(null)
const runoffMap = shallowRef<ReturnType<typeof createRunoffTexture> | null>(null)

onMounted(() => {
  clayMap.value = createClayTexture()
  runoffMap.value = createRunoffTexture()
})

onUnmounted(() => {
  clayMap.value?.dispose()
  runoffMap.value?.dispose()
})

function onCanvasReady({ renderer: gl }: { renderer: WebGLRenderer }) {
  gl.toneMapping = ACESFilmicToneMapping
  gl.toneMappingExposure = 1.15
  gl.shadowMap.enabled = true
  gl.shadowMap.type = PCFSoftShadowMap
}

const orbit = computed(() => easeInOutCubic(Math.min(props.progress / 0.85, 1)))
const zoom = computed(() => easeOutCubic(Math.max(0, (props.progress - 0.08) / 0.92)))

const groupRotationY = computed(() => lerp(-0.35, 0.85, orbit.value))
const groupScale = computed(() => lerp(1, 1.08, zoom.value))

const cameraPosition = computed<[number, number, number]>(() => {
  const angle = lerp(0.62, 0.08, zoom.value) + lerp(0, Math.PI * 0.55, orbit.value)
  const dist = lerp(16, 5.5, zoom.value)
  const height = lerp(8.5, 4.2, zoom.value)
  return [
    Math.sin(angle) * dist,
    height,
    Math.cos(angle) * dist,
  ]
})

const cameraLookAt = computed<[number, number, number]>(() => [
  0,
  lerp(0.15, 0.55, zoom.value),
  0,
])

const sceneFade = computed(() => lerp(1, 0.25, Math.max(0, (props.progress - 0.82) / 0.18)))

// Court dimensions (scaled): ~12 x 5.5 playing area
const COURT_W = 12
const COURT_D = 5.5
const LINE_H = 0.018
const LINE_Y = 0.09
</script>

<template>
  <TresCanvas
    class="court-canvas"
    :alpha="true"
    :antialias="true"
    :shadows="true"
    :clear-color="0x000000"
    :clear-alpha="0"
    :power-preference="'high-performance'"
    :dpr="[1, 2]"
    @ready="onCanvasReady"
  >
    <TresPerspectiveCamera
      :position="cameraPosition"
      :fov="38"
      :near="0.1"
      :far="120"
      :look-at="cameraLookAt"
    />

    <TresHemisphereLight :intensity="0.55" color="#fff4e8" ground-color="#3d1a0c" />
    <TresDirectionalLight
      :position="[10, 18, 8]"
      :intensity="2.2"
      color="#fff8f0"
      cast-shadow
      :shadow-mapSize="[2048, 2048]"
      :shadow-camera-left="-14"
      :shadow-camera-right="14"
      :shadow-camera-top="10"
      :shadow-camera-bottom="-10"
    />
    <TresDirectionalLight :position="[-8, 6, -6]" :intensity="0.35" color="#ffcba4" />
    <TresSpotLight
      :position="[0, 14, 2]"
      :intensity="0.6"
      :angle="0.45"
      :penumbra="0.8"
      color="#ffffff"
    />

    <TresGroup :rotation-y="groupRotationY" :scale="[groupScale, groupScale, groupScale]">
      <!-- Runoff / surround -->
      <TresMesh :position="[0, 0.02, 0]" receive-shadow>
        <TresBoxGeometry :args="[COURT_W + 4, 0.08, COURT_D + 3]" />
        <TresMeshStandardMaterial
          :map="runoffMap ?? undefined"
          color="#7a3318"
          :roughness="0.92"
          :metalness="0.02"
          :transparent="true"
          :opacity="sceneFade"
        />
      </TresMesh>

      <!-- Clay playing surface -->
      <TresMesh :position="[0, 0.06, 0]" receive-shadow>
        <TresBoxGeometry :args="[COURT_W, 0.1, COURT_D]" />
        <TresMeshStandardMaterial
          :map="clayMap ?? undefined"
          color="#b84e2a"
          :roughness="0.88"
          :metalness="0.04"
          :transparent="true"
          :opacity="sceneFade"
        />
      </TresMesh>

      <!-- White court lines -->
      <TresMesh :position="[0, LINE_Y, 0]">
        <TresBoxGeometry :args="[COURT_W, LINE_H, 0.05]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="0.95 * sceneFade" />
      </TresMesh>
      <TresMesh :position="[0, LINE_Y, 0]">
        <TresBoxGeometry :args="[0.05, LINE_H, COURT_D]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="0.95 * sceneFade" />
      </TresMesh>
      <TresMesh :position="[0, LINE_Y, -1.37]">
        <TresBoxGeometry :args="[COURT_W, LINE_H, 0.04]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="0.9 * sceneFade" />
      </TresMesh>
      <TresMesh :position="[0, LINE_Y, 1.37]">
        <TresBoxGeometry :args="[COURT_W, LINE_H, 0.04]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="0.9 * sceneFade" />
      </TresMesh>
      <TresMesh :position="[0, LINE_Y, 0]">
        <TresBoxGeometry :args="[0.04, LINE_H, 1.37]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="0.88 * sceneFade" />
      </TresMesh>
      <TresMesh :position="[-3.05, LINE_Y, 0]">
        <TresBoxGeometry :args="[0.04, LINE_H, 2.74]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="0.88 * sceneFade" />
      </TresMesh>
      <TresMesh :position="[3.05, LINE_Y, 0]">
        <TresBoxGeometry :args="[0.04, LINE_H, 2.74]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="0.88 * sceneFade" />
      </TresMesh>

      <!-- Net assembly -->
      <TresGroup :position="[0, 0, 0]">
        <TresMesh :position="[0, 0.48, 0]" cast-shadow>
          <TresBoxGeometry :args="[COURT_W + 0.1, 0.96, 0.025]" />
          <TresMeshStandardMaterial
            color="#e8eef5"
            :metalness="0.05"
            :roughness="0.75"
            :transparent="true"
            :opacity="0.42 * sceneFade"
          />
        </TresMesh>
        <TresMesh :position="[0, 0.02, 0]">
          <TresBoxGeometry :args="[COURT_W + 0.2, 0.06, 0.05]" />
          <TresMeshStandardMaterial color="#f1f5f9" :transparent="true" :opacity="0.95 * sceneFade" />
        </TresMesh>
        <TresMesh :position="[-COURT_W / 2 - 0.08, 0.5, 0]" cast-shadow>
          <TresCylinderGeometry :args="[0.06, 0.06, 1.07, 16]" />
          <TresMeshStandardMaterial color="#d4d4d8" :metalness="0.75" :roughness="0.28" />
        </TresMesh>
        <TresMesh :position="[COURT_W / 2 + 0.08, 0.5, 0]" cast-shadow>
          <TresCylinderGeometry :args="[0.06, 0.06, 1.07, 16]" />
          <TresMeshStandardMaterial color="#d4d4d8" :metalness="0.75" :roughness="0.28" />
        </TresMesh>
      </TresGroup>

      <!-- Tennis balls -->
      <TresMesh :position="[4.2, 0.14, 1.6]" cast-shadow>
        <TresSphereGeometry :args="[0.11, 32, 32]" />
        <TresMeshStandardMaterial color="#c8e600" :roughness="0.55" :metalness="0.05" />
      </TresMesh>
      <TresMesh :position="[4.45, 0.14, 1.85]" cast-shadow>
        <TresSphereGeometry :args="[0.11, 32, 32]" />
        <TresMeshStandardMaterial color="#c8e600" :roughness="0.55" :metalness="0.05" />
      </TresMesh>

      <!-- Racket placeholder (simple frame) -->
      <TresGroup :position="[-4.5, 0.35, -1.8]" :rotation="[0, 0.4, -0.15]">
        <TresMesh cast-shadow>
          <TresTorusGeometry :args="[0.28, 0.025, 12, 32]" />
          <TresMeshStandardMaterial color="#1c1917" :metalness="0.3" :roughness="0.5" />
        </TresMesh>
        <TresMesh :position="[0, -0.35, 0]" cast-shadow>
          <TresCylinderGeometry :args="[0.03, 0.04, 0.5, 12]" />
          <TresMeshStandardMaterial color="#292524" :roughness="0.6" />
        </TresMesh>
      </TresGroup>
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
