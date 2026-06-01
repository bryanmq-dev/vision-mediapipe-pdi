// src/composables/useHandTracking.ts
import { ref, shallowRef } from "vue";

// Índices de landmarks importantes
export const LANDMARKS = {
  WRIST: 0,
  INDEX_TIP: 8, 
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_TIP: 20,
  THUMB_TIP: 4,
} as const;

export interface FingerPosition {
  x: number; 
  y: number; 
  xNorm: number; 
  yNorm: number; 
  xF: number;
  yF: number;
}

export function useHandTracking() {
  const hands = shallowRef<Hands | null>(null);
  const indexFingerPos = ref<FingerPosition | null>(null);
  const handsDetected = ref(false);
  const landmarks = ref<NormalizedLandmark[][]>([]);

  async function initHands() {
    const instance = new Hands({
      locateFile: (file) => {
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
      const detectedLandmarks = results.multiHandLandmarks ?? [];
      landmarks.value = detectedLandmarks;

      if (detectedLandmarks.length > 0) {
        handsDetected.value = true;
        const indexTip = detectedLandmarks[0][LANDMARKS.INDEX_TIP];

        const mirroredX = 1 - indexTip.x;

        indexFingerPos.value = {
          x: mirroredX * window.innerWidth,
          xF: mirroredX * 854,
          y: indexTip.y * window.innerHeight,
          yF: indexTip.y * 480,
          xNorm: mirroredX,
          yNorm: indexTip.y,
        };
      } else {
        handsDetected.value = false;
        indexFingerPos.value = null;
      }
    });

    hands.value = instance;

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
