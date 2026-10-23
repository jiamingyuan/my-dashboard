import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { useModuleRegistry } from '../modules/useModuleRegistry'

export function OverviewPage() {
  const { modules, status, reload } = useModuleRegistry()
  return (
    <>
      <PageHeader title="我的工作台" description="让工具各就其位，让日常更从容。" welcome />
      {status === 'loading' ? <EmptyState title="正在加载工具列表" description="请稍候。" />
        : status === 'error' ? (
          <EmptyState title="工具列表暂时不可用" description="请重新加载后再试。">
            <button type="button" onClick={reload}>重新加载工具列表</button>
          </EmptyState>
        ) : modules.length > 0
          ? <EmptyState title="选择一个工具开始使用" description="已接入的工具显示在侧栏中。" />
          : <EmptyState title="还没有添加工具" description="工具添加后会显示在这里。" />}
    </>
  )
}
