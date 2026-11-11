import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, MessageSquareMore, Paperclip, Pill, RotateCw, SendHorizontal, Stethoscope, TriangleAlert } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { InputGroupAddon } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import type { ChatMode, PatientUIMessage } from "@/lib/medical/types";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./ChatMessage";
import { Header } from "./Header";
import { PhotoUploadDialog, type PhotoSelection } from "./PhotoUploadDialog";
import { TypingIndicator } from "./TypingIndicator";
import { Welcome } from "./Welcome";

const PLACEHOLDERS: Record<ChatMode, string> = {
  symptom: "Describe your health concern or enter a medicine name...",
  medicine: "Enter a medicine name, e.g. Paracetamol...",
  photo: "Ask about the medicine photo, or attach one with the clip...",
};

const MODES: { mode: ChatMode; label: string; icon: typeof Pill }[] = [
  { mode: "symptom", label: "Symptoms", icon: MessageSquareMore },
  { mode: "medicine", label: "Medicine", icon: Pill },
  { mode: "photo", label: "Photo scan", icon: Camera },
];

function readableError(error: Error | undefined) {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    /* not JSON */
  }
  if (/fetch|network|Failed to fetch/i.test(error.message)) {
    return "Can't reach PatientCare Bot. Please check your internet connection and try again.";
  }
  return error.message || "Something went wrong. Please try again.";
}

export function PatientCareChat() {
  const [mode, setMode] = useState<ChatMode>("symptom");
  const [photoOpen, setPhotoOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport<PatientUIMessage>({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error, stop, setMessages, regenerate, clearError } = useChat<PatientUIMessage>({
    transport,
  });

  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  const assistantHasContent =
    last?.role === "assistant" && last.parts.some((p) => (p.type === "text" && p.text) || p.type.startsWith("tool-"));
  const showTyping = status === "submitted" || (status === "streaming" && !assistantHasContent);

  const focusInput = useCallback(() => setTimeout(() => textareaRef.current?.focus(), 30), []);

  useEffect(() => {
    if (status === "ready") focusInput();
  }, [status, focusInput]);

  const selectMode = (next: ChatMode) => {
    setMode(next);
    if (next === "photo") setPhotoOpen(true);
    else focusInput();
  };

  const send = (text: string, files?: PatientUIMessage["parts"], forMode: ChatMode = mode) => {
    clearError();
    void sendMessage(
      {
        role: "user",
        parts: [...(files ?? []), ...(text ? [{ type: "text" as const, text }] : [])],
        metadata: { createdAt: Date.now() },
      },
      { body: { mode: forMode } },
    );
  };

  const handleSubmit = ({ text }: PromptInputMessage) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    send(trimmed);
  };

  const handlePhoto = (photo: PhotoSelection) => {
    setMode("photo");
    send(
      photo.note || "Please analyze this medicine photo.",
      [{ type: "file", mediaType: photo.mediaType, url: photo.dataUrl, filename: photo.filename }],
      "photo",
    );
  };

  const clearChat = () => {
    void stop();
    setMessages([]);
    clearError();
    focusInput();
  };

  const errorText = readableError(error);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {/* Decorative medical shapes */}
      <div aria-hidden className="decor-cross pointer-events-none absolute top-48 -left-12 hidden size-64 rounded-3xl lg:block" />
      <Stethoscope
        aria-hidden
        strokeWidth={1.2}
        className="pointer-events-none absolute top-36 -right-6 hidden size-64 text-lavender-strong lg:block"
      />

      <Header onClear={clearChat} canClear={messages.length > 0} />

      <Conversation className="relative z-[1] min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-6xl gap-6 px-4 pt-4 pb-6 sm:px-8">
          <Welcome activeMode={mode} onSelect={selectMode} />
          <div className="mt-2 flex flex-col gap-6">
            {messages.map((m, i) => (
              <ChatMessage key={m.id} message={m} streaming={status === "streaming" && i === messages.length - 1} />
            ))}
            <AnimatePresence>{showTyping && <TypingIndicator key="typing" />}</AnimatePresence>
            {errorText && status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-emergency/25 bg-emergency-soft px-4 py-3 text-sm text-emergency-foreground"
              >
                <TriangleAlert className="size-4 shrink-0" />
                <span className="flex-1">{errorText}</span>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => void regenerate({ body: { mode } })}>
                  <RotateCw /> Try again
                </Button>
              </motion.div>
            )}
          </div>
        </ConversationContent>
        <ConversationScrollButton className="bottom-4" />
      </Conversation>

      <div className="relative z-[2] mx-auto w-full max-w-6xl px-4 pb-3 sm:px-8 sm:pb-5">
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto">
          {MODES.map(({ mode: m, label, icon: Icon }) => (
            <button
              key={m}
              type="button"
              onClick={() => selectMode(m)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode === m && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative size-3.5" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <PromptInput
          onSubmit={handleSubmit}
          className="[&_[data-slot=input-group]]:rounded-full [&_[data-slot=input-group]]:border-border [&_[data-slot=input-group]]:bg-card [&_[data-slot=input-group]]:shadow-composer [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-primary/30"
        >
          <InputGroupAddon align="inline-start" className="pl-3 sm:pl-4">
            <PromptInputButton
              aria-label="Attach medicine photo"
              onClick={() => setPhotoOpen(true)}
              className="size-10 rounded-full text-muted-foreground hover:text-primary [&_svg]:size-5!"
            >
              <Paperclip />
            </PromptInputButton>
          </InputGroupAddon>
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            placeholder={PLACEHOLDERS[mode]}
            maxLength={4000}
            className="min-h-14 py-4 text-base placeholder:text-muted-foreground md:text-base"
          />
          <InputGroupAddon align="inline-end" className="pr-2">
            <PromptInputSubmit
              status={status}
              onStop={() => void stop()}
              variant="send"
              className="size-11 rounded-full sm:size-12 [&_svg]:size-5"
              aria-label={busy ? "Stop" : "Send message"}
            >
              {busy ? undefined : <SendHorizontal />}
            </PromptInputSubmit>
          </InputGroupAddon>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground sm:text-xs">
          PatientCare Bot provides general medical information for educational purposes only. It does not provide medical
          diagnoses or prescriptions. Always consult a qualified healthcare professional.
        </p>
      </div>

      <PhotoUploadDialog open={photoOpen} onOpenChange={setPhotoOpen} onAnalyze={handlePhoto} busy={busy} />
    </div>
  );
}
