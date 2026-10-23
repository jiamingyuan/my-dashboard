import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parseModuleRegistry } from '../../src/modules/registry.ts'

const remote = {
  id: 'fixture',
  title: '测试工具',
  remote: 'fixture_remote',
  entry: 'http://127.0.0.1:4176/remoteEntry.js',
  exposed: './Panel',
}

async function registry(page: Page, modules: unknown[]) {
  await page.route('**/modules.json', route => route.fulfill({
    json: { version: 1, modules },
  }))
}

test('runtime registry loads an actual remote, shared React hooks, CSS, theme and nested routes', async ({ page }) => {
  await registry(page, [remote])
  await page.goto('/')
  await expect(page.getByRole('link', { name: '测试工具', exact: true })).toBeVisible()
  await page.getByRole('link', { name: '测试工具', exact: true }).click()
  await expect(page.getByRole('heading', { name: '远程组件已就绪' })).toBeVisible()
  await expect(page.getByTestId('remote-panel')).toHaveCSS('padding', '24px')
  await page.getByRole('button', { name: '远程计数：0', exact: true }).click()
  await expect(page.getByRole('button', { name: '远程计数：1', exact: true })).toBeVisible()
  await expect(page.getByTestId('remote-theme')).toHaveText('night')
  await page.getByRole('button', { name: '晨间', exact: true }).click()
  await expect(page.getByTestId('remote-theme')).toHaveText('morning')
  await expect(page.getByTestId('remote-panel')).toHaveCSS('background-color', 'rgb(248, 245, 239)')
  await page.getByRole('button', { name: '打开子页面' }).click()
  await expect(page).toHaveURL(/\/tools\/fixture\/details\?view=list$/)
  await expect(page.getByTestId('remote-path')).toHaveText('/details?view=list')
  await expect(page.getByRole('button', { name: '远程计数：1', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '远程组件已就绪' })).toBeVisible()
  await expect(page.getByTestId('remote-theme')).toHaveText('morning')
  await expect(page.getByTestId('remote-path')).toHaveText('/details?view=list')
})

test('manifest entry works, and disabled tools are not registered in navigation', async ({ page }) => {
  await registry(page, [
    { ...remote, entry: 'http://127.0.0.1:4176/mf-manifest.json' },
    { ...remote, id: 'disabled', title: '停用工具', entry: 'http://127.0.0.1:4176/mf-manifest.json', enabled: false },
  ])
  await page.goto('/tools/fixture')
  await expect(page.getByRole('heading', { name: '远程组件已就绪' })).toBeVisible()
  await expect(page.getByRole('link', { name: '停用工具' })).toHaveCount(0)
  await page.goto('/tools/disabled')
  await expect(page.getByRole('heading', { name: '页面未找到' })).toBeVisible()
})

test('remote entry failure is isolated and a full reload can recover', async ({ page }) => {
  await registry(page, [remote])
  const entry = 'http://127.0.0.1:4176/remoteEntry.js'
  await page.route(entry, route => route.abort())
  await page.goto('/tools/fixture')
  await expect(page.getByRole('heading', { name: '工具暂时无法加载' })).toBeVisible()
  await page.getByRole('button', { name: '晨间', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'morning')
  await page.unroute(entry)
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await expect(page.getByRole('heading', { name: '远程组件已就绪' })).toBeVisible()
})

test('a remote render failure leaves the host navigation usable', async ({ page }) => {
  await registry(page, [{ ...remote, exposed: './BrokenPanel' }])
  await page.goto('/tools/fixture')
  await expect(page.getByRole('heading', { name: '工具暂时无法加载' })).toBeVisible()
  await page.getByRole('link', { name: '返回总览', exact: true }).click()
  await expect(page.getByRole('heading', { name: '我的工作台' })).toBeVisible()
})

test('registry failure can be retried without losing the host shell', async ({ page }) => {
  let fail = true
  await page.route('**/modules.json', route => route.fulfill(
    fail ? { status: 503, body: 'unavailable' } : { json: { version: 1, modules: [] } },
  ))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '工具列表暂时不可用' })).toBeVisible()
  fail = false
  await page.getByRole('main').getByRole('button', { name: '重新加载工具列表' }).click()
  await expect(page.getByRole('heading', { name: '还没有添加工具' })).toBeVisible()
})

test('unknown tool routes remain 404 when the runtime list is empty', async ({ page }) => {
  await page.goto('/tools/not-registered/details')
  await expect(page.getByRole('heading', { name: '页面未找到' })).toBeVisible()
})

test('registry validation rejects unsafe entries, duplicates and conflicting remotes', () => {
  const base = 'http://localhost:8080/'
  for (const modules of [
    [{ ...remote, entry: 'javascript:alert(1)' }],
    [{ ...remote, id: '../escape' }],
    [{ ...remote, exposed: '../Panel' }],
    [remote, remote],
    [remote, { ...remote, id: 'other', entry: 'http://localhost:9000/remoteEntry.js' }],
    [{ ...remote, enabled: 'false' }],
  ]) {
    expect(() => parseModuleRegistry({ version: 1, modules }, base)).toThrow()
  }
  expect(() => parseModuleRegistry({ version: 2, modules: [] }, base)).toThrow()
  expect(parseModuleRegistry({ version: 1, modules: [{ ...remote, entry: '/modules/test/remoteEntry.js' }] }, base)[0].entry)
    .toBe('http://localhost:8080/modules/test/remoteEntry.js')
})
