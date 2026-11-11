import { BadgeCheck, ExternalLink, FileSearch, Pill } from "lucide-react";
import type { MedicineLookupResult } from "@/lib/medical/types";
import { cn } from "@/lib/utils";

export function MedicineCard({ result }: { result: MedicineLookupResult }) {
  if (!result.found) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed bg-card p-4 text-sm">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileSearch className="size-5" />
        </span>
        <div>
          <p className="font-semibold">“{result.query}” could not be verified</p>
          <p className="text-muted-foreground">{result.reason}</p>
        </div>
      </div>
    );
  }
  const rx = result.prescriptionStatus === "Prescription only";
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pill-soft text-pill">
          <Pill className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-bold capitalize">{result.query}</p>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                rx ? "bg-emergency-soft text-emergency-foreground" : "bg-success-soft text-success",
              )}
            >
              {result.prescriptionStatus}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Generic: <span className="font-medium capitalize text-foreground">{result.genericName?.toLowerCase() ?? "—"}</span>
            {result.manufacturer && <> · {result.manufacturer}</>}
          </p>
          {result.matchedBy === "active-ingredient" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Matched via active ingredient “{result.matchedTerm}”. Please confirm the brand with a pharmacist.
            </p>
          )}
          <a
            href={result.source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <BadgeCheck className="size-3.5" />
            {result.source.name}
            {result.source.lastUpdated && <span className="text-muted-foreground">· updated {result.source.lastUpdated}</span>}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

const LABELS: Record<string, string> = {
  purpose: "Purpose",
  uses: "Uses",
  boxedWarning: "Boxed warning",
  warnings: "Warnings",
  doNotUse: "Do not use",
  askDoctor: "Ask a doctor",
  stopUse: "Stop use",
  sideEffects: "Side effects",
  precautions: "Precautions",
  pregnancy: "Pregnancy",
  interactions: "Interactions",
};

/** Raw verified label excerpts shown inside the collapsed tool details. */
export function MedicineLabelExcerpts({ result }: { result: MedicineLookupResult }) {
  if (!result.found) return <p className="p-3 text-sm text-muted-foreground">{result.reason}</p>;
  return (
    <dl className="space-y-2 p-3 text-xs leading-relaxed">
      {Object.entries(result.sections).map(([k, v]) => (
        <div key={k}>
          <dt className="font-semibold text-foreground">{LABELS[k] ?? k}</dt>
          <dd className="text-muted-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
