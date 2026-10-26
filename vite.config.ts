import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import { sharedDependencies } from './ops/federation/shared.ts'

const { name, version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { name: string; version: string }

export default defineConfig({
  plugins: [
    {
      name: 'dashboard-version',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ name, version }, null, 2) + '\n',
        })
      },
    },
    react(),
    federation({
      name: 'my_dashboard',
      remotes: {},
      shared: sharedDependencies,
      dts: false,
    }),
  ],
  build: { assetsInlineLimit: 0 },
  server: { proxy: { '/media-keeper/': 'http://127.0.0.1:8081' } },
  preview: { proxy: { '/media-keeper/': 'http://127.0.0.1:8081' } },
})
