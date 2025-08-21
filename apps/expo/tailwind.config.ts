import type { Config } from "tailwindcss";
// @ts-expect-error - no types
import nativewind from "nativewind/preset";

import baseConfig from "@dinsure/tailwind-config/native";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [baseConfig, nativewind],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
        display: ["Outfit", "Marlin Soft SQ", "Georgia", "serif"],
        header: ["Outfit", "Marlin Soft SQ", "Georgia", "serif"],
      },
    },
  },
} satisfies Config;
