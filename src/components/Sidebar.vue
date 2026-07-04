<!-- src/components/Sidebar.vue -->
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, type Ref } from "vue";
import HoverButton from "./HoverButton.vue";
import FiltrosSection from "./sections/FiltrosSection.vue";
import InteraccionSection from "./sections/InteraccionSection.vue";

const emit = defineEmits<{ "change-filter": [filter: string] }>();

const registerEl = inject<(id: string, cb: () => void) => void>(
  "registerHoverElement",
)!;
const unregisterEl = inject<(id: string) => void>("unregisterHoverElement")!;
const registerDragEl = inject<(id: string, reg: any) => void>(
  "registerDragElement",
)!;
const unregisterDragEl = inject<(id: string) => void>(
  "unregisterDragElement",
)!;
const hoverState = inject<any>("hoverState")!;
const activeSection = inject<Ref<"filtros" | "interaccion">>(
  "activeSection",
)!;

const SIDEBAR_WIDTH = 380;
const PULL_TAB_ID = "sidebar-pull-tab";

const openAmount = ref(0); // 0 = cerrado, 1 = abierto
let startX = 0;
let startOpen = 0;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function onEngage(pos: { x: number; y: number }) {
  startX = pos.x;
  startOpen = openAmount.value;
}

function onDrag(pos: { x: number; y: number }) {
  const deltaOpen = (startX - pos.x) / SIDEBAR_WIDTH;
  openAmount.value = clamp(startOpen + deltaOpen, 0, 1);
}

function onRelease() {
  openAmount.value = openAmount.value > 0.5 ? 1 : 0;
}

onMounted(() => {
  registerDragEl(PULL_TAB_ID, { onEngage, onDrag, onRelease });
});

onUnmounted(() => {
  unregisterDragEl(PULL_TAB_ID);
});

const isTabHovered = computed(() => hoverState.value.elementId === PULL_TAB_ID);
const tabProgress = computed(() => (isTabHovered.value ? hoverState.value.progress : 0));

// Plegado = sin interacción alguna; los botones solo se montan (y por lo
// tanto se registran para hover-click) una vez el panel queda 100% abierto.
const isOpen = computed(() => openAmount.value === 1);

const translateStyle = computed(
  () => `translate(${(1 - openAmount.value) * SIDEBAR_WIDTH}px, -50%)`,
);

function onChangeFilter(filter: string) {
  emit("change-filter", filter);
}

function selectSection(section: "filtros" | "interaccion") {
  activeSection.value = section;
}
</script>

<template>
  <div
    class="absolute right-0 top-1/2 pointer-events-auto transition-transform duration-200"
    :style="{
      transform: translateStyle,
      width: `${SIDEBAR_WIDTH}px`,
    }"
  >
    <!-- Pestaña para enganchar y jalar -->
    <div
      :id="PULL_TAB_ID"
      class="absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-24 rounded-l-xl bg-black/50 ring-1 ring-white/20 flex flex-col items-center justify-center gap-1 cursor-none"
      :class="{ 'ring-green-400 bg-green-400/20': isTabHovered }"
    >
      <i class="fa-solid fa-grip-lines-vertical text-white/70" />
      <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden rounded-b">
        <div
          class="h-full bg-green-400 transition-all duration-75"
          :style="{ width: `${tabProgress}%` }"
        />
      </div>
    </div>

    <!-- Panel del sidebar: solo existe en el DOM (y por lo tanto solo
         registra sus botones para hover-click) cuando está desplegado -->
    <div
      v-if="isOpen"
      class="bg-black/30 rounded-2xl ring-1 ring-white/20 p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
    >
      <div class="flex gap-3">
        <HoverButton
          id="tab-filtros"
          label="Filtros"
          icon="fa-solid fa-sliders"
          :hover-state="hoverState"
          :on-activate="() => selectSection('filtros')"
          @register="(id, cb) => registerEl(id, cb)"
          @unregister="(id) => unregisterEl(id)"
        />
        <HoverButton
          id="tab-interaccion"
          label="Interacción"
          icon="fa-solid fa-hand-pointer"
          :hover-state="hoverState"
          :on-activate="() => selectSection('interaccion')"
          @register="(id, cb) => registerEl(id, cb)"
          @unregister="(id) => unregisterEl(id)"
        />
      </div>

      <FiltrosSection
        v-show="activeSection === 'filtros'"
        @change-filter="onChangeFilter"
      />
      <InteraccionSection v-show="activeSection === 'interaccion'" />
    </div>
  </div>
</template>

<style scoped></style>
