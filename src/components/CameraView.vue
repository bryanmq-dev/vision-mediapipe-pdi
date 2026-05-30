<!-- src/components/CameraView.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from "vue";
import { useCamera } from "./composables/useCamera";
import { useHandTracking } from "./composables/useHandTracking";
import { useFaceMesh } from "./composables/useFaceMesh";
import { useHoverClick } from "./composables/useHoverClick";

const videoEl = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const canvasDetectedFaceEl = ref<HTMLCanvasElement | null>;
const canvasWidth = 1920;
const canvasHeight = 1080;

const { startCamera, stopCamera } = useCamera();
const {
  initHands,
  sendFrame: sendHands,
  destroy: destroyHands,
  indexFingerPos,
  handsDetected,
  landmarks,
} = useHandTracking();
const {
  initFaceMesh,
  sendFrame: sendFace,
  destroy: destroyFace,
  faceDetected,
} = useFaceMesh();
const { hoverState, registerElement, unregisterElement, tick } =
  useHoverClick(indexFingerPos);

provide("registerHoverElement", registerElement);
provide("unregisterHoverElement", unregisterElement);
provide("hoverState", hoverState);

async function onFrame() {
  if (!videoEl.value) return;

  await sendHands(videoEl.value);
  await sendFace(videoEl.value);

  tick();

  drawOverlay();
}

function drawOverlay() {
  const canvas = canvasEl.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Dibujar punto del dedo índice
  if (indexFingerPos.value) {
    const { x, y } = indexFingerPos.value;

    // Cursor principal
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(74, 222, 128, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Punto central
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
}

onMounted(async () => {
  if (!videoEl.value) return;

  await initHands();
  await initFaceMesh();

  await startCamera(videoEl.value, onFrame);
});

onUnmounted(() => {
  stopCamera();
  destroyHands();
  destroyFace();
});
</script>

<template>
  <div class="camera-view">
    <video
      ref="videoEl"
      class="camera-view__video"
      autoplay
      muted
      playsinline
    />
    <canvas
      ref="canvasEl"
      class="camera-view__canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    />

    <!-- Indicadores de estado -->
    <div class="status-bar">
      <span :class="['status-dot', { active: handsDetected }]" />
      Manos: {{ handsDetected ? "✅" : "❌" }}
      &nbsp;&nbsp;
      <span :class="['status-dot', { active: faceDetected }]" />
      Rostro: {{ faceDetected ? "✅" : "❌" }}
    </div>

    <!-- Slot para el contenido interactivo encima del video -->
    <div class="camera-view__overlay">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.camera-view {
  position: relative;
  width: 99vw;
  height: 99vh;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Video espejado para que sea intuitivo */
.camera-view__video {
  inset: 0;
  width: 90%;
  height: 90%;
  object-fit: cover;
  transform: scaleX(-1);
  opacity: 0.6;
}

.camera-view__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.camera-view__overlay {
  position: absolute;
  padding: 20px;
  inset: 0;
  pointer-events: none;
}

.status-bar {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(14, 12, 12, 0.6);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(8px);
}
</style>
