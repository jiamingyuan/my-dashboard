import styles from './PageHeader.module.css'

export function PageHeader({ title, description, welcome = false }: { title: string; description: string; welcome?: boolean }) {
  return (
    <div className={styles.header}>
      <div><h1>{title}</h1><p className={styles.description}>{description}</p></div>
      {welcome && <div className={styles.welcome}><p>你好，Jiaming</p><p className={styles.small}>今天，也留一点时间给自己。</p></div>}
    </div>
  )
}
