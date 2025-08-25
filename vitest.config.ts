import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    setupFiles: ['./test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '*.config.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/index.ts',
        '.next/',
        '.turbo/',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    
    // Test matching patterns
    include: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '.turbo',
      'coverage',
    ],
    
    // Globals
    globals: true,
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    
    // Reporter options
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },
    
    // Timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Threading
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Watch mode exclusions
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
    ],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/nextjs/src'),
      '@dinsure/contracts': path.resolve(__dirname, './packages/contracts/src'),
      '@/components': path.resolve(__dirname, './apps/nextjs/src/components'),
      '@/hooks': path.resolve(__dirname, './apps/nextjs/src/hooks'),
      '@/lib': path.resolve(__dirname, './apps/nextjs/src/lib'),
      '@/utils': path.resolve(__dirname, './apps/nextjs/src/utils'),
      '@/providers': path.resolve(__dirname, './apps/nextjs/src/providers'),
      '@/types': path.resolve(__dirname, './apps/nextjs/src/types'),
    },
  },
});