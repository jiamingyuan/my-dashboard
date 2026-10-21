import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PageFooter } from './PageFooter'
import styles from './AppShell.module.css'

export function AppShell() {
  const dialog = useRef<HTMLDialogElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const previousOverflow = useRef('')
  const [navigationOpen, setNavigationOpen] = useState(false)

  function openNavigation() {
    if (!dialog.current || dialog.current.open) return
    previousFocus.current = document.activeElement as HTMLElement
    previousOverflow.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current.showModal()
    setNavigationOpen(true)
  }

  function closeNavigation() { dialog.current?.close() }

  function finishClosing() {
    document.body.style.overflow = previousOverflow.current
    setNavigationOpen(false)
    previousFocus.current?.focus()
  }

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => { if (media.matches) dialog.current?.close() }
    media.addEventListener('change', closeOnDesktop)
    const element = dialog.current
    return () => {
      media.removeEventListener('change', closeOnDesktop)
      if (element?.open) { element.close(); document.body.style.overflow = previousOverflow.current }
    }
  }, [])

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <aside className={styles.desktopSidebar} aria-label="侧边栏"><Sidebar /></aside>
      <div className={styles.mainColumn}>
        <Topbar openNavigation={openNavigation} navigationOpen={navigationOpen} />
        <main id="main-content" tabIndex={-1} className={styles.content}>
          <Outlet />
          <PageFooter />
        </main>
      </div>
      <dialog ref={dialog} id="mobile-navigation" aria-label="导航菜单" className={styles.drawer} onClose={finishClosing}
        onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX > r.right || event.clientX < r.left || event.clientY < r.top || event.clientY > r.bottom) closeNavigation() } }}>
        <div className={styles.drawerHeader}><button type="button" onClick={closeNavigation} autoFocus>关闭导航</button></div>
        <Sidebar onNavigate={closeNavigation} />
      </dialog>
    </div>
  )
}
