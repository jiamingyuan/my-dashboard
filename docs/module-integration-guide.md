# 外部模块接入 my-dashboard 指引

适用版本：my-dashboard V0.2（npm 0.2.0）。本文面向在另一个项目中开发工具、希望把工具 UI 放进 my-dashboard 的开发者。

子模块负责导出 React 组件并部署自己的构建产物；my-dashboard 负责外壳、菜单、路由和主题。子模块源码不用搬到宿主仓库，也不用和宿主打成同一个包。Module Federation 连接的是前端组件，子模块后端仍需单独提供 API。

以下用 `ai-daily` 举例，所有名称、端口和地址都是演示配置，不代表项目已经接入 AI 日报。命令分为“子模块项目根目录”和“my-dashboard 项目根目录”两处执行。

## 1. 准备子模块项目

本指南假定子模块已有 React + TypeScript + Vite 工程，以及 `build`、`preview` 脚本。若缺少预览脚本，在子模块 package.json 的 scripts 中补充 `"preview": "vite preview"`；已有构建与类型检查脚本保留。

当前宿主的已验证基线：

| 项目 | 版本与接入关系 |
| --- | --- |
| Node.js | 宿主使用 24.20.0；复现本指南可使用同一环境 |
| React / React DOM | 19.3.1，建议子模块先对齐共享库版本 |
| React Router | 8.5.0，仅在子模块使用路由库时安装并共享 |
| Federation Vite 插件 | 1.23.5，以下示例使用此版本 |

在子模块项目根目录执行：

```sh
npm install --save-exact react@19.3.1 react-dom@19.3.1
npm install --save-dev --save-exact @module-federation/vite@1.23.5
```

React 的 TypeScript 类型也应与所用 React 主版本匹配。使用上面的组合时可对齐为 `@types/react@19.3.0`、`@types/react-dom@19.3.0`。Vite、TypeScript 和 `@vitejs/plugin-react` 沿用该子模块已有的兼容配置，不需要复制宿主的整套开发依赖，也不需要把这些依赖全局安装。

子模块仅导出组件时，无需再手动创建 Federation runtime 实例。当前宿主要求默认导出 React 组件；Vue 等其他框架需要 React 适配层，不能直接把 Vue 组件当作下文入口。

## 2. 配置子模块的 Vite

将下列 Federation 配置合并到子模块的 `vite.config.ts`。保留项目已有且需要的插件、alias 和构建设置。

```ts
// 子模块：vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

const publicBase = process.env.MODULE_PUBLIC_URL ?? 'http://127.0.0.1:8081/'

export default defineConfig({
  base: publicBase,
  plugins: [
    react(),
    federation({
      name: 'ai_daily',
      filename: 'remoteEntry.js',
      exposes: {
        './DashboardModule': './src/DashboardModule.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '19.3.1' },
        'react-dom': { singleton: true, requiredVersion: '19.3.1' },
        'react/jsx-runtime': { singleton: true, requiredVersion: '19.3.1' },
      },
      manifest: true,
      bundleAllCSS: true,
      dts: false,
    }),
  ],
  preview: {
    host: '127.0.0.1',
    port: 8081,
    strictPort: true,
    cors: {
      origin: [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
    },
  },
})
```

- `name` 是远程应用名，后面宿主清单的 `remote` 必须与它一致。为不同远程应用使用不同名称。
- `exposes` 的键 `./DashboardModule` 是宿主加载的组件标识，值指向子模块里的真实源码。
- `base` 必须指向浏览器能够访问的子模块资源地址，示例地址末尾保留 `/`。它不是宿主地址，也不是容器内部路径。
- `singleton` 让两边共享 React 实例，避免 Hooks 使用到另一份 React；本指南显式共享了 JSX runtime。
- `manifest: true` 生成 `mf-manifest.json`；`bundleAllCSS: true` 将暴露组件的 CSS 纳入加载；当前示例关闭远程类型生成，组件参数以本指南和宿主类型为准。
- `preview.cors` 只作用于本地预览，示例允许 8080 的运行页面和 5173 的宿主开发服务；宿主使用其他端口时追加其实际 origin。正式 Nginx、CDN 或其他静态服务器需要另外配置 CORS。

如果子模块使用 React Router，在项目中安装与宿主匹配的 `react-router@8.5.0`，并在 `shared` 内追加：

```ts
'react-router': { singleton: true, requiredVersion: '8.5.0' },
```

子模块不使用 React Router 时，无需安装或共享它。现有项目若通过其他包名或其他 Router 封装访问路由，还需核对其依赖与上下文，不要只靠再创建一个 BrowserRouter 规避问题。

## 3. 导出一个可被宿主渲染的组件

在子模块新增 `src/DashboardModule.tsx`：

