import { describe, expect, it, vi } from 'vitest';

import type { Project } from '../core/model/project/project.model';
import type { Printer } from '../core/printer/printer';
import {
    exportEditorPattern,
    type EditorPrinterLoader,
} from './pattern-export';

describe('editor pattern export helpers', () => {
    it('loads the requested printer and forwards export data', async () => {
        const reducedColor = new Uint8ClampedArray([1, 2, 3, 255]);
        const beadsUsage = new Map([['P-001', 1]]);
        const project = {} as Project;
        const printCalls: {
            reducedColor: Uint8ClampedArray;
            beadsUsage: Map<string, number>;
            project: Project;
            fileName: string;
        }[] = [];

        class TestPrinter implements Printer {
            name(): string {
                return 'Test';
            }

            async print(
                nextReducedColor: Uint8ClampedArray,
                nextBeadsUsage: Map<string, number>,
                nextProject: Project,
                nextFileName: string
            ): Promise<void> {
                printCalls.push({
                    reducedColor: nextReducedColor,
                    beadsUsage: nextBeadsUsage,
                    project: nextProject,
                    fileName: nextFileName,
                });
            }
        }

        const loadTestPrinter: EditorPrinterLoader = async () => TestPrinter;

        await exportEditorPattern({
            exportId: 'svg',
            reducedColor,
            beadsUsage,
            project,
            fileName: 'pattern',
            exportGridPng: () => {
                throw new Error('Grid export should not run.');
            },
            printerLoaders: {
                svg: loadTestPrinter,
            },
        });

        expect(printCalls).toEqual([
            {
                reducedColor,
                beadsUsage,
                project,
                fileName: 'pattern',
            },
        ]);
    });

    it('runs grid png export without loading a printer', async () => {
        let gridExportCount = 0;
        let printerLoadCount = 0;

        await exportEditorPattern({
            exportId: 'grid_png',
            reducedColor: new Uint8ClampedArray(),
            beadsUsage: new Map(),
            project: {} as Project,
            fileName: 'pattern',
            exportGridPng: () => {
                gridExportCount += 1;
            },
            printerLoaders: {
                png: async () => {
                    printerLoadCount += 1;
                    throw new Error('Printer should not load.');
                },
            },
        });

        expect(gridExportCount).toBe(1);
        expect(printerLoadCount).toBe(0);
    });

    it('reports unsupported export formats clearly', async () => {
        await expect(
            exportEditorPattern({
                exportId: 'unknown',
                reducedColor: new Uint8ClampedArray(),
                beadsUsage: new Map(),
                project: {} as Project,
                fileName: 'pattern',
                exportGridPng: () => undefined,
            })
        ).rejects.toThrow('Unsupported export format: unknown');
    });

    it('stays pending until the printer finishes generating the file', async () => {
        let finish!: () => void;
        const generated = new Promise<void>((resolve) => {
            finish = resolve;
        });
        const print = vi.fn(() => generated);
        const completed = vi.fn();
        class TestPrinter implements Printer {
            name = () => 'Test';
            print = print;
        }

        const result = exportEditorPattern({
            exportId: 'xlsx',
            reducedColor: new Uint8ClampedArray(),
            beadsUsage: new Map(),
            project: {} as Project,
            fileName: 'pattern',
            exportGridPng: () => undefined,
            printerLoaders: { xlsx: async () => TestPrinter },
        });
        void result.then(completed);
        await Promise.resolve();
        await Promise.resolve();

        expect(print).toHaveBeenCalledOnce();
        expect(completed).not.toHaveBeenCalled();
        finish();
        await result;
        expect(completed).toHaveBeenCalledOnce();
    });

    it.each(['load', 'print'] as const)(
        'propagates asynchronous printer %s failures',
        async (stage) => {
            const error = new Error(`${stage} failed`);
            class TestPrinter implements Printer {
                name = () => 'Test';
                async print(): Promise<void> {
                    await Promise.resolve();
                    throw error;
                }
            }

            await expect(exportEditorPattern({
                exportId: 'xlsx',
                reducedColor: new Uint8ClampedArray(),
                beadsUsage: new Map(),
                project: {} as Project,
                fileName: 'pattern',
                exportGridPng: () => undefined,
                printerLoaders: {
                    xlsx: async () => {
                        if (stage === 'load') {
                            throw error;
                        }
                        return TestPrinter;
                    },
                },
            })).rejects.toBe(error);
        }
    );

    it('awaits asynchronous grid export and propagates its failure', async () => {
        let fail!: (reason: Error) => void;
        const gridExport = new Promise<void>((_, reject) => {
            fail = reject;
        });
        const completed = vi.fn();
        const result = exportEditorPattern({
            exportId: 'grid_png',
            reducedColor: new Uint8ClampedArray(),
            beadsUsage: new Map(),
            project: {} as Project,
            fileName: 'pattern',
            exportGridPng: () => gridExport,
        });
        void result.then(completed, (): void => undefined);
        await Promise.resolve();
        expect(completed).not.toHaveBeenCalled();

        const error = new Error('Grid image encoding failed');
        const rejection = expect(result).rejects.toBe(error);
        fail(error);
        await rejection;
    });
});
