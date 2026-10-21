export type Theme = 'night' | 'morning'
export const THEME_STORAGE_KEY = 'my-dashboard.theme'

export function initialTheme(): Theme {
  return document.documentElement.dataset.theme === 'morning' ? 'morning' : 'night'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Theme changes remain usable in private or storage-restricted contexts.
  }
}
