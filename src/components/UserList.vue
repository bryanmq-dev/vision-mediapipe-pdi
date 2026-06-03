<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  users: Array<{ id: string; name: string }>;
  currentUser: string | null;
}>();

const isOpen = ref(true);

function toggle() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="absolute left-4 top-20 z-50">
    <button
      @click="toggle"
      class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition mb-2"
    >
      <svg
        :class="['w-5 h-5 transition-transform duration-200', isOpen ? 'rotate-90' : '']"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span class="flex items-center gap-2">
        <span class="relative flex h-3 w-3">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Conectados
        <span class="text-gray-400 text-sm">({{ users.length }})</span>
      </span>
    </button>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-4"
    >
      <div
        v-if="isOpen"
        class="bg-gray-800 rounded-xl p-4 w-64 shadow-2xl"
      >
        <ul class="space-y-2 max-h-60 overflow-y-auto">
          <li
            v-for="user in users"
            :key="user.id"
            class="flex items-center gap-3 text-gray-300"
          >
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="user.name === currentUser ? 'bg-blue-500' : 'bg-green-500'"
            ></span>
            <span class="truncate">{{ user.name }}</span>
            <span v-if="user.name === currentUser" class="text-xs text-blue-400 ml-auto">
              tú
            </span>
          </li>
        </ul>

        <div v-if="users.length === 0" class="text-gray-500 text-sm text-center py-4">
          Nadie más conectado
        </div>
      </div>
    </transition>
  </div>
</template>