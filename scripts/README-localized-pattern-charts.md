# 本语图格 PNG：德语、法语、日语

`build-localized-pattern-charts.mjs` 为当前111张图纸生成333张本语图格，全部输出到显式指定的任务 staging 目录，不写 `public`、`src`、PDF、旧字体或原始源包。英文 URL、旧图格与旧下载保持。挂饰候选不属于这批。

本批的100张旧 SVG 是586 × 586，而对应 PNG 是1172 × 1172，必须保留2倍栅格密度；另10张 SVG/PNG 是788 × 908，足球是908 × 990。100张纯图格的完整旧PNG像素直接保留；11张带英文尾注的图格仅裁去尾注区域，绘图区像素直接保留。新本语 footer 单独矢量栅格化后在下方拼接。逐张断言全部RGBA像素的alpha为255后，以去除冗余alpha、压缩等级9及关闭adaptive filtering的RGB PNG无损编码，再回读ensureAlpha验证整张RGBA与拼接缓冲完全一致。旧 SVG 绘图、格线、坐标和符号分组逐字节保留，只替换末尾说明分组。不会通过整图重新栅格化改变旧符号的抗锯齿。

文字采用当前 `getLocalizedPatternName`、`localizePatternNote`、共享本语 UI、杯垫说明及 Creeper 本语来源说明。官方 Perler 色名、色号、符号和数量保持。无法翻译的制作说明、未知旧尾注、变更的材料表或新增模板立即拒绝，没有整句英文回退。保留制作/熨烫未实物验证、Stocking/Snowflake 未悬挂验证、Creeper 非官方署名与权利归属、杯垫软木与热杯/洗碗机边界、空白/白豆区别及 PNG 非原寸限制。footer 不包含网页点击操作、团队讨论或内部审批状态。

说明文字使用独立字体的 glyph 轮廓路径。根据实际字符 advance 换行，再核每个 glyph 的水平、垂直边界；最终高度随本语内容变化，不删长标题或将其挤进固定高度。普通重建从冻结的轮廓文件读取，不下载、不要求 fontTools，不依赖系统日文字体或废纸篓。

```sh
node scripts/build-localized-pattern-charts.mjs --output "$CHART_TASK/generated-charts"
node scripts/build-localized-pattern-charts.mjs --check-only --output "$CHART_TASK/generated-charts"
```

首次生成拒绝已有 staging 目录。只读模式验证333份SVG和PNG、旧绘图区、文字边界以及 manifest，不写文件。候选包括 `patterns-{de,fr,ja}/{id}/grid.png`、相应 `grid.svg`、`localized-grid-assets.json` 与 `chart-checks.json`。manifest 为 `{locale: {id: {href,width,height}}}`，尺寸读取最终 PNG，不能用 SVG 尺寸代替。根代理目检后只提升333张PNG和 `src` 中的manifest；SVG只供结构和渲染验收，不建立公共下载入口。根代理独占提升，脚本不执行发布。

首次构建字体需明确指定仅用于这次任务的 Python 环境：

```sh
python3 -m venv "$CHART_TASK/font-build-env"
"$CHART_TASK/font-build-env/bin/python" -m pip install fonttools==4.60.1
node scripts/build-localized-pattern-charts.mjs --build-font --python "$CHART_TASK/font-build-env/bin/python" --output "$CHART_TASK/generated-charts"
```

新字体仅写 `scripts/fonts/native-chart-labels`，族名为 **Fuse Bead Native Chart Labels**。Google Fonts Noto Sans JP 的不可变revision、上游字体/许可SHA沿用已有经过核验的上游记录；下载字节在内存中处理并校验，SIL OFL原文保留，衍生族名独立。`source.json` 记录字体、轮廓和字符库存SHA；`glyphs.json` 记录 advance、bbox 与路径。`--build-font`拒绝覆盖已有目录。后续内容或字符扩展应建立新的、单独命名的目的版本并重新审阅，不能删除或覆盖任何旧字体来强制重建；也不能删掉原39份字体文件。

`chart-checks.json` 是数字结构、字形边界和绘图区保护证据，不能代替根代理对长标题、13色材料表、足球、杯垫及Creeper的实际PNG目检，也不代表实体制作或打印效果已验证。根代理验收并保留必要记录后，任务 staging 中的SVG、中间环境及重复图像可回收；维护脚本、冻结字体和正式PNG保留供复现。
