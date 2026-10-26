# my-dashboard 架构

核对：2026-10-26。当前版本 V0.3，以 V0.2 提交 `4ad4ace7cc5748861cdd6f1b98ae165203768408` 为差异基线；具体依赖以 package.json / package-lock.json 为准。

## 结构与边界

宿主是 React + TypeScript + Vite SPA，React Router 承载布局路由，CSS Modules 与语义 CSS 变量负责样式，React Context 管理主题。

启动时，宿主读取 `modules.json` 并校验，再为启用条目生成 sidebar 导航和 `/tools/:moduleId/*` 路由。访问工具时，Module Federation 加载对应的 ESM `remoteEntry.js` 或 `mf-manifest.json`，取得默认导出的 React 组件。正式清单登记 media-keeper，入口 /media-keeper/mf-manifest.json、导出 ./DashboardModule；测试远程仍只在 tests/fixtures。

| 组成 | 职责与边界 |
| --- | --- |
| 宿主外壳 | 总览、侧栏、顶栏、主题、小屏导航、404、模块加载及错误展示 |
| 注册清单 | 部署时指定模块 ID、名称、远程入口与导出组件；只是配置，不包含业务实现 |
| 远程模块 | 在自己的项目中构建、部署并导出 React 组件；接收宿主传入的主题和路由参数 |
| Nginx | 托管宿主静态产物；应用路由回退 index.html；同域 /media-keeper/ 整体代理到独立 media-keeper 容器，动态解析 Docker DNS，远程资源的 404 与缓存由模块 Nginx 负责 |
| 后端 | 宿主没有自建后端；media-keeper 独立容器内的 NestJS API 提供只读查询，与模块 Nginx 共处一个容器，不再依赖宿主机 Node 进程。账户和共享数据策略仍未实施 |

当前源码在本机；`my-dashboard` 是运行静态页面的独立容器，镜像为 `nginx:1.31-trixie`，镜像 ID `sha256:4c41e2d0a3a55b325ed572cd0200bdb72af1433c3daa2bca6ef8eea68ce504a2`，实际 Nginx 1.31.8。端口为 `127.0.0.1:8080 → 80`，静态目录 `/usr/share/nginx/html`，无 Volume。旧 compose.yaml 与 ops/development 记录的是过去的开发容器方案，不能当作当前运行配置。

## 设计原因与接入边界

- **独立发布**：运行时读取清单，使已部署工具的增删、排序和停用无需重新构建宿主；同时更新源码目录与运行容器中的清单后，刷新浏览器生效。宿主代码、共享依赖或打包配置变化仍需重新构建和发布。
- **React 实例共享**：Vite 插件与运行时配套，React、React DOM、JSX runtime 以及使用时的 React Router 以 singleton 共享，避免重复实例导致 Hooks 或路由上下文失效。远程根组件不另建 createRoot / BrowserRouter；组件参数见类型定义。
- **组件稳定性**：在清单加载阶段准备并缓存 lazy 组件，避免主题或子路由更新时重建组件身份、丢失内部状态。
- **加载与失败处理**：清单读取 10 秒超时，远程模块加载 15 秒超时；错误清单不部分启用，远程加载和 React 渲染失败由错误边界展示重试，宿主导航与主题继续可用。当前重试远程采用整页刷新。
- **主题与样式**：沿用 V0.1 的 night / morning、首屏初始化与存储降级。远程可以使用宿主语义 CSS 变量；CSS Modules 或类名前缀避免全局冲突。Module Federation 不隔离 DOM、CSS 或浏览器权限，只加载可信远程代码；其他框架需按当前 React 组件契约编写适配层。
- **网络与资源**：入口、manifest、chunks 和 CSS 必须部署完整，跨域时远程服务器需配置 CORS；资源 URL 依据浏览器可达的实际部署地址。远程 API、登录和共享数据不因前端接入而自动连通。
- **外壳延续**：保留搜索透明留白、静态个人信息与原始图标。全站文字改用系统 PingFang SC，通过统一的 --font-body 变量控制品牌、正文、日期和控件；没有该字体的设备回退 sans-serif。旧 Noto Sans SC / Manrope Web 字体已移除，不复制或分发 Apple 字体。没有恢复设计稿中的业务卡片或伪造业务数据。
- **运行版本识别**：Vite 构建从 package.json 自动生成 version.json，Nginx 为该文件设置 no-store；版本标记与构建产物校验值一起用于核对部署，不能只更改标记冒充新构建。当前产品版本 0.3.0 与清单格式 version=1 独立。

## 实现入口

- [应用与 provider](../src/app/App.tsx)、[宿主路由](../src/app/router.tsx)、[远程工具页](../src/pages/RemoteModulePage.tsx)。
- [清单](../public/modules.json)、[读取与组件准备](../src/modules/ModuleRegistryProvider.tsx)、[校验](../src/modules/registry.ts)、[运行时](../src/modules/runtime.ts)、[组件契约](../src/modules/types.ts)。
- [Vite 配置](../vite.config.ts)、[共享依赖](../ops/federation/shared.ts)、[Nginx 配置](../ops/nginx/default.conf)。
- [主题](../src/theme/ThemeProvider.tsx)、[语义颜色](../src/styles/tokens.css)、[首屏主题初始化](../index.html)。
- [外壳测试](../tests/e2e/shell.spec.ts)、[Federation 测试](../tests/e2e/federation.spec.ts)、[测试远程配置](../tests/fixtures/federated-remote/vite.config.ts)。
- [开发与运行](../README.md)、[子模块接入说明](../docs/module-integration-guide.md)。
