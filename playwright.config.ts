import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:5174', trace: 'on-first-retry' },
  projects: [
    { name: 'mobile-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'desktop-1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    // Front end only: the backend (and its secret key) never runs during tests.
    command: 'npm run dev:web -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    // Own port + never reuse: tests can't attach to a real-DB dev server on 5173.
    reuseExistingServer: false,
    // Fake project: even if interception failed, tests could never reach the real database.
    env: {
      VITE_SUPABASE_URL: 'https://e2e-mock.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-mock-key',
    },
  },
});
