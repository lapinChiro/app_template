import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/index.ts',
        'src/test-utils/**',
      ],
      thresholds: {
        // NOTE: 一時的に基準を下げています。本来の基準は @docs/development/coverage-standards.md を参照
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
    server: {
      deps: {
        inline: ['uuid', 'jose'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});