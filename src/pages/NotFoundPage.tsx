import { Link } from 'react-router'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFoundPage() {
  return <><PageHeader title="页面未找到" description="这个页面还不存在。" /><EmptyState title="404" description="回到工作台，继续你的日常。"><Link to="/">返回总览</Link></EmptyState></>
}
