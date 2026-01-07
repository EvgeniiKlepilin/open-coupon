import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Create storage mocks that actually store data
const sessionStorage: Record<string, unknown> = {};
const localStorage: Record<string, unknown> = {};

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Clear storage between tests
  Object.keys(sessionStorage).forEach((key) => delete sessionStorage[key]);
  Object.keys(localStorage).forEach((key) => delete localStorage[key]);
});

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: localStorage[keys] });
        }
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          keys.forEach((key) => {
            if (key in localStorage) result[key] = localStorage[key];
          });
          return Promise.resolve(result);
        }
        return Promise.resolve({ ...localStorage });
      }),
      set: vi.fn((items) => {
        Object.assign(localStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach((key) => delete localStorage[key]);
        return Promise.resolve();
      }),
    },
    session: {
      get: vi.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: sessionStorage[keys] });
        }
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          keys.forEach((key) => {
            if (key in sessionStorage) result[key] = sessionStorage[key];
          });
          return Promise.resolve(result);
        }
        return Promise.resolve({ ...sessionStorage });
      }),
      set: vi.fn((items) => {
        Object.assign(sessionStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach((key) => delete sessionStorage[key]);
        return Promise.resolve();
      }),
    },
  },
  tabs: {
    query: vi.fn(),
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
} as unknown as typeof chrome;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});
