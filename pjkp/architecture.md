# my-dashboard 架构

> 状态：V0.1 已实现 React + TypeScript + Vite 前端外壳，基于 Figma 双主题，验证通过，待用户验收。来源：2026-10-21 实际源码与测试结果；当前没有业务模块或后端。

## 整体架构

项目初始设想包括网站前端、网站后端和可接入的工具模块。用户随后评估了后端的必要性，目前明确确认的是前端技术栈；是否独立建设后端仍需结合模块需求确定。

| 组成 | 已知目标 | 待确认 |
| --- | --- | --- |
| 网站前端 | 已实现 React + TypeScript + Vite 工程、宿主导航、无工具空状态与双主题 | 用户验收、后续工具能力与接入要求 |
| 网站后端 | 初始设想包含后端部分，具体需求尚未明确 | 是否独立建设，或复用模块现有服务；语言、框架、服务职责、API、存储需求 |
| 工具模块 | 模块化接入自制工具；示例为 AI 日报、背单词、media-keeper | 工具源码或服务位置、独立运行方式、与宿主的协作边界 |

已知的用户操作路径是“打开网站 → 在 sidebar 选择工具 → 使用对应功能”。功能如何加载、数据如何传递和持久化尚未确定。

当前根目录有前端工程与锁文件，src/ 按宿主应用、布局、基础 UI、主题、页面与静态资源组织，tests/e2e/ 为 Chromium 回归，pjkp/ 为项目记录。compose.yaml 与 ops/debian/ 保存用户追加的本机容器运行配置；没有后端或业务模块目录。

## 关键机制与设计取舍

- **已确认的前端技术栈**：2026-10-20 用户明确表示“这里改成react吧”，将前端框架改为 React，并沿用已确定的 TypeScript 与 Vite。React 用于界面组件，TypeScript 用于类型约束，Vite 用于开发与构建；当前以本次用户指令为技术决策依据，历次选型变化保存在行为日志中。
- **宿主框架**：V0.1 使用 React Router 的声明式布局路由，只注册总览与通用 404；导航配置中的工具集合为空。布局复用 AppShell 与 Outlet，后续新增页面无需复制壳层。没有业务模块 SDK、请求库或后端。
- **主题与样式**：CSS Modules 限定组件样式，全局 CSS 仅承载字体、语义变量与基础样式。html 的 data-theme 控制两套颜色，React Context 管理当前选择；index.html 在应用脚本前读取本地选择，存储异常回退夜间，写入失败仍允许即时切换，不依赖远程服务。
- **布局与可访问操作**：桌面侧栏宽 248、顶栏高 72，搜索保留透明占位；中小屏收缩顶栏，小屏用原生 dialog 提供焦点保护与背景隔离，并处理四种关闭和焦点恢复。用户展示为静态信息，没有伪造登录、设置或个人菜单操作。
- **资源与可复现性**：原始 Figma SVG 本地保存，字体采用 Noto Sans SC 与 Manrope 的本地 WOFF2 完整 Unicode 分片并保留许可证，运行时无字体 CDN 或 Figma 临时 URL。package-lock.json 固定完整依赖，npm ci 还原已验证；包与 Node 基线见 README。
- **模块接入**：用户明确希望采用模块化方式。模块注册、导航项与工具能力的关联机制待设计。
- **现有工具兼容性**：接入方案依赖各工具的现状；目前未检查到工具源码或服务。站内集成、调用独立服务、嵌入页面或外链均未选定。
- **前后端协作**：接口契约、模块是否共用后端、状态和错误处理机制待确定。
- **身份与数据边界**：是否需要登录、是否仅本人使用、是否有模块间共享数据，以及权限与持久化要求待确认。
- **运行与部署**：Node 24、npm 安装、开发预览与生产预览已验证。2026-10-21 用户追加指定已有 debian:trixie 与容器名 my-dashboard；首次使用 Nginx 静态运行，随后按用户要求转为容器内开发；当前通过 Compose 在本机运行 Vite，127.0.0.1:8080 映射至容器 80。公网托管、域名及 HTTPS 未配置。
- **Debian 首次静态运行机制（历史）**：构建和运行阶段均继承本机已有 Debian 镜像。构建阶段安装经官方 SHA256 校验的 Node 24.20.0，在 Linux arm64 中 npm ci 并构建；运行阶段保留 `/app/my-dashboard` 项目副本与 dist，通过 Debian Nginx 仅托管 dist。运行镜像没有宿主 node_modules，也不依赖宿主源码挂载。Nginx 提供 SPA fallback、独立静态资源 404 与 /healthz；Compose 配置 unless-stopped 重启策略，健康和手动重启恢复已验证。

- **容器内开发与持久化**：用户于 2026-10-21 要求后续在 my-dashboard 容器开发并删除宿主项目。开发镜像直接继承已有 Debian，安装 Node 24.20.0、Git、Python 与匹配依赖版本的 Playwright Chromium。项目和 Linux 依赖保存在外部命名卷 my-dashboard-project，挂载 `/app/my-dashboard`，不绑定宿主源码。Vite 为容器主服务并提供热更新，健康检查访问首页；源码、pjkp、构建和测试均在容器内完成。历史测试证据迁入卷保存，pjkp CLI 与模板保存在 ops/tooling/project-keeper。宿主仅保留入口约定，Docker 生命周期由宿主 CLI 管理。

