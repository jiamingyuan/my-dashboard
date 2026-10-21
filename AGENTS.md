# my-dashboard 开发约定

- 用户于 2026-10-21 要求后续直接在 `my-dashboard` 容器开发，并删除本地 ai-infa 中的项目副本。唯一工作副本为容器 `/app/my-dashboard`，持久化卷为 `my-dashboard-project`；不要在宿主重建或维护第二份源码，也不要改成宿主源码绑定挂载。
- 若工具运行在宿主，源码读取、编辑、依赖安装、构建、测试和 pjkp 操作均通过 `docker exec -w /app/my-dashboard my-dashboard ...` 执行；工具在容器内时直接使用当前目录。Docker 生命周期命令在宿主执行。
- 开发服务访问 `http://localhost:8080`，由容器内 Vite 提供热更新。Node 24.20.0；锁文件固定依赖。容器已配备 Git、Python 3 与 Playwright Chromium。
- 使用项目已有 pjkp 工作流。容器内辅助脚本：`python3 ops/tooling/project-keeper/scripts/project_keeper.py --project /app/my-dashboard context --version V0.1`。先读 pjkp/index.md、rules.md、project-brief.md 与当前任务材料；不能手改 pjkp:state 元数据。
- V0.1 为 React + TypeScript + Vite 前端外壳，不加入业务模块或后端；版本仍待用户验收，不能自行关闭。
- 容器开发及恢复说明在 `ops/development/README.md`。重建容器保留卷；删除卷等于删除项目，未获明确授权不得执行。
- 所有飞书 / Lark 操作优先本机 `lark-cli`，先检查支持命令并复用现有登录状态；只有 CLI 不支持或不可用时再考虑连接器或浏览器。涉及该工具的操作在宿主执行。
