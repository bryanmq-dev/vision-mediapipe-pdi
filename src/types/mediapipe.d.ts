// src/types/mediapipe.d.ts

// ─── Tipos compartidos ───────────────────────────────────────────────
interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

type NormalizedLandmarkList = NormalizedLandmark[];

interface Classification {
  index: number;
  score: number;
  label: string;
  displayName: string;
}

// ─── Hands ───────────────────────────────────────────────────────────
interface HandsResults {
  multiHandLandmarks: NormalizedLandmarkList[];
  multiHandedness: Classification[];
  image: HTMLVideoElement;
}

interface HandsOptions {
  maxNumHands?: number;
  modelComplexity?: 0 | 1;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

declare class Hands {
  constructor(config: { locateFile: (file: string) => string });
  setOptions(options: HandsOptions): void;
  onResults(callback: (results: HandsResults) => void): void;
  send(inputs: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

// ─── FaceMesh ────────────────────────────────────────────────────────
interface FaceMeshResults {
  multiFaceLandmarks: NormalizedLandmarkList[];
  image: HTMLVideoElement;
}

interface FaceMeshOptions {
  maxNumFaces?: number;
  refineLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

declare class FaceMesh {
  constructor(config: { locateFile: (file: string) => string });
  setOptions(options: FaceMeshOptions): void;
  onResults(callback: (results: FaceMeshResults) => void): void;
  send(inputs: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

// ─── Camera ──────────────────────────────────────────────────────────
interface CameraConfig {
  onFrame: () => Promise<void>;
  width?: number;
  height?: number;
}

declare class Camera {
  constructor(videoElement: HTMLVideoElement, config: CameraConfig);
  start(): Promise<void>;
  stop(): void;
}
