# 原创复古菱形杯垫源包

`generate-original-coaster-sourcepack.mjs` 只生成私有数字源包，不写 `public`、catalog、PDF、字体或审批标记。固定 ID 为 `original-retro-diamond-coaster`，slug 为 `retro-diamond-coaster`，版本目录为 `original-coaster-v1`。

独立原创 29 × 29 符号格阵内，23 × 23 主体从零基坐标 `(3,3)` 开始，四角各切掉三格。两格 Cheddar 外框、Midnight 底色及 White 菱形环围绕 Cheddar 中心。三个颜色严格核对当前 `public/palettes/perler.csv`：Cheddar `80-19057` 共217颗，Midnight `80-15201` 共216颗，White `80-19001` 共84颗，总计517颗。没有外部像素、描图、厂商原图或生成式图片。

```sh
node scripts/generate-original-coaster-sourcepack.mjs --output "$COASTER_PACK"
node scripts/generate-original-coaster-sourcepack.mjs --check-only --output "$COASTER_PACK"
```

`COASTER_PACK` 应指向主库 Git 忽略的 `artifacts/pattern-samples/2026-10-10/original-coaster-v1` 绝对路径。首次生成拒绝已有输出目录；之后使用只读检查。输出含 `manifest.json`、`site-entries.json`、`candidate-assets.json`、`README.md`、580 × 580 预览、29 × 29 RGBA PNG、符号SVG/PNG、编辑器v1项目和 `qa/sourcepack-checks.json`。五件非PDF资产与现有图库契约一致。A4/US Letter PDF及其审批由独立步骤负责；这里的pending路径不是存在或通过的证据。

检查固定行hash、用量、边界、四邻接分量1、单珠数字割点0、内部透明孔0及上下左右镜像。原生RGBA、项目和manifest逐字节对应；预览每像素读回匹配；PNG图表对应SVG；使用当前真实 `parseEditorProject`、`decodeEditorPatternDraft` 和 serialize/reparse验证往返。渲染后PNG仍须主代理实际视觉审阅，不能用脚本通过代替辨识与版式检查。

数字拓扑不预测实物强度。旧 `requiresBacking:false` 仅表达单一数字分量，`coasterBackingRequired:true` 另记录杯垫用途需要软木底板。未实物拼制、熨烫、粘接、杯垫使用或耐热验证，不宣称热杯、烫锅、洗碗机或耐用性适用。115 mm只是23格按名义5 mm节距的占地估计，不是成品实测尺寸。PNG网格不是校准原寸模板。

源包是后续重建和审阅依据，保留唯一完整副本；一次性预览副本或调试输出完成后清理。不要重建、覆盖或删改旧源包、公共下载与字体。
