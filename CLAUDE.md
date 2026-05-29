# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # install deps
pnpm start:dev        # dev server (watch mode)
pnpm build            # compile to dist/
pnpm start:prod       # run compiled dist/main.js
pnpm test             # unit tests (jest, rootDir=src)
pnpm test:e2e         # e2e tests (test/jest-e2e.json)
pnpm test:cov         # coverage
pnpm lint             # eslint --fix
pnpm line:setup-menu  # one-time: create LINE Rich Menu (needs assets/rich-menu.png)
```

Run a single test file:
```bash
pnpm test -- src/sessions/sessions.service.spec.ts
```

## Architecture

**Som Assistant** is a NestJS chatbot that connects LINE Official Account ("som") to Gemini Flash for Thai-language conversations. The canonical implementation plan is at [docs/plans/som-assistant-line-integration.md](docs/plans/som-assistant-line-integration.md).

### Request flow

```
LINE OA  →  POST /webhook  →  LineSignatureGuard (HMAC-SHA256)
                               │
                ┌──────────────┘
                │ text message  →  ChatService.handleMessage()
                │                    SessionService.getOrCreateSession(userId)
                │                    GeminiService.generateReply(history)
                │                    SessionService.appendTurn()
                │                    LineService.reply(replyToken, text)
                │
                └ postback (action=reset)  →  ChatService.handleReset()
                                               SessionService.resetSession(userId)
                                               LineService.reply("เริ่มต้นใหม่แล้วค่ะ...")
```

### Planned module layout (not yet implemented)

```
src/
├── config/env.validation.ts     # Zod schema; validates all ENV at startup
├── database/                    # MongooseModule.forRootAsync
├── sessions/                    # Session schema + service (timeout/archive logic)
├── gemini/                      # @google/genai stateless generateContent
├── line/                        # LINE SDK client + LineSignatureGuard
├── chat/                        # Orchestrates session+gemini+line
├── webhook/                     # POST /webhook (LineSignatureGuard applied here only)
├── admin/                       # /sessions/:userId, /push (AdminKeyGuard: x-admin-key)
├── health/                      # GET /health — simple liveness, no DB check
└── scripts/setup-rich-menu.ts   # One-time Rich Menu creation
```

The project is on branch `nestjs-migration`. Currently only the NestJS scaffold exists (`AppController`/`AppService` Hello World + env validation schema). Business logic from the old Elysia branch (`feat/session-context-management`) needs to be ported as NestJS idioms — not copied line-for-line.

### Key design decisions

- **Gemini**: use `ai.models.generateContent({ contents })` (stateless) — not `ai.chats.create()`. History lives in MongoDB so the app scales horizontally and survives restarts. SDK: `@google/genai` (not deprecated `@google/generative-ai`).
- **LINE signature**: `rawBody: true` must be set in `NestFactory.create()` so the guard can read raw bytes for HMAC. Apply the guard only to `WebhookController`.
- **Session timeout**: `SESSION_TIMEOUT_MINUTES` (default 60). `getOrCreateSession()` archives idle sessions and creates a new one transparently.
- **Webhook handler**: always returns 200. Catch errors per-event — don't let a single bad event fail the whole batch.

### Required ENV

| Variable | Default | Required |
|---|---|---|
| `PORT` | `3000` | no |
| `MONGODB_URI` | — | yes |
| `GEMINI_API_KEY` | — | yes |
| `GEMINI_MODEL` | `gemini-3-flash-preview` | no |
| `LINE_CHANNEL_SECRET` | — | yes |
| `LINE_CHANNEL_ACCESS_TOKEN` | — | yes |
| `SYSTEM_INSTRUCTION` | Thai persona | no |
| `SESSION_TIMEOUT_MINUTES` | `60` | no |
| `ADMIN_API_KEY` | — | yes |

### Gemini SDK patterns

Before writing any `@google/genai` code, read `.claude/skills/js-genai/REFERENCE.md` — it is the authoritative source for correct SDK patterns, model names, and API conventions.

### Exposing webhook locally

```bash
ngrok http 3000
# Set the HTTPS URL in LINE Developers Console → Messaging API → Webhook URL
```
