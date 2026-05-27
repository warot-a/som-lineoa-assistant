# js-genai Reference — Full Code Examples

Source: https://raw.githubusercontent.com/googleapis/js-genai/refs/heads/main/codegen_instructions.md

---

## Multimodal — Local File (Base64)

```typescript
import { GoogleGenAI, Part } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI({});

function fileToGenerativePart(path: string, mimeType: string): Part {
  return { inlineData: { data: Buffer.from(fs.readFileSync(path)).toString('base64'), mimeType } };
}

async function run() {
  const imagePart = fileToGenerativePart('path/to/image.jpg', 'image/jpeg');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [imagePart, 'Describe this image in detail.'],
  });
  console.log(response.text);
}
run();
```

For PDF: use `application/pdf` as `mimeType`.

---

## Multimodal — File API (Large Files)

```typescript
import { GoogleGenAI, createPartFromUri, createUserContent } from '@google/genai';
const ai = new GoogleGenAI({});

async function run() {
  const myFile = await ai.files.upload({ file: 'video.mp4', config: { mimeType: 'video/mp4' } });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: createUserContent([createPartFromUri(myFile.uri, myFile.mimeType), 'What happens in this video?']),
  });
  console.log(response.text);
  await ai.files.delete({ name: myFile.name });
}
run();
```

---

## Thinking / Reasoning

### Gemini 3 (thinkingLevel)

Thinking is ON by default for `gemini-3-pro-preview` and `gemini-3-flash-preview`.

```typescript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: 'Solve this step by step: ...',
    config: {
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: 'LOW', // MINIMAL | LOW | MEDIUM | HIGH (default)
      },
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.thought) console.log(`Thought: ${part.text}`);
  else console.log(`Response: ${response.text}`);
}
main();
```

| Level | Description |
|---|---|
| `MINIMAL` | Flash only — minimum tokens, low-complexity tasks |
| `LOW` | Fewer tokens, simpler tasks |
| `MEDIUM` | Flash only — balanced |
| `HIGH` | Default — maximum reasoning depth |

### Gemini 2.5 (thinkingBudget)

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: 'What is AI?',
  config: {
    thinkingConfig: {
      thinkingBudget: 0,    // 0 = OFF (not available on gemini-2.5-pro, min 128)
      // thinkingBudget: 1024 // specific token budget
    },
  },
});
```

> ⚠️ `gemini-2.5-pro` minimum is 128 and cannot be turned off. Only 2.5/3 series support thinking.

---

## System Instructions

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Explain quantum physics.',
  config: { systemInstruction: 'You are a pirate.' },
});
```

---

## Safety Settings (only when explicitly requested)

```typescript
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [...],
  config: {
    safetySettings: [{
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    }],
  },
});
```

---

## Streaming

```typescript
const responseStream = await ai.models.generateContentStream({
  model: 'gemini-3-flash-preview',
  contents: ['Write a long story about a space pirate.'],
});
for await (const chunk of responseStream) process.stdout.write(chunk.text);
console.log();
```

---

## Chat (Multi-turn)

```typescript
const chat = ai.chats.create({ model: 'gemini-3-flash-preview' });
let r = await chat.sendMessage({ message: 'I have a cat named Whiskers.' });
console.log(r.text);
r = await chat.sendMessage({ message: 'What is my pet\'s name?' });
console.log(r.text);

const history = await chat.getHistory();
for (const msg of history) console.log(`${msg.role}: ${msg.parts[0].text}`);
```

### Chat with Streaming

```typescript
const chat = ai.chats.create({ model: 'gemini-3-flash-preview' });
const stream = await chat.sendMessageStream({ message: 'Tell me about dogs.' });
for await (const chunk of stream) console.log(chunk.text);
```

---

## Structured Output (JSON Schema)

```typescript
import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'List 3 popular cookie recipes with ingredients.',
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING, description: 'Name of recipe.' },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        propertyOrdering: ['recipeName', 'ingredients'],
      },
    },
  },
});

const recipes = JSON.parse(response.text);
```

Available `Type` values: `STRING`, `NUMBER`, `INTEGER`, `BOOLEAN`, `ARRAY`, `OBJECT`, `NULL`

> ⚠️ `Type.OBJECT` must contain properties — cannot be empty.

---

## Function Calling (Tools)

