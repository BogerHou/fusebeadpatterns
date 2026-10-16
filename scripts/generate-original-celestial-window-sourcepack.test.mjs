import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { SIZE, chartSvg, checkArtifacts, designs, generate, options } from './generate-original-celestial-window-sourcepack.mjs';
const sharp = createRequire(import.meta.url)('sharp');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const repo = path.resolve(import.meta.dirname,'..');
function temporaryOutput(ignored=true) {
    const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'celestial-sourcepack-test-')));
    assert.equal(spawnSync('git',['init','--quiet',root]).status,0);
    if (ignored) fs.writeFileSync(path.join(root,'.gitignore'),'/artifacts/\n');
    return {root,pack:path.join(root,'artifacts/pattern-samples/2026-10-16/original-celestial-window-v1')};
}
function snapshot(root,prefix='') {
    return fs.readdirSync(path.join(root,prefix),{withFileTypes:true}).flatMap(entry=>{
        const relative=prefix?`${prefix}/${entry.name}`:entry.name,full=path.join(root,relative),modified=fs.statSync(full).mtimeMs;
        return entry.isDirectory()?[{relative,modified,directory:true},...snapshot(root,relative)]:[{relative,modified,bytes:fs.readFileSync(full).toString('base64')}];
    });
}

test('native58-grid arched composition has the authored silhouette, continuous pale crescent and distinct celestial/botanical details',()=>{
    const {pattern,rgba}=designs()[0];
    assert.equal(pattern.id,'original-celestial-stained-glass-window');
    assert.equal(pattern.slug,'celestial-stained-glass-window');
    assert.deepEqual([pattern.width,pattern.height,pattern.boardWidth,pattern.boardHeight],[58,58,2,2]);
    assert.equal(pattern.description.length<=160,true);
    assert.deepEqual(pattern.bounds,{x:5,y:3,width:48,height:52});
    assert.equal(pattern.beads,2234); assert.equal(pattern.colorCount,8);
    // Hand-checked left arch edges for global rows4..27; the opposite edge is mirrored.
    const lefts=[24,21,18,17,15,14,13,12,11,10,9,9,8,8,7,7,7,6,6,6,6,6,6,5];
    for(let y=0;y<58;y++) {
        const left=y<3||y>54?null:y<27?lefts[y-3]:5;
        for(let x=0;x<58;x++) {
            const present=left!==null&&x>=left&&x<=57-left;
            assert.equal(pattern.rows[y][x]!=='.',present,`Silhouette cell ${x},${y}`);
            if(!present) assert.deepEqual([...rgba.subarray((y*58+x)*4,(y*58+x+1)*4)],[0,0,0,0]);
        }
    }
    assert.equal(pattern.rows[19].slice(13,18),'YYYYY');
    assert.equal(pattern.rows[19][20],'B'); // Blue cutout, never a second half of a two-color disk.
    assert.equal(pattern.rows[26].slice(18,22),'YYYY');
    assert.equal(pattern.rows[19][39],'Y'); assert.equal(pattern.rows[11][31],'Y'); assert.equal(pattern.rows[27][43],'Y');
    assert.equal(pattern.rows[46][17],'G'); assert.equal(pattern.rows[46][41],'G');
    assert.deepEqual(pattern.topology.componentSizes,[2234]); assert.equal(pattern.topology.singleBeadCutPoints,0);
    for(const key of ['physicalAssemblyTested','ironingTested','hangingTested','loadStrengthTested']) assert.equal(pattern[key],false);
    assert.match(pattern.topology.model,/not a fused-joint strength prediction/);
    assert.equal(pattern.validation.notAnEnlargedSingleBoardDesign,true);
});

test('all actual cells use exact CSV colors; four independently reconstructed boards preserve every seam and material count',()=>{
    const {pattern,rgba}=designs()[0];
    const csv=new Map(fs.readFileSync(path.join(repo,'public/palettes/perler.csv'),'utf8').trim().split(/\r?\n/).map(row=>{const [ref,name,,r,g,b]=row.split(',');return [ref,{name,rgb:[+r,+g,+b]}];}));
    const counts=Object.fromEntries(pattern.materials.map(color=>[color.symbol,0]));
    const reconstructed=Buffer.alloc(58*58*4),visits=new Uint8Array(58*58);
    for(let y=0;y<58;y++) for(let x=0;x<58;x++) {
        const symbol=pattern.rows[y][x]; if(symbol==='.') continue;
        const color=pattern.palette[symbol];assert.deepEqual(csv.get(color.ref),{name:color.name,rgb:color.rgb});
        assert.deepEqual([...rgba.subarray((y*58+x)*4,(y*58+x+1)*4)],[...color.rgb,255]); counts[symbol]++;
    }
    assert.deepEqual(counts,{N:740,B:314,T:371,S:263,M:129,G:262,Y:91,E:64});
    assert.deepEqual(pattern.boardTiles.map(board=>board.beads),[493,493,624,624]);
    for(const board of pattern.boardTiles) {
        const localCounts=Object.fromEntries(pattern.materials.map(color=>[color.symbol,0])); const local=Buffer.alloc(29*29*4);
        assert.equal(board.cells,841);assert.equal(board.emptyCells+board.beads,841);
        for(let row=0;row<29;row++) for(let col=0;col<29;col++) {
            const gx=(board.board%2===1?0:29)+col,gy=(board.board<=2?0:29)+row,global=gy*58+gx,index=(row*29+col)*4;
            visits[global]++;rgba.copy(local,index,global*4,global*4+4);local.copy(reconstructed,global*4,index,index+4);
            const symbol=pattern.rows[gy][gx]; if(symbol!=='.') localCounts[symbol]++;
        }
        assert.deepEqual(localCounts,board.counts); assert.equal(sha(local),board.rgbaSha256);
    }
    assert.ok(visits.every(count=>count===1));assert.ok(reconstructed.equals(rgba));
    for(const color of pattern.materials) assert.equal(pattern.boardTiles.reduce((sum,board)=>sum+board.counts[color.symbol],0),counts[color.symbol]);
    assert.equal(sha(rgba),pattern.validation.rgbaSha256);assert.equal(sha(pattern.rows.join('\n')),pattern.validation.designRowsSha256);
    assert.match(chartSvg(pattern),/48 x 52 motif/);assert.match(chartSvg(pattern),/stroke="#b64b40" stroke-width="2.6"/);
});

