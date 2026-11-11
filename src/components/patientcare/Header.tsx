import { RotateCcw, Sparkle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "./BotAvatar";

export function Header({ onClear, canClear }: { onClear: () => void; canClear: boolean }) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
      <div className="flex items-center gap-3">
        <BotAvatar size="md" />
        <div className="leading-tight">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-3xl">
            PatientCare <span className="text-primary">Bot</span>
          </h1>
          <p className="text-xs text-muted-foreground sm:text-base">Your Simple Medical Assistant</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canClear && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button variant="ghost" size="sm" onClick={onClear} className="rounded-full text-muted-foreground">
              <RotateCcw />
              <span className="hidden sm:inline">Clear chat</span>
            </Button>
          </motion.div>
        )}
        <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground sm:px-5 sm:py-2.5 sm:text-base">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <Sparkle className="hidden size-4 text-primary sm:block" />
          <span className="hidden min-[420px]:inline">AI Medical Assistant</span>
        </div>
      </div>
    </header>
  );
}
