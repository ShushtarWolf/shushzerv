<script setup lang="ts">
import { lerp, easeInOutCubic, easeOutCubic } from '~/composables/useScrollProgress'

const props = defineProps<{
  progress: number
}>()

const groupRotationY = computed(() => {
  const t = props.progress
  const rotatePhase = easeInOutCubic(Math.min(t / 0.55, 1))
  const zoomPhase = easeOutCubic(Math.max(0, (t - 0.25) / 0.75))
  return lerp(0.55, 0.05, rotatePhase) + lerp(0, Math.PI * 0.15, zoomPhase)
})

const groupScale = computed(() => {
  const convergePhase = easeInOutCubic(Math.max(0, (props.progress - 0.55) / 0.45))
  return lerp(1, 0.15, convergePhase)
})

const converge = computed(() => easeInOutCubic(Math.max(0, (props.progress - 0.55) / 0.45)))
const sceneOpacity = computed(() => lerp(1, 0, Math.max(0, (props.progress - 0.78) / 0.22)))

const cameraPosition = computed<[number, number, number]>(() => {
  const t = props.progress
  const zoomPhase = easeOutCubic(Math.max(0, (t - 0.25) / 0.75))
  const camDist = lerp(14, 3.2, zoomPhase)
  const camHeight = lerp(7, 11, zoomPhase)
  const camAngle = lerp(0.7, 0.02, zoomPhase)
  return [
    Math.sin(camAngle) * camDist,
    camHeight,
    Math.cos(camAngle) * camDist,
  ]
})

const floorPos = computed<[number, number, number]>(() => [
  0,
  lerp(0, 0.3, converge.value),
  0,
])
const floorScale = computed<[number, number, number]>(() => [
  lerp(1, 0.2, converge.value),
  1,
  lerp(1, 0.2, converge.value),
])
const floorOpacity = computed(() => lerp(1, 0.2, converge.value) * sceneOpacity.value)

const wallOpacity = computed(() => lerp(0.55, 0.1, converge.value) * sceneOpacity.value)
const wallScale = computed(() => lerp(1, 0.08, converge.value))

const wallBackPos = computed<[number, number, number]>(() => [
  0,
  lerp(1.5, 0.4, converge.value),
  lerp(-2.5, 0, converge.value),
])
const wallFrontPos = computed<[number, number, number]>(() => [
  0,
  lerp(1.5, 0.4, converge.value),
  lerp(2.5, 0, converge.value),
])
const wallLeftPos = computed<[number, number, number]>(() => [
  lerp(-5, 0, converge.value),
  lerp(1.5, 0.4, converge.value),
  0,
])
const wallRightPos = computed<[number, number, number]>(() => [
  lerp(5, 0, converge.value),
  lerp(1.5, 0.4, converge.value),
  0,
])

const netPos = computed<[number, number, number]>(() => [
  0,
  lerp(1.1, 0.35, converge.value),
  0,
])
const netScale = computed(() => lerp(1, 0.1, converge.value))
const netOpacity = computed(() => lerp(1, 0.3, converge.value) * sceneOpacity.value)

const postPositions = computed<[number, number, number][]>(() => {
  const pull = converge.value
  return [
    [lerp(-4.8, 0, pull), lerp(1.5, 0.3, pull), lerp(-2.4, 0, pull)],
    [lerp(4.8, 0, pull), lerp(1.5, 0.3, pull), lerp(-2.4, 0, pull)],
    [lerp(-4.8, 0, pull), lerp(1.5, 0.3, pull), lerp(2.4, 0, pull)],
    [lerp(4.8, 0, pull), lerp(1.5, 0.3, pull), lerp(2.4, 0, pull)],
  ]
})

const lineOpacity = computed(() => 0.9 * sceneOpacity.value)

const cameraLookAt = computed<[number, number, number]>(() => [
  0,
  lerp(0, 0.5, converge.value),
  0,
])
</script>

