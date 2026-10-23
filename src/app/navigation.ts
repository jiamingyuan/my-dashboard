export interface NavigationItem {
  label: string
  to: string
}

export const workspaceNavigation: readonly NavigationItem[] = [{ label: '总览', to: '/' }]
