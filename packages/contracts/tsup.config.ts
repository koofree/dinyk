import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    hooks: 'src/hooks/index.ts',
    providers: 'src/providers/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: false, // Skip DTS for now due to type issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true
});