<template>
  <TresCanvas
    class="pitch-canvas"
    :alpha="true"
    :clear-color="0x000000"
    :clear-alpha="0"
  >
    <TresPerspectiveCamera
      :position="cameraPosition"
      :fov="42"
      :near="0.1"
      :far="100"
      :look-at="cameraLookAt"
    />

    <TresAmbientLight :intensity="0.35" />
    <TresDirectionalLight :position="[8, 14, 6]" :intensity="1.4" color="#e8f0ff" />
    <TresDirectionalLight :position="[-6, 8, -4]" :intensity="0.45" color="#4a90d9" />
    <TresSpotLight
      :position="[0, 16, 0]"
      :intensity="0.8"
      :angle="0.5"
      :penumbra="0.6"
      color="#ffffff"
    />

    <TresGroup :rotation-y="groupRotationY" :scale="[groupScale, groupScale, groupScale]">
      <TresMesh :position="floorPos" :scale="floorScale">
        <TresBoxGeometry :args="[10, 0.12, 5]" />
        <TresMeshStandardMaterial
          color="#1e4d8c"
          :metalness="0.15"
          :roughness="0.55"
          :transparent="true"
          :opacity="floorOpacity"
        />
      </TresMesh>

      <TresMesh :position="[0, 0.07, 0]">
        <TresBoxGeometry :args="[0.06, 0.02, 5]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="lineOpacity" />
      </TresMesh>
      <TresMesh :position="[0, 0.07, 0]">
        <TresBoxGeometry :args="[10, 0.02, 0.06]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="lineOpacity" />
      </TresMesh>
      <TresMesh :position="[0, 0.07, -1.25]">
        <TresBoxGeometry :args="[10, 0.02, 0.04]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="lineOpacity * 0.78" />
      </TresMesh>
      <TresMesh :position="[0, 0.07, 1.25]">
        <TresBoxGeometry :args="[10, 0.02, 0.04]" />
        <TresMeshStandardMaterial color="#f8fafc" :transparent="true" :opacity="lineOpacity * 0.78" />
      </TresMesh>

      <TresMesh :position="wallBackPos" :scale="[wallScale, wallScale, wallScale]">
        <TresBoxGeometry :args="[10.2, 3, 0.08]" />
        <TresMeshPhysicalMaterial
          color="#a8d4ff"
          :metalness="0.1"
          :roughness="0.05"
          :transmission="0.72"
          :transparent="true"
          :opacity="wallOpacity"
        />
      </TresMesh>
      <TresMesh :position="wallFrontPos" :scale="[wallScale, wallScale, wallScale]">
        <TresBoxGeometry :args="[10.2, 3, 0.08]" />
        <TresMeshPhysicalMaterial
          color="#a8d4ff"
          :metalness="0.1"
          :roughness="0.05"
          :transmission="0.72"
          :transparent="true"
          :opacity="wallOpacity"
        />
      </TresMesh>
      <TresMesh :position="wallLeftPos" :scale="[wallScale, wallScale, wallScale]">
        <TresBoxGeometry :args="[0.08, 3, 5.2]" />
        <TresMeshPhysicalMaterial
          color="#a8d4ff"
          :metalness="0.1"
          :roughness="0.05"
          :transmission="0.72"
          :transparent="true"
          :opacity="wallOpacity"
        />
      </TresMesh>
      <TresMesh :position="wallRightPos" :scale="[wallScale, wallScale, wallScale]">
        <TresBoxGeometry :args="[0.08, 3, 5.2]" />
        <TresMeshPhysicalMaterial
          color="#a8d4ff"
          :metalness="0.1"
          :roughness="0.05"
          :transmission="0.72"
          :transparent="true"
          :opacity="wallOpacity"
        />
      </TresMesh>

      <TresMesh :position="[0, 2.6, -2.46]">
        <TresBoxGeometry :args="[10.2, 0.8, 0.04]" />
        <TresMeshStandardMaterial
          color="#8b9cb3"
          :metalness="0.85"
          :roughness="0.35"
          :transparent="true"
          :opacity="0.75 * sceneOpacity"
        />
      </TresMesh>
      <TresMesh :position="[0, 2.6, 2.46]">
        <TresBoxGeometry :args="[10.2, 0.8, 0.04]" />
        <TresMeshStandardMaterial
          color="#8b9cb3"
          :metalness="0.85"
          :roughness="0.35"
          :transparent="true"
          :opacity="0.75 * sceneOpacity"
        />
      </TresMesh>

      <TresGroup :position="netPos" :scale="[netScale, netScale, netScale]">
        <TresMesh :position="[0, 0.9, 0]">
          <TresBoxGeometry :args="[10, 1.8, 0.03]" />
          <TresMeshStandardMaterial
            color="#e2e8f0"
            :metalness="0.2"
            :roughness="0.8"
            :transparent="true"
            :opacity="0.35 * netOpacity"
          />
        </TresMesh>
        <TresMesh :position="[0, 0.05, 0]">
          <TresBoxGeometry :args="[10.1, 0.08, 0.06]" />
          <TresMeshStandardMaterial color="#f1f5f9" :transparent="true" :opacity="netOpacity" />
        </TresMesh>
        <TresMesh :position="[-4.95, 0.9, 0]">
          <TresBoxGeometry :args="[0.08, 1.8, 0.08]" />
          <TresMeshStandardMaterial color="#cbd5e1" :metalness="0.6" :roughness="0.4" />
        </TresMesh>
        <TresMesh :position="[4.95, 0.9, 0]">
          <TresBoxGeometry :args="[0.08, 1.8, 0.08]" />
          <TresMeshStandardMaterial color="#cbd5e1" :metalness="0.6" :roughness="0.4" />
        </TresMesh>
      </TresGroup>

      <TresMesh
        v-for="(pos, i) in postPositions"
        :key="`post-${i}`"
        :position="pos"
      >
        <TresBoxGeometry :args="[0.12, 3, 0.12]" />
        <TresMeshStandardMaterial
          color="#94a3b8"
          :metalness="0.9"
          :roughness="0.25"
          :transparent="true"
          :opacity="sceneOpacity"
        />
      </TresMesh>

      <TresMesh :position="[3.5, 0.25, 1.8]">
        <TresSphereGeometry :args="[0.14, 24, 24]" />
        <TresMeshStandardMaterial color="#c8ff00" :metalness="0.1" :roughness="0.4" />
      </TresMesh>
      <TresMesh :position="[3.2, 0.25, 1.95]">
        <TresSphereGeometry :args="[0.14, 24, 24]" />
        <TresMeshStandardMaterial color="#c8ff00" :metalness="0.1" :roughness="0.4" />
      </TresMesh>
    </TresGroup>
  </TresCanvas>
</template>

<style scoped>
.pitch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: pan-y;
}
</style>
