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
const counter = ref(0);
const confettiActive = ref(false);

const actions = [
  {
    id: "btn-color",
    label: "Cambiar Color",
    icon: "🎨",
    onActivate: () => {
      const colors = ["#1a1a2e88", "#16213e88", "#0f346088", "#53348388"];
      bgColor.value = colors[Math.floor(Math.random() * colors.length)];
      message.value = "¡Color cambiado!";
    },
  },
  {
    id: "btn-counter",
    label: "Contar",
    icon: "🔢",
    onActivate: () => {
      counter.value++;
      message.value = `Conteo: ${counter.value}`;
    },
  },
  {
    id: "btn-confetti",
    label: "Celebrar",
    icon: "🎉",
    onActivate: () => {
      confettiActive.value = true;
      message.value = "¡Fiesta!";
      setTimeout(() => (confettiActive.value = false), 2000);
    },
  },
  {
    id: "btn-reset",
    label: "Resetear",
    icon: "🔄",
    onActivate: () => {
      counter.value = 0;
      bgColor.value = "#1a1a2e88";
    },
  },
];
</script>

<template>
  <div class="demo-panel">
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
  height: 80vh;
  flex-direction: column;
  gap: 20px;
  justify-content: end;
  align-items: center;
}

.demo-panel__buttons {
  padding: 20px;
  border-radius: 20px;
  gap: 20px;
  display: flex;
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
</style>
