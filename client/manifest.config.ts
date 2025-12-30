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
  permissions: ['sidePanel', 'contentSettings', 'activeTab', 'storage', 'scripting'],
  host_permissions: ['http://localhost:3030/*', 'http://*/*', 'https://*/*', 'file:///*'],
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['http://*/*', 'https://*/*', 'file:///*'],
    },
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
});
