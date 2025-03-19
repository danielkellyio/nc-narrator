<script setup lang="ts">
import { NuxtContentNarratorInjectKey } from "./NCNarratorService.vue";

withDefaults(
  defineProps<{
    progressClass?: string;
  }>(),
  {
    progressClass: "bg-slate-900",
  }
);

const injected = inject(NuxtContentNarratorInjectKey);

if (!injected) {
  throw new Error(
    "CollectionItemNarrator: must be used within a NuxtContentNarrator"
  );
}

const { setCurrentTime, setPlaying, collectionItem } = injected;

const audioEl = useTemplateRef("audioEl");
const { playing, currentTime, duration } = useMediaControls(audioEl, {
  src: `/api/nc-narrator/mp3?path=${collectionItem?.path}`,
});

const percentComplete = computed(() => {
  return (currentTime.value / duration.value) * 100;
});

watch(currentTime, (time) => {
  setCurrentTime(time);
});
watch(playing, (value) => {
  setPlaying(value);
});
</script>

<template>
  <slot
    :play="() => (playing = !playing)"
    :pause="() => (playing = false)"
    :toggle="() => (playing = !playing)"
    :playing="playing"
    :current-time="currentTime"
    :duration="duration"
    :percent-complete="percentComplete"
  >
    <div class="audio-player-container">
      <div class="audio-player">
        <div class="progress-container">
          <div
            class="progress-bar"
            :class="progressClass"
            :style="{
              width: `${percentComplete}%`,
            }"
          />
        </div>
        <button
          class="play-button"
          :class="{ 'is-playing': playing }"
          @click="playing = !playing"
        >
          <svg
            v-if="!playing"
            class="play-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            v-else
            class="pause-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        </button>
        <div class="time-display">
          {{ Math.floor(currentTime) }}s / {{ Math.floor(duration) }}s
        </div>
      </div>
    </div>
  </slot>
  <audio ref="audioEl" class="hidden" />
</template>

<style scoped>
.audio-player-container {
  container-type: inline-size;
  width: 100%;
  margin-bottom: 1rem;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.75rem;
  width: 100%;
}

.progress-container {
  flex: 1 1 auto;
  min-width: 0;
  background-color: #e5e7eb;
  height: 0.5rem;
  border-radius: 9999px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

@container (max-width: 300px) {
  .audio-player {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .progress-container {
    width: 100%;
    flex: none;
    order: 2;
  }

  .time-display {
    order: 3;
    font-size: 0.5rem;
  }

  .play-button {
    order: 1;
    width: 2rem;
    height: 2rem;
    padding: 0.5rem;
  }
}

@container (min-width: 301px) and (max-width: 400px) {
  .audio-player {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .play-button {
    width: 2rem;
    height: 2rem;
    padding: 0.5rem;
  }

  .time-display {
    font-size: 0.5rem;
  }
}

@container (min-width: 401px) {
  .audio-player {
    padding: 1rem;
    gap: 1rem;
  }

  .play-button {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.625rem;
  }

  .time-display {
    font-size: 0.55rem;
  }
}

.progress-bar {
  height: 100%;
  transition: width 0.1s ease-in-out;
  border-radius: 9999px;
}

.time-display {
  color: #6b7280;
  white-space: nowrap;
}

.play-button {
  border-radius: 9999px;
  border: none;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.play-button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  color: #1f2937;
  background-color: #fafafa;
}

.play-button:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

.play-icon,
.pause-icon {
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
}

.play-button:hover .play-icon,
.play-button:hover .pause-icon {
  transform: scale(1.1);
}

.hidden {
  display: none;
}
</style>
