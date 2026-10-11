# 原创日落山湖多板源包

`generate-original-sunset-landscape-sourcepack.mjs` 从空58 × 58格阵独立绘制日落山湖，ID `original-sunset-mountain-lake`，slug `sunset-mountain-lake`。主体为零基x3–54、y5–52的完整52 × 48矩形，2496颗Perler Midi珠；每象限624珠、217空格，总共4块29 × 29板。不是放大旧图，不使用外部像素、角色、描图、图片转换或生成式图片。

天空使用有意选择的实色层；落日在远山后方，两层独立山脉之下为湖面，包含暖色倒影、水平水纹与前景松树。8色精确核对现有Perler CSV：Midnight、Purple、Periwinkle Blue、Lavender、Hot Coral、Cheddar、Pastel Yellow、Toothpaste。空格为RGBA全0，有珠格为CSV RGB及alpha255。名义260 × 240 mm主体、290 × 290 mm完整格阵只是5 mm布局占地，不是冷却成品实测尺寸。

```sh
node scripts/generate-original-sunset-landscape-sourcepack.mjs --output "$SUNSET_SOURCE_PACK"
node scripts/generate-original-sunset-landscape-sourcepack.mjs --check-only --output "$SUNSET_SOURCE_PACK"
node --test scripts/generate-original-sunset-landscape-sourcepack.test.mjs
```

输出只允许Git忽略的 `artifacts/pattern-samples/2026-10-11/original-large-landscape-v1` 绝对路径。首次创建拒绝已有目录，所有文件以`wx`写入；后续check-only核对所有文件且不改内容或mtime。拒绝路径及包内符号链接、额外文件、额外目录与未忽略路径。

源包共14文件：4份共享manifest／site-entries／candidate-assets／README；58 × 58像素PNG、580 × 580预览、1460 × 1720完整计数SVG／PNG、2 × 2 Midi编辑器项目、4份29 × 29原生象限PNG及数字QA回执。材料表、精确行、边界、四象限的每色数量和SHA均记录。完整计数图具有1–58行列编号，行／列29和30之间为红色跨板边界；最后独立`g`是英文说明footer，供root本语版本替换。

真实编辑器parse／decode／serialize／reparse已纳入源包验收；预览逐像素、SVG／PNG与源行完全一致，4份841格象限回拼后必须恢复原始58 × 58像素，接缝不重不漏，每色分板数量加总必须等于全图材料表。

site-entry notes描述本批计划完成的消费者PDF交付；本脚本并不生成或验证PDF。A4／US Letter路径仅是待制作映射，不能证明下载或打印比例。四邻接连通及0数字单珠割点不代表实体接头强度；拼制、熨烫、跨板接缝、承重、悬挂和墙面安装均未验证。分板打印不表示应该分别熨烫各板。

本代理只生成唯一私有源包，不写public、catalog、app、locale、字体、PDF或批准标记。root独立目检并锁定来源hash；测试自行清理临时仓库和样本，正式源包不覆写。
