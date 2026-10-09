# Mini Ghost 数字源包

`generate-mini-ghost-sourcepack.mjs` 从已发布的 Original Friendly Ghost 派生可编辑的 Perler Mini 项目。源 PNG 文件、源项目文件和解码后的 29 × 29 RGBA 格阵各有独立 SHA-256 锁；脚本先核验原文件再生成，不能从生成结果反推原图身份。

原图 311 颗、两色，White 293 颗（RGB 234, 239, 238），Black 18 颗（RGB 50, 50, 52）。全部原始 RGBA 格子置于 57 × 57 Mini 板，四边各添加 14 个透明空格，不缩放、不换色。阅读图的第 1 行、第 1 列对应 Mini 板的第 15 行、第 15 列。原占用边界为零基 `(5,4), 19 × 21`，项目边界为零基 `(19,18), 19 × 21`。

项目采用 `selectedPaletteIds: ['perler_mini']`、`boardId: 'mini'`、一块 57 × 57 板、`sourceMode: 'blank'` 和 `imageSrc: null`，保存完整编辑格阵。调色板仅 White / Black，图表内部引用为 `PM-WHITE` / `PM-BLACK`，符号为 W / B。这些引用不是厂商采购 SKU；Mini 采购 SKU 未确认。屏幕 RGB 沿用原图，不代表实物颜色测量。

打印默认采用 `fit-page`。PNG 网格是 29 × 29 行列计数参考，明确区分空位和白珠，没有原寸、排针适配、实物拼装或熨烫验收声明。本脚本不生成 PDF。

在 Mini worktree 根目录运行：

```sh
node --test scripts/generate-mini-ghost-sourcepack.test.mjs

node scripts/generate-mini-ghost-sourcepack.mjs \
  --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-09/mini-ghost-v1

node scripts/generate-mini-ghost-sourcepack.mjs --check-only \
  --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-09/mini-ghost-v1
```

私有包默认在调用脚本所在仓库的 `artifacts/pattern-samples/2026-10-09/mini-ghost-v1`；上面的显式参数将唯一保留包放在主库的 Git 忽略目录。新的公开目录默认在该 worktree 的 `public/guides/mini-perler-beads/ghost-mini`。可用 `--public-output` 指定同名排他目录进行临时测试。两目录不得互相包含，且任一目录已存在都会拒绝生成；后续复查须用 `--check-only`，该模式只读取文件。脚本不会覆盖旧 public、旧源包或其他任务的文件。

| 公开文件 | 私有包对应文件 | 尺寸 / 内容 |
| --- | --- | --- |
| `preview.png` | `previews/ghost-mini.png` | 580 × 580，保留原 29 × 29 外框，每格整倍数 20 像素 |
| `grid.png` | `charts/ghost-mini.png` | 788 × 930，29 × 29 阅读格、1–29 行列、W/B 和用量 |
| `pixels.png` | `pixels/ghost-mini.png` | 57 × 57 精确 RGBA，可与编辑项目逐字节对照 |
| `pattern.bead-pattern.json` | `projects/ghost-mini.bead-pattern.json` | 完整 Mini 空白模式项目，内含 57 × 57 格阵 |

包内 `data/original-ghost.png` 和 `data/original-ghost.bead-pattern.json` 是受锁保护的旧原始文件；`charts/ghost-mini.svg` 是私有网格源，栅格化文字依赖本机 Arial/sans-serif 字体。保存的 PNG 是发布源，复查会验证它与当前 SVG 渲染一致。`manifest.json` 记录格阵和材料约束，`qa/sourcepack-checks.json` 保存真实 `parseEditorProject`、57 × 57 解码、PNG 读回、透明边缘、计数、坐标和各输出哈希的检查结果。该数字阶段的 `pdfAuthored: false` 描述本脚本职责；root 后续 PDF 文件及验收回执单独保留，不改写数字阶段记录。

Node 测试覆盖独立源身份锁、全格阵填充、真实编辑器解析和往返、Mini 选板/调色板/默认打印模式、311 个图表符号、覆盖拒绝、只读 CLI、公开资源和 QA 篡改检测。测试仅在自身 `mini-ghost-sourcepack-test-*` 临时目录生成并在 `finally` 清理。
