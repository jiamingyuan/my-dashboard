import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <section className={styles.panel} aria-label={title}>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  )
}
