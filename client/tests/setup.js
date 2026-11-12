// Runs before every test file.
// Adds matchers like toBeInTheDocument() and cleans the fake page after each test.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// ---- Make localStorage / sessionStorage work on every Node version ----
// Node 25+ has its OWN global localStorage. Without a storage file it is broken
// (no getItem / clear), and it hides the one from jsdom. So: use jsdom's storage,
// or a small in-memory storage if that is not available.
function memoryStorage() {
  let data = {};
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; },
    clear: () => { data = {}; },
    key: (i) => Object.keys(data)[i] ?? null,
    get length() { return Object.keys(data).length; },
  };
}

for (const name of ['localStorage', 'sessionStorage']) {
  if (typeof globalThis[name]?.clear !== 'function') {
    const storage = globalThis.jsdom?.window?.[name] ?? memoryStorage(); // vitest puts the jsdom instance on globalThis.jsdom
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
  }
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
