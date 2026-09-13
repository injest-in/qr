import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

function resolveVersionInfo() {
  let commitCount = '1';
  let shortHash = 'dev';

  try {
    commitCount = execSync('git rev-list --count HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    shortHash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    commitCount = process.env.GITHUB_RUN_NUMBER || '1';
    shortHash = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'dev';
  }

  let pkgVersion = '1.0.0';
  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
    pkgVersion = pkg.version || '1.0.0';
  } catch {
    // fallback
  }

  // Format: e.g. "v1.0.14"
  const baseVersion = pkgVersion.replace(/\.[0-9]+$/, '');
  const versionString = `v${baseVersion}.${commitCount}`;
  const buildTime = new Date().toISOString();

  return { versionString, shortHash, buildTime };
}

const { versionString, shortHash, buildTime } = resolveVersionInfo();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/qr/',
  define: {
    __APP_VERSION__: JSON.stringify(versionString),
    __COMMIT_HASH__: JSON.stringify(shortHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  }
});
