import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          status: "ok",
          service: "PatientCare Bot",
          aiConfigured: Boolean(process.env["LOVABLE_API_KEY"]),
          medicineSource: "openFDA + RxNorm",
          time: new Date().toISOString(),
        }),
    },
  },
});
