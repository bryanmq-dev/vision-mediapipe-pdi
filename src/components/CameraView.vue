<!-- src/components/CameraView.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, provide } from "vue";
import { useCamera } from "./composables/useCamera";
import { useHandTracking } from "./composables/useHandTracking";
import { useFaceMesh } from "./composables/useFaceMesh";
import { useHoverClick } from "./composables/useHoverClick";
import { useTwoHandGesture } from "./composables/useTwoHandGesture";
import DetectionStatus from "./DetectionStatus.vue";
import FileBrowserModal from "./FileBrowserModal.vue";
import DocumentViewer from "./DocumentViewer.vue";

const videoEl = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const canvasDecEl = ref<HTMLCanvasElement | null>(null);
const canvasWidth = 854;
const canvasHeight = 480;

const track1 = ref(1);
const track2 = ref(1);
const track3 = ref(1);

const MIN_DOC_SCALE = 0.3;
const MAX_DOC_SCALE = 3;
const MIN_CAM_ZOOM = 1;
const MAX_CAM_ZOOM = 3;
const ZOOM_SENSITIVITY = 4;
const CAM_ZOOM_SENSITIVITY = 6;
const SCREENSHOT_FLASH_MS = 50;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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

const {
  hoverState,
  registerElement,
  unregisterElement,
  registerDragElement,
  unregisterDragElement,
  tick,
} = useHoverClick(indexFingerPos);

const props = defineProps({
  filterType: {
    type: String,
    default: "none",
  },
});

// ----- Estado transversal (sidebar, interacción, modo, documento) -----
const mode = ref<"zoom" | "camera">("zoom");
const activeSection = ref<"filtros" | "interaccion">("filtros");
const fileLoaded = ref(false);
const fileUrl = ref("");
const fileType = ref<"image" | "pdf">("image");
const docTransform = reactive({
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotateDeg: 0,
});
const zoomFactor = ref(1);
const showFileBrowser = ref(false);
const flashActive = ref(false);
const screenshotDelaySeconds = ref(3);
const countdownValue = ref<number | null>(null);

function onSelectFile(payload: { url: string; type: "image" | "pdf" }) {
  fileUrl.value = payload.url;
  fileType.value = payload.type;
  fileLoaded.value = true;
  showFileBrowser.value = false;
  docTransform.translateX = 0;
  docTransform.translateY = 0;
  docTransform.scale = 1;
  docTransform.rotateDeg = 0;
}

function closeFile() {
  fileLoaded.value = false;
  fileUrl.value = "";
}

function openFileBrowser() {
  showFileBrowser.value = true;
}

function resetZoom() {
  zoomFactor.value = 1;
}

function triggerScreenshotFlash() {
  flashActive.value = true;
  setTimeout(() => {
    flashActive.value = false;
  }, SCREENSHOT_FLASH_MS);
}

function onZoomDelta(delta: number) {
  if (fileLoaded.value) {
    docTransform.scale = clamp(
      docTransform.scale + delta * ZOOM_SENSITIVITY,
      MIN_DOC_SCALE,
      MAX_DOC_SCALE,
    );
  } else {
    zoomFactor.value = clamp(
      zoomFactor.value + delta * CAM_ZOOM_SENSITIVITY,
      MIN_CAM_ZOOM,
      MAX_CAM_ZOOM,
    );
  }
}

function onRotateDelta(deltaRad: number) {
  if (fileLoaded.value) {
    docTransform.rotateDeg += deltaRad * (180 / Math.PI);
  }
}

function takeScreenshot() {
  // Primero se captura (mientras la pantalla muestra el contenido real) y
  // solo después se dispara el flash — si no, el flash blanco queda en la
  // propia captura.
  fetch("/api/screenshot", { method: "POST" })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      console.log("Screenshot guardado en:", data.path);
      triggerScreenshotFlash();
    })
    .catch((err) => console.error("Screenshot failed:", err));
}

