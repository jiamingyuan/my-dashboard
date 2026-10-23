import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'
import { sharedDependencies } from '../../../ops/federation/shared.ts'

export default defineConfig({
  root: import.meta.dirname,
  base: 'http://127.0.0.1:4176/',
  plugins: [federation({
    name: 'fixture_remote',
    filename: 'remoteEntry.js',
    exposes: {
      './Panel': './Panel.ts',
      './BrokenPanel': './BrokenPanel.ts',
    },
    shared: sharedDependencies,
    manifest: true,
    dts: false,
    bundleAllCSS: true,
  })],
  build: {
    outDir: resolve(import.meta.dirname, '../../../node_modules/.tmp/federation-remote'),
    emptyOutDir: true,
  },
  preview: { host: '127.0.0.1', port: 4176, strictPort: true, cors: true },
})
