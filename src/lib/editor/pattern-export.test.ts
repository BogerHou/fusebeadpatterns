import { describe, expect, it } from 'vitest';

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

            print(
                nextReducedColor: Uint8ClampedArray,
                nextBeadsUsage: Map<string, number>,
                nextProject: Project,
                nextFileName: string
            ): void {
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
});
