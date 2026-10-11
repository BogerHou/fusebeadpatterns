# 原创 Latin Cross 源包

`generate-original-latin-cross-sourcepack.mjs` 从空白 29 × 29 格阵独立绘制普通平面 Latin/Christian 十字架，只生成私有数字源包。ID 为 `original-latin-cross`、slug 为 `cross`、版本为 `Original Latin Cross design v1`。不使用作者图纸或第三方像素，不是 plus 加号、cross-stitch 针法或耶稣人物；不写 public、catalog、app、locale、PDF、字体或审批标记。

冻结零基坐标为竖杆 x=13–15、y=5–23，横杆 x=8–20、y=10–12。横竖杆均为三格厚，横杆之上五行、之下十一行。主体边界为 x=8、y=5、宽13、高19；一基为列9–21、行6–24。29 × 29 是 Midi 板尺寸，不是 Mini 珠模板；19格高度不符合严格 16 × 16 Small 规则。名义 5 mm 格距的 65 × 95 mm 只是布局占地，不是冷却成品实测尺寸。

当前 `public/palettes/perler.csv` 逐项核对 Brown `80-19012`、RGB(103,76,68)。自选图纸符号为 `B`；实际共87珠、单色。只有点号为空，空格严格为 `[0,0,0,0]` RGBA；有珠格使用精确 CSV RGB 与 alpha255。

```sh
node scripts/generate-original-latin-cross-sourcepack.mjs --output "$LATIN_CROSS_PACK"
node scripts/generate-original-latin-cross-sourcepack.mjs --check-only --output "$LATIN_CROSS_PACK"
node --test scripts/generate-original-latin-cross-sourcepack.test.mjs
```

`LATIN_CROSS_PACK` 指向主库 Git 忽略的 `artifacts/pattern-samples/2026-10-11/original-latin-cross-v1` 绝对路径。生成和回读入口均核对固定版本后缀、真实路径与 Git 忽略状态，拒绝路径及包内符号链接。首次生成拒绝已有目录，并独占创建文件；后续 `--check-only` 只读，不改变文件内容或 mtime。输出中额外文件、额外空目录及非普通文件也被拒绝。

输出沿用十文件契约：manifest、site-entries、candidate-assets、README、580 × 580 预览、29 × 29 原生像素 PNG、788 × 908 一基坐标符号 SVG/PNG、编辑器 v1 项目及 QA 回执。五种非 PDF 资产映射键保持既有契约；A4/US Letter PDF 仅为待制作路径，占位不证明文件存在、打印比例或下载可用。此脚本不制作 PDF，图表 PNG 也只是计数图。

回读检查实际材料、边界、数量、行 hash、四邻接分量与数字割点。源 PNG、编辑器项目、manifest 完全一致，并调用当前真实 `parseEditorProject`、decode、serialize/reparse；预览逐像素核对，图表 PNG 与 SVG 渲染一致。整份 manifest、site-entries、asset mapping、README 和保留的 QA 回执均按预期比较。四项测试覆盖几何/RGBA/材料、已有目录及只读保护、像素/项目/元信息/尺寸篡改、额外条目与输出路径保护。测试只在独立临时目录初始化 Git 仓库，完成后删除自己的全部测试目录。

数字四邻接分量1、单珠割点0及三格厚杆都不预测实体接头强度。`requiresBacking:false`、`fragile:false` 只表达此数字布局。拼制、熨烫、悬挂和承重均未实测，不承诺挂戴、站立、耐久、儿童适用或制作时长。首次源包仍待主代理目检，没有发布或实物批准；只保留唯一可重建源包，冻结后不追加文件，不修改旧生成器、旧源包或旧资源。
