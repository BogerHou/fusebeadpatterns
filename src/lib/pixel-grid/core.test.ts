import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { inflateSync, crc32 } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { createGrid, setPixel, paintLine, resizeNearest, resizeImage, GridHistory, gridsEqual, serializeProject, parseProject, inspectImage, encodePng, LIMITS } from './core';
import type { PixelGrid, RgbaPixels, ResizeMode } from './core';
import { PixelGridError, type PixelGridErrorCode } from './errors';
// Independent Node inflater/CRC checks validate our browser-only PNG encoder.
function decodeOwnPng(bytes: Uint8Array) {
    assert.deepEqual(Array.from(bytes.subarray(0,8)),[137,80,78,71,13,10,26,10]);
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),chunks: Uint8Array[]=[];let width=0,height=0;
    for(let at=8;at<bytes.length;){const n=view.getUint32(at),type=Buffer.from(bytes.subarray(at+4,at+8)).toString();assert.equal(view.getUint32(at+n+8),crc32(bytes.subarray(at+4,at+n+8)));if(type==='IHDR'){width=view.getUint32(at+8);height=view.getUint32(at+12);assert.equal(bytes[at+16],8);assert.equal(bytes[at+17],6);}if(type==='IDAT')chunks.push(bytes.subarray(at+8,at+n+8));at+=n+12;}
    const inflated=inflateSync(Buffer.concat(chunks)),pixels: number[]=[];
    assert.equal(inflated.length,(width*4+1)*height);
    for(let y=0;y<height;y++){const at=y*(width*4+1);assert.equal(inflated[at],0);pixels.push(...inflated.subarray(at+1,at+1+width*4));}
    return {width,height,pixels};
}

