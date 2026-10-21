/* global fetch, process, console, document, innerWidth, URL */
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const baseURL = process.argv[2] || 'http://127.0.0.1:8080'
const origin = new URL(baseURL).origin
const health = await fetch(`${origin}/healthz`)
assert.equal(health.status, 200)
assert.equal((await health.text()).trim(), 'ok')
const missingAsset = await fetch(`${origin}/assets/missing-verification.js`)
assert.equal(missingAsset.status, 404)

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const errors = []
  const external = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', request => { if (new URL(request.url()).origin !== origin) external.push(request.url()) })
  const response = await page.goto(origin)
  assert.equal(response.status(), 200)
  await page.getByRole('heading', { name: '我的工作台' }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.getByRole('heading', { name: '还没有添加工具' }).count(), 1)
  assert.equal(await page.getByRole('navigation', { name: '我的工具', exact: true }).getByRole('link').count(), 0)
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'night')

  await page.getByRole('button', { name: '晨间', exact: true }).click()
  await page.reload()
  await page.getByRole('heading', { name: '我的工作台' }).waitFor()
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'morning')
  assert.equal((await page.getByTestId('search-space').boundingBox()).width, 264)
  for (const image of await page.locator('aside img').all()) {
    await image.evaluate(img => img.decode())
    assert(await image.evaluate(img => img.complete && img.naturalWidth > 0))
  }

  const direct = await page.goto(`${origin}/not-found-container-check`)
  assert.equal(direct.status(), 200, 'SPA fallback serves the application shell')
  await page.getByRole('heading', { name: '页面未找到' }).waitFor()
  await page.reload()
  await page.getByRole('link', { name: '返回总览' }).click()
  await page.getByRole('heading', { name: '我的工作台' }).waitFor()

  await page.setViewportSize({ width: 390, height: 844 })
  const menu = page.getByRole('button', { name: '打开导航' })
  await menu.click()
  await page.getByRole('dialog', { name: '导航菜单' }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: '导航菜单' }).waitFor({ state: 'hidden' })
  assert.equal(await menu.evaluate(element => element === document.activeElement), true)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.deepEqual(errors, [])
  assert.deepEqual(external, [])
  console.log(JSON.stringify({ baseURL: origin, health: 'passed', missingAsset404: 'passed', themes: 'passed', localAssets: 'passed', emptyTools: 'passed', directRouteAndRefresh: 'passed', mobileNavigation: 'passed', runtimeErrors: errors, externalRequests: external }, null, 2))
  await context.close()
} finally {
  await browser.close()
}
