<script setup lang="ts">
import type { CharacterAlignmentModel } from "elevenlabs/api";
import { NuxtContentNarratorInjectKey } from "./NCNarratorService.vue";

const injected = inject(NuxtContentNarratorInjectKey);

if (!injected) {
  throw new Error(
    "NcNarratorFollowAlongRenderer: must be used within a NuxtContentNarrator"
  );
}

const { currentTime, collectionItem, audio } = injected;

const props = withDefaults(
  defineProps<{
    highlightClass?: string;
    highlightTextClass?: string;
  }>(),
  {
    highlightClass: "bg-slate-900",
    highlightTextClass: "text-white",
  }
);

function splitIntoWords(text: string) {
  return text.split(/\s+/).filter((word: string) => word.length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VNodeContent = string | { [key: string]: any } | VNodeContent[];

function isVdomArray(arr: unknown): boolean {
  return (
    Array.isArray(arr) &&
    arr.length >= 3 &&
    typeof arr[0] === "string" &&
    typeof arr[1] === "object"
  );
}

interface ProcessArrayResult {
  result: VNodeContent;
  position: number;
}

interface WordPosition {
  text: string;
  startTime: number;
  endTime: number;
  index: number;
}

function cleanAlignmentData(alignment: CharacterAlignmentModel) {
  const cleanChars: string[] = [];
  const cleanTimes: number[] = [];
  let inBreakTag = false;
  let lastValidTime = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const time = alignment.character_end_times_seconds[i];
    lastValidTime = Math.max(lastValidTime, time);

    // Check for start of break tag
    if (char === "<") {
      const nextChars = alignment.characters.slice(i, i + 6).join("");
      if (nextChars.startsWith("<break")) {
        inBreakTag = true;
        continue;
      }
    }

    // If we're in a break tag and see '>', end the break tag
    if (inBreakTag && char === ">") {
      inBreakTag = false;
      continue;
    }

    // Skip characters while in break tag
    if (inBreakTag) {
      continue;
    }

    cleanChars.push(char);
    cleanTimes.push(lastValidTime);
  }

  return {
    characters: cleanChars,
    character_end_times_seconds: cleanTimes,
  };
}

function processArray(
  arr: VNodeContent,
  wordPositions: WordPosition[] = [],
  currentTime: number,
  currentIndex = 0
): ProcessArrayResult {
  if (!Array.isArray(arr)) return { result: arr, position: currentIndex };

  // Create a new array to store the result
  const result = [];
  let wordIndex = currentIndex;

  // Find the latest word that should be highlighted
  const latestHighlightedWord = wordPositions.reduce((latest, word) => {
    if (
      word.startTime <= currentTime &&
      (!latest || word.index > latest.index)
    ) {
      return word;
    }
    return latest;
  }, null as WordPosition | null);

  const latestIndex = latestHighlightedWord?.index ?? -1;

  // If this is a vDom array
  if (isVdomArray(arr)) {
    // Keep the tag and props (first two elements)
    result.push(arr[0], arr[1]);

    // Check if this is a code block or style tag
    const isCodeBlock =
      arr[0] === "pre" ||
      arr[0] === "style" ||
      (arr[1] &&
        typeof arr[1] === "object" &&
        "class" in arr[1] &&
        String(arr[1].class).includes("language-"));

    // If it's a code block or style tag, return it as is without processing
    if (isCodeBlock) {
      return { result: arr, position: wordIndex };
    }

    // Process each element starting from the third position (index 2)
    for (let i = 2; i < arr.length; i++) {
      if (typeof arr[i] === "string") {
        // Split the string into words and convert each word to ["span", {}, word]
        const words = splitIntoWords(arr[i]);
        for (const word of words) {
          // Find matching word position with the current index
          const wordPos = wordPositions.find(
            (pos) => pos.text === word && pos.index === wordIndex
          );

          // Only highlight if this word's index is less than or equal to the latest highlighted word
          const shouldHighlight = wordPos && wordPos.index <= latestIndex;

          const wordWrapperClass = shouldHighlight
            ? ["word-wrapper", props.highlightTextClass, "active"]
            : ["word-wrapper"];

          result.push([
            "span",
            { class: wordWrapperClass },
            ["mark", { class: [props.highlightClass] }, ""],
            ["span", { class: "word" }, word],
          ]);

          if (wordPos) {
            wordIndex++;
          }
        }
      } else if (Array.isArray(arr[i])) {
        // Process nested arrays recursively
        const processed = processArray(
          arr[i],
          wordPositions,
          currentTime,
          wordIndex
        );
        result.push(processed.result);
        wordIndex = processed.position;
      } else {
        result.push(arr[i]);
      }
    }
  } else {
    // For non-vDom arrays, process each element recursively
    for (let i = 0; i < arr.length; i++) {
      if (Array.isArray(arr[i])) {
        const processed = processArray(
          arr[i],
          wordPositions,
          currentTime,
          wordIndex
        );
        result.push(processed.result);
        wordIndex = processed.position;
      } else {
        result.push(arr[i]);
      }
    }
  }

  return { result, position: wordIndex };
}

const chunkedByWord = computed((): typeof collectionItem => {
  // Calculate word positions from the alignment data
  const wordPositions: WordPosition[] = [];
  if (audio.value?.alignment) {
    let currentWord = "";
    let currentWordStartTime = 0;
    let isFirstCharOfWord = true;
    let wordIndex = 0;

    // Clean up alignment data first
    const cleanAlignment = cleanAlignmentData(audio.value?.alignment);

    cleanAlignment.characters.forEach((char, index) => {
      const time = cleanAlignment.character_end_times_seconds[index];

      if (isFirstCharOfWord && char !== " ") {
        currentWordStartTime = time;
        isFirstCharOfWord = false;
      }

      if (char === " ") {
        if (currentWord) {
          wordPositions.push({
            text: currentWord,
            startTime: currentWordStartTime,
            endTime: time,
            index: wordIndex++,
          });
          currentWord = "";
          isFirstCharOfWord = true;
        }
      } else {
        currentWord += char;
      }

      // Handle the last word
      if (index === cleanAlignment.characters.length - 1 && currentWord) {
        wordPositions.push({
          text: currentWord,
          startTime: currentWordStartTime,
          endTime: time,
          index: wordIndex++,
        });
      }
    });
  }

  return {
    ...collectionItem,
    body: {
      ...collectionItem?.body,
      // @ts-expect-error - TODO: fix this
      value: processArray(
        // @ts-expect-error - TODO: fix this
        collectionItem?.body.value,
        wordPositions,
        currentTime.value,
        0
      ).result,
    },
  };
});
</script>

<template>
  <div>
    <ContentRenderer :value="chunkedByWord" />
  </div>
</template>

<style scoped>
:deep(.word-wrapper) {
  display: inline-block;
  padding-left: 0.1em;
  padding-right: 0.1em;
  transition: background-color 0.1s ease-in-out;
  position: relative;
}

:deep(mark) {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
:deep(.word-wrapper.active mark) {
  display: block;
}

:deep(.word) {
  display: inline-block;
  position: relative;
  z-index: 1;
}
</style>