test('16×16, 32×32 and rectangular 24×40 survive project and PNG round trips with exact RGBA',async()=>{
    for(const [w,h] of [[16,16],[32,32],[24,40]]){
        const grid=createGrid(w,h);setPixel(grid,0,0,[19,73,147,255]);setPixel(grid,1,0,[12,34,56,128]);setPixel(grid,2,0,[201,63,7,1]);setPixel(grid,w-1,h-1,[81,42,13,0]);
        const restored=parseProject(serializeProject(grid));assert.deepEqual(restored,grid);
        const encoded=await encodePng(restored),decoded=decodeOwnPng(encoded);
        assert.equal(decoded.width,w);assert.equal(decoded.height,h);assert.deepEqual(decoded.pixels,Array.from(grid.pixels));
        assert.deepEqual(inspectImage(encoded,'image/png'),{mime:'image/png',width:w,height:h});
    }
});
test('nearest-neighbor sampling keeps arbitrary colors and alpha without palette conversion',()=>{
    const source=createGrid(2,2,[13,29,47,255,88,77,66,128,99,100,101,0,5,8,11,32]);
    const result=resizeNearest(source,4,6);
    const cell=(x: number,y: number)=>Array.from(result.pixels.slice((y*4+x)*4,(y*4+x)*4+4));
    assert.deepEqual(cell(0,0),[13,29,47,255]);assert.deepEqual(cell(3,0),[88,77,66,128]);assert.deepEqual(cell(0,5),[99,100,101,0]);assert.deepEqual(cell(3,5),[5,8,11,32]);
    assert.deepEqual(Array.from(source.pixels),[13,29,47,255,88,77,66,128,99,100,101,0,5,8,11,32]);
});
test('drawing fills gaps in a stroke and erasing clears RGBA, including alpha',()=>{
    const grid=createGrid(16,16);paintLine(grid,[1,2],[6,2],[9,10,11,120]);
    for(let x=1;x<=6;x++)assert.deepEqual(Array.from(grid.pixels.slice((2*16+x)*4,(2*16+x)*4+4)),[9,10,11,120]);
    setPixel(grid,3,2,[0,0,0,0]);assert.equal(grid.pixels[(2*16+3)*4+3],0);assert.equal(setPixel(grid,16,0,[0,0,0,0]),false);
});
test('invalid canvas sizes and malformed RGBA are rejected before allocating a grid',()=>{
    for(const [w,h] of [[0,16],[-1,16],[16.5,16],[129,1],[1,129],['16',16],[Infinity,1]])assert.throws(()=>createGrid(w as number,h as number));
    for(const data of [[0,0,0],[-1,0,0,0],[0,0,0,256],[0,0,0,NaN],[0,0,0,0.5]])assert.throws(()=>createGrid(1,1,data as RgbaPixels));
});
test('project import rejects wrong formats, versions, unknown fields, malformed data and oversized files',()=>{
    const good=JSON.parse(serializeProject(createGrid(1,1)));
    const missing={...good};delete missing.pixels;assert.throws(()=>parseProject(JSON.stringify(missing)),/missing required/);
    for(const data of [null,[],{...good,format:'bead-pattern'},{...good,version:2},{...good,width:128,pixels:[0,0,0,0]},{...good,pixels:[0,0,'1',0]},{...good,url:'https://example.com/image.png'}])assert.throws(()=>parseProject(JSON.stringify(data)));
    assert.throws(()=>parseProject('{'),/valid JSON/);assert.throws(()=>parseProject(' '.repeat(LIMITS.maxProjectBytes+1)),/512/);
});
test('image import rejects excessive dimensions/bytes, unsupported types and mismatched MIME',async()=>{
    const png=await encodePng(createGrid(1,1));
    assert.throws(()=>inspectImage(png,'image/jpeg'),/file type/);
    const huge=png.slice();new DataView(huge.buffer).setUint32(16,2049);assert.throws(()=>inspectImage(huge),/2048/);
    assert.throws(()=>inspectImage(new Uint8Array(LIMITS.maxImageBytes+1)),/8 MiB/);
    assert.throws(()=>inspectImage(new TextEncoder().encode('<svg/>')),/Supported image/);
    const bad=png.slice();new DataView(bad.buffer).setUint32(8,9999);assert.throws(()=>inspectImage(bad),/incomplete chunk/);
});
test('static JPEG/WebP headers expose dimensions; animation flags are refused before decode',()=>{
    const jpeg=Uint8Array.from([255,216,255,192,0,17,8,0,24,0,40,3,1,17,0,2,17,0,3,17,0,255,217]);
    assert.deepEqual(inspectImage(jpeg,'image/jpeg'),{mime:'image/jpeg',width:40,height:24});
    const webp=new Uint8Array(30),view=new DataView(webp.buffer);webp.set(new TextEncoder().encode('RIFF'),0);view.setUint32(4,22,true);webp.set(new TextEncoder().encode('WEBPVP8X'),8);view.setUint32(16,10,true);webp[24]=23;webp[27]=39;
    assert.deepEqual(inspectImage(webp,'image/webp'),{mime:'image/webp',width:24,height:40});
    const lossless=new Uint8Array(26),lv=new DataView(lossless.buffer);lossless.set(new TextEncoder().encode('RIFF'),0);lv.setUint32(4,18,true);lossless.set(new TextEncoder().encode('WEBPVP8L'),8);lv.setUint32(16,5,true);lossless[20]=47;assert.deepEqual(inspectImage(lossless,'image/webp'),{mime:'image/webp',width:1,height:1});webp[20]=2;assert.throws(()=>inspectImage(webp),/Animated/);
});
test('animated PNG is refused even when its dimensions are within limits',async()=>{
    const png=await encodePng(createGrid(1,1)),chunk=new Uint8Array(20);new DataView(chunk.buffer).setUint32(0,8);chunk.set(new TextEncoder().encode('acTL'),4);
    const animated=new Uint8Array(png.length+20);animated.set(png.subarray(0,33));animated.set(chunk,33);animated.set(png.subarray(33),53);assert.throws(()=>inspectImage(animated),/Animated PNG/);
});

