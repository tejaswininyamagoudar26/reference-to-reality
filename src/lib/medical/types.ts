import type { UIMessage } from "ai";
import type { EmergencySign } from "./safety";

export type ChatMode = "symptom" | "medicine" | "photo";

export interface MedicineLookupFound {
  found: true;
  query: string;
  matchedBy: "name" | "active-ingredient";
  matchedTerm: string;
  brandNames: string[];
  genericName: string | null;
  manufacturer: string | null;
  prescriptionStatus: "Prescription only" | "Over-the-counter" | "Not stated in label";
  routes: string[];
  sections: Record<string, string>;
  source: { name: string; url: string; lastUpdated: string | null };
}

export interface MedicineLookupNotFound {
  found: false;
  query: string;
  reason: string;
}

export type MedicineLookupResult = MedicineLookupFound | MedicineLookupNotFound;

export type PatientMessageMetadata = { createdAt?: number };

export type PatientDataParts = {
  emergency: { signs: EmergencySign[] };
};

export type PatientUIMessage = UIMessage<PatientMessageMetadata, PatientDataParts>;
