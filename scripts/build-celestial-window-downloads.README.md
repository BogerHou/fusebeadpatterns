# Celestial Stained Glass Window 数字下载构建器

此独立适配器仅服务 `original-celestial-stained-glass-window`，详情 slug 为 `celestial-stained-glass-window`。四语标题固定为 Celestial Stained Glass Window、Glasfenster mit Mond und Sternen、Vitrail lune et étoiles、月と星のステンドグラス窓。

源包为主项目 Git 忽略目录中的 `artifacts/pattern-samples/2026-10-16/original-celestial-window-v1`。输出必须是该包内全新的 `generated-celestial-downloads`，不得写 public/src、符号链接或既有目录。所有资源以排他模式写入；任何失败都不会覆盖已有下载，失败暂存目录由本任务核查后清理。

脚本以 SHA-256 `a3d52c7793d0d260e53dae5d86e8800fe6d78a596628584195e2f91d9f9cc8b5` 锁住现有 `build-multiboard-pattern-downloads.py`。它只在独立模块命名空间复用已验证的版式与逐格验证函数，并设置本图的身份/字体；不运行旧脚本 main、不调用旧字体下载函数、不改写旧脚本、旧字体或旧图资源。原依赖字节变化会直接失败，必须先独立审查此适配器。

## 只读预审

使用已安装 Pillow、ReportLab、pypdf、pdfplumber 的 Python。字体制作还需要既有隔离环境中的 `fonttools==4.60.1`；普通源图检查及下载构建不需要 fontTools。所有模式均不联网、不安装依赖，且关闭 Python bytecode 写入。

```sh
python3 -B scripts/build-celestial-window-downloads.py --font-audit
python3 -B scripts/build-celestial-window-downloads.py --pack "$CELESTIAL_PACK" --font-audit
python3 -B scripts/build-celestial-window-downloads.py --pack "$CELESTIAL_PACK" --check-only
```

第一个命令审计冻结标题、真实四语打印说明、Perler 商品名和可打印 ASCII。第二个在源包到位后改审全部实际 PDF/图表文字，不生成图表或 PDF。两者逐份检查既有 TTF 的 cmap，报告单一字库覆盖与既有字库合并后仍缺的字符；不拿“有日文字体”代替真实覆盖检查。

2026-10-16 的准备审计读取 22 份既有 TTF，合并后仍缺冻结日语标题中的“星”，没有一份字库覆盖全部预审文字。预审为 248 字，字符集 SHA-256 为 `9b7defd315c3a1207f86a369a278e24091fd3c03a769954aa999ee12cb69cb5a`。这是文字覆盖预审，不是成品数量或源图审核。源包完成后仍需执行实际文字审计。

该源包冻结后，实际 PDF/图表文本为 223 字，字符集 SHA-256 为 `7b9db75deb7935cdc4fd110b39e46628e3632cc5de2b5155c917a272acc4e09e`。已离线准备的 64,800 字节新字体完整覆盖这些实际字符，TTF SHA-256 为 `e5599067d7424327a9c225cf5e18e2b3af65d5b4796000b6cd65fbd914f919b3`，glyph JSON SHA-256 为 `c23d9f9e65f40037d1b1dc65dd7f61bee2962c7345773df0d7ff1f3a3af8ea6e`。19 份既有 scripts 字体的原锁哈希仍全部一致。源图预审读得 2234 颗、8 色，四板为 493/493/624/624；这些是实际文件检查结果，不能替代 root 的独立图样审阅锁。

没有 `--output` 的 `--check-only` 校验源包、字体覆盖和全部 40 页文字宽度，仅报告只读预审结果；没有独立锁时明确标记未完成独立审阅。该模式不创建目录、报告、字体、PDF、SVG、PNG 或缓存。

## 仅在确有缺字时制作独立字体

本图使用新的 `scripts/fonts/celestial-window-labels`，字体内部家族/名称均为 Fuse Bead Celestial Window Labels，避免替换旧家族或使用原保留字体名。只读现有固定完整上游 TTF/OFL；禁止重新下载。输入须吻合既有来源锁：

