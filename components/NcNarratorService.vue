<script setup lang="ts">
import type { PageCollectionItemBase } from "@nuxt/content";
import type { AudioWithTimestampsResponseModel } from "elevenlabs/api";

const props = defineProps<{
  collectionItem: PageCollectionItemBase & { rawbody?: string };
  voiceId?: string;
}>();

const currentTime = ref(0);
const playing = ref(false);

function generateAudio(force: boolean = false) {
  return $fetch("/api/nc-narrator/voice", {
    method: "POST",
    body: {
      text: props.collectionItem?.rawbody,
      path: props.collectionItem?.path,
      force,
      voiceId: props.voiceId,
    },
  });
}

function getAudio() {
  return generateAudio(false);
}

const { data: audio } = await useAsyncData(getAudio, {
  lazy: true,
});

provide(NuxtContentNarratorInjectKey, {
  generateAudio,
  getAudio,
  collectionItem: props.collectionItem,
  currentTime,
  playing,
  audio,
  setCurrentTime(time: number) {
    currentTime.value = time;
  },
  setPlaying(value: boolean) {
    playing.value = value;
  },
});

if (!props.collectionItem?.rawbody) {
  throw new Error(
    "rawbody is required on collectionItem passed to NcNarratorService. View more info on how to provide rawbody within the Nuxt Content docs: https://content.nuxt.com/docs/advanced/raw-content"
  );
}
</script>
<script lang="ts">
export const NuxtContentNarratorInjectKey = Symbol() as InjectionKey<{
  generateAudio: (force?: boolean) => Promise<AudioWithTimestampsResponseModel>;
  getAudio: () => Promise<AudioWithTimestampsResponseModel>;
  collectionItem: PageCollectionItemBase & { rawbody?: string };
  currentTime: Ref<number>;
  audio: Ref<AudioWithTimestampsResponseModel | null>;
  playing: Ref<boolean>;
  setCurrentTime: (time: number) => void;
  setPlaying: (value: boolean) => void;
}>;
</script>

<template>
  <slot :current-time :playing :get-audio :audio />
</template>
