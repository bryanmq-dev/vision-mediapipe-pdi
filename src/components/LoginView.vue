<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  login: [name: string];
}>();

const name = ref("");
const isLoading = ref(false);

function handleSubmit() {
  const trimmed = name.value.trim();
  if (!trimmed) return;

  isLoading.value = true;
  emit("login", trimmed);
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
      <h1 class="text-3xl font-bold text-white mb-2 text-center">
        Vision MediaPipe
      </h1>
      <p class="text-gray-400 text-center mb-8">
        Ingresa tu nombre para ver a tus compañeros
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <input
            v-model="name"
            type="text"
            placeholder="Tu nombre"
            maxlength="50"
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            :disabled="isLoading"
          />
        </div>

        <button
          type="submit"
          :disabled="!name.trim() || isLoading"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
        >
          {{ isLoading ? "Conectando..." : "Entrar" }}
        </button>
      </form>
    </div>
  </div>
</template>