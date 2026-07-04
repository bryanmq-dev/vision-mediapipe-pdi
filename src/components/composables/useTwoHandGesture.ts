// src/components/composables/useTwoHandGesture.ts
import { watch, type Ref } from "vue";

interface Point2D {
  x: number;
  y: number;
}

const PINCH_DEADZONE = 0.002;
const ROTATE_DEADZONE_RAD = 0.02;
const SCREENSHOT_TOGETHER_THRESHOLD = 0.08;
const SCREENSHOT_APART_THRESHOLD = 0.16;
const SCREENSHOT_COOLDOWN_MS = 1500;

export function centroid(landmarks: NormalizedLandmark[]): Point2D {
  let sx = 0;
  let sy = 0;
  for (const p of landmarks) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / landmarks.length, y: sy / landmarks.length };
}

export function distanceBetween(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function angleBetween(a: Point2D, b: Point2D): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function wrapAngleDelta(delta: number): number {
  if (delta > Math.PI) return delta - 2 * Math.PI;
  if (delta < -Math.PI) return delta + 2 * Math.PI;
  return delta;
}

interface UseTwoHandGestureOptions {
  landmarks: Ref<NormalizedLandmark[][]>;
  mode: Ref<"zoom" | "camera">;
  onZoomDelta?: (deltaDistanceNorm: number) => void;
  onRotateDelta?: (deltaAngleRad: number) => void;
  onScreenshotGesture?: () => void;
}

export function useTwoHandGesture(options: UseTwoHandGestureOptions) {
  let prevDistance: number | null = null;
  let prevAngle: number | null = null;
  let screenshotArmed = false;
  let cooldownUntil = 0;

  watch(options.landmarks, (hands) => {
    if (hands.length < 2) {
      prevDistance = null;
      prevAngle = null;
      return;
    }

    const c0 = centroid(hands[0]);
    const c1 = centroid(hands[1]);
    const distance = distanceBetween(c0, c1);
    const angle = angleBetween(c0, c1);

    if (options.mode.value === "zoom") {
      if (prevDistance !== null) {
        const delta = distance - prevDistance;
        if (Math.abs(delta) > PINCH_DEADZONE) options.onZoomDelta?.(delta);
      }
      if (prevAngle !== null) {
        const deltaAngle = wrapAngleDelta(angle - prevAngle);
        if (Math.abs(deltaAngle) > ROTATE_DEADZONE_RAD) {
          options.onRotateDelta?.(deltaAngle);
        }
      }
    } else {
      // Modo cámara: reconocedor discreto, con cooldown. El gesto de
      // "juntar" queda inerte a propósito: solo separar dispara la captura.
      const now = Date.now();
      if (now >= cooldownUntil) {
        if (distance < SCREENSHOT_TOGETHER_THRESHOLD) {
          screenshotArmed = true;
        } else if (screenshotArmed && distance > SCREENSHOT_APART_THRESHOLD) {
          options.onScreenshotGesture?.();
          screenshotArmed = false;
          cooldownUntil = now + SCREENSHOT_COOLDOWN_MS;
        }
      }
    }

    prevDistance = distance;
    prevAngle = angle;
  });
}
