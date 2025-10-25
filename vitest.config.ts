import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: 'test/setupTests.ts',
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
});
