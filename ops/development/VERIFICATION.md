# 容器开发迁移验证

日期：2026-10-21（Asia/Shanghai）。来源：用户明确要求“后面就直接在my-dashboard容器里面进行开发吧，本地 ai-infa里的可以删掉了”。

## 交付状态

- 容器 `my-dashboard`：running / healthy，ID `49b5abf514a410445633c5b182ec740afd366fe01fa2e3676250fdf9cc36dfeb`；镜像 `my-dashboard:development`，底层仍为本机已有 `debian:trixie`，Linux arm64。
- Node v24.20.0、npm 11.19.0、Git 2.47.3、Python 3.13.5、Playwright 1.64.1 Chromium 已可用。
- 唯一工作目录 `/app/my-dashboard`，外部命名卷 `my-dashboard-project` 挂载该目录。源码、pjkp、Linux 依赖、构建与测试结果在卷中；没有宿主源码绑定挂载。
- Vite 主进程提供开发服务与热更新，127.0.0.1:8080 → 容器 80，访问 http://localhost:8080。健康检查访问首页，init 与 unless-stopped 已配置。
- 本地副本已于本轮复查后实际移除：`/Users/jiamingyuan/Desktop/ai-infra/my-dashboard`。更正此前判断：ai-infa 当时被改名为 ai-infra，旧路径不存在不能证明副本已删除。清理前再次核对全部 494 个文件；应用源码无新增修改，3 份仅涉及目录改名的 pjkp 文档已完整归档在 `local-rename-20261021.tar.gz`。两个宿主拼写路径仅保留 AGENTS.md 容器入口说明，没有源码。

## 实际验证

| 检查 | 结果 |
| --- | --- |
| 首次迁移逐文件 SHA256 | 494 个文件全部一致，包含源码、pjkp、原测试报告与构建产物 |
| 当前应用文件 SHA256 | 255 个文件与迁移前一致；仅修改运行配置、开发约定及项目文档 |
| Linux 依赖安装 | npm ci --no-audit --no-fund 通过，重新安装 168 个包，没有使用 macOS node_modules |
| lint | npm run lint 通过 |
| TypeScript 与生产构建 | npm run build（含 typecheck）通过 |
| Chromium 原有回归 | npm run test:e2e：11 passed，0 skipped / failed / flaky；见根 test-results 与 playwright-report |
| Compose 配置与替换 | config --quiet 通过；up --no-build --pull never --wait 成功，将静态容器替换为挂载卷的开发容器 |
| 宿主 8080 入口 | HTTP 200，返回 Vite 开发页面；实际发布端口 WebSocket 握手与文件更新事件通过 |
| 浏览器热更新 | Chromium 打开实际开发服务，临时样式修改即时应用且保持页面状态，恢复原文件后同样即时生效；无 pageerror |
| pjkp 容器执行 | Python CLI 可直接读取并维护卷内项目；最终校验在迁移日志写入后运行 |

热更新验证的初始探针曾将 CSS 导入更新类型误判为 css-update，并把两次写入安排得过近；按实际 js-update 事件及文件监听节流调整探针后，发布端口和真实浏览器检查通过。未修改应用代码来适配探针。

历史报告保存在 `pre-migration-evidence.tar.gz`，迁移前清单为 `pre-migration-manifest.json`。当前机器可读证据：`migration-result.json`、`browser-hmr-result.json`、`published-hmr-result.json`。所有临时样式修改已恢复并再次核对 SHA256。

mysql-base 和 agent-workspace 保持运行，未修改。此任务仅改变开发位置和运行方式，不加入业务模块、后端或公网发布；V0.1 仍待用户验收，版本未关闭。

最终收尾：pjkp validate --version V0.1 --stage test 返回 valid=true，errors / warnings 均为空；临时迁移容器已移除，保留正在运行的 my-dashboard 和项目卷。