function onScreenshotGesture() {
  if (countdownValue.value !== null) return; // ya hay una cuenta regresiva activa

  const delay = Math.max(0, Math.round(screenshotDelaySeconds.value));
  if (delay === 0) {
    takeScreenshot();
    return;
  }

  countdownValue.value = delay;
  const interval = setInterval(() => {
    if (countdownValue.value === null) return;
    countdownValue.value -= 1;
    if (countdownValue.value <= 0) {
      clearInterval(interval);
      countdownValue.value = null;
      takeScreenshot();
    }
  }, 1000);
}

useTwoHandGesture({
  landmarks,
  mode,
  onZoomDelta,
  onRotateDelta,
  onScreenshotGesture,
});

provide("registerHoverElement", registerElement);
provide("unregisterHoverElement", unregisterElement);
provide("registerDragElement", registerDragElement);
provide("unregisterDragElement", unregisterDragElement);
provide("hoverState", hoverState);
provide("handsDetected", handsDetected);
provide("faceDetected", faceDetected);
provide("landmarks", landmarks);
provide("mode", mode);
provide("activeSection", activeSection);
provide("fileLoaded", fileLoaded);
provide("openFileBrowser", openFileBrowser);
provide("closeFile", closeFile);
provide("resetZoom", resetZoom);
provide("screenshotDelaySeconds", screenshotDelaySeconds);

async function onFrame() {
  if (!videoEl.value) return;

  await sendHands(videoEl.value);
  await sendFace(videoEl.value);

  // Una excepción aquí no debe tumbar el loop de la cámara (que depende de
  // que este callback siga resolviendo cada frame).
  try {
    tick();
    drawDetection();
    drawOverlay();
  } catch (err) {
    console.error("Error procesando el frame:", err);
  }
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

  // Zoom digital de cámara: recorte centrado escalado por zoomFactor.
  // En 1 (sin archivo cargado y sin gesto de zoom) es idéntico al dibujo
  // de frame completo de siempre.
  const sw = video.videoWidth / zoomFactor.value;
  const sh = video.videoHeight / zoomFactor.value;
  const sx = (video.videoWidth - sw) / 2;
  const sy = (video.videoHeight - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);
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

      const currentKernel = kernels[props.filterType];
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
</script>

<template>
  <div
    class="relative w-[99vw] h-[99vh] overflow-hidden bg-black flex items-center justify-center"
  >
    <!-- Trackbar de opacidad de detección -->
    <div
      class="absolute top-8 right-8 z-50 flex flex-col gap-5 bg-black/30 p-6 rounded-2xl border border-white/10"
    >
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

    <!-- Estado de detección: global, visible en todas las secciones -->
    <DetectionStatus />

    <!-- Explorador de archivos flotante -->
    <FileBrowserModal
      :visible="showFileBrowser"
      @close="showFileBrowser = false"
      @select-file="onSelectFile"
    />

    <!-- Documento/imagen flotante -->
    <DocumentViewer
      v-if="fileLoaded"
      :file-url="fileUrl"
      :file-type="fileType"
      :transform="docTransform"
      @update:translate="
        (pos) => {
          docTransform.translateX = pos.x;
          docTransform.translateY = pos.y;
        }
      "
      @close="closeFile"
    />

    <!-- Cuenta regresiva antes de la captura en modo cámara -->
    <div
      v-if="countdownValue !== null"
      class="absolute inset-0 flex items-center justify-center z-[90] pointer-events-none"
    >
      <span class="text-white text-9xl font-bold drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">{{
        countdownValue
      }}</span>
    </div>

    <!-- Flash de captura de pantalla -->
    <div
      v-show="flashActive"
      class="absolute inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-75"
      :class="flashActive ? 'opacity-100' : 'opacity-0'"
    />

    <!-- Overlay slot (sidebar) -->
    <div class="absolute inset-0 p-5 pointer-events-none">
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
