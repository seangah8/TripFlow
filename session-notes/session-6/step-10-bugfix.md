# Session 6 (v6) — Post-implementation bugfix: Anthropic rejects schema bounds on integer/string properties

## What happened

You ran the app after Step 9 and hit a live 400 from Anthropic on every trip generation:

```
BadRequestError: 400 {"type":"error","error":{"type":"invalid_request_error",
"message":"output_config.format.schema: For 'integer' type, properties maximum,
minimum, multipleOf are not supported"}}
```

Step 1's assumption — that `minimum`/`maximum`/`multipleOf`/`maxLength` might be silently
*unenforced* by Anthropic's structured-output `json_schema` — was wrong in a more serious way:
they're not silently ignored, the API **rejects the request outright** with a 400. This broke
every single trip generation, not just curation quality.

## What was fixed

`backend/src/api/services/claudeService.ts` — `CURATION_SCHEMA`'s `estimatedMinutes` property
dropped `minimum`/`maximum`/`multipleOf` (now just `{ type: 'integer' }`), and `reasoning`
dropped `maxLength` (now just `{ type: 'string' }`). Updated the surrounding comments to
reflect that these bounds are enforced **entirely** in code now — `extractSelectedPlaces`'s
existing defensive clamp/round/truncate logic (built in Step 1, originally meant as a
belt-and-suspenders safety net) is now the *only* place these bounds are enforced; the system
prompt's natural-language instructions to Claude are the only other lever. No test changes were
needed — `claudeService.test.ts` never asserted on the removed schema fields.

## Why this wasn't caught earlier

Steps 1-9 all verified via `npm run typecheck`/`npm test`, which mock the Anthropic client and
never send a real request — the malformed schema only surfaces as an error once a real API call
is made. `/test-ai-pipeline` (the one step that does call the real API) wasn't run until you
tried the app yourself; running it right after Step 1 would have caught this immediately.

## Verification

`npm run typecheck --prefix backend` and `npm test --prefix backend` (42/42) still clean.
`npm run test:ai-pipeline --prefix backend` against the real Google Places + Anthropic APIs
(Lisbon, 4 days, museums+food/couple/mid-range): 23 curated stops across 4 days, every stop has
a real `estimatedMinutes` (all multiples of 15, within 15-240) and a concise, on-theme
`reasoning` string. No `max_tokens` truncation, no schema errors. Elapsed 32.0s.

## Suggested commit title

`fix: remove unsupported minimum/maximum/multipleOf/maxLength from Claude's structured-output schema`
