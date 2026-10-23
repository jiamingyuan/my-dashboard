import { lazy } from 'react'
import type { LazyExoticComponent } from 'react'
import { loadRemote, registerRemotes } from '@module-federation/runtime'
import type { DashboardModule, RemoteModuleExports } from './types'

const registeredEntries = new Map<string, string>()

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Remote module loading timed out.')), milliseconds)
    promise.then(
      value => { window.clearTimeout(timeout); resolve(value) },
      error => { window.clearTimeout(timeout); reject(error) },
    )
  })
}

export async function loadDashboardModule(module: DashboardModule): Promise<RemoteModuleExports> {
  const previousEntry = registeredEntries.get(module.remote)
  if (previousEntry !== module.entry) {
    registerRemotes([{ name: module.remote, entry: module.entry, type: 'module' }], {
      force: previousEntry !== undefined,
    })
    registeredEntries.set(module.remote, module.entry)
  }
  const exports = await withTimeout(
    loadRemote<RemoteModuleExports>(module.remote + '/' + module.exposed.slice(2)),
    15_000,
  )
  const component = exports?.default
  if (
    !component ||
    (typeof component !== 'function' && (typeof component !== 'object' || !('$$typeof' in component)))
  ) {
    throw new Error('The remote module must default-export a React component.')
  }
  return { default: component }
}

// Keep lazy component identities stable across navigation and theme updates.
const components = new Map<string, LazyExoticComponent<RemoteModuleExports['default']>>()

export function getDashboardModuleComponent(module: DashboardModule) {
  const key = JSON.stringify([module.remote, module.entry, module.exposed])
  let component = components.get(key)
  if (!component) {
    component = lazy(() => loadDashboardModule(module))
    components.set(key, component)
  }
  return component
}
