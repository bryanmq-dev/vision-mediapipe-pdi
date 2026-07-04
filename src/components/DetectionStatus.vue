<!-- src/components/DetectionStatus.vue -->
<script setup lang="ts">
import { inject, ref, type Ref } from "vue";

const handsDetected = inject<Ref<boolean>>("handsDetected") ?? ref(false);
const faceDetected = inject<Ref<boolean>>("faceDetected") ?? ref(false);
</script>

<template>
  <div
    class="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/30 px-8 py-3 rounded-2xl ring-1 ring-white/20 pointer-events-none"
  >
    <div class="flex items-center gap-2">
      <span
        class="w-2.5 h-2.5 rounded-full"
        :class="handsDetected ? 'bg-green-400' : 'bg-red-500'"
      />
      <span class="text-white/70 text-sm"
        >Manos {{ handsDetected ? "✅" : "❌" }}</span
      >
    </div>
    <div class="h-4 w-px bg-white/20" />
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
</template>

<style scoped></style>
