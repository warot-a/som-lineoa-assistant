import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-3-flash-preview'),

  LINE_CHANNEL_SECRET: z.string().min(1, 'LINE_CHANNEL_SECRET is required'),
  LINE_CHANNEL_ACCESS_TOKEN: z
    .string()
    .min(1, 'LINE_CHANNEL_ACCESS_TOKEN is required'),

  SYSTEM_INSTRUCTION: z
    .string()
    .default(
      "คุณคือ 'Som' ผู้ช่วยส่วนตัวเพศหญิง พูดสุภาพ ตอบเป็นภาษาไทยกระชับและเป็นมิตร",
    ),

  SESSION_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(60),

  ADMIN_API_KEY: z.string().min(1, 'ADMIN_API_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}
