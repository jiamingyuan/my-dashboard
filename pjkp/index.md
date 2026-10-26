# my-dashboard 项目入口

更新：2026-10-26。当前版本：**V0.3 · Media 接入与宿主整合**。

V0.1 建立前端外壳，V0.2 引入 Module Federation，V0.3 归档当前 Media 正式接入、PingFang SC 与文档整合。未接入 AI 日报或背单词，没有宿主后端；本次版本命名和上传不补写用户验收。

- [规则](rules.md)：全站统一使用 PingFang SC 的字体要求。
- [项目简介](project-brief.md)：项目方向、已有能力和待确定事项。
- [架构](architecture.md)：当前宿主、远程模块、主题与部署边界。
- [开发与运行](../README.md)、[模块接入说明](../docs/module-integration-guide.md)。

## 版本

| 版本 | 内容 | 实际进展 | 迭代记录 |
| --- | --- | --- | --- |
| V0.1 | React 前端基础框架、双主题、搜索留白、空状态与响应式导航 | 2026-10-21 实现并验证；历史基线，未记录用户验收 | [V0.1](V0.1/iteration.md) |
| V0.2 | Module Federation、运行时清单、动态导航与路由、主题传递、加载失败处理 | 2026-10-22 实现并验证；2026-10-23 命名并完成 PingFang SC 统一，18 项 Chromium 回归通过 | [V0.2](V0.2/iteration.md) |
| V0.3 | Media 正式接入、工具页布局、全站 PingFang SC、单一指引与构建版本标记 | 2026-10-26 定义为 0.3.0；lint / 构建、18 项回归、真实 Media 与原容器部署核验通过，纳入 main 发布提交 | [V0.3](V0.3/iteration.md) |

## 当前环境与接续位置

- 本机源码：`/Users/jiamingyuan/Desktop/ai-infra/my-dashboard`，React + TypeScript + Vite；Node 24 / npm，具体版本与命令见 README。
- 运行容器：独立的 `my-dashboard`，官方 Nginx 镜像，静态文件在 `/usr/share/nginx/html`；`127.0.0.1:8080 → 80`，无 Volume。当前不是容器内 Vite 开发环境。
- GitHub：`https://github.com/jiamingyuan/my-dashboard`。V0.1 历史基线为 `e56598edcf1a83a559a6adfc2dc317a5b1af77bb`；V0.2 上传基线为 `4ad4ace7cc5748861cdd6f1b98ae165203768408`。用户于 2026-10-26 将当前工作区定义为 V0.3，并要求上传 main、核对及更新部署；本轮结果见 V0.3 记录。
- media-keeper 已作为独立远程模块接入 `/tools/media-keeper`，本机地址 `http://localhost:8080/tools/media-keeper`。宿主不含业务源码，仅登记清单，并通过同域 /media-keeper/ 代理独立容器提供的静态资源和只读 API；总览不展示 Media 内容。标题包含匹配、日期预设、类型导航/计数、摘要、分页和详情已联通真实资料；4 项模块浏览器测试及 18 项宿主回归通过。播客类型已按用户纠正统一为 podcast，网站文章归 article；MySQL 与运行页面已同步。前端继承 PingFang SC，当前 Figma 文字仍受字体不可用限制。Media V0.3 已部署至独立 media-keeper 容器，宿主与模块加入 agent-services，旧本机 API 已停止；主页面与重启恢复检查通过。这些既有改动在本轮统一纳入宿主 V0.3；发布与部署核对结果以 V0.3 记录为准。

## 记录迁移

2026-10-23 按用户要求迁移到新版 project-keeper：每个版本只保留 `iteration.md`；长期方向归简介，当前设计归架构，原 roadmap / log / 需求 / 方案 / 测试文件中的关键决定与真实结果归入对应版本。未启用的 `config.toml` 和旧状态指纹移除，不再沿用 plan/execute 或关闭事务。

迁移前 11 份 pjkp 文件均与上述 Git 提交逐字一致，完整原文可通过 `git show e56598edcf1a83a559a6adfc2dc317a5b1af77bb:pjkp/原文件路径` 恢复。旧版 `ops/tooling/project-keeper/` 与 `ops/development/` 留作历史材料，不是当前记忆维护或运行入口。本次未创建 AGENTS.md，也未改变用户已移除项目约定的决定。
