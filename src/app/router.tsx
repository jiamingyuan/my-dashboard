import { Route, Routes } from 'react-router'
import { AppShell } from '../components/layout/AppShell'
import { OverviewPage } from '../pages/OverviewPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RemoteModulePage } from '../pages/RemoteModulePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="tools/:moduleId/*" element={<RemoteModulePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
