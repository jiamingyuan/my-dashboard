export interface NavigationItem {
  label: string
  to: string
}

export const workspaceNavigation: readonly NavigationItem[] = [{ label: '总览', to: '/' }]
// Intentionally empty: V0.1 includes the host shell, with no tool registrations.
export const toolNavigation: readonly NavigationItem[] = []
