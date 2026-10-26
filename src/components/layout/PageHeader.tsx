import styles from './PageHeader.module.css'

export function PageHeader({ title, description, welcome = false, compact = false }: { title: string; description: string; welcome?: boolean; compact?: boolean }) {
  return (
    <div className={styles.header + (compact ? ' ' + styles.compact : '')}>
      <div><h1>{title}</h1>{description && <p className={styles.description}>{description}</p>}</div>
      {welcome && <div className={styles.welcome}><p>你好，Jiaming</p><p className={styles.small}>今天，也留一点时间给自己。</p></div>}
    </div>
  )
}
