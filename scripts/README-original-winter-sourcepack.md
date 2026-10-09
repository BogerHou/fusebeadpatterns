# 原创冬季源包

`generate-original-winter-sourcepack.mjs` 仅创建私有数字源包，不写 `public`、catalog、多语言词典、字体或 PDF，也不调用 PDF authoring marker。

两款独立逻辑格阵均使用 29 × 29 方形 Perler Midi 板：

| ID / slug | 名称 | 设计 | 色彩 |
| --- | --- | --- | --- |
| `original-christmas-stocking` / `christmas-stocking` | Christmas Stocking | 红袜身、白袖口、白袜跟和白袜尖 | Red 80-19005 / White 80-19001 |
| `original-snowflake` / `snowflake` | Snowflake | 两条单格竖向、四条细阶梯斜向主枝，共六主枝；完整画布上下左右镜像，短线侧枝形成 Y 形，白色中心单格 | Light Blue 80-19009 / White 80-19001 |

袜子原生名称：DE Weihnachtsstrumpf、FR Chaussette de Noël、JA クリスマスの靴下。雪花原生名称：DE Schneeflocke、FR Flocon de neige、JA 雪の結晶。雪花是方板上的原创造型，不复制官方星形/六角板图纸；其六主枝识别必须经实际预览审阅，不能仅凭文件名、标签或拓扑通过判断。

格阵在脚本中以 29 行独立符号字符串保存。`ROWS_SHA256` 只有在 root 看过对应实际 PNG 后才能冻结。只要有一款尚未冻结，最终源包生成及 `--check-only` 均拒绝继续；`--preview-only` 允许先生成待审候选。当前固定袜子 279 颗（Red 176 / White 103）及细枝雪花 137 颗（Light Blue 136 / White 1）；雪花数字割点为 104 个，完整坐标保留于私有 manifest。

```sh
node scripts/generate-original-winter-sourcepack.mjs --preview-only \
  --preview-output /Users/simon/.codex/tmp/original-winter-candidates-v4

# root 审阅实际 PNG 并确认对应 rows 后，冻结脚本中的独立 rows hash。
node scripts/generate-original-winter-sourcepack.mjs \
  --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-09/original-winter-v1

node scripts/generate-original-winter-sourcepack.mjs --check-only \
  --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-09/original-winter-v1
```

所有创建都拒绝已有输出目录，各文件使用排他写入。预览暂存目录须以 `original-winter-candidates-` 命名，仅包含两个 580 × 580 PNG；最终源包位于 Git 忽略的 `artifacts` 中。最终输出完整并经读回检查后，清理本任务确认无用的预览副本。后续始终使用 `--check-only`，不会改写 root 增添的 PDF 或审阅回执。

每款源包文件：`previews/<id>.png`（580 × 580，整倍数每格 20 像素）、`pixels/<id>.png`（29 × 29 原生 RGBA）、`charts/<id>.svg` 与 `.png`（788 × 908，行列 1–29、每颗符号和颜色用量）、`projects/<id>.bead-pattern.json`（v1 空白模式、Perler Midi、一块 Midi 板、精确 29 × 29 编辑格阵）。所有颜色名称、RGB 和引用均从当前 `public/palettes/perler.csv` 读取并与独立预期值比较；屏幕 RGB 是近似值，未测量实物珠色。

`manifest.json` 包含 rows、palette、用量、占用边界、原生名称、独立 rows/RGBA SHA 和拓扑。`site-entries.json` 与 Santa Hat 契约一致，保存两个 original 条目的 id/slug/title/version/description，`source:null` 在 manifest 中，且不伪造 reference。`candidate-assets.json` 只映射私有候选到未来资源名称，不是发布批准。

脚本对每款检查数字四邻接连通分量为 1，并逐颗删除计算真实单珠割点；如有割点，在 `weakBridges` 记录 1-based 行列及真实数量，并设置 `fragile:true`、生成既有四语翻译兼容的 `Thin one-bead connections at row …, column …` 结构说明，不为追求零割点而加粗造型。雪花额外检查完整 29 格画布上下左右镜像，以及透明空格能通往画布外侧、没有闭合透明孔。按现有 builder 契约，`requiresBacking` 只标识是否分成多个独立部分；这里因数字四邻接分量为 1 而为 false，即使存在单珠割点也不代表实物无需支持或悬挂适合性。发布时仍应保留 fragile / notes，建议谨慎处理细连接并考虑支持材料。`physicalAssemblyTested`、`ironingTested`、`hangingTested` 均为 false。PNG 网格不是原寸模板；可编辑项目保存既有 `midi-5mm` 选项，不等于已经生成或审阅原寸 PDF。

创建前使用真实 `parseEditorProject` / `decodeEditorPatternDraft` 验证项目并执行 serialize/reparse 往返。候选预览创建后也读回两个实际 PNG，逐像素核对逻辑格子，输出 PNG 哈希及数字拓扑；此阶段不写最终源包。最终源包创建后再次读取实际 PNG、项目、SVG/PNG、manifest 和映射：原生 RGBA 逐字节匹配格阵，580 预览每像素匹配逻辑格子，PNG 图表匹配 SVG 渲染。`qa/sourcepack-checks.json` 保存数字验收及文件哈希；check-only 会对照已有回执，发现篡改即失败。

初始 manifest state 为 `private-original-grid-candidate-pdf-pending`，pendingPdfFiles 列出两份 reference library PDF 及两款分别的 A4/Letter 单页路径。这里列路径不证明 PDF 存在或通过。root 单独负责 PDF authoring marker、生成和视觉审阅；promotion 必须拒绝缺 PDF 或未完成审阅的源包。root 完成后可以在自己的授权范围更新顶层 reviewed state、清除 pendingPdfFiles，并补独立视觉/PDF批准回执；本脚本只读核对数字内容，绝不会代为批准。
