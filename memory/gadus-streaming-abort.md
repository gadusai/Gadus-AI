---
name: Gadus streaming abort
description: How the stop-streaming feature works; pattern to follow for any streaming changes.
---

## Pattern
- `streamChat()` in `artifacts/gadus/src/lib/stream.ts` accepts an optional `signal?: AbortSignal`.
- The signal is passed directly to `fetch()`.
- On `AbortError`, `streamChat` calls `onComplete()` (not `onError`) so the UI cleans up gracefully.
- In `ChatArea.tsx`, an `abortControllerRef = useRef<AbortController | null>(null)` is created per-send.
- A red stop button (Square icon) replaces the mic button while `isStreaming` is true.
- Clicking stop calls `abortControllerRef.current?.abort()`.

**Why:** AbortError must be caught separately from real errors — calling onError on abort causes confusing UI state.