```tsx
// 子模块：src/DashboardModule.tsx
import styles from './DashboardModule.module.css'

type DashboardModuleProps = {
  theme: 'night' | 'morning'
  basePath: string
  path: string
  search: string
  navigate: (to: string) => void
}

export default function DashboardModule({
  theme,
  basePath,
  path,
  search,
  navigate,
}: DashboardModuleProps) {
  if (path === '/settings') {
    return (
      <section className={styles.panel}>
        <h2>模块设置</h2>
        <p>当前主题：{theme}</p>
        <button type="button" onClick={() => navigate(basePath)}>返回模块首页</button>
      </section>
    )
  }

  return (
    <section className={styles.panel}>
      <h2>模块首页</h2>
      <p>当前主题：{theme}</p>
      <p>模块内地址：{path}{search}</p>
      <button type="button" onClick={() => navigate(basePath + '/settings')}>
        打开设置
      </button>
    </section>
  )
}
```

再新增 `src/DashboardModule.module.css`：

```css
.panel {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--panel);
  color: var(--text-primary);
}
```

参数来自当前宿主 [DashboardModuleProps](../src/modules/types.ts)：

| 参数 | 宿主传入的值 | 子模块如何使用 |
| --- | --- | --- |
| `theme` | `night` 或 `morning` | 配置组件库主题，或直接使用继承的语义 CSS 变量 |
| `basePath` | 例如 `/tools/ai-daily` | 拼接模块内跳转路径，不要硬编码宿主前缀 |
| `path` | 例如 `/`、`/settings` | 选择当前模块页面，不含模块根路径 |
| `search` | 例如 `?view=list`，没有时为空 | 用 URLSearchParams 等读取查询参数 |
| `navigate(to)` | 宿主导航函数 | 调用 `navigate(basePath + '/settings')` 跳转 |

导出的文件只负责组件，不调用 `createRoot`，不再包一层 `BrowserRouter`。原项目若需要独立运行，可保留 `main.tsx` 的挂载和独立入口，通过另一层包装复用业务组件。被宿主导入的入口不要直接依赖只在原项目 main.tsx 中初始化的 provider、样式或全局变量；需要的业务 provider 应由模块入口显式提供。

my-dashboard 已提供侧栏、顶栏和页面标题，通常只导出工具内容区。CSS Modules 或独有类名前缀可减少样式冲突；避免远程样式重置 `html`、`body` 或所有按钮。其他主题变量见 [tokens.css](../src/styles/tokens.css)。

## 4. 在本地构建和联调

在子模块项目根目录运行：

```sh
npm run build
npm run preview
```

保持预览运行，在浏览器打开下列地址，确认分别是 JSON 和 JavaScript，而不是 HTML 页面：

```text
http://127.0.0.1:8081/mf-manifest.json
http://127.0.0.1:8081/remoteEntry.js
```

8081 是此示例指定给子模块的端口；宿主继续使用 8080。若端口已被占用，请同时修改预览端口、base 和下文的注册地址，不要只改其中一处。

先使用构建后预览完成联通。子模块代码有变化时重新构建，并刷新宿主以重新加载入口；本文不将跨项目热更新作为已验证能力。

## 5. 在 my-dashboard 登记模块

进入 my-dashboard 项目，编辑 [public/modules.json](../public/modules.json)。首次接入且清单为空时，示例为：

```json
{
  "version": 1,
  "modules": [
    {
      "id": "ai-daily",
      "title": "AI 日报",
      "description": "每日 AI 资讯",
      "remote": "ai_daily",
      "entry": "http://127.0.0.1:8081/mf-manifest.json",
      "exposed": "./DashboardModule",
      "enabled": true
    }
  ]
}
```

已有其他工具时，只向原来的 `modules` 数组追加条目，保留已有配置。

对应关系必须一致：

| 宿主清单 | 子模块配置或含义 |
| --- | --- |
| `remote: ai_daily` | Federation 的 `name: ai_daily` |
| `exposed: ./DashboardModule` | `exposes` 中的键 `./DashboardModule` |
| `entry` | 部署后可访问的 manifest，也可直接填写 ESM 格式的 remoteEntry.js 地址 |
| `id: ai-daily` | 宿主路由标识，最终路径 `/tools/ai-daily`；可以与 remote 名不同 |

`id` 必须唯一、小写字母开头，可含数字和连字符。多个工具可以来自同一个远程应用，但同一 `remote` 名只能对应一个入口地址。`enabled: false` 会隐藏入口并使其工具路由显示 404。清单的 `version: 1` 是格式版本，与产品 V0.2 无关。完整约束见 [宿主接入说明](modules.md)。

目前运行的是 my-dashboard Nginx 容器，修改本机 public 文件后，还需在 my-dashboard 项目根目录执行：

```sh
docker cp public/modules.json my-dashboard:/usr/share/nginx/html/modules.json
```

