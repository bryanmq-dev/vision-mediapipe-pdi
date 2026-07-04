<!-- src/components/DocumentViewer.vue -->
<script setup lang="ts">
import { inject, onMounted, onUnmounted, type Ref } from "vue";

interface Transform {
  translateX: number;
  translateY: number;
  scale: number;
  rotateDeg: number;
}

const props = defineProps<{
  fileUrl: string;
  fileType: "image" | "pdf";
  transform: Transform;
}>();

const emit = defineEmits<{
  "update:translate": [pos: { x: number; y: number }];
  close: [];
}>();

const registerDragEl = inject<(id: string, reg: any) => void>(
  "registerDragElement",
)!;
const unregisterDragEl = inject<(id: string) => void>(
  "unregisterDragElement",
)!;
const landmarks = inject<Ref<NormalizedLandmark[][]>>("landmarks")!;

// Solo esta pestaña se registra para arrastre — así mover la mano sobre el
// contenido del documento no lo desplaza por accidente.
const GRAB_HANDLE_ID = "document-grab-handle";

let startX = 0;
let startY = 0;
let startTranslate = { x: 0, y: 0 };

function onEngage(pos: { x: number; y: number }) {
  startX = pos.x;
  startY = pos.y;
  startTranslate = {
    x: props.transform.translateX,
    y: props.transform.translateY,
  };
}

function onDrag(pos: { x: number; y: number }) {
  // Una sola mano mueve libremente el documento; con dos manos el gesto
  // de pinch-zoom/rotación toma el control en su lugar.
  if (landmarks.value.length !== 1) return;
  emit("update:translate", {
    x: startTranslate.x + (pos.x - startX),
    y: startTranslate.y + (pos.y - startY),
  });
}

onMounted(() => {
  registerDragEl(GRAB_HANDLE_ID, { onEngage, onDrag, onRelease: () => {} });
});

onUnmounted(() => {
  unregisterDragEl(GRAB_HANDLE_ID);
});
</script>

<template>
  <!-- Sin contenedor limitante: el "Documento" es 100% libre para
       moverse/escalarse por toda la pantalla. -->
  <div
    class="absolute z-30 pointer-events-auto bg-gray-900/90 rounded-xl ring-1 ring-white/20 shadow-2xl overflow-hidden w-[720px]"
    :style="{
      left: '10%',
      top: '8%',
      transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale}) rotate(${transform.rotateDeg}deg)`,
      transformOrigin: 'center center',
    }"
  >
    <div
      class="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gray-900"
    >
      <div
        :id="GRAB_HANDLE_ID"
        class="flex items-center gap-2 px-2 py-1 -mx-2 -my-1 rounded-lg cursor-none hover:bg-white/10"
      >
        <i class="fa-solid fa-up-down-left-right text-white/50 text-xs" />
        <span class="text-white text-xs font-semibold">Documento</span>
      </div>
      <button
        @click="emit('close')"
        class="text-white/60 hover:text-white text-sm leading-none"
      >
        ✕
      </button>
    </div>

    <div
      class="w-[720px] h-[540px] bg-black/40 flex items-center justify-center"
    >
      <embed
        v-if="fileType === 'pdf'"
        :src="fileUrl"
        type="application/pdf"
        class="w-full h-full"
      />
      <img
        v-else
        :src="fileUrl"
        class="max-w-full max-h-full object-contain"
      />
    </div>
  </div>
</template>

<style scoped></style>
