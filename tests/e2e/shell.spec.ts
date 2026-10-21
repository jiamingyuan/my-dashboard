import { test as base, expect, type Page } from '@playwright/test'
import { readFile, stat } from 'node:fs/promises'

const test = base.extend<{ runtimeGuard: void }>({
  runtimeGuard: [async ({ page }, use) => {
    const errors: string[] = []
    const externalRequests: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(request.url()) })
    page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4175/')) externalRequests.push(request.url()) })
    await use()
    expect(errors, 'No runtime, console, or resource errors').toEqual([])
    expect(externalRequests, 'No external assets or services at runtime').toEqual([])
  }, { auto: true }],
})

async function openShell(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-20T04:00:00Z'))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '我的工作台' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

for (const theme of ['night', 'morning'] as const) {
  test(`desktop ${theme}: shell geometry, local assets, fonts and empty state`, async ({ page }, testInfo) => {
    await openShell(page)
    if (theme === 'morning') await page.getByRole('button', { name: '晨间', exact: true }).click()
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await expect(page.getByRole('heading', { name: '还没有添加工具' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '我的工具', exact: true }).getByRole('link')).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: '工作空间', exact: true }).getByRole('link')).toHaveCount(1)
    await expect(page.getByRole('main')).not.toContainText(/AI 日报|背单词|media-keeper|serendipity|今日进度|最近使用/)
    await expect(page.locator('input, [role="search"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '设置', exact: true })).toHaveCount(0)
    await expect(page.locator('time')).toHaveText('2026.10.20')

    const header = await page.getByRole('banner').boundingBox()
    const aside = await page.getByRole('complementary', { name: '侧边栏' }).boundingBox()
    expect(aside?.width).toBe(248)
    expect(header?.height).toBe(72)
    for (const [locator, expected] of [
      [page.getByTestId('search-space'), { x: 562, y: 17, width: 264, height: 38 }],
      [page.getByRole('group', { name: '显示主题' }), { x: 842, y: 16, width: 152, height: 40 }],
      [page.locator('time').locator('..'), { x: 1010, y: 24, width: 142, height: 24 }],
    ] as const) {
      const box = await locator.boundingBox()
      expect(box).not.toBeNull()
      expect(Math.abs(box!.x - header!.x - expected.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(box!.y - header!.y - expected.y)).toBeLessThanOrEqual(1)
      expect(box!.width).toBe(expected.width)
      expect(box!.height).toBe(expected.height)
    }
    const reserved = page.getByTestId('search-space')
    await expect(reserved).toBeEmpty()
    await expect(reserved).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    expect(await reserved.getAttribute('tabindex')).toBeNull()
    await page.getByRole('button', { name: '夜间', exact: true }).focus()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('button', { name: '晨间', exact: true })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('navigation', { name: '工作空间', exact: true }).getByRole('link')).toBeFocused()

    const images = page.getByRole('complementary', { name: '侧边栏' }).locator('img')
    expect(await images.count()).toBe(2)
    for (const image of await images.all()) {
      expect(await image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
      expect(await image.getAttribute('src')).toMatch(/^\/assets\/.*\.svg$/)
    }
    const brandBox = await images.nth(0).boundingBox()
    const homeBox = await images.nth(1).boundingBox()
    expect(brandBox!.width).toBeCloseTo(theme === 'morning' ? 20 : 24, 1)
    expect(homeBox!.width).toBeCloseTo(theme === 'morning' ? 24 : 19.6, 1)
    expect(homeBox!.height).toBeCloseTo(theme === 'morning' ? 24 : 21.6, 1)
    const fonts = await page.evaluate(() => Array.from(document.fonts).filter(font => font.status === 'loaded').map(font => `${font.family.replaceAll('"', '')}:${font.weight}`))
    for (const font of ['Noto Sans SC:400', 'Noto Sans SC:500', 'Manrope:500', 'Manrope:600']) expect(fonts).toContain(font)
    await expect(page.locator('body')).toHaveCSS('background-color', theme === 'morning' ? 'rgb(238, 233, 223)' : 'rgb(24, 25, 22)')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const screenshot = testInfo.outputPath(`${theme}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    await testInfo.attach(theme, { path: screenshot, contentType: 'image/png' })
  })
}

test('theme persists across refresh and keyboard switching preserves the URL', async ({ page }) => {
  await openShell(page)
  const original = page.url()
  await page.getByRole('button', { name: '晨间', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: '晨间', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '夜间', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night')
  expect(page.url()).toBe(original)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night')
})

test('invalid saved theme defaults to night', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('my-dashboard.theme', 'unexpected'))
  await openShell(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night')
})

for (const method of ['getItem', 'setItem'] as const) {
  test(`storage ${method} failure does not block the shell or theme switching`, async ({ page }) => {
    await page.addInitScript(method => {
      Object.defineProperty(Storage.prototype, method, { value() { throw new DOMException('Storage denied', 'SecurityError') } })
    }, method)
    await openShell(page)
    await page.getByRole('button', { name: '晨间', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'morning')
    await page.getByRole('button', { name: '夜间', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'night')
  })
}

test('saved morning theme is applied before the application JavaScript loads', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('my-dashboard.theme', 'morning'))
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/assets/*.js', async route => { await gate; await route.continue() })
  try {
    await page.goto('/', { waitUntil: 'commit' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'morning')
    await expect(page.locator('#root')).toBeEmpty()
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(238, 233, 223)')
    await page.screenshot({ path: testInfo.outputPath('morning-before-react.png') })
  } finally { release() }
  await expect(page.getByRole('heading', { name: '我的工作台' })).toBeVisible()
  await expect(page.getByRole('button', { name: '晨间', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('tool URLs and unknown URLs resolve only to the host 404', async ({ page }) => {
  for (const path of ['/ai-daily', '/words', '/media-keeper', '/does-not-exist']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: '页面未找到' })).toBeVisible()
    await page.getByRole('link', { name: '返回总览' }).click()
    await expect(page.getByRole('heading', { name: '我的工作台' })).toBeVisible()
  }
  await page.getByRole('button', { name: '晨间', exact: true }).click()
  await page.goto('/unknown')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'morning')
})

test('mobile navigation traps focus, closes four ways, and restores focus', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openShell(page)
  const menu = page.getByRole('button', { name: '打开导航' })
  const dialog = page.getByRole('dialog', { name: '导航菜单' })
  await expect(menu).toBeVisible()
  await expect(page.getByTestId('search-space')).toBeHidden()
  await menu.click()
  await expect(dialog).toBeVisible()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await expect(dialog.getByRole('button', { name: '关闭导航' })).toBeFocused()
  await page.getByRole('button', { name: '晨间', exact: true }).focus()
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(menu).toBeFocused()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  await menu.click()
  await dialog.getByRole('button', { name: '关闭导航' }).click()
  await expect(menu).toBeFocused()
  await menu.click()
  await page.mouse.click(350, 200)
  await expect(dialog).not.toBeVisible()
  await expect(menu).toBeFocused()
  await menu.click()
  await dialog.getByRole('link', { name: '总览' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(menu).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true })
})

test('medium viewport and switching to desktop keep navigation usable', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await openShell(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const controls = await page.getByRole('group', { name: '显示主题' }).boundingBox()
  const date = await page.locator('time').boundingBox()
  expect(controls!.x + controls!.width).toBeLessThan(date!.x)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '打开导航' }).click()
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('complementary', { name: '侧边栏' })).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('shipped icons and font licenses are present, with no temporary asset references', async () => {
  for (const mode of ['night', 'morning']) for (const name of ['brand', 'home']) {
    const asset = `src/assets/icons/${mode}/${name}.svg`
    expect((await stat(asset)).size).toBeGreaterThan(100)
    expect(await readFile(asset, 'utf8')).toMatch(/<svg[^>]*width="[^"\s]+"[^>]*height="[^"\s]+"/)
  }
  for (const family of ['manrope', 'noto-sans-sc']) expect((await stat(`src/assets/fonts/${family}-LICENSE.txt`)).size).toBeGreaterThan(100)
  expect(await readFile('src/components/ui/ThemedIcon.tsx', 'utf8')).not.toContain('figma.com/api')
})
