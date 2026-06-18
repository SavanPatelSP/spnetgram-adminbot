import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@bot': path.resolve(__dirname, 'src/bot'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.service.ts', 'src/**/*.controller.ts', 'src/bot/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test.ts', 'src/**/*.types.ts', 'src/**/*.events.ts'],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
})
