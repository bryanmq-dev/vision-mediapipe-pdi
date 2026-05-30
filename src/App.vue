<script setup lang="ts">
import CameraView from "./components/CameraView.vue";
import DemoPanel from "./components/DemoPanel.vue";
</script>

<template>
  <CameraView>
    <DemoPanel />
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
