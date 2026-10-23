import type { ComponentType, LazyExoticComponent } from 'react'
import type { Theme } from '../theme/theme-storage.ts'

export interface DashboardModule {
  id: string
  title: string
  description?: string
  remote: string
  entry: string
  exposed: string
}

export interface DashboardModuleProps {
  theme: Theme
  basePath: string
  path: string
  search: string
  navigate: (to: string) => void
}

export interface RemoteModuleExports {
  default: ComponentType<DashboardModuleProps>
}

export interface PreparedDashboardModule extends DashboardModule {
  Component: LazyExoticComponent<RemoteModuleExports['default']>
}

export type RegistryStatus = 'loading' | 'ready' | 'error'
