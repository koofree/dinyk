import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CHAIN_ID: z.coerce.number().default(8217),
    NEXT_PUBLIC_RPC_URL: z.string().url().default("https://public-en.node.kaia.io"),
    NEXT_PUBLIC_INSURANCE_CONTRACT: z.string().optional(),
    NEXT_PUBLIC_TREASURY_CONTRACT: z.string().optional(),
    NEXT_PUBLIC_TRANCHE_POOL_CONTRACT: z.string().optional(),
    NEXT_PUBLIC_ENABLE_TESTNETS: z.coerce.boolean().default(true),
    NEXT_PUBLIC_SHOW_DEBUG_INFO: z.coerce.boolean().default(true),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_INSURANCE_CONTRACT: process.env.NEXT_PUBLIC_INSURANCE_CONTRACT,
    NEXT_PUBLIC_TREASURY_CONTRACT: process.env.NEXT_PUBLIC_TREASURY_CONTRACT,
    NEXT_PUBLIC_TRANCHE_POOL_CONTRACT: process.env.NEXT_PUBLIC_TRANCHE_POOL_CONTRACT,
    NEXT_PUBLIC_ENABLE_TESTNETS: process.env.NEXT_PUBLIC_ENABLE_TESTNETS,
    NEXT_PUBLIC_SHOW_DEBUG_INFO: process.env.NEXT_PUBLIC_SHOW_DEBUG_INFO,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});