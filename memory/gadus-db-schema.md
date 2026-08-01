---
name: Gadus DB schema notes
description: How the DB package and TypeScript project references interact; what to do after schema changes.
---

## TypeScript project references
- `artifacts/api-server` uses TypeScript project references pointing to `lib/db`.
- After any schema change in `lib/db/src/schema/`, you MUST run `cd lib/db && npx tsc --build` to regenerate declaration files before the api-server's `tsc --noEmit` check will pass.
- The api-server build itself uses esbuild (not tsc), so it still runs fine without this step — it's only the type-check that fails.

## DB push
- `cd lib/db && npx drizzle-kit push` applies schema changes to the dev database.
- Always run push after schema edits, then restart the api-server workflow.

## Known pre-existing type errors (do not fix unless asked)
- `src/routes/files.ts` — multer lacks @types, pdf-parse.default pattern
- `src/routes/memories.ts` — eq() overload issue with array value

## Schema columns (as of last update)
- conversations: id, userId, title, mode, shareToken, isShared, isPinned, createdAt, updatedAt
- messages: id, conversationId, role, content, reaction, createdAt
- user_memories: id, userId, key, value, updatedAt
