<script setup lang="ts">
import { ref, computed } from "vue";
import CameraView from "./components/CameraView.vue";
import DemoPanel from "./components/DemoPanel.vue";
import LoginView from "./components/LoginView.vue";
import UserList from "./components/UserList.vue";
import { useWebSocket } from "./composables/useWebSocket";

const { users, currentUser, connect, disconnect } = useWebSocket();
const activeFilter = ref("none");

const isLoggedIn = computed(() => !!currentUser.value);

function handleLogin(name: string) {
  connect(name);
}

function handleLogout() {
  disconnect();
}

function setFilter(filtername: string) {
  activeFilter.value = filtername;
}
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <LoginView v-if="!isLoggedIn" @login="handleLogin" />

    <div v-else class="relative h-screen">
      <CameraView :filter-type="activeFilter">
        <DemoPanel @change-filter="setFilter" @custom-filter="setFilter" />
        <UserList :users="users" :current-user="currentUser" />
      </CameraView>

      <button
        @click="handleLogout"
        class="absolute top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition z-50"
      >
        Salir
      </button>
    </div>
  </div>
</template>