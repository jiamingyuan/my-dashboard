import { createContext } from 'react'
import type { PreparedDashboardModule, RegistryStatus } from './types'

export interface ModuleRegistryState {
  modules: readonly PreparedDashboardModule[]
  status: RegistryStatus
  reload: () => void
}

export const ModuleRegistryContext = createContext<ModuleRegistryState | null>(null)