test('64×32 → 32×32 fit, center crop and stretch produce distinct, exact sampling and alpha',()=>{
    const source=createGrid(64,32);
    for(let y=0;y<32;y++)for(let x=0;x<64;x++)setPixel(source,x,y,[x,y,127,x===0?0:128]);
    const before=serializeProject(source),fit=resizeImage(source,32,32),crop=resizeImage(source,32,32,'crop'),stretch=resizeImage(source,32,32,'stretch');
    const pixel=(g: PixelGrid,x: number,y: number)=>Array.from(g.pixels.slice((y*g.width+x)*4,(y*g.width+x)*4+4));
    for(let y=0;y<32;y++)assert.equal(fit.pixels[(y*32+10)*4+3],y<8||y>=24?0:128);
    assert.deepEqual(pixel(fit,0,8),[1,1,127,128]);assert.deepEqual(pixel(fit,31,23),[63,31,127,128]);
    assert.deepEqual(pixel(crop,0,0),[16,0,127,128]);assert.deepEqual(pixel(crop,31,31),[47,31,127,128]);
    assert.deepEqual(pixel(stretch,0,0),[1,0,127,128]);assert.deepEqual(pixel(stretch,31,31),[63,31,127,128]);
    assert.equal(serializeProject(source),before);
    assert.throws(()=>resizeImage(source,32,32,'unknown' as ResizeMode),/Choose/);
    const thin=resizeImage(createGrid(1,128),128,1,'fit');assert.equal(thin.pixels.length,512);
});

test('whole-operation history restores dimensions and hidden RGBA, isolates snapshots and invalidates redo',()=>{
    const history=new GridHistory(3),original=createGrid(16,32);
    setPixel(original,0,0,[201,63,7,1]);setPixel(original,15,31,[81,42,13,0]);
    const originalText=serializeProject(original),resized=resizeImage(original,32,16,'stretch');
    assert.equal(history.push(original,resized),true);original.pixels.fill(255);
    const undo=history.undo(resized);assert.ok(undo);assert.equal(serializeProject(undo),originalText);
    const redo=history.redo(undo);assert.ok(redo);assert.ok(gridsEqual(redo,resized));
    const previous=history.undo(redo);assert.ok(previous);const edited=createGrid(previous.width,previous.height,previous.pixels);setPixel(edited,1,1,[4,5,6,7]);
    history.push(previous,edited);assert.equal(history.canRedo,false);
    assert.equal(history.push(edited,createGrid(edited.width,edited.height,edited.pixels)),false);
});

test('undo and redo share the history limit even across repeated size changes',()=>{
    const history=new GridHistory(3);let current=createGrid(1,1);
    for(let side=2;side<=6;side++){const next=createGrid(side,side);history.push(current,next);current=next;assert.ok(history.retainedSteps<=3);}
    for(const side of [5,4,3]){current=history.undo(current)!;assert.equal(current.width,side);assert.equal(history.retainedSteps,3);}
    assert.equal(history.undo(current),null);
    for(const side of [4,5,6]){current=history.redo(current)!;assert.equal(current.width,side);assert.equal(history.retainedSteps,3);}
});

test('the original version-1 fixture remains byte-compatible and PNG export retains every RGBA channel',async()=>{
    const project=readFileSync(new URL('./fixtures/rgba-16x16.pixel-grid.json',import.meta.url),'utf8');
    const grid=parseProject(project),again=parseProject(serializeProject(grid));assert.ok(gridsEqual(grid,again));
    const decoded=decodeOwnPng(await encodePng(again));assert.deepEqual(decoded.pixels,Array.from(grid.pixels));
    assert.deepEqual(Object.keys(JSON.parse(serializeProject(again))),['format','version','width','height','pixels']);
});

test('the asymmetric browser-QA fixture has the documented crop and fit landmarks',()=>{
    const source=decodeOwnPng(readFileSync(new URL('./fixtures/aspect-64x32.png',import.meta.url)));
    assert.equal(source.width,64);assert.equal(source.height,32);
    const fit=resizeImage(source,32,32,'fit'),crop=resizeImage(source,32,32,'crop');
    const pixel=(g: PixelGrid,x: number,y: number)=>Array.from(g.pixels.slice((y*g.width+x)*4,(y*g.width+x)*4+4));
    assert.deepEqual(pixel(fit,0,0),[0,0,0,0]);assert.deepEqual(pixel(fit,0,8),[204,45,66,255]);
    assert.deepEqual(pixel(crop,0,0),[240,242,235,255]);assert.deepEqual(pixel(crop,16,16),[63,155,102,255]);
});

