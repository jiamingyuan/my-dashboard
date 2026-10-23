# 通过 Module Federation 接入工具

my-dashboard 从 V0.2 起提供 Module Federation 接入能力。它是宿主（host），其他工具是独立构建、独立部署的远程应用（remote）。宿主只加载远程应用导出的 React 组件，不需要把工具源码合并到本仓库，也不需要把所有工具打进同一个包。

从另一个项目开始接入时，可先按 [外部模块接入指引](module-integration-guide.md) 完成本地配置、联调和部署；本页保留宿主协议与运行边界的说明。

当前正式配置 `public/modules.json` 的列表为空，没有接入任何业务工具。`tests/fixtures/federated-remote/` 仅供自动化测试，不会加入正式构建。

## 1. 远程项目导出组件

远程项目使用 React、TypeScript 和 Vite 时，安装 `@module-federation/vite`，配置如下。宿主已验证的插件版本是 1.23.5。

```ts
// vite.config.ts（远程工具项目）
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  // 这里必须是远程静态资源的实际部署地址；示例替换为你的地址。
  base: 'https://tools.example.com/ai-daily/',
  plugins: [
    react(),
    federation({
      name: 'ai_daily',
      filename: 'remoteEntry.js',
      exposes: { './DashboardModule': './src/DashboardModule.tsx' },
      shared: {
        react: { singleton: true, requiredVersion: packageJson.dependencies.react },
        'react-dom': { singleton: true, requiredVersion: packageJson.dependencies['react-dom'] },
        'react/jsx-runtime': { singleton: true, requiredVersion: packageJson.dependencies.react },
        'react-router': { singleton: true, requiredVersion: packageJson.dependencies['react-router'] },
      },
      manifest: true,
      bundleAllCSS: true,
      dts: false,
    }),
  ],
})
```

只共享项目实际安装并使用的依赖；如果远程项目不使用 React Router，移除相应共享项。宿主当前版本为 React / React DOM 19.3.1、React Router 8.5.0，建议远程项目保持一致。`singleton` 用于共享 React 实例，避免 Hooks 因重复 React 实例而失效。

远程入口默认导出组件，不在该入口调用 `createRoot`，也不要再包一层 `BrowserRouter`。需要单独访问远程项目时，可另设独立页面入口。

```tsx
// src/DashboardModule.tsx（远程工具项目）
type ModuleProps = {
  theme: 'night' | 'morning'
  basePath: string
  path: string
  search: string
  navigate: (to: string) => void
}

export default function DashboardModule({ theme, basePath, path, search, navigate }: ModuleProps) {
  return (
    <section>
      <p>当前主题：{theme}，页面：{path}{search}</p>
      <button onClick={() => navigate(basePath + '/settings')}>设置</button>
    </section>
  )
}
```

完整契约见 `src/modules/types.ts`：

| 参数 | 含义 |
| --- | --- |
| `theme` | 当前主题，切换后立即更新 |
| `basePath` | 模块根路径，例如 `/tools/ai-daily` |
| `path` | 模块内子路径，首页为 `/`，设置页为 `/settings` |
| `search` | URL 查询串，包含开头的 `?`；无参数时为空 |
| `navigate(to)` | 使用宿主路由跳转，模块内路径需拼接 `basePath` |

远程组件也可以使用共享的 React Router 上下文。当前组件契约面向 React；Vue 等框架需要先编写 React 适配组件，负责挂载、更新和卸载。

## 2. 部署远程产物

运行远程项目的生产构建，将完整 `dist/` 部署到对应地址。需要同时保留 `remoteEntry.js`、`mf-manifest.json`（如启用）、JS chunks、CSS 和其他资源，不能只发布入口文件。

跨域部署时，远程入口、manifest、JS、CSS 等资源都需要允许宿主来源的 CORS。HTTPS 宿主应使用 HTTPS 远程地址。远程资源路径必须指向远程服务器，避免 chunks 被误请求到宿主。可通过反向代理统一域名，减少跨域配置。

