# 原创圣诞圆挂饰源包

`generate-original-bauble-sourcepack.mjs` 只生成私有数字源包，不写 `public`、catalog、PDF、字体或审批标记。固定 ID 为 `original-christmas-bauble-ornament`，slug 为 `christmas-bauble-ornament`，版本目录为 `original-bauble-v1`。旧源生成器和旧源包不参与修改。

29 × 29 独立符号格阵以一基坐标表达：黄色顶环外框为列12–18、行3–9；列14–16、行5–7的3 × 3空格为预留穿绳孔，四边各两格宽。圆主体从行10延伸至行27，通过七格与顶环相连。主体中心为列15、行19，曼哈顿距离4–6填白色，距离0–2填Cheddar，其余填红色。主体21 × 25格；105 × 125 mm只是名义5 mm格距的布局占地，不是成品实测尺寸，孔也不能声称具有熨烫后15 mm净宽。

当前 `public/palettes/perler.csv` 严格核色：Red `80-19005` RGB(176,53,60) 共249颗，White `80-19001` RGB(234,239,238) 共60颗，Cheddar `80-19057` RGB(251,177,70) 共53颗，总计362颗。白格必须放白豆，仅点号为空。没有第三方像素、描图、角色原图或生成式图片。

```sh
node scripts/generate-original-bauble-sourcepack.mjs --output "$BAUBLE_PACK"
node scripts/generate-original-bauble-sourcepack.mjs --check-only --output "$BAUBLE_PACK"
```

`BAUBLE_PACK` 指向主库 Git 忽略的 `artifacts/pattern-samples/2026-10-10/original-bauble-v1` 绝对路径。首次生成拒绝已有目录；之后只读检查不写文件。输出含 `manifest.json`、`site-entries.json`、`candidate-assets.json`、`README.md`、580 × 580预览、29 × 29 RGBA PNG、788 × 908符号SVG/PNG、编辑器v1项目及 `qa/sourcepack-checks.json`。五件非PDF资产采用既有图库契约；A4/US Letter PDF路径仍为待独立制作的占位，不能作为文件存在或通过的证据。

固定行hash、材料数和外接边界均被核对。检查四向连接分量1、单珠数字割点0、唯一九格内部空孔及其精确坐标、左右镜像；逐格确认原生PNG、编辑器项目和manifest一致，逐像素确认预览，确认图表PNG对应SVG，并实际调用当前 `parseEditorProject`、`decodeEditorPatternDraft`、serialize/reparse验证。图表显示一基坐标和吊孔范围，PNG是计数图，不是校准原寸模板。脚本数字检查不能代替主代理渲染目检。

穿绳方法参考 [Perler Easter Egg Ornaments](https://perler.com/blogs/projects/easter-egg-ornaments)：完全冷却后通过顶部开口穿带打结。这里只参考方法，不复制厂商图纸。项目网页和PDF需另提供清楚的留孔、成人熨烫、冷却、穿绳和检查步骤，按实际品牌熨烫指导处理；丝带/细绳以冷却后的实际开口自然通过为准，不宣称固定硬件尺寸适配。

数字拓扑不预测实体强度。`requiresBacking:false`仅表达一块数字分量；`physicalAssemblyTested`、`ironingTested`、`hangingTested`、`loadStrengthTested`均为false。熨烫后剩余孔、绳带适配、接头强度、悬挂、承重和日常使用尚未实体检验。

源包保留唯一完整副本供重建和审阅；完成后清理一次性调试副本。禁止重建、覆盖或删改其他源包、旧公共下载和字体。
