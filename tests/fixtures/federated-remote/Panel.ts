/// <reference types="vite/client" />
import { createElement, useState } from 'react'
import type { DashboardModuleProps } from '../../../src/modules/types.ts'
import './panel.css'

export default function Panel({ theme, basePath, path, search, navigate }: DashboardModuleProps) {
  const [count, setCount] = useState(0)
  return createElement('section', { className: 'federation-fixture-panel', 'data-testid': 'remote-panel' },
    createElement('h2', null, '远程组件已就绪'),
    createElement('p', { 'data-testid': 'remote-theme' }, theme),
    createElement('p', { 'data-testid': 'remote-path' }, path + search),
    createElement('button', { type: 'button', onClick: () => setCount(value => value + 1) }, '远程计数：' + count),
    createElement('button', { type: 'button', onClick: () => navigate(basePath + '/details?view=list') }, '打开子页面'),
  )
}