入口与 manifest 建议设置 `Cache-Control: no-cache` 或 `no-store`；带内容哈希的 chunks 可长期缓存。发布时先上传 chunks，最后更新入口和 manifest，并保留旧 chunks 供已打开的页面使用。远程入口或缺失 chunk 应返回 404，不要回退为 HTML。

## 3. 注册到宿主

编辑宿主 `public/modules.json`，添加条目：

```json
{
  "version": 1,
  "modules": [
    {
      "id": "ai-daily",
      "title": "AI 日报",
      "description": "每日 AI 资讯",
      "remote": "ai_daily",
      "entry": "https://tools.example.com/ai-daily/mf-manifest.json",
      "exposed": "./DashboardModule",
      "enabled": true
    }
  ]
}
```

这里仅为配置示例，不会自动启用 AI 日报。

- `id`：唯一的路由标识，小写字母开头，可含数字、连字符。
- `title`：侧栏和页面标题，列表顺序就是侧栏顺序。
- `description`：可选的页面说明。
- `remote`：与远程 Vite 配置的 `name` 一致。同一远程应用可导出多个工具，但各条目必须使用相同入口地址。
- `entry`：ES module 格式的 `remoteEntry.js` 或 `mf-manifest.json` 地址。支持绝对 HTTP(S) 地址，也支持基于宿主根路径的相对地址。
- `exposed`：与远程 `exposes` 的键一致，必须以 `./` 开头。
- `enabled`：可选，默认启用；`false` 时不显示菜单，也不能通过模块路由访问。

宿主启动时读取列表；点击工具后再下载远程组件。`/tools/ai-daily/*` 自动成为模块路由，刷新子路径仍由宿主承载。入口加载 15 秒超时或组件渲染失败时会显示重试页面，侧栏和主题切换继续可用。注册清单加载失败也可重试。

列表字段有格式校验，重复 ID、冲突入口和非法地址会使整份列表加载失败，不会部分启用。请先验证配置再发布。

## 4. 在现有 Nginx 容器发布

宿主构建会将 `public/modules.json` 原样复制为 `dist/modules.json`。如果只是增删、排序或停用已经部署好的远程工具，可以直接更新运行容器的配置文件，不必重新构建宿主：

```sh
docker cp public/modules.json my-dashboard:/usr/share/nginx/html/modules.json
```

浏览器刷新后重新读取列表。此操作不需要重启 Nginx；同时应保留源码中的配置，以免下次构建覆盖。Nginx 配置 `ops/nginx/default.conf` 已为 `/modules.json` 设置 `no-store`，并为 `/tools/*` 保留 SPA 回退。

修改宿主代码、共享依赖或插件配置时仍需重新构建，并发布完整 `dist/`。Vite 预览服务器仅用于本地验证。

## 样式与信任边界

宿主已提供 `--canvas`、`--panel`、`--heading`、`--text-primary`、`--text-secondary`、`--accent-bg` 等语义 CSS 变量，远程工具可以直接使用，以跟随晨间 / 夜间主题。建议远程工具使用 CSS Modules 或唯一类名前缀，避免重置 `html`、`body`、`button` 等全局样式。

Module Federation 的远程代码在同一页面执行，可访问宿主页面与浏览器存储，只注册你信任的远程项目。错误边界处理加载及 React 渲染失败，不提供进程隔离；不受信任的页面应另行设计 iframe 隔离方案。

## 验证

```sh
npm run lint
npm run build
npm run test:e2e
```

自动化测试会临时在 4176 端口启动真正构建的远程应用，覆盖远程入口与 manifest、共享 React Hooks、远程 CSS、主题同步、子路由刷新、停用配置、入口失败恢复和渲染失败隔离，同时运行原有外壳测试。测试远程不会部署到正式页面。
