import type { AudioWithTimestampsResponseModel } from "elevenlabs/api";
import { ncNarratorUseElevenLabs } from "../../utils/NcNarrator";

export default defineEventHandler(async (event) => {
  const elevenLabs = ncNarratorUseElevenLabs();

  const body = await readBody(event);
  const audioStorage = useStorage("audio");

  if (!body.text && !body.path) {
    throw createError({
      statusCode: 400,
      statusMessage: "Text or path is required to generate audio",
    });
  }

  let audio = await audioStorage.getItem<AudioWithTimestampsResponseModel>(
    `/${body.path}.json`
  );

  if (audio && !body.force) return audio;

  if (!import.meta.dev) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Generation capabilities are only available in development mode",
    });
  }

  try {
    audio = await elevenLabs.textToSpeech.convertWithTimestamps(
      body.voiceId || "JBFqnCBsd6RMkjVDRZzb",
      {
        text: ncNarratorMarkdownToSpeech(body.text, {
          addSpeakerNotes: false,
        }),
      }
    );
    await audioStorage.setItem(`/${body.path}.json`, audio);
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error generating audio",
    });
  }
  return audio;
});
