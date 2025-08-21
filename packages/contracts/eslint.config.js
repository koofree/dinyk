import baseConfig from "@dinsure/eslint-config/base";
import reactConfig from "@dinsure/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
];