test('non-preset and extreme dimensions preserve every channel through JSON and PNG', async () => {
    for (const [width, height] of [[1, 1], [1, 128], [128, 1], [17, 31], [127, 113], [128, 128]]) {
        const grid = createGrid(width, height);
        for (let index = 0; index < width * height; index++) {
            grid.pixels.set([index % 256, (index * 17) % 256, (index * 53) % 256,
                [0, 1, 128, 255][index % 4]], index * 4);
        }
        const restored = parseProject(serializeProject(grid));
        const decoded = decodeOwnPng(await encodePng(restored));
        assert.equal(decoded.width, width);
        assert.equal(decoded.height, height);
        assert.deepEqual(decoded.pixels, Array.from(grid.pixels));
        assert.ok(gridsEqual(grid, restored));
    }
});

test('default history retains exactly 50 whole operations through undo and redo', () => {
    const history = new GridHistory();
    let current = createGrid(17, 31);
    for (let value = 1; value <= 55; value++) {
        const next = createGrid(current.width, current.height, current.pixels);
        setPixel(next, 16, 30, [value, 70, 90, 1]);
        history.push(current, next);
        current = next;
    }
    assert.equal(history.retainedSteps, 50);
    for (let value = 54; value >= 5; value--) {
        current = history.undo(current)!;
        assert.equal(current.pixels[(30 * 17 + 16) * 4], value);
        assert.equal(history.retainedSteps, 50);
    }
    assert.equal(history.undo(current), null);
    for (let value = 6; value <= 55; value++) {
        current = history.redo(current)!;
        assert.equal(current.pixels[(30 * 17 + 16) * 4], value);
    }
    assert.equal(history.redo(current), null);
});

test('a 1×128 to 17×31 resize is one reversible operation including transparent RGB', () => {
    const before = createGrid(1, 128);
    setPixel(before, 0, 127, [219, 37, 83, 0]);
    setPixel(before, 0, 0, [91, 13, 57, 1]);
    const history = new GridHistory();
    const next = resizeImage(before, 17, 31, 'stretch');
    assert.equal(history.push(before, next), true);
    const undone = history.undo(next)!;
    assert.deepEqual(undone, before);
    assert.deepEqual(history.redo(undone), next);
});

test('one stroke is one history operation, and malformed edits leave the model intact', () => {
    const grid = createGrid(17, 31);
    const before = createGrid(grid.width, grid.height, grid.pixels);
    paintLine(grid, [0, 0], [16, 30], [34, 67, 91, 128]);
    const history = new GridHistory();
    history.push(before, grid);
    assert.equal(history.retainedSteps, 1);
    assert.deepEqual(history.undo(grid), before);
    const text = serializeProject(grid);
    assert.throws(() => setPixel(grid, 0, 0, [1, 2, 3, 300]), /RGBA/);
    assert.throws(() => paintLine(grid, [0, 0], [NaN, 1], [1, 2, 3, 4]), /whole numbers/);
    assert.throws(() => resizeImage(grid, 129, 1), /1 to 128/);
    assert.throws(() => resizeImage({ width: 2049, height: 1, pixels: [] }, 1, 1), /source-image/);
    assert.equal(serializeProject(grid), text);
});

test('pixel projects reject the real bead project and bead draft envelopes', () => {
    const beadProject = readFileSync(new URL('../../../public/patterns/original-friendly-ghost/pattern.bead-pattern.json', import.meta.url), 'utf8');
    assert.equal(JSON.parse(beadProject).type, 'bead-pattern-project-v1');
    assert.throws(() => parseProject(beadProject), /Bead projects are not supported/);
    assert.throws(() => parseProject(JSON.stringify({ type: 'bead-pattern-editor-draft-v1', version: 1 })), /Bead projects are not supported/);
    const pixel = JSON.parse(serializeProject(createGrid(1, 1)));
    assert.equal(pixel.format, 'pixel-grid-project');
    assert.deepEqual(Object.keys(pixel), ['format', 'version', 'width', 'height', 'pixels']);
});

