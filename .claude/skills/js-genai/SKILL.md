---
name: js-genai
description: Generates JavaScript/TypeScript code using the Google Gen AI SDK (@google/genai) for Gemini API. Enforces correct SDK patterns, model names, and API conventions. Use when user wants to call Gemini API, write @google/genai code, use Gemini models (Flash/Pro/Veo), implement text generation, streaming, chat, structured output, function calling, grounding, image/video generation, or any Google Generative AI feature in JavaScript or TypeScript.
---

# js-genai — Google Gen AI SDK (JavaScript/TypeScript)

Official docs: https://googleapis.github.io/js-genai/

## Install

```bash
npm install @google/genai
# NOT: @google/generative-ai  ← deprecated
```

## Init (always use this pattern)

```typescript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});  // reads GEMINI_API_KEY from env
```

## Model defaults

| Use case | Model |
|---|---|
| General text/multimodal | `gemini-3-flash-preview` |
| Coding / complex reasoning | `gemini-3-pro-preview` |
| Low-latency / high-volume | `gemini-2.5-flash-lite` |
| Fast image gen/edit | `gemini-2.5-flash-image` |
| High-quality image gen | `gemini-3-pro-image-preview` |
| Video (high-fidelity) | `veo-3.0-generate-001` |
| Video (fast) | `veo-3.0-fast-generate-001` |

❌ **Prohibited**: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`

## Quick patterns

```typescript
// Text generation
const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'Hello' });
console.log(r.text);

// Streaming
const stream = await ai.models.generateContentStream({ model: 'gemini-3-flash-preview', contents: 'Tell me a story' });
for await (const chunk of stream) process.stdout.write(chunk.text);

// Chat
const chat = ai.chats.create({ model: 'gemini-3-flash-preview' });
const r2 = await chat.sendMessage({ message: 'Hi!' });

// System instruction
const r3 = await ai.models.generateContent({
  model: 'gemini-3-flash-preview', contents: 'Explain gravity',
  config: { systemInstruction: 'You are a physics teacher.' }
});
```

## Common mistakes to avoid

| ❌ Wrong | ✅ Correct |
|---|---|
| `GoogleGenerativeAI` | `GoogleGenAI` |
| `genai.getGenerativeModel(...)` | `new GoogleGenAI({})` |
| `model.generateContent(...)` | `ai.models.generateContent(...)` |
| `generationConfig: { ... }` | `config: { ... }` |
| `GoogleGenAIError` | `ApiError` |
| `GenerateContentResult` | `GenerateContentResponse` |
| `GenerateContentRequest` | `GenerateContentParameters` |
| `ai.models.create` | *(doesn't exist)* |

## Detailed examples

See [REFERENCE.md](REFERENCE.md) for full working code covering:
- Multimodal inputs (base64 + File API)
- Thinking/reasoning config (Gemini 2.5 & 3)
- Structured output (JSON Schema)
- Function calling
- Google Search grounding
- Image & video generation
- Content/Part hierarchy
- Error handling
