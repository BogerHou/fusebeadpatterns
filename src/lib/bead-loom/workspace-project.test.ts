import { describe,it,expect } from 'vitest';
import { createChart,paintLine,convertImage,serializeProject,parseProject } from './core';
import type { LoomLocaleSnapshot } from './locale-navigation';
import { saveLoomLocaleSnapshot,consumeLoomLocaleSnapshot,LOOM_LOCALE_PATHS } from './locale-navigation';
import { LOOM_WORKSPACE_FORMAT,MAX_LOOM_WORKSPACE_BYTES,LoomWorkspaceError,serializeLoomWorkspaceProject,parseLoomWorkspaceProject } from './workspace-project';
import { LOOM_WORKSPACE_COPY } from './workspace-copy';

function sample():LoomLocaleSnapshot{
    const before=createChart(3,2),chart=paintLine(before,[0,0],[1,0],before.palette[1].id);
    const source={width:3,height:2,pixels:new Uint8ClampedArray([1,2,3,0, 190,40,20,128, 4,5,6,255, 7,8,9,255, 10,11,12,0, 70,80,90,200])};
    return{chart,saved:createChart(1,1),history:{past:[before],future:[convertImage(source,chart,'crop')]},columns:'',rows:'47',aspect:'1.25',corner:'top-right',serpentine:false,
        selected:chart.palette[1].id,replaceTarget:chart.backgroundId,tool:'background',zoom:'28',cursor:[2,1],source,sourceName:'元画像青.png',mode:'crop',paper:'letter'};
}
function code(run:()=>unknown,expected:string){try{run();throw Error('expected rejection');}catch(error){expect(error).toBeInstanceOf(LoomWorkspaceError);expect((error as LoomWorkspaceError).code).toBe(expected);}}
describe('complete bead loom workspace files',()=>{
    it('round trips full raw source, independent saved chart, both history directions and pending settings',()=>{
        const original=sample(),before=serializeProject(original.chart),raw=serializeLoomWorkspaceProject(original),restored=parseLoomWorkspaceProject(raw);
        expect(restored.format).toBe(LOOM_WORKSPACE_FORMAT);expect(restored.version).toBe(1);expect(restored.snapshot).toEqual(original);
        expect(serializeProject(original.chart)).toBe(before);expect(restored.snapshot.source!.pixels.slice(0,4)).toEqual(new Uint8ClampedArray([1,2,3,0]));
        (restored.snapshot.source!.pixels as Uint8ClampedArray)[0]=200;restored.snapshot.chart.cells[0]=original.chart.backgroundId;restored.snapshot.history.future[0].palette[0].name='changed';
        expect(original.source!.pixels[0]).toBe(1);expect(serializeProject(original.chart)).toBe(before);
        expect(parseLoomWorkspaceProject(raw).snapshot).toEqual(original);
    });
    it('retains an image-converted chart only in future, all40 frames and an independent current grid',()=>{
        const snapshot=sample();snapshot.chart=createChart(3,2);snapshot.saved=createChart(1,1);snapshot.history={past:[],future:Array.from({length:40},(_,i)=>{const next=convertImage(snapshot.source!,createChart(3,2),'fit');next.title=`future ${i}`;return next;})};
        const reopened=parseLoomWorkspaceProject(serializeLoomWorkspaceProject(snapshot)).snapshot;
        expect(reopened.history.past).toHaveLength(0);expect(reopened.history.future).toHaveLength(40);
        expect(reopened.history.future).toEqual(snapshot.history.future);expect(reopened.chart).toEqual(snapshot.chart);
        expect(convertImage(reopened.source!,reopened.chart,reopened.mode)).toEqual(convertImage(snapshot.source!,snapshot.chart,snapshot.mode));
        expect(reopened.history.future[0]).not.toBe(reopened.history.future[1]);
    });
    it.each(LOOM_LOCALE_PATHS)('keeps a reopened complete workspace on the existing %s language handoff',path=>{
        const snapshot=parseLoomWorkspaceProject(serializeLoomWorkspaceProject(sample())).snapshot;
        const values=new Map<string,string>(),storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};
        const href=`https://fusebeadpatterns.art${path}`;
        expect(saveLoomLocaleSnapshot(snapshot,href,storage)).toBe(true);expect(consumeLoomLocaleSnapshot(href,storage)).toEqual(snapshot);
    });
    it('preserves legacy chart-only bytes and rejects reading that different format as a workspace',()=>{
        const chart=sample().chart,raw=serializeProject(chart);expect(parseProject(raw)).toEqual(chart);
        code(()=>parseLoomWorkspaceProject(raw),'UNSUPPORTED_FORMAT');
        const current=JSON.parse(serializeLoomWorkspaceProject(sample()));current.version=2;code(()=>parseLoomWorkspaceProject(JSON.stringify(current)),'UNSUPPORTED_FORMAT');
        expect(serializeProject(chart)).toBe(raw);
    });
    it('rejects malformed models, missing or extra fields, illegal state, noncanonical base64 and history overflow',()=>{
        type Wire=Omit<LoomLocaleSnapshot,'source'> & {source:{width:number;height:number;pixels:string;extra?:number};extra?:boolean};
        const mutations:Array<(x:{snapshot:Wire;extra?:boolean})=>void>=[
            x=>{x.snapshot.extra=true;},x=>{x.extra=true;},x=>{Reflect.deleteProperty(x.snapshot,'saved');},
            x=>{x.snapshot.history.future=Array(40).fill(x.snapshot.chart);},
            x=>{x.snapshot.chart.cells[0]='not-in-palette';},x=>{x.snapshot.history.future[0].columns=101;},
            x=>{x.snapshot.saved.palette[0].symbol='';},x=>{x.snapshot.cursor=[3,1];},
            x=>{Reflect.set(x.snapshot,'paper','a3');},x=>{x.snapshot.selected='unknown';},
            x=>{x.snapshot.source.pixels='A'.repeat(32)+'=';},x=>{x.snapshot.source.extra=0;},
            x=>{Object.defineProperty(x.snapshot,'__proto__',{value:{injected:true},enumerable:true});},
        ];
        for(const mutate of mutations){const value=JSON.parse(serializeLoomWorkspaceProject(sample()));mutate(value);code(()=>parseLoomWorkspaceProject(JSON.stringify(value)),'INVALID');}
        const tiny=sample();tiny.source={width:1,height:1,pixels:new Uint8ClampedArray(4)};const value=JSON.parse(serializeLoomWorkspaceProject(tiny));value.snapshot.source.pixels='AAAAAB==';code(()=>parseLoomWorkspaceProject(JSON.stringify(value)),'INVALID');
        code(()=>parseLoomWorkspaceProject('{'),'INVALID');
    });
    it('rejects own getters, custom array methods, prototype objects and cycles without executing accessors',()=>{
        let calls=0;const s=sample();Object.defineProperty(s.chart,'title',{enumerable:true,get(){calls++;return'title';}});code(()=>serializeLoomWorkspaceProject(s),'INVALID');expect(calls).toBe(0);
        const custom=sample();Object.defineProperty(custom.history.past,'toJSON',{enumerable:true,value():unknown[]{calls++;return[];}});code(()=>serializeLoomWorkspaceProject(custom),'INVALID');expect(calls).toBe(0);
        const cycle=sample();(cycle.history.future as unknown[])[0]=cycle;code(()=>serializeLoomWorkspaceProject(cycle),'INVALID');
        const proto=sample();Object.setPrototypeOf(proto.chart,{extra:true});code(()=>serializeLoomWorkspaceProject(proto),'INVALID');
        const bytes=sample();Object.defineProperty(bytes.source!.pixels,'length',{get(){calls++;return 0;}});Object.defineProperty(bytes.source!.pixels,'toJSON',{value():unknown[]{calls++;return[];}});
        expect(parseLoomWorkspaceProject(serializeLoomWorkspaceProject(bytes)).snapshot.source!.pixels).toEqual(sample().source!.pixels);expect(calls).toBe(0);
    });
    it('enforces source/model limits and the64MiB UTF8 byte envelope rather than character count',()=>{
        const large=sample();large.source={width:2049,height:1,pixels:new Uint8ClampedArray(2049*4)};code(()=>serializeLoomWorkspaceProject(large),'INVALID');
        const channels=sample();channels.source!.pixels=[256,...channels.source!.pixels.slice(1)];code(()=>serializeLoomWorkspaceProject(channels),'INVALID');
        code(()=>parseLoomWorkspaceProject(' '.repeat(MAX_LOOM_WORKSPACE_BYTES)+'0'),'TOO_LARGE');
        const utf8='é'.repeat(MAX_LOOM_WORKSPACE_BYTES/2)+'0';expect(utf8.length).toBeLessThan(MAX_LOOM_WORKSPACE_BYTES);code(()=>parseLoomWorkspaceProject(utf8),'TOO_LARGE');
    });
    it('provides native limits, project distinctions and stable errors in every language',()=>{
        const entries=Object.values(LOOM_WORKSPACE_COPY);expect(entries).toHaveLength(4);
        for(const copy of entries){expect(copy.save).toBeTruthy();expect(copy.help).toContain('40');expect(copy.help).toContain('64');for(const message of Object.values(copy.errors))expect(message).not.toContain('LOOM_WORKSPACE_');}
        for(const locale of ['de','fr','ja'] as const)expect(LOOM_WORKSPACE_COPY[locale].errors.INVALID).not.toBe(LOOM_WORKSPACE_COPY.en.errors.INVALID);
    });
});
