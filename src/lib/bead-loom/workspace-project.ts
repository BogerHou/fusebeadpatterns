import { LIMITS, validateChart, type LoomChart } from './core';
import type { RgbaSource } from '../pixel-grid/core';
import type { LoomLocaleSnapshot } from './locale-navigation';

export const LOOM_WORKSPACE_FORMAT = 'bead-loom-workspace';
export const LOOM_WORKSPACE_VERSION = 1;
// Matches the existing full locale-transfer envelope. Forty maximum charts,
// an independent saved chart and a 2048² RGBA source fit without dropping frames.
export const MAX_LOOM_WORKSPACE_BYTES = 64 * 1024 * 1024;
export type LoomWorkspaceErrorCode = 'UNSUPPORTED_FORMAT' | 'INVALID' | 'TOO_LARGE' | 'READ_FAILED';
export class LoomWorkspaceError extends Error {
    constructor(public readonly code: LoomWorkspaceErrorCode) { super(`LOOM_WORKSPACE_${code}`); this.name = 'LoomWorkspaceError'; }
}
export type LoomWorkspaceProject = { format: typeof LOOM_WORKSPACE_FORMAT; version: typeof LOOM_WORKSPACE_VERSION; snapshot: LoomLocaleSnapshot };

const SNAPSHOT = ['chart','saved','history','columns','rows','aspect','corner','serpentine','selected','replaceTarget','tool','zoom','cursor','source','sourceName','mode','paper'];
const CHART = ['title','columns','rows','cellAspect','palette','backgroundId','cells','startCorner','serpentine'];
const COLOR = ['id','symbol','name','code','hex'];
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const invalid = (): never => { throw new LoomWorkspaceError('INVALID'); };
const integer = (value: unknown, low: number, high: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= low && value <= high;
function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) return invalid();
    const names = Reflect.ownKeys(value);
    if (names.length !== keys.length || names.some(key => typeof key !== 'string' || !keys.includes(key))) return invalid();
    const result: Record<string, unknown> = {};
    for (const key of keys) {
        const entry = Object.getOwnPropertyDescriptor(value,key);
        if (!entry || !Object.hasOwn(entry,'value') || !entry.enumerable) return invalid();
        result[key] = entry.value;
    }
    return result;
}
function array(value: unknown, maximum: number): unknown[] {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return invalid();
    const length = Object.getOwnPropertyDescriptor(value,'length')?.value;
    if (!integer(length,0,maximum) || Reflect.ownKeys(value).length !== length + 1) return invalid();
    const result: unknown[] = [];
    for (let i=0;i<length;i++) {
        const entry=Object.getOwnPropertyDescriptor(value,String(i));
        if (!entry || !Object.hasOwn(entry,'value') || !entry.enumerable) return invalid();
        result.push(entry.value);
    }
    return result;
}
function text(value: unknown, maximum: number): string { if (typeof value !== 'string' || value.length > maximum) return invalid(); return value; }
function chartData(value: unknown): LoomChart {
    const row=fields(value,CHART),palette=array(row.palette,LIMITS.maxColors).map(value=>{
        const color=fields(value,COLOR);
        return {id:text(color.id,40),symbol:text(color.symbol,1),name:text(color.name,120),code:text(color.code,80),hex:text(color.hex,7)};
    });
    const cells=array(row.cells,LIMITS.maxCells).map(value=>text(value,LIMITS.maxIdLength));
    // The legacy validator remains the one authority for chart semantics.
    return validateChart({...row,title:text(row.title,160),backgroundId:text(row.backgroundId,40),startCorner:text(row.startCorner,20),palette,cells});
}
function sourceData(value: unknown, wire: boolean): RgbaSource | null {
    if (value===null) return null;
    const row=fields(value,['width','height','pixels']);
    if (!integer(row.width,1,LIMITS.maxImageSide) || !integer(row.height,1,LIMITS.maxImageSide) || row.width*row.height>LIMITS.maxImagePixels) return invalid();
    const length=row.width*row.height*4;
    let pixels: Uint8ClampedArray<ArrayBuffer>;
    if (wire) {
        const encoded=row.pixels;
        if (typeof encoded!=='string' || encoded.length!==Math.ceil(length/3)*4 || /[^A-Za-z0-9+/=]/.test(encoded)) return invalid();
        const padding=(3-length%3)%3,end=encoded.length-padding;
        if (encoded.indexOf('=')!==(padding?end:-1) || (padding && (encoded.slice(end)!=='='.repeat(padding) || (BASE64.indexOf(encoded[end-1])&(padding===2?15:3))!==0))) return invalid();
        const binary=atob(encoded);if(binary.length!==length)return invalid();
        pixels=new Uint8ClampedArray(length);for(let i=0;i<length;i++)pixels[i]=binary.charCodeAt(i);
    } else if(row.pixels instanceof Uint8ClampedArray || row.pixels instanceof Uint8Array) {
        const getter=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'length')!.get!;
        if(getter.call(row.pixels)!==length)return invalid();pixels=new Uint8ClampedArray(row.pixels);
    } else {
        const raw=array(row.pixels,LIMITS.maxImagePixels*4);if(raw.length!==length || raw.some(value=>!integer(value,0,255)))return invalid();
        pixels=new Uint8ClampedArray(raw as number[]);
    }
    return {width:row.width,height:row.height,pixels};
}
function normalize(value: unknown, wire: boolean): LoomLocaleSnapshot {
    const row=fields(value,SNAPSHOT),chart=chartData(row.chart),saved=chartData(row.saved),history=fields(row.history,['past','future']);
    const past=array(history.past,40),future=array(history.future,40);if(past.length+future.length>40)return invalid();
    const columns=text(row.columns,64),rows=text(row.rows,64),aspect=text(row.aspect,64),sourceName=text(row.sourceName,4096);
    const cursor=array(row.cursor,2);if(cursor.length!==2 || !integer(cursor[0],0,chart.columns-1) || !integer(cursor[1],0,chart.rows-1))return invalid();
    if(!['bottom-left','bottom-right','top-left','top-right'].includes(row.corner as string) || typeof row.serpentine!=='boolean' ||
       !['paint','background','pan'].includes(row.tool as string) || !['fit','10','18','28','40'].includes(row.zoom as string) ||
       !['fit','crop','stretch'].includes(row.mode as string) || !['a4','letter'].includes(row.paper as string) ||
       typeof row.selected!=='string' || !chart.palette.some(c=>c.id===row.selected) || typeof row.replaceTarget!=='string' || !chart.palette.some(c=>c.id===row.replaceTarget))return invalid();
    return {chart,saved,history:{past:past.map(chartData),future:future.map(chartData)},columns,rows,aspect,corner:row.corner as LoomLocaleSnapshot['corner'],serpentine:row.serpentine,
        selected:row.selected,replaceTarget:row.replaceTarget,tool:row.tool as LoomLocaleSnapshot['tool'],zoom:row.zoom as LoomLocaleSnapshot['zoom'],cursor:[cursor[0],cursor[1]],
        source:sourceData(row.source,wire),sourceName,mode:row.mode as LoomLocaleSnapshot['mode'],paper:row.paper as LoomLocaleSnapshot['paper']};
}
function budget(raw: string): void { if(raw.length>MAX_LOOM_WORKSPACE_BYTES || new TextEncoder().encode(raw).length>MAX_LOOM_WORKSPACE_BYTES)throw new LoomWorkspaceError('TOO_LARGE'); }
function stable(error: unknown): never { if(error instanceof LoomWorkspaceError)throw error;return invalid(); }
function encodedSource(source: RgbaSource | null) {
    if(!source)return null;
    let binary='';for(let i=0;i<source.pixels.length;i+=8192)binary+=String.fromCharCode(...source.pixels.slice(i,i+8192));
    return {width:source.width,height:source.height,pixels:btoa(binary)};
}
/** Owned strict data only. No storage, image requests, migration or history loss. */
export function serializeLoomWorkspaceProject(snapshot: LoomLocaleSnapshot): string {
    try {const data=normalize(snapshot,false);const raw=JSON.stringify({format:LOOM_WORKSPACE_FORMAT,version:LOOM_WORKSPACE_VERSION,snapshot:{...data,source:encodedSource(data.source)}});budget(raw);return raw;}
    catch(error){return stable(error);}
}
/** The caller installs only after the whole source/history/UI envelope succeeds. */
export function parseLoomWorkspaceProject(raw: string): LoomWorkspaceProject {
    try {
        if(typeof raw!=='string')return invalid();budget(raw);const value:unknown=JSON.parse(raw);
        if(!value || typeof value!=='object' || Array.isArray(value))return invalid();
        const header=value as Record<string,unknown>;
        if(header.format!==LOOM_WORKSPACE_FORMAT || header.version!==LOOM_WORKSPACE_VERSION)throw new LoomWorkspaceError('UNSUPPORTED_FORMAT');
        const row=fields(value,['format','version','snapshot']);return {format:LOOM_WORKSPACE_FORMAT,version:LOOM_WORKSPACE_VERSION,snapshot:normalize(row.snapshot,true)};
    }catch(error){return stable(error);}
}
