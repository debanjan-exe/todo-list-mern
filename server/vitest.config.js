// Test settings for the server (Vitest = Jest-like test runner that supports ES modules).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env: { JWT_SECRET: 'test-secret' }, // tokens can be made in tests
    restoreMocks: true, // undo spies after each test
  },
});
