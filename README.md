# Nuxt Content Narrator

A Nuxt layer that provides text-to-speech narration capabilities for Nuxt Content pages.

## Quick Start

1. Install the layer

```typescript
// nuxt.config.ts
extends: ["github:danielkellyio/nc-narrator"],
```

2. Install Peer dependencies

```bash
npm install @nuxt/content @vueuse/nuxt
```

3. Get your [ElevanLabs](http://elevenlabs.io/) API key and set as an environment variable

   ```
   NUXT_ELEVENLABS_API_KEY=sk_xxx
   ```

4. Add the NcNarrator components to your content pages

```html
<script setup lang="ts">
  const route = useRoute();

  const { data: story } = await useAsyncData(() =>
    queryCollection("stories")
      .path(route.path.toString() ?? "")
      .first()
  );
</script>

<template>
  <article class="prose prose-lg mx-auto">
    <NcNarratorService
      v-if="story"
      :collection-item="story"
      voiceId="FGY2WhTYpPnrIDTdsKH5"
    >
      <NcNarratorPlayer progressClass="bg-gray-900" />
      <NcNarratorDevTools />
      <NcNarratorFollowAlongRenderer
        highlightClass="bg-gray-900"
        highlightTextClass="text-white"
      />
    </NcNarratorService>
  </article>
</template>
```

## Components Overview

### 1. NcNarratorService

The core service component that manages the text-to-speech functionality and state.

**Props:**

- `collectionItem`: (Required) A Nuxt Content page collection item that includes the `rawbody` property
- `voiceId`: (Optional) The ID of the ElevenLabs voice to use for narration (Visit https://elevenlabs.io/app/voice-lab to browse all Elevan labs voices, click "View" button, and get the voiceId from the url )

**Features:**

- Manages audio playback state
- Handles audio generation through ElevenLabs API
- Provides context to child components through Vue's provide/inject system

### 2. NcNarratorPlayer

A customizable audio player component that provides playback controls.

**Props:**

- `progressClass`: (Optional) CSS class for the progress bar (default: "bg-slate-900")

**Features:**

- Play/pause controls
- Progress bar with current time and duration
- Responsive design with container queries
- Customizable styling
- Slot-based API for custom player UI

### 3. NcNarratorFollowAlongRenderer

A component that renders text with synchronized highlighting during audio playback.

**Props:**

- `highlightClass`: (Optional) CSS class for the highlight background (default: "bg-slate-900")
- `highlightTextClass`: (Optional) CSS class for the highlighted text (default: "text-white")

**Features:**

- Word-by-word text highlighting synchronized with audio
- Handles complex HTML content
- Preserves original markup structure
- Smart handling of code blocks and special tags

### 4. NcNarratorDevTools

Development tools component for audio generation and testing in development.

## Usage

1. Wrap your content with the `NcNarratorService`:

```vue
<template>
  <NcNarratorService :collection-item="page">
    <!-- Your content and other narrator components -->
  </NcNarratorService>
</template>
```

2. Add the player component:

```vue
<template>
  <NcNarratorService :collection-item="page">
    <NcNarratorPlayer />
    <!-- Your content -->
  </NcNarratorService>
</template>
```

3. Use the follow-along renderer for synchronized text highlighting:

```vue
<template>
  <NcNarratorService :collection-item="page">
    <NcNarratorPlayer />
    <NcNarratorFollowAlongRenderer />

    <-- or if you only need the audio and not the highlighting use the regular
    Nuxt Content <ContentRenderer />
    -->
  </NcNarratorService>
</template>
```

## Requirements

- Nuxt Content module
- ElevenLabs API Key

## Styling

The components come with minimal default styling and can be customized using the following:

- Custom CSS classes through props
- Tailwind CSS

## Development

To use the development tools:

1. Import the `NcNarratorDevTools` component
2. Place it within the `NcNarratorService` component
3. The tools will only be visible in development mode

```vue
<template>
  <NcNarratorService :collection-item="page">
    <NcNarratorDevTools />
    <!-- Other components -->
  </NcNarratorService>
</template>
```

## Deploying to Prod

## Notes

- Ensure that your Nuxt Content configuration includes the `rawbody` in the page data
