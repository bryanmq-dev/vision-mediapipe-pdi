// src/composables/useHandTracking.ts
import { ref, shallowRef } from "vue";

// Índices de landmarks importantes
export const LANDMARKS = {
  WRIST: 0,
  INDEX_TIP: 8, // ← el que usaremos para hover
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_TIP: 20,
  THUMB_TIP: 4,
} as const;

export interface FingerPosition {
  x: number; // px en canvas
  y: number; // px en canvas
  xNorm: number; // 0-1
  yNorm: number; // 0-1
}

export function useHandTracking() {
  const hands = shallowRef<Hands | null>(null);
  const indexFingerPos = ref<FingerPosition | null>(null);
  const handsDetected = ref(false);
  const landmarks = ref<NormalizedLandmark[][]>([]);

  async function initHands() {
    const instance = new Hands({
      locateFile: (file) => {
        // Solución al conflicto con FaceMesh: MediaPipe sobreescribe locateFile globalmente,
        // así que debemos asegurarnos de devolver la URL correcta según el archivo.
        if (file.includes("face_mesh")) {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    instance.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    instance.onResults((results: HandsResults) => {
      // ← HandsResults (nuestro tipo global)
      const detectedLandmarks = results.multiHandLandmarks ?? [];
      landmarks.value = detectedLandmarks;

      if (detectedLandmarks.length > 0) {
        handsDetected.value = true;
        const indexTip = detectedLandmarks[0][LANDMARKS.INDEX_TIP];

        // Invertimos el eje X (1 - x) para hacer el efecto "espejo" (selfie mode).
        // Esto sincroniza el movimiento de la mano con el transform: scaleX(-1) del video en CSS.
        const mirroredX = 1 - indexTip.x;

        // Guardamos las normativas y calculamos aproximados en px (dependerá de tu canvas/video real)
        indexFingerPos.value = {
          x: mirroredX * window.innerWidth,
          y: indexTip.y * window.innerHeight,
          xNorm: mirroredX,
          yNorm: indexTip.y,
        };

        console.log(
          "🖐️ Dedo detectado ->",
          `Norm(x:${mirroredX.toFixed(2)}, y:${indexTip.y.toFixed(2)})`,
        );
      } else {
        if (handsDetected.value === true) {
          console.log("🖐️ Mano perdida de vista");
        }
        handsDetected.value = false;
        indexFingerPos.value = null;
      }
    });

    // ¡CRÍTICO! Guardar la instancia para que `sendFrame` pueda usarla
    hands.value = instance;

    // Forzar la inicialización de los archivos WASM para poder esperar y que no colisionen luego.
    await instance.initialize();
  }

  async function sendFrame(videoEl: HTMLVideoElement) {
    await hands.value?.send({ image: videoEl });
  }

  function destroy() {
    hands.value?.close();
    hands.value = null;
  }

  return {
    initHands,
    sendFrame,
    destroy,
    indexFingerPos,
    handsDetected,
    landmarks,
  };
}
