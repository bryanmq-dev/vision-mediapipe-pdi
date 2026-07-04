<!-- src/components/sections/InteraccionSection.vue -->
<script setup lang="ts">
import { inject, type Ref } from "vue";
import HoverButton from "../HoverButton.vue";

const registerEl = inject<(id: string, cb: () => void) => void>(
  "registerHoverElement",
)!;
const unregisterEl = inject<(id: string) => void>("unregisterHoverElement")!;
const hoverState = inject<any>("hoverState")!;
const mode = inject<Ref<"zoom" | "camera">>("mode")!;
const fileLoaded = inject<Ref<boolean>>("fileLoaded")!;
const openFileBrowser = inject<() => void>("openFileBrowser")!;
const closeFile = inject<() => void>("closeFile")!;
const resetZoom = inject<() => void>("resetZoom")!;
const screenshotDelaySeconds = inject<Ref<number>>("screenshotDelaySeconds")!;

function toggleMode() {
  mode.value = mode.value === "zoom" ? "camera" : "zoom";
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <button
      @click="toggleMode"
      class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white text-sm font-semibold transition"
    >
      Modo: {{ mode === "zoom" ? "Zoom" : "Cámara" }}
    </button>

    <div v-if="mode === 'camera'" class="flex flex-col gap-1">
      <label
        class="text-white/60 text-xs font-semibold uppercase tracking-wider"
        >Segundos antes de la foto</label
      >
      <input
        type="number"
        min="0"
        max="10"
        v-model.number="screenshotDelaySeconds"
        class="w-20 px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-sm text-center focus:outline-none focus:border-green-400"
      />
    </div>

    <HoverButton
      id="btn-open-file"
      label="Abrir archivo"
      icon="fa-solid fa-folder-open"
      :hover-state="hoverState"
      :on-activate="openFileBrowser"
      @register="(id, cb) => registerEl(id, cb)"
      @unregister="(id) => unregisterEl(id)"
    />

    <button
      v-if="!fileLoaded"
      @click="resetZoom"
      class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white text-sm font-semibold transition"
    >
      Restablecer zoom
    </button>

    <button
      v-else
      @click="closeFile"
      class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white text-sm font-semibold transition"
    >
      Cerrar documento
    </button>

    <p class="text-white/50 text-xs leading-relaxed">
      <template v-if="mode === 'camera'">
        Modo cámara: separa las dos manos para tomar una captura de pantalla.
        Los demás gestos quedan desactivados.
      </template>
      <template v-else-if="fileLoaded">
        Arrastra el documento con una mano. Separa/junta las dos manos para
        hacer zoom, o gíralas para rotarlo.
      </template>
      <template v-else>
        Separa/junta las dos manos para hacer zoom digital de la cámara.
      </template>
    </p>
  </div>
</template>

<style scoped></style>
