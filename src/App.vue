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
    <DemoPanel @change-filter="setFilter" />
  </CameraView>
</template>

<style>
* {
  margin: 0 !important;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: "Inter", sans-serif;
}
</style>
