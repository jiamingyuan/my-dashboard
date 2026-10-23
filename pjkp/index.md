# my-dashboard 项目入口

更新：2026-10-23。当前版本：**V0.2 · Module Federation 接入**。

V0.1 前端外壳已实现，V0.2 在其上增加远程模块接入能力。默认工具清单仍为空，未接入 AI 日报、背单词或 media-keeper；没有宿主后端。两版均未记录用户明确验收。

- [规则](rules.md)：当前没有额外的项目专属约定。
- [项目简介](project-brief.md)：项目方向、已有能力和待确定事项。
- [架构](architecture.md)：当前宿主、远程模块、主题与部署边界。
- [开发与运行](../README.md)、[模块接入说明](../docs/modules.md)。

## 版本

| 版本 | 内容 | 实际进展 | 迭代记录 |
| --- | --- | --- | --- |
| V0.1 | React 前端基础框架、双主题、搜索留白、空状态与响应式导航 | 2026-10-21 实现并验证；历史基线，未记录用户验收 | [V0.1](V0.1/iteration.md) |
| V0.2 | Module Federation、运行时清单、动态导航与路由、主题传递、加载失败处理 | 2026-10-22 实现并通过 18 项 Chromium 测试；2026-10-23 用户指定版本号 | [V0.2](V0.2/iteration.md) |

## 当前环境与接续位置

- 本机源码：`/Users/jiamingyuan/Desktop/ai-infra/my-dashboard`，React + TypeScript + Vite；Node 24 / npm，具体版本与命令见 README。
- 运行容器：独立的 `my-dashboard`，官方 Nginx 镜像，静态文件在 `/usr/share/nginx/html`；`127.0.0.1:8080 → 80`，无 Volume。当前不是容器内 Vite 开发环境。
- GitHub：`https://github.com/jiamingyuan/my-dashboard`。V0.1 历史基线为 `e56598edcf1a83a559a6adfc2dc317a5b1af77bb`；V0.2 源码、配置、测试和文档由 main 分支的本版提交共同记录。用户于 2026-10-23 指定同步至 GitHub main；实际同步状态可核对本地 HEAD 与远端 main。
- 当前没有用户已指定但尚未完成的本版开发任务。真实子模块的源码、地址和接入时间尚未指定，不能将测试远程当成已接入业务工具。

## 记录迁移

2026-10-23 按用户要求迁移到新版 project-keeper：每个版本只保留 `iteration.md`；长期方向归简介，当前设计归架构，原 roadmap / log / 需求 / 方案 / 测试文件中的关键决定与真实结果归入对应版本。未启用的 `config.toml` 和旧状态指纹移除，不再沿用 plan/execute 或关闭事务。

迁移前 11 份 pjkp 文件均与上述 Git 提交逐字一致，完整原文可通过 `git show e56598edcf1a83a559a6adfc2dc317a5b1af77bb:pjkp/原文件路径` 恢复。旧版 `ops/tooling/project-keeper/` 与 `ops/development/` 留作历史材料，不是当前记忆维护或运行入口。本次未创建 AGENTS.md，也未改变用户已移除项目约定的决定。
