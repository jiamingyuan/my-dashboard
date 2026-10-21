# 容器内开发

2026-10-21 用户要求后续直接在 my-dashboard 容器开发，并删除宿主 ai-infa 中的项目副本。

## 当前入口

- 容器 `my-dashboard`，开发镜像 `my-dashboard:development`，基于已有 `debian:trixie`。
- 唯一源码、pjkp、锁文件、Linux node_modules 和测试报告均在 `/app/my-dashboard`，由外部命名卷 `my-dashboard-project` 持久化。没有宿主源码挂载。
- Node 24.20.0、Git、Python 3、Playwright Chromium 已安装；浏览器保存在开发镜像 `/opt/playwright`。若升级 Playwright，需同步 Dockerfile 中的版本并重建镜像。
- 访问 http://localhost:8080，127.0.0.1:8080 映射容器 80。Vite 提供开发服务和热更新；与早先 Nginx 静态预览不同，修改源码即时生效。容器默认目录为 `/app/my-dashboard`，使用 init 与 unless-stopped。

在宿主进入容器：

```sh
docker exec -it -w /app/my-dashboard my-dashboard bash
```

以下项目命令在容器中执行：

```sh
npm run typecheck
npm run lint
npm run build
npm run test:e2e
python3 ops/tooling/project-keeper/scripts/project_keeper.py --project /app/my-dashboard context --version V0.1
```

修改包依赖后同时更新锁文件；重装使用 `npm ci --no-audit --no-fund`。开发服务器由容器主进程启动，无需重复启动。历史根 README 中的普通 Node 工程命令在容器内使用。

## 从容器重建镜像与容器

下面在宿主执行，不需要恢复本地项目目录。Docker CLI 不装进业务容器，也不挂载宿主 Docker socket。

```sh
docker exec -w /app/my-dashboard my-dashboard tar --exclude=./node_modules --exclude=./dist --exclude=./test-results --exclude=./playwright-report --exclude=./.git -cf - . | docker build --pull=false -f ops/development/Dockerfile -t my-dashboard:development -
docker exec my-dashboard cat /app/my-dashboard/compose.yaml | docker compose -p my-dashboard -f - up -d --no-build --pull never
```

镜像重建不替换项目卷里的代码。若只需恢复服务，在宿主执行 `docker start my-dashboard` 或 `docker restart my-dashboard`。检查用 `docker logs --tail 50 my-dashboard` 和 `docker inspect my-dashboard`。

如果容器已删除但卷和镜像仍在，宿主可执行：

```sh
docker run -d --name my-dashboard --init --restart unless-stopped -p 127.0.0.1:8080:80 --mount type=volume,source=my-dashboard-project,target=/app/my-dashboard my-dashboard:development
```

恢复后在卷内更新、构建、测试。不要使用删除卷的命令清理该项目；持久化卷能跨容器重建保留数据，但仍需要按需要做独立备份。旧生产 Dockerfile 与 Nginx 验证留在 ops/debian，当前运行方式以本文和根 compose.yaml 为准。

宿主 `/Users/jiamingyuan/Desktop/ai-infra/AGENTS.md` 只保存容器入口约定，不保存项目源码。验证与迁移证据见 [VERIFICATION.md](VERIFICATION.md)。