- Google Fonts 固定 revision：`66a36c8c94b1a5d992ee4e7f392fccfe4945767c`
- 完整 TTF SHA-256：`c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f`
- OFL SHA-256：`1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9`

```sh
python3 -B scripts/build-celestial-window-downloads.py --prepare-font \
  --source-font "$CELESTIAL_OFFLINE_FONT" \
  --source-license "$CELESTIAL_OFFLINE_OFL"
```

此命令只创建不存在的新字体目录，写入静态 400 字重 TTF、真实 glyph 轮廓 JSON、原 OFL 和来源锁，不制作 PDF。可加 `--pack` 以实际文本为字符集；不加时使用上述预审字符集。旧字库、原完整字体和其隔离环境始终只读，不移动、不修改。普通生成/检查时逐一核实新字体、glyph、OFL 的锁定哈希与实际所需字符，不允许系统字体后备。

## 独立审阅锁和 PDF 标记

`--review-lock` 是 root 独立目检后提供的 JSON，唯一键为 `original-celestial-stained-glass-window`，其对象包含真实 `rowsSha256` 和 `rgbaSha256`。它与源包自报哈希分开；脚本不会代为批准、创建或更新审阅锁。

在首次实际制作 PDF 的命令紧前，root 必须已读 PDF skill，并成功且仅一次执行规定 marker，`operation-kind=create`、`expected-output-count=8`、`output-format=pdf`。8 是输出文件数，页面总数为 40。子代理不能重复标记或在 root 标记前制作 PDF。

```sh
# 仅在 root 完成 marker、独立图样目检和锁之后执行：
python3 -B scripts/build-celestial-window-downloads.py \
  --pack "$CELESTIAL_PACK" \
  --review-lock "$CELESTIAL_REVIEW_LOCK" \
  --output "$CELESTIAL_PACK/generated-celestial-downloads" \
  --pdf-marker-confirmed

# 后续真实只读复核；不再执行 marker：
python3 -B scripts/build-celestial-window-downloads.py \
  --pack "$CELESTIAL_PACK" \
  --review-lock "$CELESTIAL_REVIEW_LOCK" \
  --output "$CELESTIAL_PACK/generated-celestial-downloads" \
  --check-only
```

可用 `--node` 指定能读取工作树 Sharp 的现有 Node。该命令仅本地将内存 SVG 栅格化，不创建下载、调用远程服务或消耗 Vercel 图片转换。

## 输出和验证合同

四语分别输出 A4 和 US Letter，共 8 份 PDF，每份固定 5 页：缩小总览及总材料表，加左上、右上、左下、右下四块 29×29 板。每板为 145×145 mm、5 mm 格距，横竖标尺各 50 mm。总览明确不可作原寸铺珠模板；产品色名保留原厂英文，四语标题说明其性质。

四板全局坐标依次为行/列 1-29、行 1-29/列 30-58、行 30-58/列 1-29、行/列 30-58。验证器独立解析打印结果，覆盖全部 3364 格，不重复、不漏格，并将透明空格、有珠 RGB、符号重组为原 58×58 RGBA，核实 29/30 的边界；不能用绘制时的切片函数自证正确。

每页还检查纸型、Lang、嵌入字体与 ToUnicode、文字边界、材料数、全局坐标和本语详情链接。另输出四语 SVG/PNG 计数图，共 8 个非 PDF 图文件；字体轮廓内嵌，无系统字体、外链或新图片转换。计数图不是原寸模板。`grid-assets.json` 和 `download-checks.json` 记录实际尺寸、源/输出哈希与逐项数字结果。每次 `--check-only` 比较完整 SVG/PNG 字节、报告字节及完整预期文件集合，缺一份或多出文件均失败。

数字检查通过后，root 仍须用 Poppler 渲染全部 40 页并目检版面和四语字形，检查 4 张计数图，完成真实下载和编辑器 2×2 回载后再提升资产。实体拼装、熨烫、接缝强度、悬挂和承重均未测试；数字连通不等于实物可靠性。

清理仅限本任务确认无用的临时渲染和失败暂存；保留唯一源包、最终下载、独立审阅锁、新字体及必要验收记录。不清理 Trash 中既有固定源/隔离环境，不改其他 agent 产物。
