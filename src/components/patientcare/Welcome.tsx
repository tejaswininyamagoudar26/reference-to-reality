import { Camera, MessageSquareMore, Pill } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChatMode } from "@/lib/medical/types";
import { BotAvatar } from "./BotAvatar";

const cards: {
  mode: ChatMode;
  title: string;
  subtitle: string;
  icon: typeof Pill;
  iconClass: string;
}[] = [
  {
    mode: "symptom",
    title: "Describe a Symptom",
    subtitle: "e.g. cough, fever, headache",
    icon: MessageSquareMore,
    iconClass: "bg-secondary text-primary",
  },
  {
    mode: "medicine",
    title: "Check a Medicine",
    subtitle: "Uses, side effects & precautions",
    icon: Pill,
    iconClass: "bg-pill-soft text-pill",
  },
  {
    mode: "photo",
    title: "Upload Medicine Photo",
    subtitle: "Read details from the packaging",
    icon: Camera,
    iconClass: "bg-secondary text-primary",
  },
];

export function Welcome({ activeMode, onSelect }: { activeMode: ChatMode; onSelect: (mode: ChatMode) => void }) {
  return (
    <section className="flex flex-col items-center pt-2 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <BotAvatar size="lg" className="shadow-card-hover rounded-full" />
        <svg
          aria-hidden
          viewBox="0 0 40 40"
          className="absolute -top-3 -right-10 size-12 text-primary-soft sm:-right-12 sm:size-14"
        >
          <path d="M8 4 L5 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 6 L14 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M30 22 L18 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
        className="mt-6 text-3xl font-extrabold tracking-tight sm:text-[2.6rem]"
      >
        Hi! I'm <span className="text-primary">PatientCare Bot</span>{" "}
        <span role="img" aria-label="waving hand">
          👋
        </span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="mt-3 max-w-xl text-base text-muted-foreground sm:text-xl sm:leading-relaxed"
      >
        Tell me your health issue, a medicine name, or upload a medicine photo. I'll explain it in simple terms.
      </motion.p>

      <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          const active = activeMode === card.mode;
          return (
            <motion.button
              key={card.mode}
              type="button"
              onClick={() => onSelect(card.mode)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-card transition-[box-shadow,border-color] duration-200 hover:shadow-card-hover sm:p-5",
                active ? "border-primary/40 ring-2 ring-primary/15" : "border-border",
              )}
            >
              <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14", card.iconClass)}>
                <Icon className="size-6 sm:size-7" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-bold text-foreground sm:text-lg">{card.title}</span>
                <span className="block text-sm text-muted-foreground">{card.subtitle}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
