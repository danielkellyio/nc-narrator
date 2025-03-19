<script setup lang="ts">
import { NuxtContentNarratorInjectKey } from "./NcNarratorService.vue";
const injected = inject(NuxtContentNarratorInjectKey);

if (!injected) {
  throw new Error(
    "NcNarratorDevTools must be used within the NcNarratorService"
  );
}

const loading = ref(false);
const { generateAudio } = injected;

async function handleGenerateAudio() {
  try {
    loading.value = true;
    await generateAudio(true);
    window.location.reload();
  } catch (error) {
    alert(error);
  } finally {
    loading.value = false;
  }
}

const isDev = import.meta.dev;
</script>

<template>
  <div v-if="isDev">
    <button @click="handleGenerateAudio">
      {{ loading ? "Generating..." : "Generate Audio" }}
    </button>
  </div>
</template>

<style scoped>
button {
  background-color: #000;
  color: #fff;
  padding: 0.3rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  font-size: 0.7rem;
}
</style>
