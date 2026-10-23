import { Component, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { useModuleRegistry } from '../modules/useModuleRegistry'
import type { PreparedDashboardModule } from '../modules/types'
import { useTheme } from '../theme/useTheme'
import { NotFoundPage } from './NotFoundPage'

class ModuleErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <EmptyState title="工具暂时无法加载" description="请重新加载，或返回总览后稍后再试。">
          <button type="button" onClick={() => window.location.reload()}>重新加载</button>
          <Link to="/">返回总览</Link>
        </EmptyState>
      )
    }
    return this.props.children
  }
}

function RemoteModuleContent({ module }: { module: PreparedDashboardModule }) {
  const { Component: Remote } = module
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  return (
    <ModuleErrorBoundary>
      <Suspense fallback={<EmptyState title="正在加载工具" description="请稍候。" />}>
        <Remote
          theme={theme}
          basePath={'/tools/' + module.id}
          path={'/' + (params['*'] ?? '')}
          search={location.search}
          navigate={to => { void navigate(to) }}
        />
      </Suspense>
    </ModuleErrorBoundary>
  )
}

export function RemoteModulePage() {
  const { moduleId } = useParams()
  const { modules, status, reload } = useModuleRegistry()

  if (status === 'loading') return <EmptyState title="正在加载工具列表" description="请稍候。" />
  if (status === 'error') {
    return (
      <EmptyState title="工具列表暂时不可用" description="请重新加载后再试。">
        <button type="button" onClick={reload}>重新加载工具列表</button>
        <Link to="/">返回总览</Link>
      </EmptyState>
    )
  }
  const module = modules.find(item => item.id === moduleId)
  if (!module) return <NotFoundPage />

  return (
    <>
      <PageHeader title={module.title} description={module.description ?? ''} />
      <RemoteModuleContent key={module.id} module={module} />
    </>
  )
}
