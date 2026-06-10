import { ref } from "vue";

export function useCamera() {
  const videoRef = ref<HTMLVideoElement | null>(null);
  let camera: Camera | null = null;

  async function startCamera(
    videoEl: HTMLVideoElement,
    onFrame: () => Promise<void>,
  ) {
    try {
      camera = new Camera(videoEl, {
        onFrame,
        width: 1280,
        height: 720,
      });
      await camera.start();
    } catch (err: any) {
      console.log("Error");
      console.log(err);
    }
  }

  function stopCamera() {
    camera?.stop();
    camera = null;
  }

  return { videoRef, startCamera, stopCamera };
}
