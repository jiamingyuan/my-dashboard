import { useState, type ReactNode } from 'react'
import { ThemeContext } from './theme-context'
import { applyTheme, initialTheme, type Theme } from './theme-storage'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState(initialTheme)
  function setTheme(next: Theme) {
    applyTheme(next)
    updateTheme(next)
  }
  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}
