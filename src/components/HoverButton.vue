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
  <div :id="id" class="hover-btn" :class="{ 'hover-btn--active': isHovered }">
    <i v-if="icon" :class="['hover-btn__icon', icon]"></i>
    <span class="hover-btn__label">{{ label }}</span>

    <!-- Barra de progreso circular o lineal -->
    <div class="hover-btn__progress-track">
      <div
        class="hover-btn__progress-fill"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>

<style scoped>
.hover-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100px;
  height: 100px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: none;
  transition:
    border-color 0.2s,
    background 0.2s;
  user-select: none;
}

.hover-btn--active {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.15);
}

.hover-btn__icon {
  font-size: 2rem;
}

.hover-btn__label {
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
}

.hover-btn__progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0 0 18px 18px;
  overflow: hidden;
}

.hover-btn__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22d3ee);
  transition: width 0.05s linear;
}
</style>
