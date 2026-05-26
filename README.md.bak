# Som Assistant (น้องส้ม) 🍊

**Som Assistant** (Nong Som) is a smart, context-aware personal assistant integrated directly into the LINE Messaging app. Powered by Google's state-of-the-art **Gemini AI (`gemini-2.5-flash`)** model, it maintains multi-turn conversation context and manages user sessions gracefully.

It is built with **Node.js** using the **NestJS** framework, utilizing **MongoDB** to persist conversational history and structured session summaries.

---

## 🚀 Key Features

*   **Context-Aware Conversational AI**: Nong Som maintains full conversation history rather than treating messages as one-off interactions. She automatically retrieves preceding messages for rich, highly relevant AI-driven conversational responses.
*   **Time-Based Session Lifecycle (1-Hour TTL)**: 
    *   Sessions automatically close after **1 hour of inactivity**.
    *   If a user sends a message after 1 hour, the active session is automatically finalized, archived with a summary, and a clean new session starts immediately.
*   **Manual Session Reset & Summarization ("เริ่มเรื่องใหม่")**:
    *   Triggered via a LINE postback (e.g. `action=reset` from a Rich Menu or button).
    *   Nong Som will automatically digest the current active conversation, compile a concise Thai bullet-point summary (up to 5 key points), and archive the session.
    *   A premium-looking **LINE Flex Message** is returned to the user with the summary, leaving the conversation state fresh and ready.
*   **Built-in `/version` Command**:
    *   Send `version` or `/version` to instantly view the current Git commit SHA (or `development` locally) for transparent build tracking.
*   **Robust Signature Verification**:
    *   A custom NestJS Guard strictly validates incoming `x-line-signature` headers using HMAC-SHA256 and your `LINE_CHANNEL_SECRET` to ensure all traffic originates from LINE's servers.

---

## 🛠 Tech Stack

*   **Framework**: [NestJS](https://nestjs.com/) (v11+)
*   **Runtime**: [Node.js](https://nodejs.org/) (v18+)
*   **Package Manager**: `pnpm`
*   **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) (`@nestjs/mongoose`)
*   **AI Engine**: [Google Generative AI SDK](https://github.com/google-gemini/generative-ai-js) (`@google/genai`) using `gemini-2.5-flash`
*   **HTTP Client**: [Axios](https://github.com/axios/axios) for LINE Messaging API communication

---

## 📁 Project Structure

Following NestJS modular design best practices, the application code is structured by domain feature modules:

```text
src/
├── app.module.ts               # Root module orchestrating all feature modules
├── main.ts                     # Application entry point with raw body parsing enabled
├── types.ts                    # Shared TypeScript interfaces & types
├── config/                     # Configuration module validating environment variables
│   ├── config.module.ts
│   └── config.service.ts
├── database/                   # Database module establishing Mongoose connection
│   └── database.module.ts
├── gemini/                     # Gemini AI module for chat replies and summaries
│   ├── gemini.module.ts
│   └── gemini.service.ts
├── line/                       # LINE Messaging API module
│   ├── line.module.ts
│   ├── line.service.ts
│   └── guards/
│       └── line-signature.guard.ts  # Guard to verify x-line-signature
├── session/                    # Session lifecycle and database models
│   ├── session.module.ts
│   ├── session.service.ts
│   └── schemas/
│       └── session.schema.ts   # Mongoose schemas for Session and Message
└── webhook/                    # Webhook endpoint and webhook event routing
    ├── webhook.module.ts
    └── webhook.controller.ts   # Webhook controller handling messages & postbacks
```

---

## 💻 Local Development

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A running [MongoDB](https://www.mongodb.com/) instance (local or Atlas)
- A [Gemini API Key](https://aistudio.google.com/)
- A [LINE Developers Account](https://developers.line.biz/) with a Messaging API Channel

### 2. Installation
Clone the repository and install dependencies:
```bash
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (use `.env.example` as a template):
```env
LINE_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
GEMINI_API_KEY=your_google_gemini_api_key
MONGODB_URI=mongodb://localhost:27017/som-assistant
PORT=3000
```

### 4. Running the App
```bash
# Development (watch mode)
pnpm run start:dev

# Production build and run
pnpm run build
pnpm run start:prod
```

### 5. Local Tunneling for Webhook Testing
Since LINE Webhooks require an HTTPS URL, use a tunneling tool like `ngrok` or `localtunnel` to expose your local server:
```bash
ngrok http 3000
```
Then, copy the `https://...` forwarding address, append `/webhook`, and paste it into the **Webhook URL** field in your LINE Developer Console (e.g., `https://your-tunnel.ngrok.io/webhook`). Make sure to enable **Use Webhook**!

---

## 🧪 Testing & Validation

```bash
# Run ESLint validation
pnpm run lint

# Format codebase using Prettier
pnpm run format

# Run all unit tests
pnpm run test

# Run e2e tests
pnpm run test:e2e
```

---

## 🚀 Deployment (Railway.app)

This project is fully containerized and optimized for one-click deployments to **[Railway](https://railway.app)**.

### Deployment Steps:
1.  **Push to GitHub**: Push your codebase to a private/public GitHub repository.
2.  **Create a New Project on Railway**:
    *   Click **New Project** -> **Deploy from GitHub repo**.
    *   Select your `som-assistant` repository.
3.  **Add MongoDB Database**:
    *   You can provision MongoDB directly in the same Railway project by clicking **New** -> **Database** -> **MongoDB**.
    *   Railway will automatically provision MongoDB and provide a connection string.
4.  **Configure Environment Variables**:
    *   In the **Variables** tab of your service, add the following variables:
        *   `LINE_ACCESS_TOKEN`: *Your LINE Channel Access Token*
        *   `LINE_CHANNEL_SECRET`: *Your LINE Channel Secret*
        *   `GEMINI_API_KEY`: *Your Google Gemini API Key*
        *   `MONGODB_URI`: `${{MONGODB_URL}}` *(Reference the Railway-provisioned MongoDB database variables)*
5.  **Automatic Port Binding**:
    *   The `Dockerfile` and `src/main.ts` are pre-configured to bind to port `0.0.0.0` and read the `PORT` environment variable automatically injected by Railway.
6.  **Verify Webhook**:
    *   Once deployed, Railway will provide a public production URL (e.g. `https://som-assistant-production.up.railway.app`).
    *   Update your **LINE Webhook URL** to `https://<your-railway-url>/webhook` and verify it.

---

## 📄 License
This project is [MIT licensed](LICENSE).
