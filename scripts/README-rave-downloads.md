# 原创 Rave 图纸下载构建

`build-rave-pattern-downloads.py` 只处理 `original-rave-v1` 私有源包中的 Alien Head、Rainbow Smiley、Crescent Moon Mushroom 三款独立原创。每款是29×29、单块Midi板、最多7种当前Perler CSV颜色；固定 ID、slug、四语名字在脚本中显式登记，不使用第三方角色或艺人标识。

脚本从明确的源包读取29行格阵，核对原尺寸RGBA PNG、v1编辑器项目、材料表、数量、边界和数字连通性。不修改源包、旧脚本、旧字体、public、catalog或索引。

```sh
python3 -B scripts/build-rave-pattern-downloads.py --pack "$RAVE_PACK" --font-characters
python3 -B scripts/build-rave-pattern-downloads.py --pack "$RAVE_PACK" --font-dir "$RAVE_FONT_DIR" --build-font
python3 -B scripts/build-rave-pattern-downloads.py --pack "$RAVE_PACK" --font-dir "$RAVE_FONT_DIR" --review-lock "$RAVE_REVIEW_LOCK" --output "$RAVE_OUTPUT"
python3 -B scripts/build-rave-pattern-downloads.py --pack "$RAVE_PACK" --font-dir "$RAVE_FONT_DIR" --review-lock "$RAVE_REVIEW_LOCK" --output "$RAVE_OUTPUT" --check-only
```

- `RAVE_PACK` 是主库Git忽略的 `artifacts/pattern-samples/2026-10-11/original-rave-v1`；包目录及父目录不能经过符号链接。
- `RAVE_FONT_DIR` 为新建 `scripts/fonts/rave-labels` 或私有同名目录。`--build-font` **仅生成字体后退出，不制作PDF**，拒绝已有目录；需要fontTools 4.60.1。它只抓取与Latin Cross一致的固定Google Fonts提交中的Noto Sans JP与OFL，逐项校验源文件SHA256，以400字重生成新子集、glyph路径JSON、OFL及来源锁，不刷新任何旧字库。
- `RAVE_REVIEW_LOCK` 是根代理目检后保留的独立JSON，键为三个固定ID，各含 `rowsSha256` 和 `rgbaSha256`。不能自动从待验候选覆盖原锁；manifest自报哈希不代表验收批准。没有独立锁时只能检查源包、查询字形或生成新字体。
- `RAVE_OUTPUT` 必须是私有 `generated-rave-downloads` 新目录，不能位于public/src或经过符号链接。生成拒绝已有目录；`--check-only`不写文件。Node需能在本工作树找到Sharp，可以用 `--node` 明确Node运行时。

**首次真正制作PDF前**，由负责发布的根代理成功且仅一次运行PDF skill的 `mark_artifact_operation_started.mjs --operation-kind create --expected-output-count 24 --output-format pdf`；不要为只读查询或字体创建标记，也不要让多个agent重复标记。

输出为24份单页PDF（3图×英德法日×A4/US Letter）及12份同源SVG/PNG计数图。英语位于 `patterns/<id>`，其余位于 `patterns-de|fr|ja/<id>`；PDF名为 `pattern.pdf` 和 `pattern-letter.pdf`，图表为 `grid.svg` 和 `grid.png`。英语源包已有原符号图时，根代理可以仅提升本脚本的九份三语图格，英语仍保留已验源包图格；不能把两个不同英语图表混作同一验收契约。

PDF整格145×145 mm，格距5 mm，一基行列、每个有珠格的精确RGB和符号、两列四行材料表及双向50 mm标尺。最多7色时材料行位于205–226 mm，说明从232 mm起，避免复用旧三色footer造成覆盖。四语PDF嵌入新字体，设置本语Lang、`PrintScaling=None`及对应语言详情链接。打印颜色仍是近似，需要核对自己的品牌色号和实际板格距。

数字检查逐格独立核对PDF坐标、RGB、符号、全部网格线、两个刻度长度、材料数量、纸张尺寸、嵌入字体、文字边界和本语链接。SVG所有可见文字转为新字库的glyph路径，无系统字体和外部资源依赖；PNG由该SVG在内存经Sharp生成。检查12图的全部841格避开符号/网线的位置，`--check-only`比较完整SVG和PNG字节，覆盖日本字形实际像素，不能以提取文字代替视觉验收。

`grid-assets.json`记录实际图格尺寸及路径，`download-checks.json`保留源格阵/像素/项目SHA256、材料及逐项数字验收。发布前仍需渲染24份PDF并目检，查看12份图表，真实下载和编辑器项目往返；文本提取和结构测试不能代替版面验收。实体制作、熨烫、固定方式及佩戴强度均未验证，不宣称佩戴适配、承重或物理可靠性。

临时渲染仅用于本批目检，完成后清理自己的中间产物；保留唯一可重建源包、必要新字体、最终资源及最小验收记录，不清理别人的Downloads或活动构建目录。
