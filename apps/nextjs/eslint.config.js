import baseConfig, { restrictEnvAccess } from "@dinsure/eslint-config/base";
import nextjsConfig from "@dinsure/eslint-config/nextjs";
import reactConfig from "@dinsure/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
