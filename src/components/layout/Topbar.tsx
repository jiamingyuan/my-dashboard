import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useModuleRegistry } from '../../modules/useModuleRegistry'
import { ThemeSwitch } from '../ui/ThemeSwitch'
import styles from './Topbar.module.css'

export function Topbar({ openNavigation, navigationOpen }: { openNavigation: () => void; navigationOpen: boolean }) {
  const location = useLocation()
  const { modules } = useModuleRegistry()
  const moduleTitle = modules.find(module => location.pathname === '/tools/' + module.id || location.pathname.startsWith('/tools/' + module.id + '/'))?.title
  const [date, setDate] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const formattedDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('.')
  return (
    <header className={styles.topbar}>
      <button className={styles.menu} type="button" onClick={openNavigation} aria-label="打开导航" aria-controls="mobile-navigation" aria-expanded={navigationOpen}>菜单</button>
      <div className={styles.breadcrumb} aria-label="当前位置">
        <span className={styles.workspace}>工作空间</span><span className={styles.separator} aria-hidden="true">/</span>
        <span>{location.pathname === '/' ? '总览' : moduleTitle ?? '页面未找到'}</span>
      </div>
      <div className={styles.flexible} />
      <div className={styles.searchSpace} data-testid="search-space" aria-hidden="true" />
      <ThemeSwitch />
      <div className={styles.date}><time dateTime={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}>{formattedDate}</time></div>
    </header>
  )
}
