// src/composables/useHoverClick.ts
import { ref, watch, type Ref } from "vue";

interface HoverState {
  elementId: string | null;
  startTime: number | null;
  progress: number; // 0-100
}

const HOVER_DURATION_MS = 1000;

export function useHoverClick(
  indexFingerPos: Ref<{ x: number; y: number } | null>,
) {
  const hoverState = ref<HoverState>({
    elementId: null,
    startTime: null,
    progress: 0,
  });

  // Elementos registrados: id → callback
  const registeredElements = new Map<string, () => void>();

  function registerElement(id: string, callback: () => void) {
    registeredElements.set(id, callback);
  }

  function unregisterElement(id: string) {
    registeredElements.delete(id);
  }

  // Chequeamos si el dedo está sobre algún elemento registrado
  function checkHover() {
    const pos = indexFingerPos.value;
    if (!pos) {
      resetHover();
      return;
    }

    let hoveredId: string | null = null;

    for (const id of registeredElements.keys()) {
      const el = document.getElementById(id);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const isOver =
        pos.x >= rect.left &&
        pos.x <= rect.right &&
        pos.y >= rect.top &&
        pos.y <= rect.bottom;

      if (isOver) {
        hoveredId = id;
        break;
      }
    }

    if (!hoveredId) {
      resetHover();
      return;
    }

    // ¿Es el mismo elemento que ya estábamos hovereando?
    if (hoverState.value.elementId !== hoveredId) {
      // Nuevo elemento: reiniciar timer
      hoverState.value = {
        elementId: hoveredId,
        startTime: Date.now(),
        progress: 0,
      };
    } else {
      // Mismo elemento: actualizar progreso
      const elapsed = Date.now() - (hoverState.value.startTime ?? Date.now());
      const progress = Math.min((elapsed / HOVER_DURATION_MS) * 100, 100);
      hoverState.value.progress = progress;

      if (progress >= 100) {
        // ¡Activar click!
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

  // Ejecutar checkHover en cada frame (llamar desde el loop de cámara)
  function tick() {
    checkHover();
  }

  return {
    hoverState,
    registerElement,
    unregisterElement,
    tick,
  };
}
