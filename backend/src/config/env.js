import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:123@localhost:5432/book_service?schema=public'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16).default('bookpoisk-access-secret-2026'),
  JWT_REFRESH_SECRET: z.string().min(16).default('bookpoisk-refresh-secret-2026'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  REFRESH_COOKIE_NAME: z.string().default('refreshToken'),
  AI_PROVIDER: z.enum(['gemini', 'deepseek', 'openai', 'genapi']).default('gemini'),
  GEN_API_KEY: z.string().optional().default(''),
  GEN_API_MODEL: z.string().default('grok-4.1-fast-non-reasoning'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
  DEEPSEEK_API_KEY: z.string().optional().default(''),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini')
});

const parsed = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsed.NODE_ENV,
  isProduction: parsed.NODE_ENV === 'production',
  isTest: parsed.NODE_ENV === 'test',
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  frontendUrl: parsed.FRONTEND_URL,
  jwtAccessSecret: parsed.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
  jwtAccessTtl: parsed.JWT_ACCESS_TTL,
  jwtRefreshTtlDays: parsed.JWT_REFRESH_TTL_DAYS,
  refreshCookieName: parsed.REFRESH_COOKIE_NAME,
  aiProvider: parsed.AI_PROVIDER,
  genApiKey: parsed.GEN_API_KEY,
  genApiModel: parsed.GEN_API_MODEL,
  geminiApiKey: parsed.GEMINI_API_KEY,
  geminiModel: parsed.GEMINI_MODEL,
  deepseekApiKey: parsed.DEEPSEEK_API_KEY,
  deepseekModel: parsed.DEEPSEEK_MODEL,
  openaiApiKey: parsed.OPENAI_API_KEY,
  openaiModel: parsed.OPENAI_MODEL
};