test('private generated files roundtrip through the real editor, exact RGBA and read-only checker; repeated generation cannot overwrite',async()=>{
    const {root,pack}=temporaryOutput();
    try {
        const report=await generate(pack);
        for(const key of ['realEditorParse','realEditorSerializeReparse','pixelPngEqualsProjectEqualsManifest','emptyPixelRgbaAllZero','fourQuadrantsExactlyRecomposeSource']) assert.equal(report[key],true);
        assert.equal(Object.keys(report.fileSha256).length,13);
        assert.equal(fs.statSync(path.join(pack,'manifest.json')).mode&0o777,0o600);
        const before=snapshot(pack);
        const cli=spawnSync(process.execPath,['scripts/generate-original-celestial-window-sourcepack.mjs','--output',pack,'--check-only'],{cwd:repo,encoding:'utf8'});
        assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).mode,'read-only-check');
        assert.deepEqual(snapshot(pack),before);
        await assert.rejects(generate(pack),/exists/); assert.deepEqual(snapshot(pack),before);
        assert.ok(!snapshot(pack).some(entry=>entry.relative.endsWith('.pdf')));
        // Downstream artifacts are outside this checker's scope and cannot change original checksums.
        fs.mkdirSync(path.join(pack,'generated-celestial-downloads'));
        fs.writeFileSync(path.join(pack,'generated-celestial-downloads','not-a-source-file.txt'),'not verified by sourcepack checker');
        assert.deepEqual(await checkArtifacts(pack),report);
        fs.symlinkSync(path.join(pack,'manifest.json'),path.join(pack,'generated-celestial-downloads','invalid-link'));
        await assert.rejects(checkArtifacts(pack),/symlinks/);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('checker detects shifted seam tile, hidden transparent RGB, inconsistent project and altered digital QA',async()=>{
    const {root,pack}=temporaryOutput();const id='original-celestial-stained-glass-window';
    try {
        await generate(pack);
        const tilePath=path.join(pack,`boards/${id}-board-2.png`),tile=fs.readFileSync(tilePath);
        const decoded=await sharp(tile).ensureAlpha().raw().toBuffer();
        const shifted=Buffer.alloc(decoded.length);decoded.copy(shifted,4,0,decoded.length-4);
        fs.writeFileSync(tilePath,await sharp(shifted,{raw:{width:29,height:29,channels:4}}).png().toBuffer());
        await assert.rejects(checkArtifacts(pack),/Quadrant/);fs.writeFileSync(tilePath,tile);
        const pixelPath=path.join(pack,`pixels/${id}.png`),pixel=fs.readFileSync(pixelPath),raw=await sharp(pixel).ensureAlpha().raw().toBuffer();raw[0]=111;
        fs.writeFileSync(pixelPath,await sharp(raw,{raw:{width:SIZE,height:SIZE,channels:4}}).png().toBuffer());
        await assert.rejects(checkArtifacts(pack),/Native pixel PNG/);fs.writeFileSync(pixelPath,pixel);
        const projectPath=path.join(pack,`projects/${id}.bead-pattern.json`),project=fs.readFileSync(projectPath),bad=JSON.parse(project);bad.draft.boardWidth=1;fs.writeFileSync(projectPath,JSON.stringify(bad));
        await assert.rejects(checkArtifacts(pack),/Project differs/);fs.writeFileSync(projectPath,project);
        const qaPath=path.join(pack,'qa/sourcepack-checks.json'),qa=fs.readFileSync(qaPath),wrong=JSON.parse(qa);wrong.fourQuadrantsExactlyRecomposeSource=false;fs.writeFileSync(qaPath,JSON.stringify(wrong));
        await assert.rejects(checkArtifacts(pack),/digital QA differs/);fs.writeFileSync(qaPath,qa);
        const extra=path.join(pack,'unexpected');fs.mkdirSync(extra);await assert.rejects(checkArtifacts(pack),/Unexpected/);fs.rmdirSync(extra);
        assert.equal((await checkArtifacts(pack)).fourQuadrantsExactlyRecomposeSource,true);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('unsafe output, unignored repository, duplicate flags and symlink ancestors are refused without output creation',async()=>{
    const {root,pack}=temporaryOutput(false);
    try {
        await assert.rejects(generate(pack),/Git ignored/);assert.equal(fs.existsSync(pack),false);
        assert.throws(()=>options(['--output',path.join(root,'public','artifacts/pattern-samples/2026-10-16/original-celestial-window-v1')]),/public/);
        assert.throws(()=>options(['--output',pack.replace('-v1','-v2')]),/versioned private/);
        assert.throws(()=>options(['--output',pack,'--check-only','--check-only']));
        assert.throws(()=>options(['--output',pack,'--output',pack]));assert.throws(()=>options(['--output']));
        fs.mkdirSync(path.join(root,'target'));fs.symlinkSync(path.join(root,'target'),path.join(root,'artifacts'));
        await assert.rejects(generate(pack),/symlinks|versioned private/);assert.equal(fs.existsSync(path.join(root,'target','pattern-samples')),false);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
});
