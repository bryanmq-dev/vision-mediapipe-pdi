<!-- src/components/DemoPanel.vue -->
<script setup lang="ts">
import { ref, inject } from "vue";
import HoverButton from "./HoverButton.vue";

const registerEl = inject<(id: string, cb: () => void) => void>(
  "registerHoverElement",
)!;
const unregisterEl = inject<(id: string) => void>("unregisterHoverElement")!;
const hoverState = inject<any>("hoverState")!;
const handsDetected = inject<Ref<boolean>>("handsDetected") ?? ref(false);
const faceDetected = inject<Ref<boolean>>("faceDetected") ?? ref(false);

const message = ref("¡Prueba con tu mano!");
const customkernel = ref("1,1,1,1,1,1,1,1,1");

const emit = defineEmits(["change-filter", "custom-filter"]);

const actions = [
  {
    id: "btn-blanconegro",
    label: "Blanco y negro",
    icon: "fa-solid fa-circle-half-stroke",
    onActivate: () => {
      emit("change-filter", "grayscale");
      message.value = "Filtro: Blanco y Negro";
    },
  },
  {
    id: "btn-sepia",
    label: "Sepia",
    icon: "fa-solid fa-camera-retro",
    onActivate: () => {
      emit("change-filter", "sepia");
      message.value = "Filtro: Sepia";
    },
  },
  {
    id: "btn-invert",
    label: "Invertir",
    icon: "fa-solid fa-yin-yang",
    onActivate: () => {
      emit("change-filter", "invert");
      message.value = "Filtro: Negativo";
    },
  },
  {
    id: "btn-normal",
    label: "Video Original",
    icon: "fa-solid fa-video",
    onActivate: () => {
      emit("change-filter", "none");
      message.value = "Filtro: Ninguno (Normal)";
    },
  },
  {
    id: "btn-edge",
    label: "Bordes",
    icon: "fa-solid fa-border-all",
    onActivate: () => {
      emit("change-filter", "edge");
      message.value = "Filtro: Detección de Bordes";
    },
  },
  {
    id: "btn-contrast",
    label: "Alto Contraste",
    icon: "fa-solid fa-sun",
    onActivate: () => {
      emit("change-filter", "contrast");
      message.value = "Filtro: Alto Contraste";
    },
  },
  {
    id: "btn-emboss",
    label: "Relieve",
    icon: "fa-solid fa-mountain",
    onActivate: () => {
      emit("change-filter", "emboss");
      message.value = "Filtro: Relieve (Emboss)";
    },
  },
  {
    id: "btn-threshold",
    label: "Binarizado",
    icon: "fa-solid fa-barcode",
    onActivate: () => {
      emit("change-filter", "threshold");
      message.value = "Filtro: Binarizado (Blanco/Negro puro)";
    },
  },
  {
    id: "btn-posterize",
    label: "Posterizar",
    icon: "fa-solid fa-layer-group",
    onActivate: () => {
      emit("change-filter", "posterize");
      message.value = "Filtro: Posterizado (8-bits)";
    },
  },
  {
    id: "btn-red-channel",
    label: "Canal Rojo",
    icon: "fa-solid fa-eye-dropper",
    onActivate: () => {
      emit("change-filter", "red-channel");
      message.value = "Filtro: Solo Canal Rojo";
    },
  },
];

const onActivateCustom = () => {
  const splitted = customkernel.value.split(",");
  emit(
    "custom-filter",
    splitted.slice(
      0,
      splitted[splitted.length - 1] === ","
        ? splitted.length - 1
        : splitted.length,
    ),
  );
  message.value = "Filtro customizado";
};
</script>

<template>
  <div
    class="relative flex flex-col gap-5 items-start justify-center h-screen w-full pointer-events-auto"
  >
    <!-- Custom kernel input + button -->
    <div
      class="absolute top-1/2 -translate-y-1/2 bg-black/30 rounded-2xl ring-1 ring-white/20"
    >
      <div class="flex flex-col items-center gap-4 p-2">
        <span
          class="text-white/60 text-xs font-semibold uppercase tracking-wider"
          >Kernel customizado</span
        >
        <input
          v-model="customkernel"
          type="text"
          class="w-64 text-sm rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(74,222,128,0.3)] transition-all"
          placeholder="1,1,1,1,1,1,1,1,1"
        />
        <HoverButton
          id="customId"
          icon="fa-solid fa-play"
          label="Aplicar"
          :on-activate="onActivateCustom"
          :hover-state="hoverState"
          @register="(id, cb) => registerEl(id, cb)"
          @unregister="(id) => unregisterEl(id)"
        />
      </div>
    </div>

    <!-- Buttons grid -->
    <div
      class="absolute bottom-20 right-0 flex flex-col gap-5 p-0 rounded-2xl bg-black/30 ring-1 ring-white/20"
    >
      <div class="p-3">
        <div class="grid grid-cols-4 gap-4">
          <HoverButton
            v-for="action in actions"
            :key="action.id"
            :id="action.id"
            :label="action.label"
            :icon="action.icon"
            :hover-state="hoverState"
            :on-activate="action.onActivate"
            @register="(id, cb) => registerEl(id, cb)"
            @unregister="(id) => unregisterEl(id)"
          />
        </div>
      </div>
    </div>

    <!-- Top message with detection status integrated -->
    <div
      class="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 bg-black/30 px-10 py-6 rounded-2xl ring-1 ring-white/20"
    >
      <p class="text-white font-bold text-base">
        {{ message }}
      </p>
      <div
        class="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <span
            class="w-2.5 h-2.5 rounded-full"
            :class="handsDetected ? 'bg-green-400' : 'bg-red-500'"
          />
          <span class="text-white/70 text-sm"
            >Manos {{ handsDetected ? "✅" : "❌" }}</span
          >
        </div>
        <div class="h-4 bg-white/20" />
        <div class="flex items-center gap-2">
          <span
            class="w-2.5 h-2.5 rounded-full"
            :class="faceDetected ? 'bg-green-400' : 'bg-red-500'"
          />
          <span class="text-white/70 text-sm"
            >Rostro {{ faceDetected ? "✅" : "❌" }}</span
          >
        </div>
      </div>
      <p class="text-white/50 text-xs">
        ☝️ Mantén el dedo índice sobre un botón por 2 segundos para activarlo
      </p>
    </div>
  </div>
</template>

<style scoped></style>
