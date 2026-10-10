# 原创圣诞圆挂饰：德语、法语、日语图格

`build-bauble-localized-charts.mjs` 只处理 `original-christmas-bauble-ornament` 的私有 `original-bauble-v1` 源包。它不生成PDF、重建源包、修改catalog或写 `public`、`src`，也不读取或重写旧333张本语图格。输出三个PNG、供验收的三个SVG、局部尺寸manifest和数字检查记录；根代理目检后仅提升PNG并将三个新ID记录合入网站manifest。

源包路径固定在主库Git忽略的 `artifacts/pattern-samples/2026-10-10/original-bauble-v1`。脚本核对冻结行SHA、英文SVG/PNG字节SHA、362颗／3色材料及实际边界，拒绝图纸、色号、数量、吊孔或未实测声明被改变。原788×908英文图格上部761行的RGBA像素直接保留；只替换其下方英文尾注，不重新栅格化原绘图区。新footer采用与旧批相同的glyph路径排版和无损RGB编码，回读后核对完整RGBA和原绘图区。实际PNG尺寸写入manifest，不能沿用英文SVG尺寸。

本语标题、材料、白豆与空白区别、近似色、打印限制及留孔／未实物验证说明来自当前共享本语内容。额外说明交代3×3空孔、两珠宽边框、冷却后的实际孔尺寸未检验，以及成人按厂家说明熨烫、完全冷却、自然穿绳打结和检查接头。穿绳流程参考网站已链接的Perler方法；不复制厂商图案。PNG用于数格，不是校准原寸模板。所有数字检查均不证明制作、熨烫、实际孔径、绳适配、悬挂或承重通过。

```sh
node scripts/build-bauble-localized-charts.mjs --pack "$BAUBLE_PACK" --output "$BAUBLE_TASK/generated-bauble-charts"
node scripts/build-bauble-localized-charts.mjs --pack "$BAUBLE_PACK" --output "$BAUBLE_TASK/generated-bauble-charts" --check-only
```

首次生成拒绝已有输出目录。`--check-only`只读核对六份文件、局部manifest和检查记录；它不会调用PDF审批标记或制造任何发布／实物审批记录。

日文轮廓使用独立的 `scripts/fonts/bauble-chart-labels` 目的版，族名为 **Fuse Bead Bauble Chart Labels**。已有 `native-chart-labels`、`bauble-jp` 和其他旧字体保持原路径及字节。普通重建直接读取冻结glyph轮廓，不需要fontTools、下载或系统日文字体。

首次构建这个新字体时，显式使用任务临时环境中的fontTools 4.60.1：

```sh
node scripts/build-bauble-localized-charts.mjs --pack "$BAUBLE_PACK" --output "$BAUBLE_TASK/generated-bauble-charts" --build-font --python "$BAUBLE_TASK/bauble-chart-font-env/bin/python"
```

上游沿用已经锁定的Google Fonts Noto Sans JP不可变revision及SHA，字体和OFL在内存中下载并校验，保留原OFL，衍生族名独立。新的目录、字体文件、轮廓、文字库存与SHA被单独记录；命令拒绝覆盖任何已有字体目录。后续文字扩展需要新目的版本并重新审阅，不能删除旧字体强制刷新。

`build-localized-pattern-charts.mjs` 导入只提供原排版／渲染函数，不执行旧CLI。旧批仍按独立冻结的111个ID重建，保持原365字符库存、旧字体SHA和333张输出，不因catalog增长而刷新旧资产。源包、正式PNG、维护代码及冻结字体保留；验收后SVG staging、字体临时环境和其他重复中间产物由创建者回收。
