# 原创58×58多板图纸下载

`build-multiboard-pattern-downloads.py` 是 Sunset Mountain Lake 的独立增量构建器，固定ID `original-sunset-mountain-lake`、slug `sunset-mountain-lake`。它读取主库Git忽略的 `artifacts/pattern-samples/2026-10-11/original-large-landscape-v1`，不导入或修改历史单板、Rave或其他PDF构建器，不改旧下载、旧字体、catalog、应用或索引。

源包沿用 `manifest.json`、`pixels/<id>.png`、`projects/<id>.bead-pattern.json`。唯一图柄需58×58格阵、2×2块29×29 Midi板，最多8种实际Perler CSV颜色。空格RGBA严格全零；有珠格alpha255，色号、RGB、名字、符号及数量必须与当前Perler CSV和源格阵一致。材料、主体边界和各板数量均从实际源格阵核对，不预填2496或624来伪造结果。图柄宽高须超过29、四板都有珠，横竖边界都有连续图形；数字连通不代表实体强度。

```sh
python3 -B scripts/build-multiboard-pattern-downloads.py --pack "$MULTIBOARD_PACK" --font-characters
python3 -B scripts/build-multiboard-pattern-downloads.py --pack "$MULTIBOARD_PACK" --font-dir "$MULTIBOARD_FONT_DIR" --build-font
python3 -B scripts/build-multiboard-pattern-downloads.py --pack "$MULTIBOARD_PACK" --font-dir "$MULTIBOARD_FONT_DIR" --review-lock "$MULTIBOARD_REVIEW_LOCK" --output "$MULTIBOARD_OUTPUT"
python3 -B scripts/build-multiboard-pattern-downloads.py --pack "$MULTIBOARD_PACK" --font-dir "$MULTIBOARD_FONT_DIR" --review-lock "$MULTIBOARD_REVIEW_LOCK" --output "$MULTIBOARD_OUTPUT" --check-only
```

`MULTIBOARD_OUTPUT` 必须是独立私有新目录 `generated-multiboard-downloads`，不得位于public/src或经过符号链接。首次生成拒绝已有输出目录，所有文件独占写入；`--check-only`不写任何文件。可以用 `--node` 指定工作树能加载Sharp的Node运行时。

独立 `MULTIBOARD_REVIEW_LOCK` JSON只有固定ID一个键，其对象含 `rowsSha256` 和 `rgbaSha256`；应由根代理完成源图目检后冻结。不允许候选自动覆盖锁，也不能用manifest自报哈希代替独立批准。没有review lock不能制作或验收PDF，但可以只读查询字形及准备新字体。

**PDF skill marker仅由根代理负责。** 首次实际制作PDF前，成功且仅一次执行 `mark_artifact_operation_started.mjs --operation-kind create --expected-output-count 8 --output-format pdf`。这里是8份PDF文件，不是40张页面；其他agent不得重复标记或提前制作PDF。

新字库 `multiboard-labels` 使用新名字 `FuseBeadMultiboardLabels-Regular.ttf`。`--build-font`只建新字体后退出，不生成PDF或图表；需要fontTools 4.60.1，抓取与既有Latin Cross/Rave相同的固定Google Fonts提交及OFL，校验源SHA256后以Noto Sans JP 400生成新subset、glyph路径JSON、OFL和来源锁，拒绝刷新旧目录。普通构建只读该新字库，不联网。

每款图纸输出8份PDF：英语、德语、法语、日语各A4和US Letter一份，每份固定5页。第1页是缩小的全图总览、总材料表和打印提示，明确不是实际尺寸铺珠模板。第2至5页是下面四块实际尺寸图，每块29×29格、145×145 mm、格距5 mm：

| 板次 | 位置 | 全局列 | 全局行 |
| --- | --- | --- | --- |
| 1 | 左上 | 1–29 | 1–29 |
| 2 | 右上 | 30–58 | 1–29 |
| 3 | 左下 | 1–29 | 30–58 |
| 4 | 右下 | 30–58 | 30–58 |

每块板使用全球行列标号、板次和位置、原格阵符号/RGB、该板材料数量、本语打印说明、本语详情链接及横竖各50 mm标尺。PDF嵌入新字体，设置对应Lang和 `PrintScaling=None`。两列四行材料区可以容纳8色，数字和说明不相互覆盖。英文产品色名保留原厂名称，本语标题明确其为英文商品名。

验证器独立按PDF第2至5页固定原点 `(0,0)、(29,0)、(0,29)、(29,29)` 解读，不调用绘图函数的分板取色函数来证明自己。逐格检查全局坐标、符号、RGB、全部网格线、58方向坐标标号、纸张尺寸、双轴刻度、材料数和链接。四页覆盖全部3364个全局格子且不重复，从打印出的有珠格加空白全零RGBA恢复58×58像素，必须与原项目/PNG/独立锁完全一致；四板珠数和色数汇总也须一致。重点是29/30行列边界，不多放、不漏放、不把纸张余白当作额外格子。总览亦逐格核对缩放后的RGB。

另有4份1484像素宽的四语计数图SVG/PNG，保留完整58×58格、全球坐标、强化的29/30板界、材料和四板对应关系。所有可见文字转换为新字库glyph路径，不依赖系统日文字体。PNG由SVG在内存经Sharp生成；检查全部3364格的颜色与不透明背景，`--check-only`比较完整SVG和PNG字节。计数PNG不是5 mm实尺寸模板。

输出路径遵循现有约定：英语 `patterns/<id>`，其余 `patterns-de|fr|ja/<id>`；文件名 `pattern.pdf`、`pattern-letter.pdf`、`grid.svg`、`grid.png`。`grid-assets.json`记录实际PNG宽高，`download-checks.json`记录源格阵/项目/RGBA哈希及逐项验收结果。源包预览、原尺寸PNG和项目另由根代理从已验源包提升，构建器不重复重写这些资产。

发布前必须渲染并目检全部8份PDF的40页、4份计数图，做真实下载、编辑器2×2回载、边界格编辑/保存/回载、品牌和语言切换，比较599份旧HTML关键记录、1738份资源/字体、117个旧catalog对象和593条旧sitemap字面条目及相对顺序。结构验证及文字提取不能代替视觉或实际下载验收。

实体拼装、熨烫、跨板接缝强度、悬挂和承重均未测试，不以数字连通、像素一致或大尺寸文件宣称已完成实物验证。打印后测量标尺并与自己的Midi板格距核对。

清理本批临时渲染和废弃候选，保留唯一源包、新字体、最终资源及最小验收记录；不清理旧资源、别人的下载或活动预览构建目录。