若终端找不到 docker，可使用 `/Users/jiamingyuan/.docker/bin/docker`。仅更新清单无需重建宿主或重启 Nginx；保留本机清单修改，以免下次构建覆盖。宿主在 Vite 开发模式运行时，则直接读取自己的 public 文件，刷新即可。

在浏览器刷新 `http://localhost:8080`，侧栏应出现“AI 日报”，点击后访问 `/tools/ai-daily`。宿主不会扫描其他仓库或自动发现模块，菜单来自这份清单。

## 6. 核对联通结果

1. 点击侧栏入口，确认内容由子模块加载，网络中能看到远程入口及其 JS/CSS 正常返回。
2. 切换晨间 / 夜间，确认模块的 theme 参数和样式随之变化。
3. 点击示例的“打开设置”，确认 URL 为 `/tools/ai-daily/settings`；刷新该地址，模块仍能显示设置页。
4. 返回总览再进入工具，确认外壳和模块的业务 provider 不互相干扰。
5. 业务 API 单独检查：浏览器中的 `fetch('/api/...')` 默认访问宿主域名，不会因为代码来自远程就自动改向子模块服务器。按项目需求设置 API base，或明确配置宿主反向代理；鉴权和数据权限仍由各自服务设计。

本指南的模块是配置示例，不是新增的正式业务模块。仓库已有的自动化联通用例见 [Federation 测试](../tests/e2e/federation.spec.ts)，测试远程位于 tests/fixtures，不部署到用户页面。

## 7. 改为正式部署地址

在子模块项目根目录，用最终的浏览器访问地址构建，例如：

```sh
MODULE_PUBLIC_URL=https://tools.example.com/ai-daily/ npm run build
```

将完整 dist 内容部署到该 URL 对应的目录，至少保留入口、manifest、assets 下的 JS/CSS 与其他依赖资源；不要只复制 remoteEntry.js。确认这些文件能通过正式 URL 访问，再把宿主清单的 entry 改为：

```text
https://tools.example.com/ai-daily/mf-manifest.json
```

随后同步运行容器的清单并刷新页面。生产页面不能继续使用示例中的 127.0.0.1：它会指向访问者自己的电脑；容器名和容器内部文件路径也不是远程模块的浏览器访问地址。

部署服务器需要满足：

- 跨域时，manifest、入口、chunks、CSS 等资源允许实际宿主来源的 CORS；本地 preview 设置不会自动作用于 Nginx 或 CDN。也可通过同域反向代理统一资源地址。
- HTTPS 宿主使用 HTTPS 远程资源，避免浏览器阻止混合内容。
- JS 返回正确的 JavaScript MIME，缺失的入口或静态文件返回 404，不要套用 SPA 的 index.html 回退。
- 入口和 manifest 使用 no-cache 或 no-store；带内容哈希的 chunks 可以长期缓存。发布时先上传资源，最后更新入口/manifest，并保留旧 chunks 供已打开页面使用。

远程代码与宿主在同一页面执行，可访问 DOM 与浏览器存储。当前接入模型适合自己的可信工具；错误边界不隔离全局样式、全局副作用或浏览器权限。

## 常见问题

| 现象 | 优先核对 |
| --- | --- |
| 侧栏没有新工具 | 是否同步了运行容器的 modules.json、刷新页面、enabled 为 true，以及整份清单是否校验失败 |
| 工具列表暂时不可用 | modules.json 请求状态、JSON 语法、version=1、重复 id、同名 remote 是否配置了不同入口 |
| 工具暂时无法加载 | 浏览器 Network 中的 manifest / remoteEntry / chunk 请求、CORS、MIME，以及 remote / exposed 名称是否匹配；修复后使用重新加载按钮 |
| Expected a JavaScript module，却收到 text/html | 地址错误、文件未发布，或远程服务器把静态文件请求回退到了 index.html |
| Invalid hook call / React 上下文异常 | React 和 JSX runtime 是否 singleton，共享版本是否兼容，是否又创建了 React 根或嵌套 Router |
| 页面能显示但样式不对 | 暴露组件是否导入了自己的 CSS、是否启用 bundleAllCSS、CSS 是否可加载，以及是否污染了全局选择器 |
| 点击模块内链接跳出了工具 | 是否通过 basePath 拼接宿主路径，是否另用了独立 BrowserRouter |
| 改完代码仍看到旧模块 | 子模块是否重新构建并发布、入口/manifest 是否被缓存，宿主页面是否刷新 |
| API 返回宿主 HTML 或 404 | 相对 API 路径是否意外指向宿主；单独核对后端地址、反向代理、CORS 和鉴权 |

宿主实现与当前协议见 [modules.md](modules.md)、[组件类型](../src/modules/types.ts)、[运行时](../src/modules/runtime.ts)。插件配置可参考 [Module Federation 官方 Vite 文档](https://module-federation.io/integrations/build-tool/vite.html)；本文以仓库当前锁定版本和既有联通测试为依据，升级插件时重新核对配置。
