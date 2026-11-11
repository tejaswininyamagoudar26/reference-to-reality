# PatientCare Bot — AI Medical Information Assistant

General health information in simple words: describe symptoms, look up verified medicine
information, or scan a medicine photo. Not a diagnosis or prescription tool.

## Features
| Feature | How it works |
| --- | --- |
| Symptom checker | Rule-based emergency screening runs first (server), then Lovable AI answers with strict safety rules (no diagnosis, no doses). Emergency signs show an urgent-care alert. |
| Medicine information | Name normalized with NLM **RxNorm**, label fetched from the U.S. **FDA (openFDA / DailyMed)**. AI only explains the verified label; if nothing is found it says so. |
| Medicine photo scanner | JPG/PNG/WEBP up to 10 MB (type + file-signature checked). Vision AI reads the packaging text (OCR), then the readable name is matched against the FDA label. Loose pills are never identified by appearance. |

No login. Conversation lives only in the current browser session; photos are not stored.

## Architecture
- React 19 + TanStack Start, Tailwind v4, Framer Motion, AI Elements chat components.
- Server runs as TypeScript server routes on the edge (Lovable's hosting does not run Python/FastAPI; the endpoints below are the equivalent).
- AI: Lovable AI Gateway (`LOVABLE_API_KEY`, managed automatically and never sent to the browser).

```
src/lib/medical/
  safety.ts                 emergency warning-sign rules
  image-validation.ts       upload format/size/signature checks
  medicine-lookup.server.ts RxNorm + openFDA lookup
  prompts.server.ts         safety + mode instructions
  chat.server.ts            streaming AI chat with lookup_medicine tool
  rate-limit.server.ts      per-IP rate limiting
src/routes/api/
  chat.ts                   POST /api/chat
  medicine/search.ts        POST /api/medicine/search
  health.ts                 GET  /api/health
src/components/patientcare/ UI
```

## API
- `GET /api/health` → `{ status, aiConfigured, ... }`
- `POST /api/medicine/search` body `{ "name": "Paracetamol", "activeIngredient": null }` → verified label JSON (404 when not found). No AI involved.
- `POST /api/chat` body `{ "mode": "symptom" | "medicine" | "photo", "messages": UIMessage[] }` → AI SDK UI-message stream. Photos are `file` parts with a `data:image/...;base64` URL.

Errors return JSON `{ "error": "..." }` with 400 (invalid input / bad image), 413 (too large), 429 (rate limit), 503 (AI not configured).

## Configuration
Nothing to set up inside Lovable — the AI key is provided by Lovable Cloud automatically. See `.env.example` for the variable names.

## Testing
- `bunx vitest run` — emergency rules, upload rules, medicine name matching.
- Postman/curl: call the endpoints above, e.g. `curl -X POST /api/medicine/search -d '{"name":"Augmentin"}' -H 'content-type: application/json'`.
