import { PhoneCall, TriangleAlert } from "lucide-react";
import type { EmergencySign } from "@/lib/medical/safety";

export function EmergencyAlert({ signs }: { signs: EmergencySign[] }) {
  const selfHarm = signs.some((s) => s.category === "self-harm");
  return (
    <div role="alert" className="rounded-2xl border border-emergency/30 bg-emergency-soft p-4 text-emergency-foreground">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emergency text-primary-foreground">
          <TriangleAlert className="size-5" />
        </span>
        <div className="space-y-1.5 text-sm">
          <p className="font-display text-base font-bold">This may need urgent medical attention</p>
          <p>
            We noticed: <strong>{signs.map((s) => s.label).join(", ")}</strong>. Please don't wait for an online answer.
          </p>
          <p className="flex items-center gap-2 font-semibold">
            <PhoneCall className="size-4" />
            Call your local emergency number now — 112 (India), 911 (US), 999 (UK) — or go to the nearest emergency department.
          </p>
          {selfHarm && (
            <p>
              If you're thinking about harming yourself, you're not alone. Reach out to a crisis helpline (e.g. Tele-MANAS 14416 in
              India, 988 in the US) or someone you trust right now.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
