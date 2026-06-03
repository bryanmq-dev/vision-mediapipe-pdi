<!-- src/components/HoverButton.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, computed } from "vue";
import { useHoverClick } from "./composables/useHoverClick";

const props = defineProps<{
  id: string;
  label: string;
  icon?: string;
  hoverState: ReturnType<typeof useHoverClick>["hoverState"]["value"];
  onActivate: () => void;
}>();

const emit = defineEmits(["register", "unregister"]);

const isHovered = computed(() => props.hoverState.elementId === props.id);
const progress = computed(() =>
  isHovered.value ? props.hoverState.progress : 0,
);

onMounted(() => emit("register", props.id, props.onActivate));
onUnmounted(() => emit("unregister", props.id));
</script>

<template>
  <div
    :id="id"
    class="relative flex flex-col items-center justify-center gap-1 w-24 h-24 rounded-xl bg-white/10 border-2 border-white/20 cursor-none transition-all duration-200 hover:border-green-400 hover:bg-green-400/15"
    :class="{ 'border-green-400 bg-green-400/15': isHovered }"
  >
    <i v-if="icon" :class="[icon, 'text-2xl text-white']" />
    <span class="text-white text-xs font-semibold">{{ label }}</span>

    <!-- Progress bar -->
    <div
      class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 rounded-b-xl overflow-hidden"
    >
      <div
        class="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-75"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>

<style scoped></style>
