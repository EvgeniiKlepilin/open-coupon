import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function with providers if needed
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Mock fetch responses
 */
export function mockFetch(data: any, ok = true, status = 200) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      statusText: ok ? 'OK' : 'Error',
    } as Response)
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
export function mockChromeStorage(data: Record<string, any> = {}) {
  (chrome.storage.local.get as any).mockImplementation((keys: string | string[] | null) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: data[keys] });
    }
    if (Array.isArray(keys)) {
      const result: Record<string, any> = {};
      keys.forEach((key) => {
        if (key in data) {
          result[key] = data[key];
        }
      });
      return Promise.resolve(result);
    }
    return Promise.resolve(data);
  });

  (chrome.storage.local.set as any).mockImplementation((items: Record<string, any>) => {
    Object.assign(data, items);
    return Promise.resolve();
  });

  (chrome.storage.local.remove as any).mockImplementation((keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach((key) => delete data[key]);
    return Promise.resolve();
  });
}

/**
 * Mock Chrome tabs
 */
export function mockChromeTabs(tabs: chrome.tabs.Tab[]) {
  (chrome.tabs.query as any).mockResolvedValue(tabs);
}

// Re-export everything from React Testing Library (including waitFor)
export * from '@testing-library/react';
