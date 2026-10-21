# my-dashboard V0.1 测试结果

## 测试批次

### 2026-10-21 · V0.1 前端外壳首次执行

- 授权：用户于 2026-10-21 明确要求开始执行 V0.1；依据本版 requirements、spec 与 test-plan。
- 被测实现：当前 src/、工程配置、package-lock.json、原始 SVG 与本地字体。没有业务模块或后端。
- 环境：macOS arm64，Node v24.20.0、npm 11.19.0、Playwright 1.64.1、Chromium 156.0.8078.4（build 1248）。浏览器时区 Asia/Shanghai；截图时钟固定为 2026-10-20 12:00，用于与 Figma 日期一致。
- 浏览器批次实际开始时间：2026-10-21 11:11:49 Asia/Shanghai；总时长约 5.7 秒。没有跳过、失败或 flaky 用例。

| 验证项 | 实际命令 / 方法 | 结果 |
| --- | --- | --- |
| 依赖与锁文件 | npm 安装后运行 `npm ci --offline --cache /private/tmp/my-dashboard-npm --no-audit --no-fund` | 通过，唯一 package-lock.json；初次安装审计 0 vulnerabilities |
| TypeScript | `npm run typecheck` | 通过，退出码 0 |
| ESLint | `npm run lint` | 通过，退出码 0 |
| 生产构建 | `npm run build` | 通过，退出码 0；JS 266.00 kB / gzip 84.85 kB；CSS 194.57 kB / gzip 70.63 kB，不含按需请求的字体分片 |
| 开发预览 | `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`，HTTP 检查 | 通过，200 OK；已将本地页面交给 Codex 预览 |
| 生产预览及回归 | `npm run test:e2e`，测试器自动启动 127.0.0.1:4175 preview | 11 / 11 通过 |
| 双主题外壳 | 1440 × 1000 下核对 sidebar 248、topbar 72、两套主题色、真实加载字体和空状态 | 通过 |
| 搜索空位 | 两主题检查相对顶栏 x562 / y17 / 264×38；主题开关 x842 / y16 / 152×40；日期 x1010 / y24 / 142×24 | 通过，透明空容器无焦点或交互 |
| 图标与字体 | 四个非空原始 SVG、本地调用与几何；两字体 400/500 与 500/600 实际加载、两份许可证 | 通过，无 Figma 临时 URL 或运行时外部请求 |
| 主题状态 | 切换、刷新、键盘、无效存储、读取失败、写入失败 | 通过；写入失败仍可即时切换 |
| 首屏主题 | 阻断应用 JS，检查空 root 时 html 已为晨间并呈现暖象牙背景，再放行脚本 | 通过，首屏截图证据已保存 |
| 无模块范围 | 无工具导航与业务内容；三项业务 URL 及随机 URL 仅通用 404；源码检查无 src/modules、fetch 或运行时外链 | 通过 |
| 小屏与中等宽度 | 390×844、1024×768，无水平溢出；抽屉焦点保护、Escape / 关闭按钮 / 遮罩 / 总览四种关闭与焦点恢复；切换到桌面自动关闭 | 通过 |
| 人工视觉核对 | 查看夜间、晨间及小屏三张测试截图，与原 Figma 保留外壳比较 | 通过；无模块内容按本版范围为空状态。桌面截图中的导航描边是键盘操作后保留的可见焦点 |
| README 与范围 | 核对脚本、启动说明、真实路径、SPA fallback 和不含部署的说明 | 通过 |

证据：

- [浏览器 JSON 报告](../../test-results/results.json)，统计 expected=11、unexpected=0、skipped=0、flaky=0。
- [HTML 报告](../../playwright-report/index.html)。
- [夜间桌面截图](../../test-results/shell-desktop-night-shell--a2c99-ssets-fonts-and-empty-state/night.png)。
- [晨间桌面截图](../../test-results/shell-desktop-morning-shel-2552e-ssets-fonts-and-empty-state/morning.png)。
- [小屏截图](../../test-results/shell-mobile-navigation-tr-8f991-our-ways-and-restores-focus/mobile.png)。
- [React 加载前的晨间背景](../../test-results/shell-saved-morning-theme--d79a4-pplication-JavaScript-loads/morning-before-react.png)。

开发过程首次沙箱网络请求 npm 失败，按授权通过网络权限下载后完成安装；这不是应用回归失败。npm ci 提示可选 fsevents 安装脚本未获 allowScripts 许可，未新增许可，开发服务和全部检查仍正常。最初开发构建后仅调整了字体交付格式和测试 / 配置文件，当前结果来自调整后的生产构建。

### 2026-10-21 · GitHub 归档前容器验证

- 用户追加授权上传至 https://github.com/jiamingyuan/my-dashboard；本批 code 为 code-v01-github-prep-20261021。
- 环境：Debian trixie / Linux arm64，Node v24.20.0、npm 11.19.0、Playwright 1.64.1 Chromium。
- 实际浏览器开始时间：2026-10-21T13:27:34.720Z（UTC），总时长 1.96 秒。
- npm run lint、npm run build（包含 typecheck）通过；npm run test:e2e：11 passed，0 unexpected / skipped / flaky。
- 暂存清单检查：依赖、构建产物、浏览器报告、本机迁移归档与 .env 被忽略；未发现令牌或私钥格式。README 已补充当前容器路径、8080 与 GitHub 同步说明。
- 原应用源码、锁文件与测试代码没有变化；不重复安装依赖或人工视觉审阅，沿用首次视觉基线。Safari / Firefox、业务模块与网站公网托管未验证。
- 当前原始报告位于根 test-results 和 playwright-report；上一容器批次归档在 ops/development/pre-github-evidence.tar.gz。这些运行产物仅留在项目卷，不上传 Git。
- 此批仅证明工程与归档准备检查，不代表远端推送结果或用户验收；GitHub 上传结果在项目日志单独记录。

## 当前结论

首次实施的安装还原、类型检查、lint、构建、11 项 Chromium 用例和三张界面截图核对均通过；GitHub 归档前容器复测的 lint、构建与 11 项 Chromium 同样通过。仍无业务模块、后端或模拟 API；上传 GitHub 是用户追加的独立操作，结果见项目日志。

尚未执行 Safari / Firefox、生产托管或业务模块验证，这些不在当前承诺范围内。移动布局和无模块空状态为本版实施方案，等待用户 UI 审阅；测试通过不代表用户验收，V0.1 不关闭。
