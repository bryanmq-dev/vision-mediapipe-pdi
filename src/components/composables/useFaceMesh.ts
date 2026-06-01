// src/composables/useFaceMesh.ts
import { ref, shallowRef } from "vue";

export interface FacePosition {
  x: number; // px en canvas
  y: number; // px en canvas
}

export function useFaceMesh() {
  const faceMesh = shallowRef<FaceMesh | null>(null);
  const faceDetected = ref(false);
  const faceLandmarks = ref<any[][]>([]);
  const facePosition = ref<FacePosition | null>(null);

  async function initFaceMesh() {
    const instance = new FaceMesh({
      locateFile: (file) => {
        // Solución al conflicto con Hands: MediaPipe puede mezclar las llamadas a locateFile
        // cuando se usan múltiples modelos, así que enrutamos correctamente por el nombre del archivo.
        if (file.includes("hands")) {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    instance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    instance.onResults((results: FaceMeshResults) => {
      // ← FaceMeshResults
      faceLandmarks.value = results.multiFaceLandmarks ?? [];
      faceDetected.value = faceLandmarks.value.length > 0;

      facePosition.value = {
        x: faceLandmarks.value[0]?.[0]["x"],
        y: faceLandmarks.value[0]?.[0]["y"],
      };
    });

    faceMesh.value = instance;

    // Forzar inicialización.
    await instance.initialize();
  }

  async function sendFrame(videoEl: HTMLVideoElement) {
    await faceMesh.value?.send({ image: videoEl });
  }

  function destroy() {
    faceMesh.value?.close();
    faceMesh.value = null;
  }

  return {
    initFaceMesh,
    sendFrame,
    destroy,
    faceDetected,
    faceLandmarks,
    facePosition,
  };
}
