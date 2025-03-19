import type { AudioWithTimestampsResponseModel } from "elevenlabs/api";
import { Buffer } from "node:buffer";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const audioStorage = useStorage("audio");
  const audio = await audioStorage.getItem<AudioWithTimestampsResponseModel>(
    `/${query.path}.json`
  );

  if (!audio) {
    throw createError({
      statusCode: 404,
      statusMessage: "Audio not found",
    });
  }

  const base64Audio = audio.audio_base64;
  const decodedAudio = Buffer.from(base64Audio, "base64");

  setHeader(event, "Content-Type", "audio/mpeg");
  return decodedAudio;
});
