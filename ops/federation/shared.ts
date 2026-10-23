import { readFileSync } from 'node:fs'

const { dependencies } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { dependencies: Record<string, string> }

export const sharedDependencies = {
  react: { singleton: true, requiredVersion: dependencies.react },
  'react-dom': { singleton: true, requiredVersion: dependencies['react-dom'] },
  'react/jsx-runtime': { singleton: true, requiredVersion: dependencies.react },
  'react-router': { singleton: true, requiredVersion: dependencies['react-router'] },
}