```typescript
import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({});

const controlLightDeclaration = {
  name: 'controlLight',
  parameters: {
    type: Type.OBJECT,
    description: 'Set brightness and color temperature of a light.',
    properties: {
      brightness: { type: Type.NUMBER, description: 'Light level 0–100.' },
      colorTemperature: { type: Type.STRING, description: '`daylight`, `cool`, or `warm`.' },
    },
    required: ['brightness', 'colorTemperature'],
  },
};

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Dim the lights so the room feels cozy and warm.',
  config: { tools: [{ functionDeclarations: [controlLightDeclaration] }] },
});

if (response.functionCalls) console.log(response.functionCalls);
else console.log(response.text);
```

---

## Grounding (Google Search)

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'What is the latest news about the Gemini API?',
  config: { tools: [{ googleSearch: {} }] },
});
console.log(response.text);

const metadata = response.candidates?.[0]?.groundingMetadata;
if (metadata) {
  console.log('Queries:', metadata.webSearchQueries);
  console.log('Sources:', metadata.groundingChunks?.map(c => c.web?.title));
}
```

---

## Image Generation

### Fast (gemini-2.5-flash-image)

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: 'A nano banana dish in a fancy restaurant with a Gemini theme',
});

for (const part of response.candidates[0].content.parts) {
  if (part.text) console.log(part.text);
  else if (part.inlineData) {
    const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    // save or display imageUrl
  }
}
```

### High-Quality (gemini-3-pro-image-preview)

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: 'A weather forecast chart for San Francisco',
  config: {
    imageConfig: {
      aspectRatio: '16:9',  // 1:1 | 2:3 | 3:2 | 3:4 | 4:3 | 4:5 | 5:4 | 9:16 | 16:9 | 21:9
      imageSize: '2K',       // 1K | 2K | 4K
    },
    tools: [{ googleSearch: {} }],
  },
});
```

### Edit Images (chat mode)

```typescript
import * as fs from 'fs';
const chat = ai.chats.create({ model: 'gemini-2.5-flash-image' });
const imageBase64 = fs.readFileSync('path/to/image.png').toString('base64');

const response = await chat.sendMessage({
  content: [
    { inlineData: { mimeType: 'image/png', data: imageBase64 } },
    'Make it a bananas foster.',
  ],
});

for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
  }
}
```

---

## Video Generation (Veo)

> ⚠️ Veo can be costly — remind user to check pricing at ai.google.dev/pricing

```typescript
import { GoogleGenAI } from '@google/genai';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const ai = new GoogleGenAI({});

async function main() {
  let operation = await ai.models.generateVideos({
    model: 'veo-3.0-fast-generate-001',
    prompt: 'Panning wide shot of a calico kitten sleeping in sunshine',
    config: { personGeneration: 'dont_allow', aspectRatio: '16:9' },
  });

  while (!operation.done) {
    await new Promise(r => setTimeout(r, 10000)); // poll every 10s
    operation = await ai.operations.getVideosOperation({ operation });
  }

  operation.response?.generatedVideos?.forEach(async (video, n) => {
    const resp = await fetch(`${video.video.uri}&key=${process.env.GEMINI_API_KEY}`);
    Readable.fromWeb(resp.body).pipe(createWriteStream(`video${n}.mp4`));
    console.log(`Saved video${n}.mp4`);
  });
}
main();
```

---

## Content/Part Hierarchy

Short form (auto-coerced):
```typescript
contents: 'How does AI work?'
```

Equivalent explicit form:
```typescript
contents: [{ role: 'user', parts: [{ text: 'How does AI work?' }] }]
```

---

## Error Handling

```typescript
import { ApiError } from '@google/genai';

try {
  const r = await ai.models.generateContent({ ... });
} catch (e) {
  if (e instanceof ApiError) {
    console.error(`Status: ${e.status}, Message: ${e.message}`);
  }
}
```

`ApiError` extends `Error` with: `message`, `name`, `status` (HTTP code).

---

## Useful Links

- Docs: https://ai.google.dev/gemini-api/docs
- API Keys: https://ai.google.dev/gemini-api/docs/api-key
- Models: https://ai.google.dev/models
- Pricing: https://ai.google.dev/pricing
- Rate Limits: https://ai.google.dev/rate-limits
- SDK Reference: https://googleapis.github.io/js-genai/
