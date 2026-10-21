import { useTheme } from '../../theme/useTheme'
import styles from './ThemeSwitch.module.css'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  return (
    <div className={styles.switch} role="group" aria-label="显示主题">
      <button type="button" aria-pressed={theme === 'morning'} onClick={() => setTheme('morning')}>晨间</button>
      <button type="button" aria-pressed={theme === 'night'} onClick={() => setTheme('night')}>夜间</button>
    </div>
  )
}
