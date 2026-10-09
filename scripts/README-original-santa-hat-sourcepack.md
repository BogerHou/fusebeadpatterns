# 原创 Santa Hat v1 源包

`generate-original-santa-hat-sourcepack.mjs` 仅生成原创圣诞帽的私有源包。
代码中的 29×29 symbol rows 是制作源；不联网、不下载或描摹外部图纸，
不使用生成式图片，不写 `src`、`public`、catalog、builder 或旧源包。
不会调用 PDF 工具、创建 PDF 文件或标记 PDF 已完成。

主任务已接受此逻辑格阵作为 v1 候选；实际 PNG 尚须由主任务审阅，
公开发布与 PDF authoring marker 由主任务处理。

## 格阵和材料

ID `original-santa-hat`，slug `santa-hat`，title `Santa Hat`，kind `original`，
version `Original Santa hat design v1`，source `null`。
原生名称：DE `Weihnachtsmütze`、FR `Bonnet de Noël`、JA `サンタの帽子`。

使用一块 29×29 MIDI 板。主体 26×21，左上角零基偏移 x=1、y=4。
空格 `.` 不放珠。帽子红色，帽檐和右侧绒球白色，浅灰色表现下边缘。

| 符号 | Perler Midi 色号 | CSV 色名 | RGB | Hex | 颗数 |
| --- | --- | --- | --- | --- | --- |
| R | 80-19005 | Red | 176, 53, 60 | #b0353c | 225 |
| W | 80-19001 | White | 234, 239, 238 | #eaefee | 84 |
| S | 80-15181 | Light Grey | 179, 186, 184 | #b3bab8 | 23 |

合计 332 颗、3 色。所有色号、英文制造商色名和 RGB 由现有
`public/palettes/perler.csv` 读取并与 v1 材料断言核对。
CSV 屏幕颜色未经独立实物测色。

格阵 SHA256：
`15fe7fc7878d90a3e8a15b7f37230a4de612975e7f4beffebe4fcfd75b32583c`。
脚本拒绝静默更换 v1 格阵。数字检查得到一个四邻接组件、零单格割点；
`weakBridges=[]`，`requiresBacking=false` 描述数字组件，不能推断实物强度。
未实拼、熨烫、打印或悬挂测试。

## 执行与校验

需要项目运行时中的 Node、Sharp 和 TypeScript。默认输出为当前仓库的
`artifacts/pattern-samples/2026-10-09/original-santa-hat-v1`。
使用隔离 worktree 时须显式指定主库中保留的最终源包目录：

```bash
node scripts/generate-original-santa-hat-sourcepack.mjs --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-09/original-santa-hat-v1
node scripts/generate-original-santa-hat-sourcepack.mjs --check-only --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-09/original-santa-hat-v1
```

生成模式要求目标目录不存在；避免覆盖已保留的源、后续 PDF 或审核记录。
`--check-only` 只读回校验，不更新任何文件或批准字段。
无需额外 Node 测试 wiring；数字和文件一致性校验由此脚本完成，
builder 的变更由负责它的 agent 单独验证。

## 保留产物与 builder 契约

- `manifest.json`：既有原创字段、实际 rows、palette、bounds、components，
  createdAt 为 2026-10-09，并明确 PDF pending。
- `site-entries.json`：单项原创 entry，稳定 slug、原创 version，无 reference。
- `candidate-assets.json`：五项已生成资源与未来标准公开文件名映射；
  PDF 单独列在 pendingFiles，不能视为存在或验收通过。
- `previews/original-santa-hat.png`：580×580，20 px/逻辑格，纯色网格预览。
- `charts/original-santa-hat.svg`、`.png`：788×908，符号、行列编号及材料表。
- `pixels/original-santa-hat.png`：29×29，RGBA；空格四个字节均为零。
- `projects/original-santa-hat.bead-pattern.json`：现有编辑器 v1 格式，
  `sourceMode: blank`、`imageSrc: null`、默认 `perler`，1×1 MIDI 板。
- `qa/sourcepack-checks.json`：唯一数字验收报告，包含源格阵、RGBA 和资源哈希。
- `README.md`：源包的制作方法与未完成的后续步骤。

校验逐像素核对 native PNG、项目 RGBA、manifest；逐格核对预览；
核对符号 SVG 与 chart PNG，并调用仓库真实编辑器 parser/serializer 往返。
该结果只验证上述数字产物。

builder 后续默认读取本包的 `reference-pattern-library.pdf`（A4）和
`reference-pattern-library-us-letter.pdf`（US Letter），按 manifest 页面顺序
提取标题 `Santa Hat`、含 `332 beads` 的单页。两份 PDF 均由主任务之后制作，
并独立核验 PrintScaling None、5mm 格距、50mm 校准线、颜色/符号及字体。
此脚本不创建 `pdfs` 目录，也不检查或伪造这些尚不存在的文件。
现有 11 个旧包只由主任务的 builder 在主库只读访问，本脚本不读取或复制它们。
