import { describe, expect, it } from 'vitest';
import { createGrid, readPixel, serializeProject } from '../pixel-grid/core';
import {
    addFrame, animationsEqual, cloneAnimation, createAnimation, moveFrame, packSpriteSheet,
    parseAnimation, removeFrame, replaceFrame, resizeAnimation, serializeAnimation,
    setActiveFrame, setAnimationFps, SpriteError, SpriteHistory, SPRITE_LIMITS,
    validateAnimation, type SpriteAnimation,
} from './core';

function fixture(): SpriteAnimation {
    return { width: 2, height: 1, fps: 7, activeFrame: 1, frames: [
        createGrid(2, 1, [10, 20, 30, 0, 40, 50, 60, 127]),
        createGrid(2, 1, [70, 80, 90, 128, 100, 110, 120, 255]),
        createGrid(2, 1, [130, 140, 150, 33, 160, 170, 180, 200]),
    ] };
}
function code(action: () => unknown, expected: string): void {
    let caught: unknown;
    try { action(); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(SpriteError);
    expect((caught as SpriteError).name).toBe('SpriteError');
    expect((caught as SpriteError).code).toBe(expected);
}
function wire(): Record<string, unknown> { return JSON.parse(serializeAnimation(fixture())); }

describe('independent sprite animation model', () => {
    it('starts with one blank local animation and independent buffers', () => {
        const a = createAnimation(), b = createAnimation();
        expect([a.width, a.height, a.fps, a.activeFrame, a.frames.length]).toEqual([16, 16, 8, 0, 1]);
        expect(a.frames[0].pixels.every(value => value === 0)).toBe(true);
        a.frames[0].pixels[0] = 99;
        expect(b.frames[0].pixels[0]).toBe(0);
        validateAnimation(a);
    });

    it.each([0, -1, 65, 1.5, NaN, Infinity, '16', null])('rejects unsafe dimension %s', value => {
        code(() => createAnimation(value as number, 1), 'INVALID_DIMENSIONS');
        code(() => resizeAnimation(fixture(), 1, value as number, 'crop'), 'INVALID_DIMENSIONS');
    });

    it.each([0, 25, 1.5, NaN, Infinity, '8', null])('rejects unsafe fps %s', value => {
        code(() => setAnimationFps(fixture(), value as number), 'INVALID_FPS');
        code(() => validateAnimation({ ...fixture(), fps: value as number }), 'INVALID_FPS');
    });

    it('requires exact own data fields and dense frame arrays without evaluating getters', () => {
        for (const bad of [null, [], Object.create(fixture()), { ...fixture(), unknown: true }, { ...fixture(), [Symbol('hidden')]: 1 }]) {
            code(() => validateAnimation(bad as SpriteAnimation), 'INVALID_ANIMATION');
        }
        let called = false;
        const getter = { ...fixture() };
        Object.defineProperty(getter, 'fps', { enumerable: true, get() { called = true; return 8; } });
        code(() => validateAnimation(getter), 'INVALID_ANIMATION');
        expect(called).toBe(false);
        const sparse = fixture(); delete sparse.frames[1];
        code(() => validateAnimation(sparse), 'FRAME_LIMIT');
        const extra = fixture(); Object.assign(extra.frames, { url: 'https://example.org' });
        code(() => validateAnimation(extra), 'FRAME_LIMIT');
        const empty: SpriteAnimation = { ...fixture(), frames: [] };
        code(() => validateAnimation(empty), 'FRAME_LIMIT');
    });

    it('rejects wrong frame dimensions, channel containers, extra fields and limits', () => {
        const a = fixture(); a.frames[1] = createGrid(1, 1);
        code(() => validateAnimation(a), 'INVALID_FRAME');
        const b = fixture(); b.frames[0].pixels = [1, 2] as unknown as typeof b.frames[0]['pixels'];
        code(() => validateAnimation(b), 'INVALID_FRAME');
        const c = fixture(); Object.assign(c.frames[0], { sourceURL: 'https://example.org' });
        code(() => validateAnimation(c), 'INVALID_FRAME');
        const d = fixture(); d.frames.push(...Array.from({ length: 30 }, () => createGrid(2, 1)));
        code(() => validateAnimation(d), 'FRAME_LIMIT');
        for (const activeFrame of [-1, 3, 0.5, NaN]) code(() => validateAnimation({ ...fixture(), activeFrame }), 'INVALID_FRAME_INDEX');
    });

    it('deep-clones all frames even when input frames share the same source object', () => {
        const a = fixture(); a.frames[2] = a.frames[0];
        const b = cloneAnimation(a);
        b.frames[0].pixels[0] = 200;
        expect(b.frames[2].pixels[0]).toBe(10);
        expect(a.frames[0].pixels[0]).toBe(10);
        expect(b.frames.every((frame, index) => frame !== a.frames[index] && frame.pixels.buffer !== a.frames[index].pixels.buffer)).toBe(true);
    });

    it('inserts after the selected frame and never aliases blank, duplicated or replaced frames', () => {
        const source = fixture(), blank = addFrame(source), duplicate = addFrame(source, true);
        expect(blank.activeFrame).toBe(2); expect(blank.frames.length).toBe(4);
        expect(Array.from(blank.frames[2].pixels)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
        expect(Array.from(duplicate.frames[2].pixels)).toEqual([70, 80, 90, 128, 100, 110, 120, 255]);
        duplicate.frames[2].pixels[0] = 3;
        expect(duplicate.frames[1].pixels[0]).toBe(70); expect(source.frames[1].pixels[0]).toBe(70);
        const grid = createGrid(2, 1, [1, 2, 3, 4, 5, 6, 7, 8]), replacement = replaceFrame(source, 0, grid);
        grid.pixels[0] = 255;
        expect(replacement.frames[0].pixels[0]).toBe(1); expect(source.frames[0].pixels[0]).toBe(10);
    });

    it('tracks selected-frame identity through deletes and true reordering', () => {
        expect(removeFrame(fixture(), 0).activeFrame).toBe(0);
        const middle = removeFrame(fixture());
        expect(middle.activeFrame).toBe(1); expect(middle.frames[1].pixels[0]).toBe(130);
        const last = removeFrame(setActiveFrame(fixture(), 2));
        expect(last.activeFrame).toBe(1); expect(last.frames[1].pixels[0]).toBe(70);
        const moved = moveFrame(fixture(), -1);
        expect(moved.activeFrame).toBe(0); expect(moved.frames.map(frame => frame.pixels[0])).toEqual([70, 10, 130]);
        const boundarySource = setActiveFrame(fixture(), 0), boundary = moveFrame(boundarySource, -1);
        expect(boundary.frames.map(frame => frame.pixels[0])).toEqual([10, 70, 130]);
        expect(boundary.frames[0].pixels).not.toBe(boundarySource.frames[0].pixels);
        code(() => removeFrame(createAnimation()), 'LAST_FRAME');
        code(() => moveFrame(fixture(), 0 as 1), 'INVALID_DIRECTION');
        code(() => setActiveFrame(fixture(), 3), 'INVALID_FRAME_INDEX');
        code(() => replaceFrame(fixture(), 1, createGrid(1, 1)), 'INVALID_FRAME');
    });

    it('crops every frame at upper left and pads only with transparent RGBA', () => {
        const bigger = resizeAnimation(fixture(), 3, 2, 'crop');
        expect(bigger.activeFrame).toBe(1); expect(bigger.fps).toBe(7);
        expect(Array.from(bigger.frames[0].pixels)).toEqual([10, 20, 30, 0, 40, 50, 60, 127, 0, 0, 0, 0, ...Array(12).fill(0)]);
        expect(readPixel(bigger.frames[2], 1, 0)).toEqual([160, 170, 180, 200]);
        const small = resizeAnimation(fixture(), 1, 1, 'crop');
        expect(small.frames.map(frame => Array.from(frame.pixels))).toEqual([[10, 20, 30, 0], [70, 80, 90, 128], [130, 140, 150, 33]]);
        code(() => resizeAnimation(fixture(), 2, 1, 'fit' as 'crop'), 'INVALID_RESIZE_MODE');
    });

    it('nearest scaling uses source pixel centers consistently for all frames', () => {
        const grown = resizeAnimation(fixture(), 4, 2, 'scale');
        expect(Array.from(grown.frames[0].pixels)).toEqual([
            10,20,30,0,10,20,30,0,40,50,60,127,40,50,60,127,
            10,20,30,0,10,20,30,0,40,50,60,127,40,50,60,127,
        ]);
        const shrunk = resizeAnimation(fixture(), 1, 1, 'scale');
        expect(shrunk.frames.map(frame => Array.from(frame.pixels))).toEqual([[40,50,60,127],[100,110,120,255],[160,170,180,200]]);
    });
});

describe('strict bounded sprite project format', () => {
    it('round-trips exact frame order, controls and all RGBA, including invisible RGB', () => {
        const text = serializeAnimation(fixture()), parsed = parseAnimation(text);
        expect(JSON.parse(text)).toEqual({ format:'fusebead-sprite-project', version:1, width:2, height:1, fps:7, activeFrame:1,
            frames:['ChQeACgyPH8=','RlBagGRueP8=','goyWIaCqtMg='] });
        expect(animationsEqual(parsed, fixture())).toBe(true);
        parsed.frames[0].pixels[0] = 255;
        expect(parseAnimation(text).frames[0].pixels[0]).toBe(10);
        expect(animationsEqual(setActiveFrame(fixture(), 0), fixture())).toBe(false);
        expect(animationsEqual(setAnimationFps(fixture(), 8), fixture())).toBe(false);
    });

    it('rejects malformed JSON, foreign/old formats, missing/extra own keys and oversized Unicode', () => {
        code(() => parseAnimation('{'), 'PROJECT_INVALID_JSON');
        code(() => parseAnimation(serializeProject(createGrid(1, 1))), 'PROJECT_FIELDS');
        for (const update of [{ format:'pixel-grid-project' }, { version:2 }, { version:'1' }]) {
            code(() => parseAnimation(JSON.stringify({ ...wire(), ...update })), 'PROJECT_UNSUPPORTED_FORMAT');
        }
        const missing = wire(); delete missing.fps;
        code(() => parseAnimation(JSON.stringify(missing)), 'PROJECT_FIELDS');
        code(() => parseAnimation(JSON.stringify({ ...wire(), url:'https://example.org' })), 'PROJECT_FIELDS');
        code(() => parseAnimation('{"__proto__":{},' + serializeAnimation(fixture()).slice(1)), 'PROJECT_FIELDS');
        code(() => parseAnimation(' '.repeat(1048577)), 'PROJECT_TOO_LARGE');
        code(() => parseAnimation('\u3042'.repeat(350000)), 'PROJECT_TOO_LARGE');
    });

    it.each(['AQIDBB==', 'AQIDBA', 'AQIDBA= ', 'AQIDBA-_', 'AQIDBA===', '', null, [], { pixels:'AQIDBA==' }])('requires canonical length-checked base64 %s', pixels => {
        const value = { format:'fusebead-sprite-project',version:1,width:1,height:1,fps:8,activeFrame:0,frames:[pixels] };
        code(() => parseAnimation(JSON.stringify(value)), 'PROJECT_FRAME_DATA');
    });

    it('accepts the complete 64 by 64 by 32 maximum within 1 MiB, not a larger allocation', () => {
        const a: SpriteAnimation = { width:64,height:64,fps:24,activeFrame:31,frames:Array.from({ length:32 }, (_, index) => {
            const grid=createGrid(64,64); grid.pixels[0]=index; grid.pixels[16383]=255-index; return grid;
        }) };
        validateAnimation(a);
        const text=serializeAnimation(a);
        expect(new TextEncoder().encode(text).length).toBeLessThan(1048576);
        const parsed=parseAnimation(text);
        expect(parsed.frames[31].pixels[0]).toBe(31); expect(parsed.frames[0].pixels[16383]).toBe(255);
        code(() => addFrame(a), 'FRAME_LIMIT');
        const oversized=JSON.parse(text); oversized.width=65;
        code(() => parseAnimation(JSON.stringify(oversized)), 'INVALID_DIMENSIONS');
        expect(SPRITE_LIMITS.maxRawBytes).toBe(64*64*4*32);
    });
});

describe('whole-animation transaction history', () => {
    it('restores all dimensions, frames, selection and fps as one undo/redo step', () => {
        const before=fixture(), after=setAnimationFps(resizeAnimation(moveFrame(addFrame(before,true),-1),3,2,'crop'),12);
        const history=new SpriteHistory(); expect(history.push(before,after)).toBe(true);
        before.frames[0].pixels[0]=255;
        const restored=history.undo(after)!;
        expect(animationsEqual(restored,fixture())).toBe(true); expect(history.canUndo).toBe(false); expect(history.canRedo).toBe(true);
        const replay=history.redo(restored)!;
        expect(animationsEqual(replay,after)).toBe(true); replay.frames[0].pixels[0]=201;
        expect(after.frames[0].pixels[0]).toBe(10);
        expect(history.retainedSteps).toBe(1);
        history.clear(); expect(history.canUndo).toBe(false); expect(history.canRedo).toBe(false); expect(history.retainedBytes).toBe(0);
    });

    it('does not erase redo on a no-op, but a real branch replaces the redo future', () => {
        const a=fixture(), b=setAnimationFps(a,8), c=setAnimationFps(a,12), history=new SpriteHistory(2);
        history.push(a,b); const undone=history.undo(b)!;
        expect(history.push(undone,cloneAnimation(undone))).toBe(false); expect(history.canRedo).toBe(true);
        history.push(undone,c); expect(history.canRedo).toBe(false);
        expect(animationsEqual(history.undo(c)!,a)).toBe(true);
    });

    it('evicts oldest transactions and shares a hard 30-step / 16 MiB undo+redo budget', () => {
        const history=new SpriteHistory(), a: SpriteAnimation={width:64,height:64,fps:8,activeFrame:0,frames:Array.from({length:32},()=>createGrid(64,64))};
        let current=a;
        for(let i=1;i<=33;i++) { const next=cloneAnimation(current);next.frames[0].pixels[0]=i;history.push(current,next);current=next; }
        expect(history.retainedSteps).toBe(30); expect(history.retainedBytes).toBe(30*524288); expect(history.retainedBytes).toBeLessThanOrEqual(16777216);
        for(let i=0;i<30;i++) {current=history.undo(current)!;expect(history.retainedSteps).toBe(30);}
        expect(current.frames[0].pixels[0]).toBe(3); expect(history.undo(current)).toBeNull();
        for(let i=0;i<30;i++) current=history.redo(current)!;
        expect(current.frames[0].pixels[0]).toBe(33); expect(history.redo(current)).toBeNull();
    });

    it.each([0,31,-1,1.5,Infinity])('rejects unbounded history configuration %s', value => code(()=>new SpriteHistory(value),'INVALID_HISTORY_LIMIT'));
});

describe('sprite-sheet layout and raw pixels', () => {
    it('packs actual frame-order RGBA into horizontal and vertical strips', () => {
        const horizontal=packSpriteSheet(fixture());
        expect([horizontal.width,horizontal.height,horizontal.columns,horizontal.rows]).toEqual([6,1,3,1]);
        expect(Array.from(horizontal.pixels)).toEqual([10,20,30,0,40,50,60,127,70,80,90,128,100,110,120,255,130,140,150,33,160,170,180,200]);
        const vertical=packSpriteSheet(fixture(),'vertical');
        expect([vertical.width,vertical.height,vertical.columns,vertical.rows]).toEqual([2,3,1,3]);
        expect(Array.from(vertical.pixels)).toEqual(Array.from(horizontal.pixels));
        expect(horizontal.frames.map(({index,x,y,width,height})=>({index,x,y,width,height}))).toEqual([
            {index:0,x:0,y:0,width:2,height:1},{index:1,x:2,y:0,width:2,height:1},{index:2,x:4,y:0,width:2,height:1},
        ]);
        expect(vertical.frames.map(value=>value.y)).toEqual([0,1,2]);
        expect(horizontal.frames.every(value=>value.durationMs===1000/7)).toBe(true);
    });

    it('keeps incomplete grid padding transparent, exact two-dimensional row strides and independent memory', () => {
        const source=resizeAnimation(fixture(),2,2,'crop'), sheet=packSpriteSheet(source,'grid');
        expect([sheet.width,sheet.height,sheet.columns,sheet.rows]).toEqual([4,4,2,2]);
        expect(sheet.frames.map(value=>[value.x,value.y])).toEqual([[0,0],[2,0],[0,2]]);
        const cell=(x:number,y:number)=>Array.from(sheet.pixels.slice((y*4+x)*4,(y*4+x+1)*4));
        expect(cell(0,0)).toEqual([10,20,30,0]);expect(cell(2,0)).toEqual([70,80,90,128]);expect(cell(1,2)).toEqual([160,170,180,200]);
        for(const [x,y] of [[2,2],[3,2],[2,3],[3,3],[0,1],[3,1]])expect(cell(x,y)).toEqual([0,0,0,0]);
        sheet.pixels[0]=255;expect(source.frames[0].pixels[0]).toBe(10);
        expect(packSpriteSheet(fixture(),'grid',1).frames.map(value=>[value.x,value.y])).toEqual([[0,0],[0,1],[0,2]]);
        for(const columns of [0,4,1.5,Infinity])code(()=>packSpriteSheet(fixture(),'grid',columns),'INVALID_COLUMNS');
        code(()=>packSpriteSheet(fixture(),'diagonal' as 'grid'),'INVALID_LAYOUT');
    });
});
