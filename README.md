# my-dashboard

个人工具网站。当前 V0.3（npm 版本 0.3.0）在 V0.2 Module Federation 宿主基础上整合 media-keeper 正式接入、统一 PingFang SC 字体、工具页布局与单一接入指引。宿主没有自建业务后端、登录或模拟接口。

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

`build` 包括 TypeScript 检查并生成 `dist/`，其中 `version.json` 的项目名与版本自动取自 package.json。`preview` 用于本地检查构建结果，默认 http://localhost:4173；请以终端实际地址为准。

## 核对运行版本

构建部署后访问 [version.json](http://localhost:8080/version.json)，或运行：

```sh
curl -fsS http://localhost:8080/version.json
```

当前版本应返回 `{"name":"my-dashboard","version":"0.3.0"}`。此文件由构建生成，Nginx 禁用缓存；核对部署时还应比较构建文件和运行配置，而不只手动改版本标记。它与 modules.json 的 `version: 1` 清单格式无关，Media 模块也保留自己的独立版本。

## 回归测试

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright 自动在 127.0.0.1:4175 启动生产预览，在 4176 启动真实的测试远程应用。覆盖远程模块加载、React 共享、CSS、主题传递、子路由和失败恢复，以及双主题与刷新恢复、存储失败降级、首屏主题初始化、全站字体与无字体下载、桌面留白尺寸、无模块范围、404、小屏抽屉与焦点恢复。截图、JSON 结果与失败轨迹位于被忽略的 `test-results/`，HTML 报告位于 `playwright-report/`。测试限于 Chromium；不代表其他浏览器或线上环境已验证。

## 工程结构

- `src/app/router.tsx`：总览、远程工具 `/tools/:moduleId/*` 和通用 404 的宿主路由。
- `src/app/navigation.ts`：工作空间导航；工具导航由运行时清单生成。
- `src/modules/`：远程清单校验、加载、React 共享运行时与组件契约。
- `public/modules.json`：运行时工具清单，已登记 media-keeper。
- `src/components/layout/`：侧栏、顶栏、标题、用户展示和页脚。
- `src/components/ui/`：主题开关、空状态和原始图标适配。
- `src/theme/`：React Context 与本地主题存储；`index.html` 在应用脚本运行前设置主题。
- `src/styles/`：两套语义变量、字体和全局基础样式；组件样式使用 CSS Modules。
- `src/assets/`：原始 Figma SVG；字体统一使用系统 PingFang SC，不再打包或下载 Web 字体。
- `tests/e2e/`：交互与资源验证。
- [项目记忆入口](pjkp/index.md)：当前状态、规则、简介与架构；[V0.1](pjkp/V0.1/iteration.md)、[V0.2](pjkp/V0.2/iteration.md)、[V0.3](pjkp/V0.3/iteration.md) 各用一份迭代记录保存目标、决定和真实结果。

其他项目可以独立构建和部署，通过 Module Federation 导出 React 组件，再在 `public/modules.json` 注册。侧栏和路由自动生成，组件跟随宿主主题。子模块项目的配置、联调、部署、宿主协议与边界统一见 [外部模块接入指引](docs/module-integration-guide.md)。

## UI 与行为

UI 来源：[晨间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=14-266) / [夜间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=4-86)。宿主保留外壳；Media 工具页从 media-keeper 独立构建的远程组件加载，总览不加入 Media 内容。

- 默认夜间，手动选择保存于 `my-dashboard.theme`；只接受 `night` / `morning`。存储不可用时仍能切换，不自动跟随系统主题。
- 桌面搜索位置为 264 × 38 的透明空白，无输入框、快捷键或点击行为。1200 以下为适配顶栏隐藏占位，768 以下使用模态导航抽屉。
- 日期使用浏览器本地时间；Jiaming 为设计稿中的静态个人信息，不表示已登录账户。
- 主题色与全站字体变量集中于 `tokens.css`。中英文、品牌、日期及控件统一使用 `PingFang SC`，未安装该字体的设备回退到系统 sans-serif；不打包 Apple 字体。图标来源见 `src/assets/icons/README.md`。

## 依赖基线

React / React DOM 19.3.1，React Router 8.5.0，Vite 8.3.4，TypeScript 6.0.3，ESLint 10.13.0，Playwright 1.64.1，Module Federation Vite 插件 1.23.5、运行时 2.9.2。精确直接依赖见 `package.json`，完整解析结果以唯一 `package-lock.json` 为准。

## 当前 Media 接入

访问 [Media](http://localhost:8080/tools/media-keeper)。远程源码在同级 `media-keeper/apps/web/`，通过 `media_keeper/./DashboardModule` 加载，共享 React 实例并继承宿主主题、字体和导航。列表、筛选、分页和详情由远程模块负责；宿主只登记清单、显示外壳，并修正工具面包屑与紧凑标题布局。

开发 / 预览时，宿主代理 `/media-keeper/` 到 `127.0.0.1:8081`；先在 media-keeper 启动 `npm run start:api` 和 `npm run preview:web`（代码变更后先 `npm run build:web`）。正式运行时，独立的 `media-keeper` 容器在 8081 提供远程静态资源和只读 API；宿主与它同在 `agent-services` 网络，通过 `/media-keeper/` 代理到 `http://media-keeper:80`，配置使用 Docker DNS 动态解析。正式部署无需本机 Node API 进程，更新模块只需重新构建其应用镜像；完整命令见 media-keeper README。

新增远程模块的浏览器联调用例位于 `media-keeper/tests/web.spec.ts`，在该仓库执行 `npm run test:web`。本仓库外壳用例显式提供空清单，仍验证可复用的无模块行为，不以测试清单覆盖正式配置。

## 后续托管注意

当前仅通过本机 Nginx 容器提供静态页面，尚未配置公网托管。配置见 `ops/nginx/default.conf`：应用路由回退到 `index.html`，静态资产缺失返回 404，`modules.json` 与 `version.json` 禁用缓存。其他静态托管环境也需要相同规则。Vite 当前 base 为 `/`，部署到子路径时需同步配置 Vite base 和路由 basename，并重新验证资源与直达刷新。
