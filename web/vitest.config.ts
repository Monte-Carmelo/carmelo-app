import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
      exclude: [
        'src/app/api/**',
        'src/app/(app)/**/route.ts',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/stories/**',
        '**/storybook-static/**',
        '**/coverage/**',
        '**/node_modules/**',
        '**/tests/**',
        'scripts/**',
      ],
    },
    include: ['src/**/*.test.ts?(x)', 'tests/unit/**/*.test.ts?(x)'],
    exclude: ['tests/contract/**', 'tests/e2e/**'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
    },
  },
});
