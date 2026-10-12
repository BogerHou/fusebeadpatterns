# Hama Creeper 下载构建

本脚本只新增 `minecraft-creeper-face-v1-hama` 品牌变体，复用已发布非官方 Minecraft fan art 的 29 × 29 原图格、透明区域和 16 × 16 脸部位置。它不修改 Perler 下载、旧六款 Hama 资源、catalog、Hama 清单或任何字体。源项目、PNG、RGBA、alpha、重配色 RGBA 与所复用字体均有固定独立审核哈希，CSV必须匹配既定真实值。

材料固定为 H10 Green 136颗（CSV符号 `-`）、H18 Black 80颗（`4`）、H47 Pastel Green 40颗（`R`）。打印材料表显示制造商色号10、18、47；项目保存实际CSV引用H10、H18、H47。RGB为屏幕近似值，尚未实体拼装或熨烫。字符归属及发布授权未确认的原始状态保留，不称为原创角色或官方 Hama／Minecraft 图纸。

先检查字体覆盖，再创建无PDF包。需要 Python 的 Pillow、ReportLab、pypdf、pdfplumber 和固定 fontTools 4.60.1，以及已安装的仓库 Node／TypeScript／Sharp 依赖。可使用现有 bundled runtime 或隔离的 Python 环境；fontTools 仅提取轮廓，任何字体文件都不重建。`--node` 可指定 Node 可执行文件。

```bash
# 从仓库根目录执行；artifacts/ 必须保持 Git 忽略。
HAMA_CREEPER_STAGE="$(pwd)/artifacts/hama-creeper-review/generated-hama-creeper-downloads"
python3 -B scripts/build-hama-creeper-downloads.py --font-inventory
python3 -B scripts/build-hama-creeper-downloads.py --prepare --stage "$HAMA_CREEPER_STAGE"
python3 -B scripts/build-hama-creeper-downloads.py --check-only --stage "$HAMA_CREEPER_STAGE"
```

`--prepare` 拒绝已存在输出并以`xb`首写，仅创建3份公共源资产、四语言SVG/PNG和3份私有验收JSON，不创建PDF。SVG内部用defs/use复用已核字体轮廓，无外部字体，并在内存与完整内联轮廓PNG逐字节比较。实际编辑器必须接受项目且解码、序列化回读一致。项目schema没有`originalPattern`，不添加虚构字段；blank模式、Hama色板和真实editedPattern构成恢复源。

PDF是另一明确步骤：在审查色号、字体和实际预览后，须按适用的PDF技能规则紧邻首次制作命令执行marker（8份pdf），随后才能使用`--author --stage "$HAMA_CREEPER_STAGE"`。2026-10-12已完成本批marker、八份PDF制作与渲染验收；重新生成应使用全新暂存目录。该模式只在吻合的无PDF包中创建8份单页A4／US Letter文件，不重写准备资产；每页完整29格、5mm间距、145mm边长和两条50mm尺，链接到相应语言现有详情页`#hama-midi`。现有字体缺字时直接失败，不能覆盖刷新旧字体。

`--check-only` 真正只读：无PDF包核对11资产；一旦存在任何PDF就要求完整8份PDF、真实格色/符号、原生语言/字体、材料数量、两条尺、详情链接和全部哈希。它不重写字体、图格、PNG、项目或报告。数字验收不替代八页实际渲染目检、打印校准、实体拼装与熨烫检查。计数PNG不作为实际尺寸放置模板。

最终发布目录为 `public/patterns-hama-characters/minecraft-creeper-face-v1/`，共19份资源。只复制经过核验的该新增目录，三个暂存报告与渲染中间文件不进入 public。保留旧资源，不能用此构建器重写原 Perler 下载或六款原创 Hama 资源。
