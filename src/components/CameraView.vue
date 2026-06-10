<!-- src/components/CameraView.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from "vue";
import { useCamera } from "./composables/useCamera";
import { useHandTracking } from "./composables/useHandTracking";
import { useFaceMesh } from "./composables/useFaceMesh";
import { useHoverClick } from "./composables/useHoverClick";

const videoEl = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const canvasDecEl = ref<HTMLCanvasElement | null>(null);
const canvasWidth = 854;
const canvasHeight = 480;

const { startCamera, stopCamera } = useCamera();
const {
  initHands,
  sendFrame: sendHands,
  destroy: destroyHands,
  indexFingerPos,
  handsDetected,
} = useHandTracking();

const {
  initFaceMesh,
  sendFrame: sendFace,
  destroy: destroyFace,
  faceDetected,
  facePosition,
} = useFaceMesh();

const { hoverState, registerElement, unregisterElement, tick } =
  useHoverClick(indexFingerPos);

const props = defineProps({
  filterType: {
    type: String,
    default: "none",
  },
});

provide("registerHoverElement", registerElement);
provide("unregisterHoverElement", unregisterElement);
provide("hoverState", hoverState);
provide("handsDetected", handsDetected);
provide("faceDetected", faceDetected);

async function onFrame() {
  if (!videoEl.value) return;

  await sendHands(videoEl.value);
  await sendFace(videoEl.value);

  tick();

  drawDetection();
  drawOverlay();
}

function drawDetection() {
  const canvas = canvasDecEl.value;
  const ctx = canvas?.getContext("2d", { willReadFrequently: true });
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvasWidth, 0);
  ctx.rect(0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  // Dibujar punto del dedo índice
  if (indexFingerPos.value) {
    const { xF, yF } = indexFingerPos.value;

    // Cursor principal
    ctx.beginPath();
    ctx.arc(xF, yF, 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(74, 222, 128, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Punto central
    ctx.beginPath();
    ctx.arc(xF, yF, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  // Dibujar rostro
  if (facePosition.value) {
    const { x, y } = facePosition.value;

    const mirroredX = 1 - x;
    // Cursor principal
    ctx.beginPath();
    ctx.rect(mirroredX * canvasWidth - 100, y * canvasHeight - 100, 150, 150);
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

function drawOverlay() {
  const canvas = canvasEl.value;
  const ctx = canvas?.getContext("2d", { willReadFrequently: true });
  const video = videoEl.value;
  if (!canvas || !ctx || !video) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvasWidth, 0);
  ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  if (props.filterType !== "none") {
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    const max = data.length;

    // ----- FILTROS EXISTENTES (Puntos individuales) -----
    if (props.filterType === "grayscale") {
      for (let i = 0; i < max; i += 4) {
        const gray =
          (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
    } else if (props.filterType === "invert") {
      for (let i = 0; i < max; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    } else if (props.filterType === "sepia") {
      for (let i = 0; i < max; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        data[i] = r * 0.393 + g * 0.769 + b * 0.189;
        data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
        data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
      }
    } else if (props.filterType === "contrast") {
      const factor = 2.0;
      for (let i = 0; i < max; i += 4) {
        data[i] = factor * (data[i] - 128) + 128; // R
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
      }
    } else if (props.filterType === "threshold") {
      // 1. BINARIZACIÓN
      const umbral = 127;
      for (let i = 0; i < max; i += 4) {
        const luminancia =
          (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
        const color = luminancia > umbral ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = color;
      }
    } else if (props.filterType === "posterize") {
      // 2. POSTERIZACIÓN
      const niveles = 4;
      const factor = 255 / (niveles - 1);
      for (let i = 0; i < max; i += 4) {
        data[i] = Math.round(data[i] / factor) * factor;
        data[i + 1] = Math.round(data[i + 1] / factor) * factor;
        data[i + 2] = Math.round(data[i + 2] / factor) * factor;
      }
    } else if (props.filterType === "red-channel") {
      // 3. EXTRACCIÓN DE CANAL ROJO
      for (let i = 0; i < max; i += 4) {
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    } else {
      const kernels: Record<string, number[]> = {
        edge: [0, -1, 0, -1, 4, -1, 0, -1, 0],
        emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
      };

      const kernel = kernels[props.filterType];
      let currentKernel;
      if (kernel) {
        currentKernel = kernel;
      } else {
        currentKernel = props.filterType
          .toString()
          .split(",")
          .map((c) => parseInt(c));
      }
      if (currentKernel) {
        const tempData = new Uint8ClampedArray(data);
        const w = canvasWidth;
        const h = canvasHeight;

        const offset = props.filterType === "emboss" ? 128 : 0;

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const dstOff = (y * w + x) * 4;
            let r = 0,
              g = 0,
              b = 0;

            for (let cy = -1; cy <= 1; cy++) {
              for (let cx = -1; cx <= 1; cx++) {
                const srcOff = ((y + cy) * w + (x + cx)) * 4;
                const wt = currentKernel[(cy + 1) * 3 + (cx + 1)];

                r += tempData[srcOff] * wt;
                g += tempData[srcOff + 1] * wt;
                b += tempData[srcOff + 2] * wt;
              }
            }

            data[dstOff] = r + offset;
            data[dstOff + 1] = g + offset;
            data[dstOff + 2] = b + offset;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
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

const track1 = ref(1);
const track2 = ref(1);
const track3 = ref(1);
</script>

<template>
  <div
    class="relative w-[99vw] h-[99vh] overflow-hidden bg-black flex items-center justify-center"
  >
    <!-- Trackbars -->
    <div
      class="absolute top-8 right-8 z-50 flex flex-col gap-5 bg-black/30 p-6 rounded-2xl border border-white/10"
    >
      <div class="flex flex-col items-center gap-3">
        <label
          class="text-white/80 text-xs font-semibold uppercase tracking-wider"
          >Opacidad filtros</label
        >
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.1"
          v-model="track2"
          class="w-36 h-1.5 rounded-full bg-white/20 appearance-none cursor-pointer accent-green-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(74,222,128,0.5)] [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_rgba(74,222,128,0.8)]"
        />
        <span class="text-green-400 text-sm font-bold min-w-8 text-center">{{
          track2
        }}</span>
      </div>
      <div class="flex flex-col items-center gap-3">
        <label
          class="text-white/80 text-xs font-semibold uppercase tracking-wider"
          >Opacidad deteccion</label
        >
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.1"
          v-model="track3"
          class="w-36 h-1.5 rounded-full bg-white/20 appearance-none cursor-pointer accent-green-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(74,222,128,0.5)] [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_rgba(74,222,128,0.8)]"
        />
        <span class="text-green-400 text-sm font-bold min-w-8 text-center">{{
          track3
        }}</span>
      </div>
    </div>

    <!-- Video layer -->
    <video
      ref="videoEl"
      class="absolute inset-0 w-full h-full object-cover -scale-x-100"
      :style="{ opacity: track1 }"
      autoplay
      muted
      playsinline
    />

    <!-- Filter canvas layer -->
    <canvas
      ref="canvasEl"
      class="absolute inset-0 w-full h-full"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ opacity: track2 }"
    />

    <!-- Detection canvas layer -->
    <canvas
      ref="canvasDecEl"
      class="absolute inset-0 w-full h-full"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ opacity: track3 }"
    />

    <!-- Overlay slot -->
    <div class="absolute inset-0 p-5 pointer-events-none">
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
