import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function with providers if needed
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options });
}

/**
 * Mock fetch responses
 */
export function mockFetch(data: unknown, ok = true, status = 200) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      statusText: ok ? 'OK' : 'Error',
    } as Response),
  );
}

/**
 * Mock fetch error
 */
export function mockFetchError(error: Error) {
  global.fetch = vi.fn(() => Promise.reject(error));
}

/**
 * Mock Chrome storage
 */
export function mockChromeStorage(data: Record<string, unknown> = {}) {
  vi.mocked(chrome.storage.local.get).mockImplementation((keys: string | string[] | null) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: data[keys] });
    }
    if (Array.isArray(keys)) {
      const result: Record<string, unknown> = {};
      keys.forEach((key) => {
        if (key in data) {
          result[key] = data[key];
        }
      });
      return Promise.resolve(result);
    }
    return Promise.resolve(data);
  });

  vi.mocked(chrome.storage.local.set).mockImplementation((items: Record<string, unknown>) => {
    Object.assign(data, items);
    return Promise.resolve();
  });

  vi.mocked(chrome.storage.local.remove).mockImplementation((keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach((key) => delete data[key]);
    return Promise.resolve();
  });
}

/**
 * Mock Chrome tabs
 */
export function mockChromeTabs(tabs: chrome.tabs.Tab[]) {
  vi.mocked(chrome.tabs.query).mockResolvedValue(tabs);
}

// Re-export everything from React Testing Library (including waitFor)
export * from '@testing-library/react';
