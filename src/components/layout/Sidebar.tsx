import { NavLink } from 'react-router'
import { toolNavigation, workspaceNavigation } from '../../app/navigation'
import { ThemedIcon } from '../ui/ThemedIcon'
import { UserSummary } from './UserSummary'
import styles from './Sidebar.module.css'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.mark}><ThemedIcon name="brand" /></div>
        <div><p className={styles.wordmark}>my-dashboard</p><p className={styles.subtitle}>PERSONAL WORKSPACE</p></div>
      </div>
      <nav aria-label="工作空间" className={styles.group}>
        <p className={styles.caption}>工作空间</p>
        {workspaceNavigation.map(item => (
          <NavLink key={item.to} to={item.to} end className={({ isActive }) => `${styles.link} ${isActive ? styles.selected : ''}`} onClick={onNavigate}>
            <ThemedIcon name="home" /><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <nav aria-label="我的工具" className={styles.group}>
        <p className={styles.caption}>我的工具</p>
        {toolNavigation.length === 0 ? <p className={styles.noTools}>暂无工具</p> : toolNavigation.map(item => <NavLink key={item.to} to={item.to} className={styles.link} onClick={onNavigate}>{item.label}</NavLink>)}
      </nav>
      <div className={styles.userArea}><UserSummary /></div>
    </div>
  )
}
