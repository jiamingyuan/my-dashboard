# 首次本机容器运行验证（历史）

> 以下为切换开发容器之前的真实验证，容器 ID、Nginx 和健康接口不代表当前状态。当前验证见 [开发容器迁移验证](../development/VERIFICATION.md)。

检查日期：2026-10-21（Asia/Shanghai）。用户要求：使用已有 debian:trixie，创建 my-dashboard 容器，放入 my-dashboard 项目并运行。

## 当前观察状态

- 容器：`my-dashboard`，ID `a2c24ac7d3587a85efa83823d17b94d5c18a76e0764b7decaa84dbaa39a299f0`。
- 状态：running / healthy。重启策略：unless-stopped。已实际手动重启并再次通过检查。
- 访问：http://localhost:8080；仅映射 `127.0.0.1:8080 → 80/tcp`。
- 原始镜像：本机已有 `debian:trixie`，ID `sha256:913f6706df59a68922d1dd08f78c2476560a8d367897200a6005b00e5f67c2d5`，linux/arm64。运行环境报告 Debian GNU/Linux 13（trixie）。
- 派生运行镜像：`my-dashboard:debian-trixie`，ID `sha256:7f93f4caaf121263d2520ce52fcf00060b97e7fd28b0571aa4ca2ee976bf1488`。根文件系统首层与已有 Debian 镜像一致。
- 项目副本：`/app/my-dashboard`，包含源码、package.json、锁文件与构建时的 pjkp 文档；网站根目录 `/app/my-dashboard/dist`。宿主源码没有挂载入容器，运行时无 node_modules。

## 已执行检查

| 检查 | 实际结果 |
| --- | --- |
| Docker Compose 配置验证 | 通过 |
| Debian 镜像复用 | 构建日志与根文件系统层确认，未拉取 Node/Nginx 基础镜像 |
| Linux 环境安装与构建 | npm ci、TypeScript 检查、Vite 生产构建通过 |
| nginx -t | 通过 |
| /healthz | 200，正文 ok |
| 首页 | 宿主 HTTP 200，Nginx 返回 text/html，index.html no-cache |
| /assets/missing-verification.js | 404，无错误回退为 HTML |
| 浏览器总览与空状态 | 正常，无业务工具导航 |
| 晨间切换与刷新恢复 | 通过 |
| 原始 SVG 与字体 | 本地资源正常，无运行时外部请求 |
| SPA 直达与刷新 | Nginx 回退到应用，未知路径显示宿主 404，可回总览 |
| 小屏抽屉 | 正常打开，Escape 关闭且恢复焦点，无水平溢出 |
| 运行错误 | 浏览器 pageerror / console error 为空 |
| 手动重启恢复 | docker restart 后容器再次 healthy，项目文件与服务仍正常 |
| 宿主 lint | npm run lint 通过，覆盖新增验证脚本 |

浏览器检查命令：`node ops/debian/verify.mjs`；具体断言保存在同目录脚本中。来源文件与容器副本 SHA256 一致：

- src/main.tsx：`845738e50af3a931f4efb975f78f660845ad52472a51a6b3ac3309bd22ac3bb8`
- package-lock.json：`196aa50c381f504ed04d1f9c33e80e502e80b032ad3dabf0c538378699167f4d`

原有 mysql-base 与 agent-workspace 容器保持运行，未修改。服务按用户要求保持启动，不进行公网发布。此为追加的运行操作验证，不改写 V0.1 的历史 UI 测试结果，也不表示用户已经验收或关闭版本。
