import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

const now = new Date();
const buildTimestamp = Date.now();
const buildVersion = `v2026.${now.toISOString().slice(0, 10).replace(/-/g, '')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

function versionPlugin(): Plugin {
  return {
    name: 'version-manifest-plugin',
    buildStart() {
      const info = {
        version: buildVersion,
        buildTime: buildTimestamp,
        buildDate: now.toISOString(),
      };
      try {
        const publicDir = path.resolve(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(
          path.resolve(publicDir, 'version.json'),
          JSON.stringify(info, null, 2)
        );
      } catch (e) {
        console.warn('Could not write public/version.json:', e);
      }
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          {
            version: buildVersion,
            buildTime: buildTimestamp,
            buildDate: now.toISOString(),
          },
          null,
          2
        ),
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), versionPlugin()],
    define: {
      __APP_BUILD_TIME__: JSON.stringify(buildTimestamp),
      __APP_VERSION__: JSON.stringify(buildVersion),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
