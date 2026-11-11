import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageUp, RefreshCw, ScanLine, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPT_ATTRIBUTE, checkImageFile } from "@/lib/medical/image-validation";
import { cn } from "@/lib/utils";

export interface PhotoSelection {
  dataUrl: string;
  mediaType: string;
  filename: string;
  note: string;
}

export function PhotoUploadDialog({
  open,
  onOpenChange,
  onAnalyze,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze: (photo: PhotoSelection) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; type: string; size: number } | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState("");

  const reset = useCallback(() => {
    setFile(null);
    setDataUrl(null);
    setProgress(0);
    setError(null);
    setNote("");
  }, []);

  const load = useCallback((f: File) => {
    setError(null);
    const check = checkImageFile(f);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setFile({ name: f.name, type: f.type, size: f.size });
    setDataUrl(null);
    setProgress(0);
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onerror = () => {
      setError("This image could not be read. Please try another photo.");
      setFile(null);
    };
    reader.onload = () => {
      setProgress(100);
      setDataUrl(String(reader.result));
    };
    reader.readAsDataURL(f);
  }, []);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(reset, 200);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-3xl border bg-card p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Upload medicine photo</DialogTitle>
          <DialogDescription>
            Take a clear photo of the box, strip or label so the name and strength are readable.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="hidden"
          aria-label="Choose medicine photo"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) load(f);
            e.target.value = "";
          }}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="drop"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) load(f);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragging ? "border-primary bg-secondary" : "border-input bg-background",
              )}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
                <ImageUp className="size-7" />
              </span>
              <div>
                <p className="font-semibold">Drag & drop your photo here</p>
                <p className="text-sm text-muted-foreground">JPG, JPEG, PNG or WEBP · up to 10 MB</p>
              </div>
              <Button type="button" variant="soft" className="rounded-full" onClick={() => inputRef.current?.click()}>
                Browse files
              </Button>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border bg-muted">
                {dataUrl ? (
                  <img src={dataUrl} alt="Selected medicine" className="max-h-64 w-full object-contain" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Loading preview…</div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
                    <RefreshCw /> Replace
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={reset}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-1.5 bg-secondary" aria-label="Upload progress" />
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Optional: add a question about this medicine…"
                className="min-h-16 rounded-xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p role="alert" className="rounded-xl bg-emergency-soft px-3 py-2 text-sm text-emergency-foreground">
            {error}
          </p>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
          Loose tablets can't be identified reliably by color or shape. Photos are analyzed once and not stored.
        </p>

        <Button
          type="button"
          size="lg"
          className="w-full rounded-full"
          disabled={!dataUrl || busy}
          onClick={() => {
            if (!dataUrl || !file) return;
            onAnalyze({ dataUrl, mediaType: file.type, filename: file.name, note: note.trim() });
            close(false);
          }}
        >
          <ScanLine /> Analyze photo
        </Button>
      </DialogContent>
    </Dialog>
  );
}
