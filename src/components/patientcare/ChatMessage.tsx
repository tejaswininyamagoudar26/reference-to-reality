import { format } from "date-fns";
import { CheckCheck, Database } from "lucide-react";
import { motion } from "framer-motion";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import type { MedicineLookupResult, PatientUIMessage } from "@/lib/medical/types";
import { BotAvatar } from "./BotAvatar";
import { EmergencyAlert } from "./EmergencyAlert";
import { MedicineCard, MedicineLabelExcerpts } from "./MedicineCard";
import type { ToolUIPart } from "ai";

function Time({ ts, read }: { ts?: number | undefined; read?: boolean }) {
  if (!ts) return null;
  return (
    <span className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
      {format(ts, "p")}
      {read && <CheckCheck className="size-4 text-primary" />}
    </span>
  );
}

export function ChatMessage({ message, streaming }: { message: PatientUIMessage; streaming: boolean }) {
  const createdAt = message.metadata?.createdAt;

  if (message.role === "user") {
    const text = message.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    const images = message.parts.filter((p) => p.type === "file");
    return (
      <motion.div initial={{ opacity: 0, y: 10, x: 8 }} animate={{ opacity: 1, y: 0, x: 0 }} transition={{ duration: 0.25 }}>
        <Message from="user" className="max-w-[88%] sm:max-w-[70%]">
          <MessageContent className="rounded-3xl! bg-chat-user! px-6! py-4! text-base text-chat-user-foreground! shadow-bubble">
            {images.map((img, i) => (
              <img key={i} src={img.url} alt="Uploaded medicine" className="max-h-56 rounded-2xl border object-contain" />
            ))}
            {text && <p className="whitespace-pre-wrap">{text}</p>}
            <Time ts={createdAt} read />
          </MessageContent>
        </Message>
      </motion.div>
    );
  }

  const hasText = message.parts.some((p) => p.type === "text" && p.text.length > 0);
  const hasVisible = hasText || message.parts.some((p) => p.type === "data-emergency" || p.type.startsWith("tool-"));
  if (!hasVisible) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex gap-3 sm:gap-4">
      <BotAvatar size="sm" className="mt-1 hidden sm:block" />
      <Message from="assistant" className="max-w-full sm:max-w-[85%]">
        <MessageContent className="w-full gap-3 rounded-3xl border bg-card px-5 py-4 text-base shadow-card">
          {message.parts.map((part, i) => {
            if (part.type === "data-emergency") {
              return <EmergencyAlert key={i} signs={part.data.signs} />;
            }
            if (part.type === "tool-lookup_medicine") {
              const tp = part as ToolUIPart;
              const output = tp.state === "output-available" ? (tp.output as MedicineLookupResult) : undefined;
              const name = (tp.input as { name?: string } | undefined)?.name;
              return (
                <div key={i} className="space-y-2">
                  <Tool defaultOpen={false} className="mb-0 rounded-2xl bg-muted/40">
                    <ToolHeader
                      type={tp.type}
                      state={tp.state}
                      title={`Verified lookup${name ? `: ${name}` : ""}`}
                      className="[&_svg:first-child]:text-primary"
                    />
                    <ToolContent className="space-y-3 p-3">
                      <ToolInput input={tp.input} />
                      <ToolOutput
                        output={output ? <MedicineLabelExcerpts result={output} /> : undefined}
                        errorText={tp.errorText}
                      />
                    </ToolContent>
                  </Tool>
                  {output && <MedicineCard result={output} />}
                  {tp.state === "input-available" && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Database className="size-4 animate-pulse text-primary" /> Checking the FDA medicine database…
                    </p>
                  )}
                </div>
              );
            }
            if (part.type === "text" && part.text) {
              return (
                <MessageResponse key={i} className="chat-prose" isAnimating={streaming}>
                  {part.text}
                </MessageResponse>
              );
            }
            return null;
          })}
          <Time ts={createdAt} />
        </MessageContent>
      </Message>
    </motion.div>
  );
}
