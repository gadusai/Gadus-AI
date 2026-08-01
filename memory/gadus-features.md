---
name: Gadus feature set
description: What's already built in Gadus AI so future work doesn't duplicate it.
---

## Already built (do not rebuild)
- Clerk auth (email + Google OAuth) via VITE_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY
- 12 AI modes with rich specialized system prompts in api-server/src/routes/chat.ts (MODE_SYSTEM_PROMPTS)
- File upload (PDF, Word, Excel, CSV, images) via /api/files/analyze
- Voice input (Web Speech API) + TTS in use-voice-input.ts hook
- Memory system — extracts user facts after each response, persisted in user_memories table
- Reactions (thumbs up/down) on messages via /api/reactions
- Insights dashboard (Recharts) in pages/Insights.tsx
- Prompt library (50 expert prompts) in components/PromptLibrary.tsx
- Streaming word-by-word via SSE in lib/stream.ts
- Floating chat widget (bottom-right) in components/FloatingWidget.tsx
- Conversation sharing (public URL) via /api/conversations/:id/share + pages/SharedConversation.tsx
- Dark/light mode toggle in Sidebar header
- Conversation search in Sidebar
- Web URL auto-browsing (paste URL into chat) via /api/browse
- Image generation via Replicate in /api/images/generate
- Stop streaming button (red square) that replaces mic during active generation
- Conversation pinning — isPinned in DB, POST /conversations/:id/pin, pinned section in Sidebar
- Keyboard shortcuts — ⌘K new chat, ⌘/ prompt library, ⌘⇧E export, ⌘⇧S share, ⌘⇧P pin, ? = modal
- PDF/HTML export — styled HTML opens in new tab + triggers print dialog
- Smart AI-generated conversation titles — Groq generates 4-7 word title after first response

## NOT yet built
- Task manager (async multi-step jobs)
- Slack / email / calendar integrations
- Shared conversation gallery / upvoting
