<script setup lang="ts">
import { ref } from "vue";
import CameraView from "./components/CameraView.vue";
import Sidebar from "./components/Sidebar.vue";

const activeFilter = ref("none");

function setFilter(filtername: string) {
  activeFilter.value = filtername;
}
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <div class="relative h-screen">
      <CameraView :filter-type="activeFilter">
        <Sidebar @change-filter="setFilter" />
      </CameraView>
    </div>
  </div>
</template>
