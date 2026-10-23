# my-dashboard

个人工具网站。当前 V0.2（npm 版本 0.2.0）在 V0.1 前端外壳基础上加入 Module Federation：总览、晨间 / 夜间主题、侧栏、顶栏、搜索留白与远程模块接入能力。默认工具清单为空，没有业务模块、后端、登录或模拟接口。

仓库：[jiamingyuan/my-dashboard](https://github.com/jiamingyuan/my-dashboard)。

## 开发与运行

项目在本机使用 Node.js 开发；当前 `my-dashboard` 容器使用 Nginx 提供构建后的静态网页，访问 http://localhost:8080。容器不包含开发源码或 Node.js 开发环境，网页文件在 `/usr/share/nginx/html`，不挂载 Volume。

## 本机开发

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

Playwright 自动在 127.0.0.1:4175 启动生产预览，在 4176 启动真实的测试远程应用。覆盖远程模块加载、React 共享、CSS、主题传递、子路由和失败恢复，以及双主题与刷新恢复、存储失败降级、首屏主题初始化、桌面留白尺寸、无模块范围、404、小屏抽屉与焦点恢复。截图、JSON 结果与失败轨迹位于被忽略的 `test-results/`，HTML 报告位于 `playwright-report/`。测试限于 Chromium；不代表其他浏览器或线上环境已验证。

## 工程结构

- `src/app/router.tsx`：总览、远程工具 `/tools/:moduleId/*` 和通用 404 的宿主路由。
- `src/app/navigation.ts`：工作空间导航；工具导航由运行时清单生成。
- `src/modules/`：远程清单校验、加载、React 共享运行时与组件契约。
- `public/modules.json`：运行时工具清单，默认列表为空。
- `src/components/layout/`：侧栏、顶栏、标题、用户展示和页脚。
- `src/components/ui/`：主题开关、空状态和原始图标适配。
- `src/theme/`：React Context 与本地主题存储；`index.html` 在应用脚本运行前设置主题。
- `src/styles/`：两套语义变量、字体和全局基础样式；组件样式使用 CSS Modules。
- `src/assets/`：原始 Figma SVG、自托管 WOFF2 字体与许可证，没有运行时 CDN。
- `tests/e2e/`：交互与资源验证。
- [项目记忆入口](pjkp/index.md)：当前状态、规则、简介与架构；[V0.1](pjkp/V0.1/iteration.md)、[V0.2](pjkp/V0.2/iteration.md) 各用一份迭代记录保存目标、决定和真实结果。

其他项目可以独立构建和部署，通过 Module Federation 导出 React 组件，再在 `public/modules.json` 注册。侧栏和路由自动生成，组件跟随宿主主题。子模块项目的完整配置、联调和部署步骤见 [外部模块接入指引](docs/module-integration-guide.md)，宿主协议与边界见 [模块接入说明](docs/modules.md)。

## UI 与行为

UI 来源：[晨间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=14-266) / [夜间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=4-86)。只还原本版外壳；原稿的业务卡片及工具页面不加入。

- 默认夜间，手动选择保存于 `my-dashboard.theme`；只接受 `night` / `morning`。存储不可用时仍能切换，不自动跟随系统主题。
- 桌面搜索位置为 264 × 38 的透明空白，无输入框、快捷键或点击行为。1200 以下为适配顶栏隐藏占位，768 以下使用模态导航抽屉。
- 日期使用浏览器本地时间；Jiaming 为设计稿中的静态个人信息，不表示已登录账户。
- 主题色集中于 `tokens.css`。图标来源见 `src/assets/icons/README.md`，字体版本与许可证见 `src/assets/fonts/`。

## 依赖基线

React / React DOM 19.3.1，React Router 8.5.0，Vite 8.3.4，TypeScript 6.0.3，ESLint 10.13.0，Playwright 1.64.1，Module Federation Vite 插件 1.23.5、运行时 2.9.2。精确直接依赖见 `package.json`，完整解析结果以唯一 `package-lock.json` 为准。

## 后续托管注意

当前仅通过本机 Nginx 容器提供静态页面，尚未配置公网托管。配置见 `ops/nginx/default.conf`：应用路由回退到 `index.html`，静态资产缺失返回 404，`modules.json` 禁用缓存。其他静态托管环境也需要相同规则。Vite 当前 base 为 `/`，部署到子路径时需同步配置 Vite base 和路由 basename，并重新验证资源与直达刷新。
