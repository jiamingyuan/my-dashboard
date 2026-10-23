import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '../theme/ThemeProvider'
import { AppRoutes } from './router'
import { ModuleRegistryProvider } from '../modules/ModuleRegistryProvider'

export function App() {
  return <ThemeProvider><ModuleRegistryProvider><BrowserRouter><AppRoutes /></BrowserRouter></ModuleRegistryProvider></ThemeProvider>
}
