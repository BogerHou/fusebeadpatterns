import { describe, expect, it } from 'vitest';

import {
    drawGridExportPattern,
    type GridExportDrawingContext,
} from './grid-export';

type DrawOperation =
    | {
          type: 'fillRect';
          fillStyle: string;
          x: number;
          y: number;
          width: number;
          height: number;
      }
    | {
          type: 'line';
          strokeStyle: string;
          lineWidth: number;
          from: [number, number];
          to: [number, number];
      };

class FakeGridContext implements GridExportDrawingContext {
    fillStyle = '';
    strokeStyle = '';
    lineWidth = 1;
    operations: DrawOperation[] = [];
    private pendingFrom: [number, number] | null = null;
    private pendingTo: [number, number] | null = null;

    fillRect(x: number, y: number, width: number, height: number): void {
        this.operations.push({
            type: 'fillRect',
            fillStyle: String(this.fillStyle),
            x,
            y,
            width,
            height,
        });
    }

    beginPath(): void {
        this.pendingFrom = null;
        this.pendingTo = null;
    }

    moveTo(x: number, y: number): void {
        this.pendingFrom = [x, y];
    }

    lineTo(x: number, y: number): void {
        this.pendingTo = [x, y];
    }

    stroke(): void {
        if (!this.pendingFrom || !this.pendingTo) {
            throw new Error('Expected line endpoints before stroke.');
        }

        this.operations.push({
            type: 'line',
            strokeStyle: String(this.strokeStyle),
            lineWidth: this.lineWidth,
            from: this.pendingFrom,
            to: this.pendingTo,
        });
    }
}

describe('grid export helpers', () => {
    it('draws non-transparent beads without allocating per-pixel slices', () => {
        const context = new FakeGridContext();
        const data = new Uint8ClampedArray([
            255, 0, 0, 255, 0, 255, 0, 0,
            0, 0, 255, 128, 10, 20, 30, 255,
        ]);

        drawGridExportPattern(context, data, 2, 2, {
            cellSize: 10,
            beadsPerBoard: 2,
        });

        expect(
            context.operations.filter((operation) => operation.type === 'fillRect')
        ).toEqual([
            {
                type: 'fillRect',
                fillStyle: 'rgba(255, 0, 0, 1)',
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            },
            {
                type: 'fillRect',
                fillStyle: 'rgba(0, 0, 255, 0.5019607843137255)',
                x: 0,
                y: 10,
                width: 10,
                height: 10,
            },
            {
                type: 'fillRect',
                fillStyle: 'rgba(10, 20, 30, 1)',
                x: 10,
                y: 10,
                width: 10,
                height: 10,
            },
        ]);
    });

    it('draws cell grid lines before thicker board separators', () => {
        const context = new FakeGridContext();

        drawGridExportPattern(
            context,
            new Uint8ClampedArray(3 * 2 * 4),
            3,
            2,
            {
                cellSize: 5,
                beadsPerBoard: 2,
            }
        );

        const lines = context.operations.filter(
            (operation): operation is Extract<DrawOperation, { type: 'line' }> =>
                operation.type === 'line'
        );

        expect(lines.slice(0, 7)).toEqual([
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.15)',
                lineWidth: 1,
                from: [0, 0],
                to: [0, 10],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.15)',
                lineWidth: 1,
                from: [5, 0],
                to: [5, 10],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.15)',
                lineWidth: 1,
                from: [10, 0],
                to: [10, 10],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.15)',
                lineWidth: 1,
                from: [15, 0],
                to: [15, 10],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.15)',
                lineWidth: 1,
                from: [0, 0],
                to: [15, 0],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.15)',
                lineWidth: 1,
                from: [0, 5],
                to: [15, 5],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.15)',
                lineWidth: 1,
                from: [0, 10],
                to: [15, 10],
            },
        ]);

        expect(lines.slice(7)).toEqual([
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.6)',
                lineWidth: 3,
                from: [0, 0],
                to: [0, 10],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.6)',
                lineWidth: 3,
                from: [10, 0],
                to: [10, 10],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.6)',
                lineWidth: 3,
                from: [0, 0],
                to: [15, 0],
            },
            {
                type: 'line',
                strokeStyle: 'rgba(0, 0, 0, 0.6)',
                lineWidth: 3,
                from: [0, 10],
                to: [15, 10],
            },
        ]);
    });
});
