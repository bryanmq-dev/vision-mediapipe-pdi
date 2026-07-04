<!-- src/components/sections/FiltrosSection.vue -->
<script setup lang="ts">
import { inject, ref } from "vue";
import HoverButton from "../HoverButton.vue";
import { FILTER_ACTIONS, type FilterAction } from "../../filters";

const emit = defineEmits<{ "change-filter": [filter: string] }>();

const registerEl = inject<(id: string, cb: () => void) => void>(
  "registerHoverElement",
)!;
const unregisterEl = inject<(id: string) => void>("unregisterHoverElement")!;
const hoverState = inject<any>("hoverState")!;

const message = ref("¡Prueba con tu mano!");

function activate(action: FilterAction) {
  emit("change-filter", action.filterType);
  message.value = action.message;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-white text-sm font-semibold text-center">{{ message }}</p>

    <div class="grid grid-cols-3 gap-5">
      <HoverButton
        v-for="action in FILTER_ACTIONS"
        :key="action.id"
        :id="action.id"
        :label="action.label"
        :icon="action.icon"
        :hover-state="hoverState"
        :on-activate="() => activate(action)"
        @register="(id, cb) => registerEl(id, cb)"
        @unregister="(id) => unregisterEl(id)"
      />
    </div>
  </div>
</template>

<style scoped></style>
