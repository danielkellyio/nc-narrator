import { ElevenLabsClient } from "elevenlabs";

export const ncNarratorUseElevenLabs = () => {
  const config = useRuntimeConfig();
  return new ElevenLabsClient({
    apiKey: config.elevenlabsApiKey,
  });
};
/**
 * Options for converting markdown to speech-ready text for ElevenLabs
 */
export interface ncNarratorMarkdownToSpeechOptions {
  /** Whether to add pauses using ElevenLabs break tags */
  addPauses?: boolean;
  /** Default short pause duration in seconds */
  shortPauseDuration?: number;
  /** Default medium pause duration in seconds */
  mediumPauseDuration?: number;
  /** Default long pause duration in seconds */
  longPauseDuration?: number;
  /** Whether to preserve emphasis markers for TTS inflection */
  preserveEmphasis?: boolean;
  /** Whether to add speaker notes for code blocks, lists, etc. */
  addSpeakerNotes?: boolean;
}

/**
 * Converts Markdown text to plain text optimized for ElevenLabs text-to-speech
 * Uses ElevenLabs specific SSML tags for pauses: <break time="x.xs" />
 *
 * @param markdown - The markdown text to convert
 * @param options - Configuration options
 * @returns Plain text suitable for ElevenLabs TTS with proper break tags
 */
export function ncNarratorMarkdownToSpeech(
  markdown: string,
  options: ncNarratorMarkdownToSpeechOptions = {}
): string {
  const {
    addPauses = true,
    shortPauseDuration = 0.3,
    mediumPauseDuration = 0.7,
    longPauseDuration = 1.0,
    preserveEmphasis = false,
    addSpeakerNotes = true,
  } = options;

  if (!markdown) return "";

  let text = markdown;

  // Remove YAML frontmatter
  text = text.replace(/^---[\s\S]*?---/, "");

  // remove any leading or trailing newlines
  text = text.replace(/\\n/g, "\n").trim();

  // Handle headings with pauses - using positive lookbehind to ensure we don't match within paragraphs
  text = text.replace(/#{1,6}\s+(.+)$/gm, (_, heading) => {
    return `${heading}${
      addPauses ? ` <break time="${longPauseDuration}s" />` : ""
    }`;
  });

  // Handle emphasis markers
  if (!preserveEmphasis) {
    text = text.replace(/\*\*(.+?)\*\*/g, "$1"); // Remove bold
    text = text.replace(/\*(.+?)\*/g, "$1"); // Remove italics
    text = text.replace(/_(.+?)_/g, "$1"); // Remove underline
  }

  // Handle lists
  text = text.replace(/^\s*[-*+]\s+(.+)/gm, (_, item) => {
    const prefix = addSpeakerNotes ? "Bullet point: " : "";
    return `${prefix}${item}${
      addPauses ? ` <break time="${mediumPauseDuration}s" />` : ""
    }`;
  });

  // Handle numbered lists
  text = text.replace(/^\s*(\d+)\.\s+(.+)/gm, (_, number, item) => {
    const prefix = addSpeakerNotes ? `Item ${number}: ` : ``;
    return `${prefix}${item}${
      addPauses ? ` <break time="${mediumPauseDuration}s" />` : ""
    }`;
  });

  // Handle code blocks
  text = text.replace(/```[\s\S]*?```/g, () => {
    if (!addSpeakerNotes) return "";
    return `Code block omitted. <break time="${mediumPauseDuration}s" />`;
  });

  // Handle inline code
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    if (!addSpeakerNotes) return code;
    return `code: ${code}`;
  });

  // handle strikeouts
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Handle links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Handle blockquotes
  text = text.replace(/^\s*>\s*(.+)/gm, (_, quote) => {
    const prefix = addSpeakerNotes ? "Quote: " : "";
    return `${prefix}${quote}${
      addPauses ? ` <break time="${mediumPauseDuration}s" />` : ""
    }`;
  });

  // Handle paragraphs - replace multiple newlines with a space and break tag
  text = text.replace(/\n\n+/g, (match, offset, str) => {
    // Don't add medium break if it follows a heading (which already has a long break)
    const precedingText = str.slice(0, offset).trim();
    if (
      precedingText.endsWith(`<break time="${longPauseDuration}s" />`) ||
      precedingText.endsWith(`<break time="${mediumPauseDuration}s" />`) ||
      precedingText.endsWith(`<break time="${shortPauseDuration}s" />`)
    ) {
      return " ";
    }
    return addPauses ? ` <break time="${mediumPauseDuration}s" /> ` : " ";
  });

  // Clean up any remaining markdown artifacts
  text = text.replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1");

  // Final cleanup: normalize spaces and remove any remaining newlines
  text = text.replace(/\\n+/g, " ").replace(/\s+/g, " ").trim();

  return text;
}
