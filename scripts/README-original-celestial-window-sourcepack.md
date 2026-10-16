# 原创 Celestial Stained Glass Window 私有源包

这是从空白 58×58 网格独立绘制的四板图案生成器，不读取旧图案或外部图片。深色拱形窗框、金色内缘、连续浅金月牙、三颗星、冷色几何玻璃、下部菱形及双植物均在原生坐标绘制；不是旧风景换色，也不是29×29图案放大。主题是原创展示供给选择，无该题材搜索量声明。

固定身份：`original-celestial-stained-glass-window` / `celestial-stained-glass-window`。占用范围为零起点 x5..52、y3..54，48×52；画布58×58，2×2排列的四块29×29 Midi板。共2234颗、8种项目现有Perler色，四板分别493 / 493 / 624 / 624颗。所有ref/name/RGB逐项核对 `public/palettes/perler.csv`。显示RGB为已有数据，不代表另做实体色测量。

仅在主项目这个私有、Git忽略的位置生成一次：

```sh
node scripts/generate-original-celestial-window-sourcepack.mjs --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-16/original-celestial-window-v1
```

之后只做只读检查：

```sh
node scripts/generate-original-celestial-window-sourcepack.mjs --output /Users/simon/Documents/code/fusebeadpatterns/artifacts/pattern-samples/2026-10-16/original-celestial-window-v1 --check-only
node --test scripts/generate-original-celestial-window-sourcepack.test.mjs
```

安全检查沿用既有源包约定：必须是固定日期/版本的 `artifacts/pattern-samples` 后缀，所属Git仓库必须忽略它，拒绝 `public`、符号链接、额外文件和覆盖已有包。测试只在各自创建并删除的独立临时Git仓库中使用同一固定后缀。正式源包文件权限0600，目录0700。所有字节先在内存准备，文件以 `wx` 创建；脚本不写public、catalog、app、locale、字体或PDF。

源包保留 manifest 完整逐格rows、真实Perler材料与计数、四板材料与RGBA哈希、58×58 RGBA PNG、580×580预览、1460×1720编号符号图SVG/PNG、可编辑工程、四张29×29板PNG和最小数字QA。真实编辑器parse/decode/serialize/reparse、所有预览像素、透明像素全零、图格PNG与SVG、四板逐格重组及每色合计都必须一致。缝位是第29与30列/行之间，两侧格各计一次，不复制接缝格。

后续独立下载builder可以建立 `generated-celestial-downloads/` 隔离目录。源包检查跳过其内容，不将PDF/翻译算作源包审核，只拒绝其中的符号链接。其他额外目录/文件仍拒绝。PDF路径与交付notes是待制作映射，不能当已生成或已验证下载。

根代理目检后独立核哈希；此脚本不自设批准锁、不声称视觉或发布验收。当前仅有数字连通性（单分量、无单格割点），没有实物拼装、熨烫、接缝强度、悬挂或安装验收。标称占用格范围240×260mm、完整画布290×290mm仅是5mm格距计算，并非冷却成品测量。不承诺年龄适用、工时或耐久性，不将四板打印等同分板熨烫指令。

最终唯一源包需保留；一次性候选预览和测试临时目录由执行agent清理。新增图片均为静态生成，不引入Vercel图片转换。
