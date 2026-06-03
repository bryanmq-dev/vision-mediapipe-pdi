<script setup lang="ts">
import { ref } from "vue";
import CameraView from "./components/CameraView.vue";
import DemoPanel from "./components/DemoPanel.vue";

const activeFilter = ref("none");

function setFilter(filtername: string) {
  activeFilter.value = filtername;
}
</script>

<template>
  <CameraView :filter-type="activeFilter">
    <DemoPanel @change-filter="setFilter" @custom-filter="setFilter" />
  </CameraView>
</template>

<style>
body {
  font-family: "Inter", system-ui, sans-serif;
}
</style>