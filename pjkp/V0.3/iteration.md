# my-dashboard V0.3 迭代记录

## 当前状态

2026-10-26 用户指定当前项目为 V0.3，npm 版本同步为 0.3.0。范围基于 V0.2 已上传提交 `4ad4ace7cc5748861cdd6f1b98ae165203768408` 到本轮工作区的实际 diff，包含此前尚未提交的字体、Media 接入、布局和文档调整。

版本元数据、构建标记及本轮验证已完成，现有 my-dashboard 容器已更新并核验为 0.3.0；当前内容随 V0.3 发布提交同步 GitHub main。正式模块为独立 media-keeper；其应用版本与宿主 V0.3 独立。版本命名、自动测试和推送均不补写为用户验收。

## 目标与来源

用户原话：“将现在的my-dashboard定义为V0.3版本，并上传上 github，同时如果容器里部署的不是该版本，就进行修改”。本轮归档当前已有能力，核验后发布到原仓库 main，并在必要时更新原 my-dashboard 运行容器；没有新建业务模块或增加后端需求。

## 相对 V0.2 已上传基线的变化

| 内容 | 实际变更依据 |
| --- | --- |
| Media 正式登记 | public/modules.json 登记 media_keeper、/media-keeper/mf-manifest.json 和 ./DashboardModule；宿主不包含独立模块业务源码 |
| 模块外壳调整 | Topbar 按真实模块显示面包屑，PageHeader 与工具页改用紧凑标题；总览仍不展示 Media 内容 |
| 同域接入与服务边界 | Vite dev/preview 代理 /media-keeper/ 到 127.0.0.1:8081；正式 Nginx 经 agent-services 网络和 Docker DNS 将整段路径代理至 media-keeper:80，API 和模块资源归独立容器负责 |
| 字体统一 | 全站 PingFang SC，品牌、日期、正文和控件复用同一变量；删除 Noto Sans SC / Manrope 的 Web 字体、样式和未使用依赖，设备无苹方时回退 sans-serif |
| 文档合并 | 只保留 docs/module-integration-guide.md，完整合入宿主协议、字段约束、超时、部署和排错；README 与 pjkp 引用已统一 |
| 验证适配 | 外壳测试显式提供空清单，避免正式 Media 配置改变无模块基线；字体与远程继承检查随当前实现更新 |
| 本轮发布配置 | package.json / package-lock.json 为 0.3.0；Vite 根据 package 自动生成 version.json，Nginx 禁用其缓存，便于核对运行版本 |

设计过程和被取代的决定仍保存在 [V0.2 记录](../V0.2/iteration.md)，不因本次归档抹去历史。当前跨版本字体要求见 [规则](../rules.md)。

## 验证与部署结果

2026-10-26 本轮实际检查：

- Node.js 24.20.0 / npm 11.19.0 环境下，lint、TypeScript 检查与生产构建通过；package.json、lock 两处版本及 dist/version.json 均为 0.3.0。
- 18 项 Chromium 回归全部通过，覆盖宿主双主题、存储降级、字体、响应式导航、远程组件共享、路由、加载与渲染失败恢复。
- 发布前将本轮 24 个构建文件与运行容器逐项比较：已有页面与资源内容全部一致，仅缺少 version.json；运行配置缺少其缓存规则。因此只向原容器补入自动构建的版本文件及当前 Nginx 配置，没有重建容器。
- Nginx 配置检查与 reload 成功；更新后全部 24 个构建文件的 SHA-256 及 Nginx 配置均与本地一致。/version.json 返回 application/json、0.3.0 与 no-store；/modules.json 保留 Media 登记及清单格式 version=1；/healthz、Media manifest 均为 200，缺失静态资产为 404。
- 对 http://localhost:8080 进行真实 Chromium 检查：总览不显示模块内容，侧栏可进入 Media 并读取 19 条真实资料，详情直达刷新及返回列表正常，晨间/夜间主题传递、PingFang SC 继承、390px 导航与无横向溢出通过，未出现页面/控制台错误或失败 HTTP 响应。只读浏览，没有修改资料。
- 本轮修改文档的 64 处本地链接、版本/依赖锁一致性与 git diff --check 通过；源码候选文件未发现所检查的凭据模式。
- 沿用原镜像、8080 端口与 agent-services 网络，无 Volume；没有重建 media-keeper、mysql-base 或其他容器。构建/测试输出和操作前备份仅存系统临时目录。旧部署的未引用资源未额外清理。

## 发布与接续

本轮发布目标为原仓库 [jiamingyuan/my-dashboard](https://github.com/jiamingyuan/my-dashboard) 的 main 分支；版本提交包含当前源码、配置、指引和 V0.1 / V0.2 / V0.3 历史，上传结果由该发布提交与远端 main 记录核对，不另建 tag。运行版本可由 [version.json](http://localhost:8080/version.json) 查询。

本轮没有新增业务开发事项。公网托管、用户验收及未来业务范围尚未指定。
