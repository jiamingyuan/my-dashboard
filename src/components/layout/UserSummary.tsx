import styles from './Sidebar.module.css'

export function UserSummary() {
  return (
    <div className={styles.user}>
      <span className={styles.avatar} aria-hidden="true">J</span>
      <div><p className={styles.username}>Jiaming</p><p className={styles.account}>个人工作空间</p></div>
    </div>
  )
}
