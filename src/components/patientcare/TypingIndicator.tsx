import { motion } from "framer-motion";
import { BotAvatar } from "./BotAvatar";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-4"
      role="status"
      aria-label="PatientCare Bot is typing"
    >
      <BotAvatar size="sm" />
      <div className="flex items-center gap-1.5 rounded-full bg-secondary px-6 py-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot size-2 rounded-full bg-primary-soft" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </motion.div>
  );
}
