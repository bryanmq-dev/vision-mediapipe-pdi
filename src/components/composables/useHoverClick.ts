// src/composables/useHoverClick.ts
import { ref, type Ref } from "vue";

interface HoverState {
  elementId: string | null;
  startTime: number | null;
  progress: number; // 0-100
}

interface Point {
  x: number;
  y: number;
}

interface DragRegistration {
  onEngage?: (pos: Point) => void;
  onDrag: (pos: Point) => void;
  onRelease: (pos: Point) => void;
}

const HOVER_DURATION_MS = 1000;

export function useHoverClick(indexFingerPos: Ref<Point | null>) {
  const hoverState = ref<HoverState>({
    elementId: null,
    startTime: null,
    progress: 0,
  });
  const dragState = ref<{ elementId: string } | null>(null);

  const registeredElements = new Map<string, () => void>();
  const registeredDragElements = new Map<string, DragRegistration>();
  let lastDragPos: Point = { x: 0, y: 0 };

  function registerElement(id: string, callback: () => void) {
    registeredElements.set(id, callback);
  }

  function unregisterElement(id: string) {
    registeredElements.delete(id);
  }

  function registerDragElement(id: string, registration: DragRegistration) {
    registeredDragElements.set(id, registration);
  }

  function unregisterDragElement(id: string) {
    registeredDragElements.delete(id);
    if (dragState.value?.elementId === id) {
      dragState.value = null;
    }
  }

  function findHoveredId(pos: Point): string | null {
    for (const id of [
      ...registeredElements.keys(),
      ...registeredDragElements.keys(),
    ]) {
      const el = document.getElementById(id);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const isOver =
        pos.x >= rect.left &&
        pos.x <= rect.right &&
        pos.y >= rect.top &&
        pos.y <= rect.bottom;

      if (isOver) return id;
    }
    return null;
  }

  function checkHover() {
    const pos = indexFingerPos.value;
    if (!pos) {
      resetHover();
      return;
    }

    const hoveredId = findHoveredId(pos);

    if (!hoveredId) {
      resetHover();
      return;
    }

    if (hoverState.value.elementId !== hoveredId) {
      // Nuevo elemento: reiniciar timer
      hoverState.value = {
        elementId: hoveredId,
        startTime: Date.now(),
        progress: 0,
      };
      return;
    }

    // Mismo elemento: actualizar progreso
    const elapsed = Date.now() - (hoverState.value.startTime ?? Date.now());
    const progress = Math.min((elapsed / HOVER_DURATION_MS) * 100, 100);
    hoverState.value.progress = progress;

    if (progress >= 100) {
      const dragReg = registeredDragElements.get(hoveredId);
      if (dragReg) {
        // Enganchar: a partir de ahora la posición se transmite cada frame
        // hasta que se pierda el tracking de la mano (ver tick()).
        dragState.value = { elementId: hoveredId };
        lastDragPos = pos;
        resetHover();
        dragReg.onEngage?.(pos);
      } else {
        const callback = registeredElements.get(hoveredId);
        callback?.();
        resetHover();
      }
    }
  }

  function resetHover() {
    hoverState.value = {
      elementId: null,
      startTime: null,
      progress: 0,
    };
  }

  // Ejecutar en cada frame (llamado desde el loop de cámara)
  function tick() {
    if (dragState.value) {
      const reg = registeredDragElements.get(dragState.value.elementId);
      const pos = indexFingerPos.value;

      if (!pos) {
        // La mano se perdió: esa es la señal de "soltar", sin gesto extra.
        reg?.onRelease(lastDragPos);
        dragState.value = null;
        return;
      }

      lastDragPos = pos;
      reg?.onDrag(pos);
      return;
    }

    checkHover();
  }

  return {
    hoverState,
    dragState,
    registerElement,
    unregisterElement,
    registerDragElement,
    unregisterDragElement,
    tick,
  };
}