test('project limits use encoded bytes and malformed input cannot mutate existing history', () => {
    const grid = createGrid(1, 1, [19, 37, 83, 0]);
    const history = new GridHistory();
    const original = serializeProject(grid);
    const accepted = original + ' '.repeat(LIMITS.maxProjectBytes - new TextEncoder().encode(original).length);
    assert.deepEqual(parseProject(accepted), grid);
    assert.throws(() => parseProject(accepted + ' '), /512 KiB/);
    assert.throws(() => parseProject('é'.repeat(LIMITS.maxProjectBytes / 2 + 1)), /512 KiB/);
    assert.throws(() => parseProject(JSON.stringify({ ...JSON.parse(original), pixels: [0, 0, 0, null] })), /RGBA/);
    assert.equal(serializeProject(grid), original);
    assert.equal(history.canUndo, false);
    assert.equal(history.canRedo, false);
});

test('PNG export capability failure leaves exact RGBA available as a project', async () => {
    const grid = createGrid(1, 1, [219, 37, 83, 0]);
    const original = serializeProject(grid);
    vi.stubGlobal('CompressionStream', undefined);
    try {
        await assert.rejects(encodePng(grid), /Save the project file/);
        assert.equal(serializeProject(grid), original);
        assert.deepEqual(parseProject(original), grid);
    } finally {
        vi.unstubAllGlobals();
    }
});

test('the decoded-source ceiling accepts 2048×2048 without quantizing RGBA', () => {
    const pixels = new Uint8ClampedArray(LIMITS.maxImagePixels * 4);
    const center = (1024 * 2048 + 1024) * 4;
    pixels.set([219, 37, 83, 1], center);
    const source = { width: 2048, height: 2048, pixels };
    assert.deepEqual(Array.from(resizeImage(source, 1, 1, 'stretch').pixels), [219, 37, 83, 1]);
    assert.deepEqual(Array.from(source.pixels.slice(center, center + 4)), [219, 37, 83, 1]);
    assert.throws(() => resizeImage({ ...source, height: 2049 }, 1, 1), /source-image/);
    assert.throws(() => resizeImage({ ...source, pixels: pixels.subarray(4) }, 1, 1), /length/);
});

test('image header limits include the boundary and handle byte-offset views correctly', async () => {
    const png = await encodePng(createGrid(17, 31));
    const padded = new Uint8Array(png.length + 7);
    padded.set(png, 7);
    assert.deepEqual(inspectImage(padded.subarray(7), 'image/png'), { mime: 'image/png', width: 17, height: 31 });
    // These are header-screening fixtures, not a claim that a browser decoded them.
    const jpeg = Uint8Array.from([255, 216, 255, 192, 0, 17, 8, 8, 0, 8, 0, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0, 255, 217]);
    assert.deepEqual(inspectImage(jpeg, 'image/jpg'), { mime: 'image/jpeg', width: 2048, height: 2048 });
    const maxBytes = new Uint8Array(LIMITS.maxImageBytes);
    maxBytes.set(jpeg);
    assert.equal(inspectImage(maxBytes).width, 2048);
    const tall = jpeg.slice();
    tall[8] = 1;
    assert.throws(() => inspectImage(tall), /2048/);
    assert.throws(() => inspectImage(new Uint8Array()), /8 MiB/);
    assert.throws(() => inspectImage(new TextEncoder().encode('GIF89a')), /Supported image/);
});

