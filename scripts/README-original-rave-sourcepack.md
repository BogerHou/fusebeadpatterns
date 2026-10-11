# 原创 Rave 图纸源包

`generate-original-rave-sourcepack.mjs` 只制作三款私有数字源图，不写主库、public、catalog、PDF、字体或审批状态。

- `original-rave-alien-head`／`alien-head`：Alien Head，独立外星人轮廓及长黑眼。
- `original-rave-rainbow-smiley`／`rainbow-smiley`：Rainbow Smiley，六条彩色色带和黑色表情。
- `original-rave-moon-mushroom`／`crescent-moon-mushroom`：Crescent Moon Mushroom，独立月牙与蘑菇相接的构图。

社群只提供题材需求证据，没有使用社群作品像素、作者图纸、描图、艺人标记、具名角色或生成式图片。29 × 29 表示 Midi 板尺寸；每图不超过7种实际 Perler CSV 色号。空格全为 RGBA(0,0,0,0)，有珠格的 RGB 与当前 CSV 一致，alpha255。

```sh
node scripts/generate-original-rave-sourcepack.mjs --output "$RAVE_SOURCE_PACK"
node scripts/generate-original-rave-sourcepack.mjs --check-only --output "$RAVE_SOURCE_PACK"
node --test scripts/generate-original-rave-sourcepack.test.mjs
```

`RAVE_SOURCE_PACK` 必须指向 Git 忽略的 `artifacts/pattern-samples/2026-10-11/original-rave-v1` 绝对路径。首次生成拒绝已有目录，所有文件用 `wx` 独占写入；随后只读检查，文件内容及 mtime 不变。路径、包内符号链接、额外文件／目录与不受 Git 忽略的输出均拒绝。

三图共用 manifest、site-entries、candidate-assets、README 和数字 QA 回执；每图另有29 × 29像素PNG、580 × 580预览、788 × 1040计数图SVG／PNG及真实编辑器项目。SVG最后一组为独立说明 footer，前面的图格、编号和符号可供后续本语页脚复用。PDF路径只是待制作映射，不证明文件存在或打印比例。

检查逐像素对照源行和预览、SVG／PNG及项目，并调用项目当前真实 `parseEditorProject`、decode、serialize／reparse。记录实际珠数、每色材料数、边界、四邻接分量和单珠割点。数字连通或名义5 mm占地不能证明实体强度、冷却成品尺寸或佩戴适配；拼制、熨烫、悬挂、承重仍未验证。

主代理独立目检并冻结来源hash。唯一正式源包生成后不覆写，不添加批准状态；测试自行清理自己的临时仓库及样本。
