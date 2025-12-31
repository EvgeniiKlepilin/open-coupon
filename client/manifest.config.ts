import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  // Minimal permissions - only what we actually need
  // Removed: contentSettings (unused), scripting (use declarative content_scripts), file:/// (security risk)
  permissions: ['sidePanel', 'activeTab', 'storage', 'alarms'],
  // Only localhost for development API calls
  // activeTab permission handles accessing page content without broad host_permissions
  host_permissions: ['http://localhost:3030/*'],
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      // Content scripts run on all HTTP/HTTPS pages (file:/// removed for security)
      matches: ['http://*/*', 'https://*/*'],
    },
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
});
