import { createOpenAI } from "@ai-sdk/openai";
import {
  APICallError,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
} from "ai";
import { z } from "zod";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";
import { checkImageDataUrl } from "./image-validation";
import { lookupMedicine } from "./medicine-lookup.server";
import { buildInstructions } from "./prompts.server";
import { clientKey, jsonError, rateLimit } from "./rate-limit.server";
import { detectEmergencySigns } from "./safety";
import type { ChatMode, PatientUIMessage } from "./types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const MAX_TEXT = 4000;
const MAX_IMAGES_KEPT = 3;

const bodySchema = z.object({
  mode: z.enum(["symptom", "medicine", "photo"]).default("symptom"),
  messages: z
    .array(
      z
        .object({
          id: z.string().max(200),
          role: z.enum(["user", "assistant"]),
          parts: z.array(z.record(z.unknown())).max(60),
        })
        .passthrough(),
    )
    .min(1)
    .max(60),
});

export function friendlyAiError(error: unknown): string {
  const status = APICallError.isInstance(error) ? error.statusCode : undefined;
  if (status === 401) return "The AI service key is invalid or missing. The app owner needs to reconnect Lovable AI.";
  if (status === 402)
    return "The AI service has run out of credits for this workspace. The app owner can add credits in Lovable workspace settings.";
  if (status === 403) return "The AI service declined this request. Please rephrase or try a different question.";
  if (status === 429) return "Too many requests right now. Please wait a moment and try again.";
  if (status && status >= 500) return "The AI service is temporarily unavailable. Please try again in a minute.";
  if (error instanceof Error && error.name === "AbortError") return "The request was stopped.";
  return "Something went wrong while generating the answer. Please try again.";
}

function lastUserText(messages: PatientUIMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (
    last?.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n") ?? ""
  );
}

/** Validates uploads and keeps only the most recent photos in history to bound request size. */
function sanitizeMessages(messages: PatientUIMessage[]): { messages: PatientUIMessage[]; error?: string } {
  let imagesSeen = 0;
  const out: PatientUIMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m) continue;
    const parts: PatientUIMessage["parts"] = [];
    for (const p of m.parts) {
      if (p.type === "text") {
        if (m.role === "user" && p.text.length > MAX_TEXT) {
          return { messages, error: `Please keep your message under ${MAX_TEXT} characters.` };
        }
        parts.push(p);
      } else if (p.type === "file") {
        if (m.role !== "user") continue;
        const check = checkImageDataUrl(p.url);
        if (!check.ok) {
          if (i === messages.length - 1) return { messages, error: check.error };
          continue;
        }
        imagesSeen++;
        if (imagesSeen > MAX_IMAGES_KEPT) {
          parts.push({ type: "text", text: "[An earlier medicine photo was shared here.]" });
        } else {
          parts.push(p);
        }
      } else if (m.role === "assistant") {
        parts.push(p);
      }
    }
    out.unshift({ ...m, parts } as PatientUIMessage);
  }
  return { messages: out };
}

export async function handleChat(request: Request): Promise<Response> {
  const limit = rateLimit(`chat:${clientKey(request)}`, 20);
  if (!limit.ok) {
    return jsonError(429, "Too many requests. Please wait a moment and try again.", {
      "retry-after": String(limit.retryAfter),
    });
  }

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return jsonError(503, "The AI service is not configured yet. Add the Lovable AI key to enable answers.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 45 * 1024 * 1024) return jsonError(413, "This request is too large.");

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return jsonError(400, "Invalid request. Please refresh the page and try again.");
  }

  const mode = parsed.mode as ChatMode;
  const { messages, error } = sanitizeMessages(parsed.messages as unknown as PatientUIMessage[]);
  if (error) return jsonError(400, error);

  const latestText = lastUserText(messages);
  const lastHasImage = messages.at(-1)?.parts.some((p) => p.type === "file");
  if (!latestText.trim() && !lastHasImage) return jsonError(400, "Please type a message first.");

  const emergency = detectEmergencySigns(latestText);
  const modelMessages = await convertToModelMessages(messages);

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const stream = createUIMessageStream<PatientUIMessage>({
    originalMessages: messages,
    execute: ({ writer }) => {
      if (emergency.length) {
        writer.write({ type: "data-emergency", data: { signs: emergency } });
      }
      const result = streamText({
        model: provider.responses(MODEL),
        instructions: buildInstructions(mode, emergency),
        messages: modelMessages,
        abortSignal: request.signal,
        stopWhen: isStepCount(6),
        tools: {
          lookup_medicine: tool({
            description:
              "Look up verified medicine information (official FDA drug label via RxNorm normalization). Use for any medicine name.",
            inputSchema: z.object({
              name: z.string().describe("Medicine name as written by the user or read from packaging"),
              active_ingredient: z
                .string()
                .nullable()
                .describe("Known active ingredient if the name is a brand, else null"),
            }),
            execute: async ({ name, active_ingredient }) => lookupMedicine(name, active_ingredient),
          }),
        },
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      writer.merge(
        result.toUIMessageStream<PatientUIMessage>({
          sendReasoning: false,
          messageMetadata: ({ part }) => (part.type === "start" ? { createdAt: Date.now() } : undefined),
          onError: (e) => {
            console.error("AI stream error", e);
            return friendlyAiError(e);
          },
        }),
      );
    },
    onError: (e) => {
      console.error("Chat stream error", e);
      return friendlyAiError(e);
    },
  });

  return withLovableAiGatewayRunIdHeader(createUIMessageStreamResponse({ stream }), runIdFetch);
}