test('explicit core validation failures carry stable codes for localized UI', async () => {
    const grid = createGrid(1, 1), project = JSON.parse(serializeProject(grid));
    const missing = { ...project }; delete missing.pixels;
    const png = await encodePng(grid), incompletePng = png.slice(), largePng = png.slice();
    new DataView(incompletePng.buffer).setUint32(8, 9999);
    new DataView(largePng.buffer).setUint32(16, 2049);
    const chunk = new Uint8Array(20); new DataView(chunk.buffer).setUint32(0, 8); chunk.set(new TextEncoder().encode('acTL'), 4);
    const animatedPng = new Uint8Array(png.length + 20); animatedPng.set(png.subarray(0, 33)); animatedPng.set(chunk, 33); animatedPng.set(png.subarray(33), 53);
    const webp = new Uint8Array(30), view = new DataView(webp.buffer);
    webp.set(new TextEncoder().encode('RIFF'), 0); webp.set(new TextEncoder().encode('WEBPVP8X'), 8); view.setUint32(16, 10, true);
    const incompleteWebp = webp.slice(); new DataView(incompleteWebp.buffer).setUint32(16, 30, true);
    const animatedWebp = webp.slice(); animatedWebp[20] = 2;
    const failures: [PixelGridErrorCode, () => unknown][] = [
        ['INVALID_DIMENSIONS', () => createGrid(0, 1)],
        ['PIXEL_DATA_LENGTH', () => createGrid(1, 1, [0, 0, 0])],
        ['INVALID_RGBA_CHANNELS', () => createGrid(1, 1, [0, 0, NaN, 0])],
        ['INVALID_PIXEL_POSITION', () => paintLine(grid, [0, 0], [NaN, 1], [0, 0, 0, 0])],
        ['INVALID_RESIZE_MODE', () => resizeImage(grid, 1, 1, 'invalid' as ResizeMode)],
        ['SOURCE_IMAGE_LIMIT', () => resizeImage({ width: 2049, height: 1, pixels: [] }, 1, 1)],
        ['INVALID_HISTORY_LIMIT', () => new GridHistory(0)],
        ['PROJECT_TOO_LARGE', () => parseProject(' '.repeat(LIMITS.maxProjectBytes + 1))],
        ['PROJECT_INVALID_JSON', () => parseProject('{')],
        ['PROJECT_UNSUPPORTED_FORMAT', () => parseProject('{}')],
        ['PROJECT_MISSING_FIELDS', () => parseProject(JSON.stringify(missing))],
        ['PROJECT_UNSUPPORTED_FIELDS', () => parseProject(JSON.stringify({ ...project, extra: true }))],
        ['IMAGE_FILE_SIZE', () => inspectImage(new Uint8Array())],
        ['PNG_INCOMPLETE_CHUNK', () => inspectImage(incompletePng)],
        ['PNG_ANIMATED', () => inspectImage(animatedPng)],
        ['JPEG_INVALID_MARKER', () => inspectImage(Uint8Array.from([255, 216, 0, 0, 0, 0]))],
        ['JPEG_INCOMPLETE_SEGMENT', () => inspectImage(Uint8Array.from([255, 216, 255, 192, 0, 255]))],
        ['JPEG_INVALID_DIMENSIONS', () => inspectImage(Uint8Array.from([255, 216, 255, 192, 0, 7, 0, 0, 0, 0, 0]))],
        ['WEBP_INCOMPLETE_CHUNK', () => inspectImage(incompleteWebp)],
        ['WEBP_ANIMATED', () => inspectImage(animatedWebp)],
        ['IMAGE_UNSUPPORTED_FORMAT', () => inspectImage(new TextEncoder().encode('GIF89a'))],
        ['IMAGE_MIME_MISMATCH', () => inspectImage(png, 'image/jpeg')],
        ['IMAGE_DIMENSIONS_LIMIT', () => inspectImage(largePng)],
    ];
    for (const [code, action] of failures) assert.throws(action, (error: unknown) => error instanceof PixelGridError && error.name === 'PixelGridError' && error.code === code, code);
    vi.stubGlobal('CompressionStream', undefined);
    try { await assert.rejects(encodePng(grid), (error: unknown) => error instanceof PixelGridError && error.code === 'PNG_EXPORT_UNSUPPORTED'); }
    finally { vi.unstubAllGlobals(); }
});

test('sparse RGBA arrays cannot silently turn missing channels into zero', () => {
    const sparse = new Array<number>(4); sparse[0] = 81; sparse[3] = 0;
    const grid = createGrid(1, 1, [11, 22, 33, 128]), before = serializeProject(grid);
    for (const operation of [() => createGrid(1, 1, sparse), () => setPixel(grid, 0, 0, sparse)]) {
        assert.throws(operation, (error: unknown) => error instanceof PixelGridError && error.code === 'INVALID_RGBA_CHANNELS');
    }
    assert.equal(serializeProject(grid), before);
    assert.equal(1 in sparse, false);
});
