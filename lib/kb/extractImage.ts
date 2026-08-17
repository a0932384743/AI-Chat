import { generateText } from "ai";
import { VISION_MODEL, litellm } from "@/lib/litellm";

const TRANSCRIBE_PROMPT =
  "Transcribe all visible text in this image verbatim. Then, on a new line, " +
  "add a concise description of what the image shows. If there is no text, " +
  "only provide the description.";

/** Uses a vision-capable chat model (via LiteLLM) to turn an image into indexable text. */
export async function extractImageText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const { text } = await generateText({
    model: litellm(VISION_MODEL),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: TRANSCRIBE_PROMPT },
          { type: "image", image: buffer, mimeType },
        ],
      },
    ],
  });

  return text;
}
