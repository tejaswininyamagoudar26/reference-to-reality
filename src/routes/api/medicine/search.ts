import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { lookupMedicine } from "@/lib/medical/medicine-lookup.server";
import { clientKey, jsonError, rateLimit } from "@/lib/medical/rate-limit.server";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  activeIngredient: z.string().trim().max(80).nullable().optional(),
});

/** Verified medicine label lookup (no AI). POST { "name": "Paracetamol" } */
export const Route = createFileRoute("/api/medicine/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const limit = rateLimit(`medicine:${clientKey(request)}`, 30);
        if (!limit.ok) return jsonError(429, "Too many requests. Please wait a moment.");
        let body: z.infer<typeof schema>;
        try {
          body = schema.parse(await request.json());
        } catch {
          return jsonError(400, "Please provide a medicine name between 2 and 80 characters.");
        }
        const result = await lookupMedicine(body.name, body.activeIngredient ?? null);
        return Response.json(result, { status: result.found ? 200 : 404 });
      },
    },
  },
});
