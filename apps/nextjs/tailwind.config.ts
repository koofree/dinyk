import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

import baseConfig from "@dinsure/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [...baseConfig.content, "../../packages/ui/src/*.{ts,tsx}"],
  presets: [baseConfig],
  theme: {
    extend: {
      screens: {
        'nav': '1130px',
        'mobile': '1000px',
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Pretendard", "Outfit", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
        display: ["var(--font-display)", "Outfit", "Pretendard", ...fontFamily.sans],
        header: ["var(--font-header)", "Outfit", "Pretendard", ...fontFamily.sans],
        outfit: ["Outfit", "Pretendard", ...fontFamily.sans],
      },
      borderRadius: {
        'lg': '16px',
        'xl': '16px',
        '2xl': '16px',
      },
    },
  },
} satisfies Config;
