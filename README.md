# my-dashboard

个人工具网站的前端基础框架。当前 V0.1 只有应用外壳：总览、晨间 / 夜间主题、侧栏、顶栏、搜索留白与无工具空状态。没有业务模块、后端、登录或模拟接口。

仓库：[jiamingyuan/my-dashboard](https://github.com/jiamingyuan/my-dashboard)。

## 容器内开发（当前）

当前工作副本在 Docker 容器 `my-dashboard` 的 `/app/my-dashboard`，由持久化卷 `my-dashboard-project` 保存。开发镜像为 `my-dashboard:development`，基于 Debian trixie，包含 Node 24.20.0、Git、Python 3 和 Playwright Chromium。

在宿主进入容器：

```sh
docker exec -it -w /app/my-dashboard my-dashboard bash
```

容器主进程已启动 Vite，访问 http://localhost:8080，支持热更新，无需重复启动开发服务器。类型检查、lint、构建、测试及 Git 操作都在容器项目目录执行。开发镜像重建、恢复和数据卷说明见 [容器开发说明](ops/development/README.md)，GitHub 同步说明见 [GITHUB.md](ops/development/GITHUB.md)。

## Node.js 工程运行（其他环境）

需要 Node.js 24（当前验证为 24.20.0）和 npm（当前为 11.19.0）。在本目录运行：

```sh
npm ci
npm run dev
```

按终端打印的地址访问，默认 http://localhost:5173。开发服务只在本机启动，不代表发布或部署。

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

`build` 包括 TypeScript 检查并生成 `dist/`。`preview` 用于本地检查构建结果，默认 http://localhost:4173；请以终端实际地址为准。

## 回归测试

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright 自动在 127.0.0.1:4175 启动生产预览，覆盖双主题与刷新恢复、存储失败降级、首屏主题初始化、桌面留白尺寸、无模块范围、404、小屏抽屉与焦点恢复。截图、JSON 结果与失败轨迹位于被忽略的 `test-results/`，HTML 报告位于 `playwright-report/`。测试限于 Chromium；不代表其他浏览器或线上环境已验证。

## 工程结构

- `src/app/router.tsx`：总览和通用 404 的宿主路由。
- `src/app/navigation.ts`：工作空间导航和明确为空的工具导航。
- `src/components/layout/`：侧栏、顶栏、标题、用户展示和页脚。
- `src/components/ui/`：主题开关、空状态和原始图标适配。
- `src/theme/`：React Context 与本地主题存储；`index.html` 在应用脚本运行前设置主题。
- `src/styles/`：两套语义变量、字体和全局基础样式；组件样式使用 CSS Modules。
- `src/assets/`：原始 Figma SVG、自托管 WOFF2 字体与许可证，没有运行时 CDN。
- `tests/e2e/`：交互与资源验证。
- `pjkp/V0.1/`：需求、实施方案、测试计划与实际结果。

未来需要新增页面时，在 `router.tsx` 声明路由，在 `navigation.ts` 增加对应导航；宿主外壳通过 Outlet 承载页面。本版没有模块注册 SDK、模块样例或模块目录，新增业务功能另按其实际需求设计。

## UI 与行为

UI 来源：[晨间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=14-266) / [夜间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=4-86)。只还原本版外壳；原稿的业务卡片及工具页面不加入。

- 默认夜间，手动选择保存于 `my-dashboard.theme`；只接受 `night` / `morning`。存储不可用时仍能切换，不自动跟随系统主题。
- 桌面搜索位置为 264 × 38 的透明空白，无输入框、快捷键或点击行为。1200 以下为适配顶栏隐藏占位，768 以下使用模态导航抽屉。
- 日期使用浏览器本地时间；Jiaming 为设计稿中的静态个人信息，不表示已登录账户。
- 主题色集中于 `tokens.css`。图标来源见 `src/assets/icons/README.md`，字体版本与许可证见 `src/assets/fonts/`。

## 依赖基线

React / React DOM 19.3.1，React Router 8.5.0，Vite 8.3.4，TypeScript 6.0.3，ESLint 10.13.0，Playwright 1.64.1。精确直接依赖见 `package.json`，完整解析结果以唯一 `package-lock.json` 为准。

## 后续托管注意

当前仅在本机开发容器运行，尚未配置公网托管。若以后使用静态托管，需要将应用内未知 URL 回退到 `index.html`，再由 React Router 显示总览或 404；静态资产路径仍应正常返回文件。Vite 当前 base 为 `/`，部署到子路径时需同步配置 Vite base 和路由 basename，并重新验证资源与直达刷新。
