/**
 * Application Configuration
 * Handles environment-based configuration with runtime fallbacks
 */

/**
 * Configuration interface
 */
interface Config {
  apiBaseUrl: string;
  environment: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get API base URL from environment or chrome.storage
 * Falls back to production URL if not configured
 */
async function getApiBaseUrl(): Promise<string> {
  // First, try to get from build-time environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl;
  }

  // Fallback: Try chrome.storage for runtime configuration
  try {
    const result = await chrome.storage.local.get('apiBaseUrl');
    if (result.apiBaseUrl && typeof result.apiBaseUrl === 'string') {
      return result.apiBaseUrl;
    }
  } catch (error) {
    console.warn('[Config] Failed to read API URL from storage:', error);
  }

  // Final fallback: production URL
  return 'https://api.opencoupon.com/api/v1';
}

/**
 * Get environment from build-time variable
 */
function getEnvironment(): 'development' | 'production' | 'test' {
  const env = import.meta.env.VITE_ENV || import.meta.env.MODE;

  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  return 'development';
}

/**
 * Initialize configuration (async)
 */
async function initializeConfig(): Promise<Config> {
  const apiBaseUrl = await getApiBaseUrl();
  const environment = getEnvironment();

  return {
    apiBaseUrl,
    environment,
    isDevelopment: environment === 'development',
    isProduction: environment === 'production',
  };
}

/**
 * Synchronous config for build-time values
 * Note: apiBaseUrl will use fallback if async initialization hasn't completed
 */
export const config: Config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.opencoupon.com/api/v1',
  environment: getEnvironment(),
  isDevelopment: getEnvironment() === 'development',
  isProduction: getEnvironment() === 'production',
};

/**
 * Get full configuration (async, includes chrome.storage check)
 */
export async function getConfig(): Promise<Config> {
  return initializeConfig();
}

/**
 * Update API base URL at runtime (for admin settings UI)
 */
export async function setApiBaseUrl(url: string): Promise<void> {
  try {
    // Validate URL format
    new URL(url); // Throws if invalid
    await chrome.storage.local.set({ apiBaseUrl: url });
  } catch (error) {
    throw new Error('Invalid API URL format');
  }
}

/**
 * Get API base URL (async, checks all sources)
 */
export async function getApiUrl(): Promise<string> {
  return getApiBaseUrl();
}
