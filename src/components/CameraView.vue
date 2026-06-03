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
  landmarks,
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

  // Dibujar posición del rostro (mirado horizontalmente para que coincida con el video espejado)
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
      // Factor de contraste (mayor a 1 aumenta el contraste, en este caso 2.0 es el doble)
      const factor = 2.0;
      for (let i = 0; i < max; i += 4) {
        // Fórmula: factor * (color - 128) + 128
        // El Uint8ClampedArray se encarga de que no baje de 0 ni pase de 255
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
      const niveles = 4; // Entre más bajo, menos colores
      const factor = 255 / (niveles - 1);
      for (let i = 0; i < max; i += 4) {
        data[i] = Math.round(data[i] / factor) * factor;
        data[i + 1] = Math.round(data[i + 1] / factor) * factor;
        data[i + 2] = Math.round(data[i + 2] / factor) * factor;
      }
    } else if (props.filterType === "red-channel") {
      // 3. EXTRACCIÓN DE CANAL ROJO
      for (let i = 0; i < max; i += 4) {
        // data[i] (Rojo) se queda igual
        data[i + 1] = 0; // Apagamos el Verde
        data[i + 2] = 0; // Apagamos el Azul
      }
    }
    // ----- NUEVOS FILTROS DE CONVOLUCIÓN (Matrices 3x3) -----
    else {
      // Definimos nuestras matrices de kernel (3x3 aplanadas)
      const kernels: Record<string, number[]> = {
        edge: [
          // Detección de bordes (Laplaciano)
          0, -1, 0, -1, 4, -1, 0, -1, 0,
        ],
        sharpen: [
          // Realce / Enfoque
          0, -1, 0, -1, 5, -1, 0, -1, 0,
        ],
        emboss: [
          // Relieve
          -2, -1, 0, -1, 1, 1, 0, 1, 2,
        ],
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
        //currentKernel props.filterType.split(",").map((c) => parseInt(c));
      }
      if (currentKernel) {
        // Hacemos una copia de los datos originales para leer de ahí
        const tempData = new Uint8ClampedArray(data);
        const w = canvasWidth;
        const h = canvasHeight;

        // Compensación de luminosidad (para el relieve, para que no se vea negro)
        const offset = props.filterType === "emboss" ? 128 : 0;

        // Saltamos los bordes extremos 1 píxel (y=1 a h-1) por rendimiento
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const dstOff = (y * w + x) * 4;
            let r = 0,
              g = 0,
              b = 0;

            // Recorremos los 9 píxeles (matriz 3x3)
            for (let cy = -1; cy <= 1; cy++) {
              for (let cx = -1; cx <= 1; cx++) {
                const srcOff = ((y + cy) * w + (x + cx)) * 4;
                const wt = currentKernel[(cy + 1) * 3 + (cx + 1)];

                r += tempData[srcOff] * wt;
                g += tempData[srcOff + 1] * wt;
                b += tempData[srcOff + 2] * wt;
              }
            }

            // Aplicamos valores y sumamos el offset
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
  <div class="camera-view">
    <div class="camera-view__trackbars">
      <div class="trackbar">
        <label>Opacidad de video</label>
        <input type="range" min="0.0" max="1.0" step="0.1" v-model="track1" />
        <span class="trackbar__value">{{ track1 }}</span>
      </div>
      <div class="trackbar">
        <label>Opacidad de filtros</label>
        <input type="range" min="0.0" max="1.0" step="0.1" v-model="track2" />
        <span class="trackbar__value">{{ track2 }}</span>
      </div>
      <div class="trackbar">
        <label>Opacidad de deteccion</label>
        <input type="range" min="0.0" max="1.0" step="0.1" v-model="track3" />
        <span class="trackbar__value">{{ track3 }}</span>
      </div>
    </div>
    <video
      ref="videoEl"
      class="camera-view__video"
      autoplay
      muted
      playsinline
      :style="{ opacity: track1 }"
    />
    <canvas
      ref="canvasEl"
      class="camera-view__canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ opacity: track2 }"
    />
    <canvas
      ref="canvasDecEl"
      class="camera-view__decCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ opacity: track3 }"
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

.camera-view__video {
  inset: 0;
  position: absolute;
  object-fit: cover;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
}

.camera-view__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.camera-view__decCanvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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

.camera-view__trackbars {
  position: absolute;
  top: 20%;
  left: 3%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.trackbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.trackbar label {
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.trackbar__value {
  color: #4ade80;
  font-size: 14px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

.trackbar input[type="range"] {
  -webkit-appearance: none;
  width: 150px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.trackbar input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4ade80;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.trackbar input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.8);
}
</style>
