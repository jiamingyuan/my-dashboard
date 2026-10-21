import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'

export function OverviewPage() {
  return <><PageHeader title="我的工作台" description="让工具各就其位，让日常更从容。" welcome /><EmptyState title="还没有添加工具" description="工具添加后会显示在这里。" /></>
}
