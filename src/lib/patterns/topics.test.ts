import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEditorProject } from '../editor/draft';
import { patternCollections, patterns } from './catalog';
import { getPatternsForTopic, getAdditionalPatternsForTopic, getPatternTopicBySlug, patternTopics } from './topics';

describe('curated pattern topics', () => {
    it('adds distinct routes and only links existing, non-duplicated library patterns', () => {
        const existingRoutes = new Set([...patterns, ...patternCollections].map(({ slug }) => slug));
        expect(new Set(patternTopics.map(({ slug }) => slug)).size).toBe(patternTopics.length);
        for (const topic of patternTopics) {
            expect(existingRoutes.has(topic.slug)).toBe(false);
            expect(topic.patternIds.length).toBeGreaterThan(0);
            expect(new Set(topic.patternIds).size).toBe(topic.patternIds.length);
            expect(getPatternsForTopic(topic).map(({ id }) => id)).toEqual(topic.patternIds);
            const additional = getAdditionalPatternsForTopic(topic);
            const allIds = [...topic.patternIds, ...additional.map(pattern => pattern.id)];
            expect(new Set(allIds).size).toBe(allIds.length);
        }
        expect(getPatternTopicBySlug('missing')).toBeUndefined();
    });

    it('keeps every easy selection within four colors and one midi board, with no detached pieces', async () => {
        const topic = getPatternTopicBySlug('easy')!;
        for (const pattern of getPatternsForTopic(topic)) {
            expect(pattern.colorCount).toBeLessThanOrEqual(4);
            expect([pattern.gridWidth, pattern.gridHeight]).toEqual([29, 29]);
            expect(pattern.notes.join(' ')).not.toMatch(/thin one-bead connections|separate parts/i);

            const project = parseEditorProject(await readFile(path.join(process.cwd(), 'public', pattern.assets.project), 'utf8'))!;
            const grid = project.editedPattern!;
            const data = Buffer.from(grid.data, 'base64');
            const occupied = new Set<number>();
            for (let cell = 0; cell < grid.width * grid.height; cell++) {
                if (data[cell * 4 + 3] !== 0) occupied.add(cell);
            }
            expect(occupied.size).toBeGreaterThan(0);
            const queue = [occupied.values().next().value!];
            occupied.delete(queue[0]);
            while (queue.length > 0) {
                const cell = queue.pop()!;
                const x = cell % grid.width;
                const y = Math.floor(cell / grid.width);
                for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
                    if (nextX < 0 || nextX >= grid.width || nextY < 0 || nextY >= grid.height) continue;
                    const nextCell = nextY * grid.width + nextX;
                    if (occupied.delete(nextCell)) queue.push(nextCell);
                }
            }
            expect(occupied.size, `${pattern.id} contains a detached piece`).toBe(0);
        }
    });

    it('keeps the published Christmas selections and discloses the fine snowflake connections', async () => {
        const topic = getPatternTopicBySlug('christmas')!;
        expect(topic.patternIds).toEqual(['original-christmas-tree', 'original-snowman', 'original-gingerbread-man']);
        expect(topic.title).toBe('Christmas Perler Bead Patterns');
        expect(getAdditionalPatternsForTopic(topic).map(pattern => pattern.id)).toEqual(['original-santa-hat', 'original-christmas-stocking', 'original-snowflake', 'original-christmas-bauble-ornament']);
        for (const pattern of [...getPatternsForTopic(topic), ...getAdditionalPatternsForTopic(topic)]) {
            expect(pattern.source).toBeNull();
            expect(pattern.collectionId).toBeNull();
            expect(pattern.version).toMatch(/^Original .+ design v1$/);
            expect([pattern.gridWidth, pattern.gridHeight]).toEqual([29, 29]);
            expect(pattern.colorCount).toBeLessThanOrEqual(4);
            if (pattern.id === 'original-christmas-bauble-ornament') {
                expect(pattern.notes.join(' ')).toContain('Physical assembly, ironing, cord fit and hanging strength have not been tested');
            } else expect(pattern.notes.join(' ')).toContain('not been physically assembled or iron-tested');
            const draft = parseEditorProject(await readFile(path.join(process.cwd(), 'public', pattern.assets.project), 'utf8'))!;
            expect(draft.selectedPaletteIds).toEqual(['perler']);
            expect([draft.boardId, draft.boardWidth, draft.boardHeight]).toEqual(['midi', 1, 1]);
            const data = Buffer.from(draft.editedPattern!.data, 'base64');
            const occupied = new Set<number>();
            for (let cell = 0; cell < 29 * 29; cell++) if (data[cell * 4 + 3] !== 0) occupied.add(cell);
            expect(occupied.size).toBe(pattern.beads);
            // Keep the old robust designs, and independently count the disclosed fine branches.
            let cutPoints = 0;
            for (const removed of [undefined, ...occupied]) {
                const unvisited = new Set(occupied);
                if (removed !== undefined) unvisited.delete(removed);
                const queue = [unvisited.values().next().value!];
                unvisited.delete(queue[0]);
                while (queue.length) {
                    const cell = queue.pop()!;
                    const x = cell % 29, y = Math.floor(cell / 29);
                    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
                        if (nx < 0 || nx >= 29 || ny < 0 || ny >= 29) continue;
                        const next = ny * 29 + nx;
                        if (unvisited.delete(next)) queue.push(next);
                    }
                }
                if (removed === undefined) expect(unvisited.size, `${pattern.id} contains a detached part`).toBe(0);
                else if (unvisited.size) cutPoints += 1;
            }
            expect(cutPoints).toBe(pattern.id === 'original-snowflake' ? 104 : 0);
            if (cutPoints) expect(pattern.notes[0]).toContain('Fine one-bead snowflake branches');
        }
    });
});
