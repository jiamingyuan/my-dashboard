# my-dashboard 项目入口

## 项目入口

- 项目：my-dashboard
- GitHub 仓库：[jiamingyuan/my-dashboard](https://github.com/jiamingyuan/my-dashboard)，分支 `main`；已于 2026-10-21 按用户要求完成首次上传，版本仍待验收。
- 项目根目录：Docker 容器 `my-dashboard` 内 `/app/my-dashboard`；持久化卷 `my-dashboard-project`，宿主源码副本已按用户要求迁出。
- 当前阶段：V0.1「前端基础框架」已实现并通过本版验证，待用户验收；根据用户追加要求，已迁入本机 my-dashboard Debian 开发容器，后续在容器内开发，版本未关闭。
- 前端技术栈：React + TypeScript + Vite（2026-10-20 用户在当前对话确认改为 React）。
- 配置：[config.toml](config.toml)（仅预留，不参与运行）

## 文件导航

- [项目简介](project-brief.md)：背景与功能。
- [架构](architecture.md)：框架、机制与源码入口。
- V0.1 前端基础框架：[需求](V0.1/requirements.md)、[执行方案](V0.1/spec.md)、[测试方案](V0.1/test-plan.md)。仅应用外壳，不加入任何业务模块。
- [运行说明](../README.md)与 [V0.1 测试结果](V0.1/test-results.md)：实际源码入口、启动命令与检查证据。
- [容器内开发](../ops/development/README.md)、[Compose 配置](../compose.yaml)、[迁移验证](../ops/development/VERIFICATION.md)：容器 my-dashboard，Vite 热更新，本机访问 http://localhost:8080；首次 Nginx 运行记录保留在 ops/debian。
- Figma 界面草稿：[晨间模式](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=14-266) / [夜间模式](https://www.figma.com/design/P2EfZNJYj2PsdZLmaMzHMN?node-id=4-86)。每套主题包含总览和三个模块，均为可编辑设计图层，原型可切换主题并保留当前模块。
- [规则](rules.md)：原则和边界。
- [规划](roadmap.md)：愿景、里程碑、todo。
- [日志](log.md)：行为历史。

## 版本状态

<!-- pjkp:versions:start -->
最近完成版本：暂无

| 版本 | 状态 | 来源 |
| --- | --- | --- |
| V0.1 | awaiting-acceptance | [需求](V0.1/requirements.md) |
<!-- pjkp:versions:end -->

## 当前阻塞与待同步事项

- V0.1 已使用 React Router、CSS Modules 与 React Context 实现外壳、双主题及无工具空状态；依赖已锁定，源码位于 src/，启动方式见 README。
- 后端、数据存储、登录和公网托管待确认；本机容器已经使用用户指定的 debian:trixie 运行，仅映射 127.0.0.1:8080。
- AI 日报、背单词、media-keeper 均不加入 V0.1；未来接入方式和现有工具位置待后续确认。
- 用户于 2026-10-21 授权执行 V0.1，代码和测试已完成；尚无用户验收记录，不关闭版本。Safari / Firefox 与生产托管未验证。
