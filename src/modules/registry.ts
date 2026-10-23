import type { DashboardModule } from './types.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Invalid module field: ' + field)
  }
  return value.trim()
}

export function parseModuleRegistry(value: unknown, baseUrl: string): DashboardModule[] {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.modules)) {
    throw new Error('Expected a version 1 module registry.')
  }
  const ids = new Set<string>()
  const remotes = new Map<string, string>()
  const modules: DashboardModule[] = []

  for (const item of value.modules) {
    if (!isRecord(item)) throw new Error('Invalid module definition.')
    const id = requiredString(item.id, 'id')
    const title = requiredString(item.title, 'title')
    const remote = requiredString(item.remote, 'remote')
    const exposed = requiredString(item.exposed, 'exposed')
    const entry = new URL(requiredString(item.entry, 'entry'), baseUrl)

    if (!/^[a-z][a-z0-9-]*$/.test(id) || ids.has(id)) {
      throw new Error('Invalid or duplicate module id: ' + id)
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(remote)) {
      throw new Error('Invalid remote name: ' + remote)
    }
    if (!/^\.\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(exposed)) {
      throw new Error('Invalid exposed module: ' + exposed)
    }
    if (!['http:', 'https:'].includes(entry.protocol) || entry.username || entry.password || entry.hash) {
      throw new Error('Module entries must be HTTP(S) URLs without credentials or fragments.')
    }
    if (item.description !== undefined && typeof item.description !== 'string') {
      throw new Error('Invalid module description.')
    }
    if (item.enabled !== undefined && typeof item.enabled !== 'boolean') {
      throw new Error('Invalid enabled flag.')
    }
    const previousEntry = remotes.get(remote)
    if (previousEntry && previousEntry !== entry.href) {
      throw new Error('One remote name cannot refer to different entries.')
    }
    ids.add(id)
    remotes.set(remote, entry.href)
    if (item.enabled === false) continue

    modules.push({
      id, title, remote, exposed, entry: entry.href,
      description: typeof item.description === 'string' ? item.description : undefined,
    })
  }
  return modules
}
