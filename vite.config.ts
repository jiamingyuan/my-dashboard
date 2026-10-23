import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import { sharedDependencies } from './ops/federation/shared.ts'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'my_dashboard',
      remotes: {},
      shared: sharedDependencies,
      dts: false,
    }),
  ],
  build: { assetsInlineLimit: 0 },
})
