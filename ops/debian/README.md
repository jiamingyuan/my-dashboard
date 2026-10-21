# Debian 静态运行方案（历史）

> 当前已根据用户要求切换为容器内开发，根 compose.yaml 使用开发镜像和持久化卷，当前操作以 [容器开发说明](../development/README.md) 为准。本文保留首次 Nginx 静态运行方案及验证背景；下面的早期重建命令不再描述当前 Compose 行为。

用户于 2026-10-21 要求使用已有 `debian:trixie`，创建名为 `my-dashboard` 的容器，把项目放进去并启动。

在项目根目录运行：

```sh
docker compose up -d --build --pull never
```

访问 http://localhost:8080。容器名为 `my-dashboard`，派生镜像为 `my-dashboard:debian-trixie`；构建和运行两阶段都使用本地 `debian:trixie`，不会拉取 Node 或 Nginx 基础镜像。

构建阶段安装 Node 24.20.0，按官方 SHASUMS256 校验 Linux 包，执行 npm ci 和生产构建。运行阶段使用 Debian 的 Nginx；源码和 pjkp 文档位于 `/app/my-dashboard`，网站根目录仅为其中的 `dist/`。运行镜像不含构建阶段的 Node 与 node_modules，需要更新时重新构建镜像。

项目是镜像内的副本，没有挂载宿主源码目录。复制时排除宿主 node_modules、旧 dist、浏览器报告、Git 和私有环境配置。应用内 URL 回退到 index.html；不存在的 `/assets/` 文件返回 404。`/healthz` 用于 Docker 健康检查。

常用操作：

```sh
docker compose ps
docker logs --tail 50 my-dashboard
docker exec -it my-dashboard sh
docker compose restart
docker compose stop
```

更新源码后，重新运行首条 up 命令即可重建。`restart: unless-stopped` 会在容器异常退出或 Docker 重启后恢复服务；手动停止后保持停止状态。当前仅映射本机 127.0.0.1:8080，没有公网、域名或 HTTPS 配置。

本次是用户追加的本机容器运行操作，独立于 V0.1 前端界面验收，不改变其无业务模块的范围，也不关闭版本。

安装项目依赖与 Playwright Chromium 后，可从宿主项目目录运行 `node ops/debian/verify.mjs`，检查容器健康接口、静态资源、双主题、SPA 直达刷新和小屏导航。可选首个参数为另一个本机服务地址。
