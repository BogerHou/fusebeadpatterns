# 原创黑猫源包

`generate-original-black-cat-sourcepack.mjs` 从空白 29 × 29 格阵独立绘制普通正面坐姿黑猫，只生成私有数字源包。固定 ID `original-black-cat`、slug `black-cat`、版本目录 `original-black-cat-v1`。不描摹第三方图纸，不代表 Jiji、Luna 或其他具名角色；不写 public、catalog、app、locale、PDF、字体或审批标记。

短尖耳采用两格耳尖；脸部左右对称，仅四格普通 Yellow 构成小眼睛。七格宽颈部连到紧凑身躯，右侧两至三格宽的弯尾通过最后三行与身体相连。主体实际 16 × 16，零基外接边界 x=6、y=6；一基为列7–22、行7–22。29 × 29 是 Midi 板尺寸，主体小不等于使用 Mini 珠。名义 5 mm 格距的 80 × 80 mm 只是布局占地，不是冷却成品实测尺寸。

当前 `public/palettes/perler.csv` 逐项核对：Black `80-19018` RGB(50,50,52) 共177颗；普通 Yellow `80-19003` RGB(231,206,62) 共4颗；总181颗、两色。仅点号为空，空格严格 `[0,0,0,0]` RGBA；有豆格精确使用 CSV RGB 与 alpha255。未使用 Cheddar、Fluorescent Yellow 或 Mini 色表替代普通 Yellow。

```sh
node scripts/generate-original-black-cat-sourcepack.mjs --output "$BLACK_CAT_PACK"
node scripts/generate-original-black-cat-sourcepack.mjs --check-only --output "$BLACK_CAT_PACK"
node --test scripts/generate-original-black-cat-sourcepack.test.mjs
```

`BLACK_CAT_PACK` 指向主库 Git 忽略的 `artifacts/pattern-samples/2026-10-11/original-black-cat-v1` 绝对路径，CLI 先确认真实路径、版本后缀及 Git 忽略状态。首次生成拒绝已有目录，独占创建文件；后续 `--check-only` 只读且不会更新记录。

输出沿用既有源包契约：manifest、site-entries、candidate-assets、README、580 × 580 预览、29 × 29 原生像素 PNG、788 × 908 一基坐标符号 SVG/PNG、编辑器 v1 项目与 QA 回执。五种非 PDF 资产映射键保持不变。A4/US Letter PDF 仅是待制作路径，占位不能证明文件存在、打印比例或下载可用；此脚本不制作 PDF。图表 PNG 是计数图，不是校准原寸模板。

规则核验包括实际四邻接分量1、单珠数字割点0、逐格零透明值、两项 CSV 材料、真实 bounds/计数与行 hash。源 PNG、编辑器项目、manifest 完全一致；调用当前真实 `parseEditorProject`、decode、serialize/reparse。预览逐像素回读、图表 PNG 与 SVG 渲染一致；整份 manifest、site-entries、asset mapping、README 与保留的 QA 回执都按预期比较，拒绝额外文件及符号链接。必要测试覆盖透明格隐藏 RGB、编辑器调色板、旧检查漏检的 manifest 字段、README/QA 篡改、只读模式与已有输出保护。

数字检查不代替主代理目检，更不预测实体接头强度。首次源包目检待处理，没有发布或实物批准；`requiresBacking:false`、`fragile:false` 只表达此数字布局。拼制、熨烫、悬挂及承重均未实测，不承诺挂戴、耐久、儿童适用或制作时间。

保留唯一可重建源包供目检和后续整合。测试目录在完成后清理；不修改、重建或清理其他源包、旧生成器及旧公共资源。
