# my-dashboard V0.1 执行方案

> 状态：已于 2026-10-21 依据用户“那就开始执行吧”的授权完成本版实现与验证，待用户验收。以下方案已落实；未加入业务模块、后端或部署。

## 规划依据

- [本版需求](requirements.md)、[项目规则](../rules.md)、[项目简介](../project-brief.md)、[项目架构](../architecture.md)。用户明确要求前端框架且不加任何模块，版本号为 V0.1。
- Figma：[晨间总览 14:266](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=14-266)、[夜间总览 4:86](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=4-86)。2026-10-20 已通过 get_design_context 获取两套高保真代码、组件说明和截图；包含最新搜索空白占位。
- UI 迁移只提取应用外壳；设计中所有工具入口、业务卡片、日报、学习数据和最近使用记录均按本版范围排除，不修改原 Figma 业务示例画面。
- 官方依据：[React 从头建立应用](https://react.dev/learn/build-a-react-app-from-scratch)、[Vite 启动与模板](https://vite.dev/guide/)、[Vite CSS Modules](https://vite.dev/guide/features#css-modules)、[React Router 声明式安装](https://reactrouter.com/start/declarative/installation)、[Playwright 测试编写](https://playwright.dev/docs/writing-tests)。查询日期 2026-10-20。

## 当前实现与约束

- 实际项目根目录：`/Users/jiamingyuan/Desktop/ai-infa/my-dashboard`。执行前仅有 pjkp/ 文档；当前已有 package.json、唯一 package-lock.json、src/ 与 tests/e2e/，保留原有 pjkp/。当前目录及父目录不是 Git 仓库，未创建远程仓库或 PR。
- 当前本机命令环境：Node.js v24.20.0、npm 11.19.0；pnpm 可找到但本版选择 npm，避免多锁文件。Node 24 为官方列出的 LTS 分支，见 [Node.js 发布信息](https://nodejs.org/en/about/previous-releases)。执行前重新核验实际运行环境和包 engines。
- 本版为浏览器 SPA，只有本地状态；没有后端或业务 API。外部网络仅在执行阶段安装依赖、获取设计资产和字体时需要；运行时资产应本地提供。
- Figma 没有工程 Code Connect 映射或已选定的应用组件库。返回的 Tailwind 类只作为设计描述；本版使用 CSS Modules，不安装 Tailwind。
- 原 Figma 画面有业务内容，本版不做整页逐像素复刻。验收只对品牌、外壳、主题和保留的控件按原稿比较，空状态和小屏布局单独审阅。

## 变更方案

### 工程与依赖

- 项目根目录直接放置前端工程，保留 pjkp/；依据 react-ts 官方模板创建最小配置，先在临时目录生成模板，再逐文件复制，避免脚手架清理已有非空目录。
- 运行依赖：react、react-dom、react-router；主题使用 React Context + 本地状态。开发依赖使用 Vite 官方 React 插件、TypeScript、ESLint 及其 React Hooks / Refresh 配置、Playwright。精确版本在执行时核验稳定版本和 peerDependencies，写入 package.json 与唯一 package-lock.json，不把未经核验的版本称为已安装。
- 不增加状态管理库、请求库、查询缓存、UI 全家桶、插件运行时、微前端或业务模块目录。
- 脚本约定：dev、typecheck、lint、build、preview、test:e2e；build 包括类型检查后生产打包。通过 npm ci 验证锁文件，README 记录实际安装版本、Node 版本和命令。
- TypeScript strict 模式，组件局部使用 CSS Modules；全局仅放字体、reset、语义变量和基础无障碍样式。根目录 .gitignore 忽略 node_modules、dist、测试产物等，不初始化远程仓库。

### 布局与无模块状态

- AppShell 使用 Grid / Flex，由 Sidebar、Topbar、主内容和 PageFooter 组成；不将 Figma 固定 1440 × 1000 画布变成页面固定宽高。桌面最小高度 100dvh，主列 min-width: 0，页面自然滚动。
- 1440 × 1000 基准：sidebar 宽 248，左右内边距 20；topbar 高 72，内容左右内边距 40；内容顶部间距 32，区块间距 24；导航高 48，品牌标记 34；圆角 8 / 16。按提取的真实布局继续核对具体尺寸。
- 侧栏保留品牌、“工作空间 → 总览”、“我的工具 → 暂无工具”、底部静态个人信息；不渲染三项业务导航、设置入口或个人下拉按钮。宿主路由配置与工具导航数据分开，工具导航为明确的空数组，不加入示例工具对象。
- 顶栏包含面包屑、弹性空白、264 × 38 搜索占位、152 × 40 主题开关及本地日期。占位 aria-hidden，不包含 input、role=search、快捷键、事件或可聚焦元素。桌面主题开关与日期相对位置参照原稿。
- 总览保留“我的工作台”和原有简短说明、欢迎区。主内容只显示一个沿用原面板风格的 EmptyState：“还没有添加工具”，补充“工具添加后会显示在这里。”不提供无法使用的添加按钮，不显示假数据、技术状态卡、假模块或模块开发进度。页脚沿用原稿的品牌语句。
- 入口仅为 `/`（总览）；React Router 的布局路由保留承载位置，`*` 显示 404 与“返回总览”链接。未来模块可通过路由和导航配置扩展，但本版没有模块路径、懒加载示例或注册协议。
- 小屏为 Agent 基础适配方案：768 以下侧栏转为受控抽屉，顶栏增加导航开关，隐藏日期与搜索空白占位；只显示当前页短面包屑和主题开关。768–1199 隐藏搜索占位并收缩间距，避免固定宽度总和溢出；1200 以上使用完整桌面顶栏。小屏收起的是占位容器，仍无搜索 UI。

### 主题、字体与资产

- 用 `<html data-theme="night|morning">` 和 CSS 语义变量统一着色；应用只有一套组件，不复制两棵主题 DOM。两套变量覆盖背景、面板、抬升层、主次文字、强调、图标和边框。

| 语义 | 夜间 | 晨间 |
| --- | --- | --- |
| canvas | #181916 | #EEE9DF |
| panel | #242521 | #F8F5EF |
| raised | #30312C | #E7E0D4 |
| heading | #EEE9DF | #181916 |
| text primary | #D7CFC0 | #30312C |
| text secondary | #948E84 | #625C52 |
| accent background | #B98E55 | #805D35 |
| accent text | #D0B173 | #805D35 |
| text on accent | #181916 | #EEE9DF |

- 默认夜间；本地键 `my-dashboard.theme` 只接受 night / morning。首次加载在页面渲染前读取并设置 html 主题，读取失败或值无效回退夜间。ThemeProvider 与该结果一致，切换即时生效；存储写入失败不阻断切换。此版不自动跟随系统主题，也不把本地主题状态当用户账户偏好服务。
- 主题控件使用两个原生 button，明确可访问名称与 aria-pressed，焦点样式可见；切换不改变路由。CSS color-scheme 与当前主题一致，减少动画时遵守 prefers-reduced-motion。
- 使用 Noto Sans SC 400 / 500，Manrope 500 / 600 的本地字体文件并保留许可证，font-display: swap；CSS 作用范围延续中文正文和拉丁品牌的区别。不能在视觉验收中把回退字体称作完全匹配。
- 只获取应用外壳实际使用的原始 SVG：品牌网格与总览图标的晨间 / 夜间资产。执行时重新取对应 get_design_context 以避免临时 URL 过期，按工具给出的 curl -L 下载到工程本地；保留原 SVG，不把整页截图当资产、不重画或替换图标。没有使用的模块图标不下载。
- 图标保留源 viewBox / 根尺寸；外层容器匹配实际设计 slot，再核对渲染边界，不能用统一 img 宽高规则意外覆盖 SVG 尺寸。图片 alt 为空时由邻接文字提供名称。日期动态渲染，视觉比较时固定浏览器时间，避免误判。

### 计划文件组织

以下工程文件已创建，具体入口见 README：

```text
package.json / package-lock.json / index.html / vite.config.ts
tsconfig*.json / eslint.config.js / .gitignore / .nvmrc / README.md
src/
  main.tsx
  app/            App.tsx, router.tsx, navigation.ts
  components/
    layout/       AppShell, Sidebar, Topbar, PageHeader, UserSummary, PageFooter
    ui/           ThemeSwitch, EmptyState
  pages/          OverviewPage, NotFoundPage
  theme/          ThemeProvider.tsx, theme-storage.ts
  styles/         tokens.css, global.css, fonts.css
  assets/         icons/night/, icons/morning/, fonts/（含许可证）
tests/e2e/        shell.spec.ts
playwright.config.ts
```

布局和 UI 组件采用相应 .tsx 与 .module.css 文件；路由、主题和视图各自负责本层逻辑。没有 src/modules、后端目录或业务数据目录。

## 执行任务

以下任务已在当前实现中完成，不代表用户已验收或版本已关闭；真实验证证据见 test-results.md。

| 顺序 | 工作与依赖 | 修改范围 | 完成判据 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | 核验当前需求、环境和依赖兼容性，无前置 | 依赖选择记录、临时模板 | 不覆盖 pjkp；确定可安装的稳定组合与 Node 基线 | 完成 |
| 2 | 创建基础工程，依赖 1 | 根配置、src/main、最小 App、锁文件 | npm ci、typecheck、lint、build 可运行 | 完成 |
| 3 | 提取壳层 SVG 和本地字体，依赖 1–2 | assets、fonts.css、来源及许可证 | 所用资源本地存在、可加载，无临时 URL | 完成 |
| 4 | 建立语义色与主题机制，依赖 2–3 | tokens.css、theme、ThemeSwitch、首屏初始化 | 双主题可切换、持久化且存储异常可降级 | 完成 |
| 5 | 还原桌面外壳与空状态，依赖 3–4 | layout、ui、OverviewPage、navigation | 无模块、无搜索 UI；外壳符合设计尺寸 | 完成 |
| 6 | 配置总览与 404、键盘操作和小屏抽屉，依赖 5 | router、NotFoundPage、响应式样式 | 页面可返回、小屏无溢出、焦点及抽屉可用 | 完成 |
| 7 | 完成最小行为回归与视觉核对，依赖 4–6 | Playwright、测试证据 | 按 test-plan 执行，修复本版问题，记录真实结果 | 完成 |
| 8 | 补齐启动与扩展说明、同步 pjkp，依赖 7 | README、架构、版本执行/测试记录 | 真实路径和命令准确，版本保持待用户验收 | 完成 |

实际依赖为 React / React DOM 19.3.1、React Router 8.5.0、Vite 8.3.4、TypeScript 6.0.3、ESLint 10.13.0、Playwright 1.64.1，完整清单见 package.json。官方模板当前采用 Oxlint，本版仍按既有方案配置 ESLint。字体采用相同字形与完整 Unicode 分片的 WOFF2，仅保留现代浏览器实际使用的格式，共 204 个文件、4,880,496 字节；许可证和来源均在工程中。

## 验证映射

| 需求验收 | 实施任务 | test-plan 场景 |
| --- | --- | --- |
| 安装、启动、检查与构建 | 1–2、8 | 工程与锁文件 |
| 外壳 UI、资源与字体 | 3、5、7 | 桌面双主题视觉与资产 |
| 主题切换、刷新和异常 | 4、7 | 主题状态与降级 |
| 搜索占位及相邻位置 | 5、7 | 搜索留白 |
| 不加入任何业务模块 | 5、7 | 无模块范围检查 |
| 响应式、键盘与焦点 | 6–7 | 小屏与可访问操作 |
| 404 与扩展说明 | 6、8 | 宿主导航与文档 |

## 待确认与待重审事项

- 当前计划不存在阻塞基础外壳的产品缺口；晨间/夜间、无模块和搜索占位采用用户最新要求。Agent 的默认值详见 requirements，不伪装为用户逐项决策。
- 本版实现和验证已完成，尚待用户验收。后续如对 UI 或范围有修订，先更新需求及对应方案、验证映射，不把测试通过当成用户验收。
- 获取字体或设计资产失败会阻塞对应视觉匹配，不能随意替换资源后宣称一致；其他工程任务可以继续。
- 执行时依赖包的 engines 或 peerDependencies 不相容时，选择相容稳定组合并记录实际版本；如必须改变已确定的基础技术栈，再讨论范围变化。
- 部署域名、基础路径、托管 SPA 回退配置和模块服务接入均不属于本版实现，不在本次 plan 中宣称可上线。