### 界面设计草稿

- 用户来源：2026-10-20 当前对话，要求通过 Figma 设计主页面，通过 sidebar 选择不同模块，主题颜色参考所给飞书文档；随后要求保留夜间模式并增加晨间模式。
- 设计入口：[晨间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=14-266) / [夜间设计](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=4-86)；[晨间原型](https://www.figma.com/proto/P2EfZNJYj2PsdZLmaMzHMN?node-id=14-266&starting-point-node-id=14%3A266) / [夜间原型](https://www.figma.com/proto/P2EfZNJYj2PsdZLmaMzHMN?node-id=4-86&starting-point-node-id=4%3A86)。文件包含八张 1440 × 1000 桌面画面，两套主题各覆盖总览、AI 日报、背单词、media-keeper。共设置 48 条原型跳转，包括每套主题各 20 条模块跳转与八条跨主题跳转；右上角的「晨间 / 夜间」切换保留当前模块，两套主题均有总览起始画面。
- 配色依据：[静奢古铜品牌颜色规范](https://lcn6mqfic6vj.feishu.cn/docx/CPWvde40covTsxxgxBjceZiVnMh)，通过本机 lark-cli 复用现有登录状态读取。页面背景使用曜岩黑 `#181916`，面板使用玄武岩 `#242521`，选中及抬升层使用炭灰岩 `#30312C`；主要按钮使用鎏铜金 `#B98E55`，高光使用 `#D0B173`，正文使用石灰岩 `#D7CFC0`，次级文字使用 `#948E84`。深色层级主要通过间距与表面颜色建立，古铜色用于少量交互焦点。
- 晨间配色沿用规范的暖象牙 `#EEE9DF` 背景、深古铜 `#805D35` 强调色和炭灰岩 `#30312C` 正文。另派生浅象牙 `#F8F5EF` 面板、浅沙 `#E7E0D4` 抬升层和深灰褐 `#625C52` 次级文字，用于区分浅色层级与保障可读性；这些派生色属于本次设计选择。主要按钮使用深古铜底与暖象牙字。深古铜在暖象牙和浅沙背景上的对比度分别约为 4.91:1、4.53:1。
- 草稿字体为 Noto Sans SC 与 Manrope；参考文档仅指定配色，该字体组合属于本次设计选择，现已作为前端本地字体使用。Figma 中建立了 55 个本地颜色与布局变量、语义别名和文字样式。受当前文件单集合模式数量限制，两套主题采用独立语义颜色集合；重复导航、按钮、工具卡片与主题开关使用组件实例，晨间共享组件使用对应语义变量，文字与矢量图标均可编辑；未使用整页图片替代界面图层。
- 制作设计初稿时工程没有可复用的组件或样式；Figma 局部复用 Simple Design System 的兼容间距、圆角与图标。V0.1 没有引入 SDS 代码库，保留了应用实际使用图形的原始 SVG，来源见 assets 的说明文档。
- 主页面包括工具入口、日报预览、学习进度和最近使用区。各模块的内容、学习数字、媒体分类等均为 Agent 提出的界面示例，待用户审阅，不作为已确认需求或真实服务能力。2026-10-20 用户要求先去掉搜索框但保留位置：双主题八张画面均已移除搜索图标、提示文字、快捷键和底色，保留 264 × 38 的透明占位，主题开关和日期坐标未变。当前仅实现 Figma 导航原型，学习操作、添加内容等控件未接入业务服务。
- 检查证据：移除搜索框后，双主题八张画面共含 400 个文字节点、197 个组件实例，无图片填充节点；Manrope 与 Noto Sans SC 字体保持一致。八处透明搜索占位尺寸、坐标及相邻主题开关和日期坐标与修改前一致，原型跳转仍为 48 条。此前已完成八张画面的截图检查及晨间组件修正，晨间无遗留夜间颜色绑定、无越界元素；本次另检查晨间和夜间总览截图。原型跳转目标均指向文件内有效的其他画面；这不等同于应用开发、测试或用户验收完成。

## 实现入口

- [启动与工程说明](../README.md)、[依赖与命令](../package.json)。
- [应用入口](../src/main.tsx)、[宿主路由](../src/app/router.tsx)、[导航配置](../src/app/navigation.ts)。
- [页面外壳](../src/components/layout/AppShell.tsx)、[顶栏与搜索留白](../src/components/layout/Topbar.tsx)、[总览空状态](../src/pages/OverviewPage.tsx)。
- [主题状态](../src/theme/ThemeProvider.tsx)、[首屏主题初始化](../index.html)、[语义色](../src/styles/tokens.css)。
- [图标来源](../src/assets/icons/README.md)、[字体来源与许可证](../src/assets/fonts/README.md)。
- [浏览器测试](../tests/e2e/shell.spec.ts)、[执行方案](V0.1/spec.md)、[测试结果](V0.1/test-results.md)。
- [容器定义](../compose.yaml)、[开发 Dockerfile](../ops/development/Dockerfile)、[开发与恢复说明](../ops/development/README.md)、[迁移验证](../ops/development/VERIFICATION.md)。首次静态运行的 Dockerfile、Nginx 与验证保留在 ops/debian。

没有 API 定义或业务数据模型；当前容器运行入口为前端 Vite 开发服务。
