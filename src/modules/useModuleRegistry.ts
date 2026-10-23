import { useContext } from 'react'
import { ModuleRegistryContext } from './module-registry-context'

export function useModuleRegistry() {
  const registry = useContext(ModuleRegistryContext)
  if (!registry) throw new Error('useModuleRegistry requires ModuleRegistryProvider')
  return registry
}
