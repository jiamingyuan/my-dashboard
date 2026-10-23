import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ModuleRegistryContext } from './module-registry-context'
import { parseModuleRegistry } from './registry'
import { getDashboardModuleComponent } from './runtime'
import type { PreparedDashboardModule, RegistryStatus } from './types'

export function ModuleRegistryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ modules: PreparedDashboardModule[]; status: RegistryStatus }>({
    modules: [], status: 'loading',
  })
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => {
    setState({ modules: [], status: 'loading' })
    setRevision(value => value + 1)
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10_000)
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href

    async function load() {
      try {
        const response = await fetch(new URL('modules.json', baseUrl), {
          cache: 'no-store', signal: controller.signal,
        })
        if (!response.ok) throw new Error('Module registry HTTP ' + response.status)
        const data: unknown = await response.json()
        const modules = parseModuleRegistry(data, baseUrl).map(module => ({
          ...module, Component: getDashboardModuleComponent(module),
        }))
        if (active) setState({ modules, status: 'ready' })
      } catch (error) {
        if (active) {
          console.error('Unable to load the module registry.', error)
          setState({ modules: [], status: 'error' })
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }
    void load()
    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [revision])

  return <ModuleRegistryContext.Provider value={{ ...state, reload }}>{children}</ModuleRegistryContext.Provider>
}
