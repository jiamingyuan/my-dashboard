# GitHub 同步

用户指定仓库：https://github.com/jiamingyuan/my-dashboard，默认分支 main。源码与 Git 元数据位于容器 `/app/my-dashboard`，通过 my-dashboard-project 卷持久化；无需恢复宿主源码副本。

在容器中检查和提交修改：

```sh
git status
git diff
git add <本次修改的文件>
git commit -m "说明本次变更"
```

远端 origin 使用不含凭据的 HTTPS URL。首次发布复用宿主已登录的 GitHub CLI，在一次 Git 网络进程中临时提供授权；不把令牌写入镜像、仓库、远端地址或持久配置。后续推送也需要已有授权，可通过相同方式执行；容器本身没有长期保存 GitHub 登录状态。

GitHub 保存源码、package-lock.json、原始图标与字体许可证、Docker 配置、测试代码及 pjkp 文档。node_modules、dist、浏览器运行报告、本机迁移归档和环境凭据由 .gitignore 排除，继续保留在项目卷中。仓库是源代码备份，不包含 Docker 镜像、项目卷或浏览器二进制。

V0.1 的用户验收与代码上传分别记录；推送不代表验收、关闭版本、发布 Release 或启用网站托管。
