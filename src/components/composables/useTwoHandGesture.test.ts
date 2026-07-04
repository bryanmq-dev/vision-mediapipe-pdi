import { test } from "node:test";
import assert from "node:assert";
import {
  centroid,
  distanceBetween,
  angleBetween,
} from "./useTwoHandGesture.ts";

function landmarks(x: number, y: number): NormalizedLandmark[] {
  return [{ x, y, z: 0 }];
}

test("centroid averages landmark positions", () => {
  const points: NormalizedLandmark[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
  ];
  assert.deepStrictEqual(centroid(points), { x: 0.5, y: 0.5 });
});

test("distanceBetween measures euclidean distance", () => {
  const a = centroid(landmarks(0, 0));
  const b = centroid(landmarks(3, 4));
  assert.strictEqual(distanceBetween(a, b), 5);
});

test("angleBetween measures the angle of the vector between two points", () => {
  const a = centroid(landmarks(0, 0));
  const b = centroid(landmarks(1, 0));
  assert.strictEqual(angleBetween(a, b), 0);
});
