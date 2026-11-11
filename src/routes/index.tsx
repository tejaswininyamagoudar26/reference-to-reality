import { createFileRoute } from "@tanstack/react-router";
import { PatientCareChat } from "@/components/patientcare/PatientCareChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PatientCare Bot — Your Simple Medical Assistant" },
      {
        name: "description",
        content:
          "Describe symptoms, look up verified medicine information, or scan a medicine photo. General health information in simple words.",
      },
      { property: "og:title", content: "PatientCare Bot — Your Simple Medical Assistant" },
      {
        property: "og:description",
        content: "AI medical information assistant: symptom guidance, verified medicine facts and medicine photo scanning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <PatientCareChat />;
}
