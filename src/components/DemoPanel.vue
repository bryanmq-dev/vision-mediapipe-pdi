<!-- src/components/DemoPanel.vue -->
<script setup lang="ts">
import { ref, inject } from "vue";
import HoverButton from "./HoverButton.vue";

const registerEl = inject<(id: string, cb: () => void) => void>(
  "registerHoverElement",
)!;
const unregisterEl = inject<(id: string) => void>("unregisterHoverElement")!;
const hoverState = inject<any>("hoverState")!;

const bgColor = ref("#1a1a2eaa");
const message = ref("¡Prueba con tu mano!");

const customkernel = ref("1,1,1,1,1,1,1,1,1");

const emit = defineEmits(["change-filter", "custom-filter"]);

const actions = [
  {
    id: "btn-blanconegro",
    label: "Blanco y negro",
    icon: "fa-solid fa-circle-half-stroke", // Ícono de contraste
    onActivate: () => {
      emit("change-filter", "grayscale");
      message.value = "Filtro: Blanco y Negro";
    },
  },
  {
    id: "btn-sepia",
    label: "Sepia",
    icon: "fa-solid fa-camera-retro", // Ícono de cámara antigua
    onActivate: () => {
      emit("change-filter", "sepia");
      message.value = "Filtro: Sepia";
    },
  },
  {
    id: "btn-invert",
    label: "Invertir",
    icon: "fa-solid fa-yin-yang", // Ícono del yin yang para los colores invertidos
    onActivate: () => {
      emit("change-filter", "invert");
      message.value = "Filtro: Negativo";
    },
  },
  {
    id: "btn-normal",
    label: "Video Original",
    icon: "fa-solid fa-video", // Ícono de cámara de video
    onActivate: () => {
      emit("change-filter", "none");
      message.value = "Filtro: Ninguno (Normal)";
    },
  },
  {
    id: "btn-edge",
    label: "Bordes",
    icon: "fa-solid fa-border-all", // Ícono en forma de cuadrícula / bordes
    onActivate: () => {
      emit("change-filter", "edge");
      message.value = "Filtro: Detección de Bordes";
    },
  },
  {
    id: "btn-contrast",
    label: "Alto Contraste",
    icon: "fa-solid fa-sun", // Ícono de un sol para indicar intensidad de luz/contraste
    onActivate: () => {
      emit("change-filter", "contrast");
      message.value = "Filtro: Alto Contraste";
    },
  },
  {
    id: "btn-emboss",
    label: "Relieve",
    icon: "fa-solid fa-mountain", // Ícono de relieve topográfico
    onActivate: () => {
      emit("change-filter", "emboss");
      message.value = "Filtro: Relieve (Emboss)";
    },
  },
  {
    id: "btn-threshold",
    label: "Binarizado",
    icon: "fa-solid fa-barcode", // Ícono que recuerda al blanco y negro puro
    onActivate: () => {
      emit("change-filter", "threshold");
      message.value = "Filtro: Binarizado (Blanco/Negro puro)";
    },
  },
  {
    id: "btn-posterize",
    label: "Posterizar",
    icon: "fa-solid fa-layer-group", // Ícono de capas/niveles
    onActivate: () => {
      emit("change-filter", "posterize");
      message.value = "Filtro: Posterizado (8-bits)";
    },
  },
  {
    id: "btn-red-channel",
    label: "Canal Rojo",
    icon: "fa-solid fa-eye-dropper", // Ícono de gota de color
    onActivate: () => {
      emit("change-filter", "red-channel");
      message.value = "Filtro: Solo Canal Rojo";
    },
  },
];

const onActivateCustom = () => {
  const splitted = customkernel.value.split(",");
  if (splitted[splitted.length - 1] === ",") {
    emit("custom-filter", splitted.slice(0, splitted.length - 1));
  } else {
    emit("custom-filter", splitted);
  }
  message.value = "Filtro customizado";
};
</script>

<template>
  <div class="demo-panel">
    <div class="demo-panel__custom-kernel">
      <input
        type="text"
        v-model="customkernel"
        class="demo-panel__custom-kernel-field"
      />
      <HoverButton
        key="custom"
        id="customId"
        icon="fa-solid fa-pen"
        label="Aplicar kernel customizado"
        :on-activate="onActivateCustom"
        :hover-state="hoverState"
        @register="(id, cb) => registerEl(id, cb)"
        @unregister="(id) => unregisterEl(id)"
      />
    </div>
    <div class="demo-panel__buttons" :style="{ backgroundColor: bgColor }">
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

    <p class="label-message">
      Mensaje actual: <span class="current-message">{{ message }}</span>
    </p>
    <!-- Hint para el usuario -->
    <p class="demo-panel__hint">
      ☝️ Mantén el dedo índice sobre un botón por 2 segundos para activarlo
    </p>
  </div>
</template>

<style>
.demo-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  height: 100vh;
  width: 100%;
  position: relative;
}

.demo-panel__buttons {
  display: grid;
  max-width: 50vw;
  padding: 20px;
  border-radius: 20px;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 20px;
  opacity: 0.7;
  justify-self: end;
  align-self: end;
}

.label-message {
  color: white;
  font-weight: bolder;
}

.current-message {
  background-color: rgba(0, 0, 0, 0.4);
  padding: 6px;
  border-radius: 10px;
  color: white;
}

.demo-panel__custom-kernel {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  position: absolute;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
}

.demo-panel__custom-kernel-field {
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 250px;
  backdrop-filter: blur(10px);
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.demo-panel__custom-kernel-field:focus {
  outline: none;
  border-color: #4ade80;
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
}
</style>
