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
      fontSize: {
        // Complete font size scale override
        'xs': ['0.5rem', { lineHeight: '1rem' }],
        'sm': ['0.75rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }],
        'lg': ['1rem', { lineHeight: '1.75rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.25rem', { lineHeight: '2rem' }],
        '3xl': ['1.5rem', { lineHeight: '2.25rem' }],
        '4xl': ['1.875rem', { lineHeight: '2.5rem' }],
        '5xl': ['2.25rem', { lineHeight: '1' }],
        '6xl': ['2.75rem', { lineHeight: '1' }],
        '7xl': ['3rem', { lineHeight: '1.1' }], // Custom size: 80px
        '8xl': ['5.5rem', { lineHeight: '1' }], // Custom size: 104px
        '9xl': ['6.5rem', { lineHeight: '1' }], // Custom size: 136px
      },
      borderRadius: {
        'lg': '16px',
        'xl': '16px',
        '2xl': '16px',
      },
    },
  },
} satisfies Config;
