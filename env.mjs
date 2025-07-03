import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ELEVENLABS_API_KEY: z.string().optional(),
    ELEVENLABS_AGENT_ID: z.string().optional(),
    TURN_SERVER_URL: z.string().optional(),
    TURN_SERVER_USERNAME: z.string().optional(),
    TURN_SERVER_PASSWORD: z.string().optional(),
    IRON_SESSION_SECRET_KEY: z
      .string()
      .min(32, 'Session secret key should be at least 32 characters long'),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    ELEVENLABS_AGENT_ID: process.env.ELEVENLABS_AGENT_ID,
    TURN_SERVER_URL: process.env.TURN_SERVER_URL,
    TURN_SERVER_USERNAME: process.env.TURN_SERVER_USERNAME,
    TURN_SERVER_PASSWORD: process.env.TURN_SERVER_PASSWORD,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    IRON_SESSION_SECRET_KEY: process.env.IRON_SESSION_SECRET_KEY,
  },
});
