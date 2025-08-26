import { defineConfig } from "tsup";

const isDebug = process.env.NODE_ENV === "development";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    hooks: "src/hooks/index.ts",
    providers: "src/providers/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: isDebug ? "inline" : true,
  clean: true,
  external: ["react", "react-dom"],
  treeshake: !isDebug,
  minify: !isDebug,
  define: {
    "process.env.DEBUG": isDebug ? "true" : "false",
  },
  esbuildOptions(options) {
    if (isDebug) {
      options.keepNames = true;
      options.logLevel = "info";
    }
  },
});
