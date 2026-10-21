# 设计资产来源

原始 SVG 来自 Figma 文件 `P2EfZNJYj2PsdZLmaMzHMN`，于 2026-10-21 按 get_design_context 的 curl 下载指令保存，未修改 SVG 内容。

| 文件 | 来源图层 | 使用位置 |
| --- | --- | --- |
| morning/brand.svg | Icon/grid / Morning / on-accent，17:561（总览 14:266） | 侧栏品牌标记 |
| morning/home.svg | Icon/home / Morning / default，17:519 | 总览导航 |
| night/brand.svg | icon/grid，6:684（总览 4:86） | 侧栏品牌标记 |
| night/home.svg | I6:695;4:62;4:14;68:15816 | 总览导航中的原始 SDS 图形 |

夜间 Home 为设计中的原始矢量，工程无可复用的 SDS 代码组件，故保留其设计工具导出的 SVG。CSS 只处理外层 slot 与既有图形位置，不覆盖原始 SVG 根宽高。
