# Plan: Som Assistant — LINE OA × Gemini Flash Integration

## Context

**som-assistant** เป็น NestJS chatbot ที่เชื่อมต่อกับ LINE Official Account ชื่อ "som" โดยใช้ Gemini Flash เป็นสมองในการตอบคำถาม. ขณะนี้ project อยู่ใน branch `nestjs-migration` ซึ่งเพิ่ง migrate มาจาก Elysia แต่ business logic ยังไม่ได้ port มา — มีแค่ NestJS scaffold เปล่าๆ (`AppController` / `AppService` แค่ Hello World).

**สิ่งที่ต้องทำ:**
1. รับ webhook จาก LINE OA → verify signature → ส่งข้อความเข้า Gemini Flash → reply กลับ LINE
2. รองรับ multi-turn conversation: เก็บ history ใน MongoDB session
3. Auto-archive session เมื่อ idle เกิน 1 ชั่วโมง (configurable)
4. มี Rich Menu ปุ่ม "เริ่มสนทนาใหม่" ที่ส่ง postback action เพื่อ reset session (ไม่ให้ user ต้องพิมพ์ `/reset` เอง)
5. ตอบเป็นภาษาไทย persona ผู้หญิงผู้ช่วย (configurable ผ่าน ENV)
6. มี admin/utility API: `GET /health`, `GET /sessions/:userId`, `POST /sessions/:userId/reset`, `POST /push`

**Why:** มี implementation เก่าใน Elysia (branch `feat/session-context-management`) เป็น reference. Project ปัจจุบันเริ่มจาก scaffold สะอาด ไม่ใช่การ port โค้ดบรรทัดต่อบรรทัด — ออกแบบใหม่ตาม NestJS idioms (Modules, Services, DI, Guards, Schemas).

---

## Architecture Overview

```
LINE OA  ──webhook──▶  POST /webhook  ──▶  WebhookController
                                             │
                                             ├──signature verify (LineSignatureGuard)
                                             │
                                             ├─ message event ──▶ ChatService.handleMessage(userId, text)
                                             │                       │
                                             │                       ├─ SessionService.getOrCreateSession(userId)
                                             │                       │    (auto-archive ถ้า idle > 60 นาที)
                                             │                       ├─ GeminiService.generateReply(history, systemInstruction)
                                             │                       └─ SessionService.appendTurn(sessionId, user, model)
                                             │
                                             └─ postback (action=reset) ──▶ SessionService.resetSession(userId)
                                                                              + LineService.reply("เริ่มต้นใหม่แล้วค่ะ...")
```

### Module Layout

```
src/
├── main.ts                       # bootstrap + rawBody enabled (สำหรับ HMAC)
├── app.module.ts                 # wire ทุก feature module
├── config/
│   └── env.validation.ts         # Zod/class-validator schema สำหรับ ENV
├── database/
│   └── database.module.ts        # MongooseModule.forRootAsync
├── sessions/
│   ├── sessions.module.ts
│   ├── sessions.service.ts
│   ├── sessions.service.spec.ts
│   └── schemas/session.schema.ts # @Schema/@Prop decorators
├── gemini/
│   ├── gemini.module.ts
│   ├── gemini.service.ts         # ใช้ @google/genai (gemini-3-flash-preview)
│   └── gemini.service.spec.ts
├── line/
│   ├── line.module.ts
│   ├── line.service.ts           # reply, push, validateSignature
│   ├── line.service.spec.ts
│   └── line-signature.guard.ts   # NestJS guard อ่าน rawBody + x-line-signature
├── chat/
│   ├── chat.module.ts
│   ├── chat.service.ts           # orchestrate session + gemini + line
│   └── chat.service.spec.ts
├── webhook/
│   ├── webhook.module.ts
│   ├── webhook.controller.ts     # POST /webhook
│   └── webhook.controller.spec.ts
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts       # /sessions/*, /push
│   └── admin-key.guard.ts        # x-admin-key header
├── health/
│   └── health.controller.ts      # GET /health
└── scripts/
    └── setup-rich-menu.ts        # one-time: สร้าง Rich Menu + set เป็น default
```

---

## Critical Files & Changes

### 1. Dependencies (`package.json`)

