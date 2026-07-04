<!-- src/components/FileBrowserModal.vue -->
<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import HoverButton from "./HoverButton.vue";

interface FileEntry {
  name: string;
  type: "dir" | "image" | "pdf";
  path: string;
}

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  close: [];
  "select-file": [payload: { url: string; type: "image" | "pdf" }];
}>();

const registerEl = inject<(id: string, cb: () => void) => void>(
  "registerHoverElement",
)!;
const unregisterEl = inject<(id: string) => void>("unregisterHoverElement")!;
const hoverState = inject<any>("hoverState")!;

const currentDir = ref("");
const entries = ref<FileEntry[]>([]);
const error = ref("");

async function fetchEntries() {
  error.value = "";
  try {
    const res = await fetch(
      `/api/files?dir=${encodeURIComponent(currentDir.value)}`,
    );
    if (!res.ok) throw new Error("No se pudo listar la carpeta");
    entries.value = await res.json();
  } catch (e) {
    error.value = (e as Error).message;
    entries.value = [];
  }
}

watch(
  [() => props.visible, currentDir],
  ([visible]) => {
    if (visible) fetchEntries();
  },
  { immediate: true },
);

function openEntry(entry: FileEntry) {
  if (entry.type === "dir") {
    currentDir.value = entry.path;
  } else {
    emit("select-file", {
      url: `/api/files/content?path=${encodeURIComponent(entry.path)}`,
      type: entry.type,
    });
  }
}

const breadcrumbs = computed(() => currentDir.value.split("/").filter(Boolean));

function goToBreadcrumb(index: number) {
  currentDir.value = breadcrumbs.value.slice(0, index + 1).join("/");
}

function iconFor(entry: FileEntry) {
  if (entry.type === "dir") return "fa-solid fa-folder";
  if (entry.type === "pdf") return "fa-solid fa-file-pdf";
  return "fa-solid fa-file-image";
}
</script>

<template>
  <div
    v-if="visible"
    class="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto"
  >
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
    <div
      class="relative bg-gray-900 rounded-2xl ring-1 ring-white/20 w-[600px] max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
    >
      <div
        class="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10"
      >
        <span class="text-white text-sm font-semibold">Abrir archivo</span>
        <button
          @click="emit('close')"
          class="text-white/60 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div
        class="flex items-center gap-1 px-4 py-2 text-xs text-white/60 border-b border-white/10"
      >
        <button @click="currentDir = ''" class="hover:text-green-400">
          Inicio
        </button>
        <template v-for="(part, i) in breadcrumbs" :key="i">
          <span>/</span>
          <button @click="goToBreadcrumb(i)" class="hover:text-green-400">
            {{ part }}
          </button>
        </template>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
        <div v-else class="grid grid-cols-4 gap-3">
          <HoverButton
            v-for="entry in entries"
            :key="entry.path"
            :id="'file-cell-' + entry.path"
            :label="entry.name"
            :icon="iconFor(entry)"
            :hover-state="hoverState"
            :on-activate="() => openEntry(entry)"
            @register="(id, cb) => registerEl(id, cb)"
            @unregister="(id) => unregisterEl(id)"
          />
        </div>
        <p
          v-if="!error && entries.length === 0"
          class="text-white/40 text-sm text-center py-8"
        >
          Carpeta vacía
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
