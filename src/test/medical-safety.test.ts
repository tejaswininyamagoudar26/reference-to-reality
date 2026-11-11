import { describe, expect, it } from "vitest";
import { detectEmergencySigns } from "@/lib/medical/safety";
import { checkImageDataUrl, checkImageFile, MAX_IMAGE_BYTES } from "@/lib/medical/image-validation";
import { isCloseMatch } from "@/lib/medical/medicine-lookup.server";

describe("emergency screening", () => {
  it("flags chest pain", () => {
    expect(detectEmergencySigns("I have chest pain spreading to my left arm").map((s) => s.category)).toContain("cardiac");
  });
  it("flags trouble breathing", () => {
    expect(detectEmergencySigns("my son can't breathe properly").map((s) => s.category)).toContain("breathing");
  });
  it("flags thoughts of self-harm", () => {
    expect(detectEmergencySigns("I want to end my life").map((s) => s.category)).toContain("self-harm");
  });
  it("does not flag an ordinary cold", () => {
    expect(detectEmergencySigns("I have a cough, blocked nose, and mild fever.")).toEqual([]);
  });
});

describe("medicine photo upload rules", () => {
  it("accepts a 5 MB PNG", () => {
    expect(checkImageFile({ type: "image/png", size: 5 * 1024 * 1024 }).ok).toBe(true);
  });
  it("rejects files over 10 MB", () => {
    expect(checkImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 }).ok).toBe(false);
  });
  it("rejects GIF and PDF files", () => {
    expect(checkImageFile({ type: "image/gif", size: 1000 }).ok).toBe(false);
    expect(checkImageFile({ type: "application/pdf", size: 1000 }).ok).toBe(false);
  });
  it("rejects a file labelled PNG whose bytes are not an image", () => {
    const fake = `data:image/png;base64,${btoa("hello this is not an image at all")}`;
    expect(checkImageDataUrl(fake).ok).toBe(false);
  });
  it("accepts real PNG bytes", () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    expect(checkImageDataUrl(`data:image/png;base64,${png}`).ok).toBe(true);
  });
});

describe("medicine name matching", () => {
  it("tolerates a small typo", () => {
    expect(isCloseMatch("amoxicilin", "amoxicillin")).toBe(true);
  });
  it("rejects a different product name", () => {
    expect(isCloseMatch("dolo", "no dolo")).toBe(false);
  });
});