เพิ่ม:
- `@nestjs/config` — ENV management
- `@nestjs/mongoose` + `mongoose` — MongoDB
- `@google/genai` — Gemini SDK (ตาม `.claude/skills/js-genai/`)
- `@line/bot-sdk` — LINE Messaging API client
- `zod` (หรือใช้ `class-validator` + `class-transformer`) — ENV validation
- dev: `@types/node` (มีแล้ว)

เพิ่ม script:
- `"line:setup-menu": "ts-node src/scripts/setup-rich-menu.ts"`

### 2. Bootstrap (`src/main.ts`)

ต้องเปิด `rawBody: true` เพื่อให้ guard อ่าน raw request body สำหรับ HMAC verification.

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
```

### 3. Config (`src/config/env.validation.ts`)

ENV ที่ต้องมี (validate ตอน startup):

| Variable | Required | Default | Note |
|---|---|---|---|
| `PORT` | no | `3000` | |
| `MONGODB_URI` | yes | — | Railway MongoDB connection string |
| `GEMINI_API_KEY` | yes | — | |
| `GEMINI_MODEL` | no | `gemini-3-flash-preview` | |
| `LINE_CHANNEL_SECRET` | yes | — | สำหรับ verify signature |
| `LINE_CHANNEL_ACCESS_TOKEN` | yes | — | สำหรับ reply/push |
| `SYSTEM_INSTRUCTION` | no | (ภาษาไทย persona หญิงผู้ช่วย ดูข้อ 5) | |
| `SESSION_TIMEOUT_MINUTES` | no | `60` | |
| `ADMIN_API_KEY` | yes | — | ป้องกัน admin endpoints |

ใช้ `ConfigModule.forRoot({ isGlobal: true, validate })`.

### 4. Session schema (`src/sessions/schemas/session.schema.ts`)

NestJS Mongoose decorators แทน plain mongoose schema (ของเดิมใน branch เก่า):

```ts
@Schema({ timestamps: true })
class Session {
  @Prop({ required: true, unique: true, index: true }) sessionId: string;
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ enum: ['active', 'archived'], default: 'active' }) status: 'active' | 'archived';
  @Prop({ type: [{ role: String, content: String, timestamp: Date }], default: [] })
  messages: { role: 'user' | 'model'; content: string; timestamp: Date }[];
  @Prop({ default: null }) summary: string | null;
  @Prop({ default: () => new Date() }) lastActivity: Date;
}
```

Index แนะนำเพิ่ม: compound `{ userId: 1, status: 1 }` เพื่อให้ lookup active session ของ user เร็ว.

### 5. SessionService (`src/sessions/sessions.service.ts`)

API:
- `getOrCreateSession(userId)` — ถ้ามี active session แต่ `lastActivity` เกิน `SESSION_TIMEOUT_MINUTES` → archive แล้วสร้างใหม่. ถ้าไม่มี active → สร้างใหม่.
- `appendTurn(sessionId, userMessage, modelReply)` — push 2 messages และอัพเดท `lastActivity`.
- `resetSession(userId)` — archive active session ของ user นั้น (ถ้ามี); ครั้งต่อไปที่ user ส่งข้อความจะสร้างใหม่.
- `getSessions(userId)` — สำหรับ admin: คืน sessions ทั้งหมดของ user (active + archived).

### 6. GeminiService (`src/gemini/gemini.service.ts`)

ใช้ pattern จาก `.claude/skills/js-genai/REFERENCE.md`:

```ts
const ai = new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY') });
const response = await ai.models.generateContent({
  model: config.get('GEMINI_MODEL'),
  contents: history.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  })),
  config: { systemInstruction: config.get('SYSTEM_INSTRUCTION') },
});
return response.text;
```

**ออกแบบ:** ไม่ใช้ `ai.chats.create()` (stateful in-memory) เพราะ history เก็บที่ MongoDB — ใช้ `ai.models.generateContent({ contents })` แบบ stateless แทน. ทำให้ scale horizontal ได้และ session survive across restarts.

Default system instruction: `"คุณคือ 'som' ผู้ช่วยส่วนตัวเพศหญิง พูดสุภาพ ตอบเป็นภาษาไทยกระชับและเป็นมิตร"`.

Error handling: catch `ApiError` → ส่ง fallback text เป็นไทย `"ขออภัยค่ะ ตอนนี้ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง"` ให้ ChatService ส่งกลับ LINE.

### 7. LineService (`src/line/line.service.ts`)

ใช้ `@line/bot-sdk`:
- `client.replyMessage(replyToken, messages)` — สำหรับตอบใน webhook
- `client.pushMessage(userId, messages)` — สำหรับ admin push API
- `validateSignature(rawBody, channelSecret, signature)` — เรียกจาก guard

### 8. LineSignatureGuard (`src/line/line-signature.guard.ts`)

NestJS guard ที่:
1. อ่าน `x-line-signature` header
2. อ่าน `req.rawBody` (จาก `rawBody: true` ที่ตั้งใน main.ts)
3. คำนวน HMAC-SHA256 ด้วย channel secret → base64 → เทียบ
4. ถ้าไม่ match → throw `UnauthorizedException`

Apply เฉพาะ `WebhookController` (อย่าทำเป็น global).

### 9. WebhookController (`src/webhook/webhook.controller.ts`)

```ts
@Controller('webhook')
@UseGuards(LineSignatureGuard)
class WebhookController {
  @Post()
  async handle(@Body() body: WebhookRequestBody) {
    // วน events: message (text) → ChatService.handleMessage()
    //            postback action=reset → ChatService.handleReset()
    //            อื่นๆ (follow/sticker/image) → ตอบ default หรือเงียบ
    // return 200 OK เสมอ (อย่า throw ออกจาก handler ระดับ event เดี่ยว)
  }
}
```

### 10. ChatService (`src/chat/chat.service.ts`)

Orchestrate flow:
- `handleMessage(userId, text, replyToken)`:
  1. `session = sessionsService.getOrCreateSession(userId)`
  2. `history = [...session.messages, { role: 'user', content: text }]`
  3. `reply = geminiService.generateReply(history)`
  4. `sessionsService.appendTurn(session.sessionId, text, reply)`
  5. `lineService.reply(replyToken, reply)`
- `handleReset(userId, replyToken)`:
  1. `sessionsService.resetSession(userId)`
  2. `lineService.reply(replyToken, "เริ่มต้นการสนทนาใหม่แล้วค่ะ พิมพ์ข้อความได้เลย")`

### 11. AdminController (`src/admin/admin.controller.ts`)

ใช้ `@UseGuards(AdminKeyGuard)` (ตรวจ `x-admin-key` header กับ `ADMIN_API_KEY`):
- `GET /sessions/:userId` → `sessionsService.getSessions(userId)`
- `POST /sessions/:userId/reset` → `sessionsService.resetSession(userId)`
- `POST /push` body `{ userId, text }` → `lineService.push(userId, text)`

### 12. HealthController (`src/health/health.controller.ts`)

`GET /health` → `{ status: 'ok', uptime: process.uptime() }`. ไม่ต้องใช้ guard. ไม่ต้องเช็ค Mongo ทุก request (overkill); ทำเป็น simple liveness probe.

### 13. Rich Menu setup (`src/scripts/setup-rich-menu.ts`)

One-time script — รันด้วย `pnpm line:setup-menu`:
1. สร้าง Rich Menu ผ่าน `client.createRichMenu({ ... })` กำหนด area สำหรับปุ่ม "เริ่มสนทนาใหม่"
2. Area action เป็น `{ type: 'postback', data: 'action=reset', displayText: 'เริ่มสนทนาใหม่' }`
3. Upload Rich Menu image (เตรียม PNG ขนาด 2500x843 หรือ 2500x1686 ใส่ใน `assets/rich-menu.png`)
4. `client.setDefaultRichMenu(richMenuId)` → ผูกกับทุก user

ในแผน: ใส่ comment ในไฟล์ระบุว่าต้องเตรียม `assets/rich-menu.png` ก่อนรัน script.

---

## Reusable Patterns

- **Mongoose schema decorators**: pattern เดียวกับ `@nestjs/mongoose` docs — ดู [Session schema](#4-session-schema-srcsessionsschemassessionschemats) ข้างบน
- **Reference implementation เก่า**: git branch `feat/session-context-management` มี `src/services/session.service.ts` และ `src/services/line.service.ts` ที่ logic ครบ — ใช้เป็น reference แต่ port เป็น NestJS idioms (DI, Module, Schema decorator) ไม่ใช่ copy ตรงๆ
- **Gemini SDK patterns**: ใช้ `.claude/skills/js-genai/REFERENCE.md` เป็น authoritative source (โดยเฉพาะ section "Chat (Multi-turn)" และ "System Instructions"). อย่าใช้ `@google/generative-ai` (deprecated).
- **NestJS rawBody**: ใช้ official pattern `NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })` + `RawBodyRequest<Request>`.

---

## Out of Scope (จงใจตัดออก)

- Streaming reply (LINE ไม่รองรับ — ต้องรอ Gemini เสร็จก่อน reply ทีเดียว)
- Image/multimodal input (สามารถเพิ่มได้ภายหลังถ้า user ส่งรูป — เริ่มจาก text-only ก่อน)
- Session summary generation (มีฟิลด์ `summary` เผื่อไว้แต่ยังไม่ implement; เพิ่มได้ภายหลังตอนต้อง compress ยาวๆ)
- Rate limiting per-user (ทำได้ภายหลังด้วย `@nestjs/throttler`)
- Auth/multi-tenant (project นี้ single OA)

---

## Verification

### Local unit tests
```bash
pnpm test
```
- SessionService: getOrCreate (new user, active <60min, active ≥60min → archive+new), appendTurn, resetSession
- GeminiService: mock `@google/genai`, verify model + system instruction passed, ApiError → fallback text
- LineService: validateSignature with known fixtures (channel secret + body + expected signature)
- LineSignatureGuard: pass on valid signature, throw on invalid

### Local e2e
```bash
pnpm test:e2e
```
- POST /webhook ไม่มี signature → 401
- POST /webhook signature ผิด → 401
- POST /webhook valid signature + message event → 200, mock LineService.reply ถูกเรียก, mock GeminiService ถูกเรียกด้วย history ที่ถูกต้อง
- POST /webhook postback action=reset → 200, session ของ user นั้นถูก archive
- GET /health → 200

### Local manual run
```bash
pnpm start:dev
curl http://localhost:3000/health           # ควรได้ 200
curl -H "x-admin-key: ..." http://localhost:3000/sessions/U_test  # ควรได้ array sessions
```

ใช้ [ngrok](https://ngrok.com/) หรือ Railway deploy เพื่อให้ LINE ยิง webhook เข้ามาได้:
```bash
ngrok http 3000
```
แล้วเอา HTTPS URL ไปใส่ใน LINE Developers Console → Messaging API → Webhook URL.

### LINE end-to-end (manual)
1. Deploy → ตั้ง webhook URL ใน LINE Developers Console
2. รัน `pnpm line:setup-menu` หนึ่งครั้ง (ต้องมี `assets/rich-menu.png`)
3. Add som OA เป็นเพื่อนใน LINE
4. ทักทาย → ตอบเป็นไทย persona หญิง ✓
5. ถามต่อเนื่อง → reply อ้างอิงข้อความก่อนหน้า (multi-turn ทำงาน) ✓
6. กดปุ่ม "เริ่มสนทนาใหม่" บน Rich Menu → ได้ reply "เริ่มต้นใหม่แล้วค่ะ..." ✓
7. ถามต่อ → ไม่อ้างอิง context เก่า (session ใหม่) ✓
8. รอเกิน `SESSION_TIMEOUT_MINUTES` แล้วทักใหม่ → ไม่อ้างอิง context เก่า ✓

---

## Suggested Implementation Order

1. Setup foundation: install deps, `ConfigModule` + env validation, update `main.ts` (rawBody), `DatabaseModule`
2. Session layer: schema + service + tests (TDD here — ลอจิก timeout/archive ละเอียด)
3. Gemini layer: service + tests (mock SDK)
4. LINE layer: service + signature guard + tests
5. Chat orchestrator: chat.service + tests
6. Webhook controller + e2e tests
7. Health + Admin controllers
8. Rich menu setup script + assets
9. Update `app.module.ts` ให้ wire ทุกอย่าง
10. End-to-end manual test ผ่าน ngrok หรือ Railway deploy
