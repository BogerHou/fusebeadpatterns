import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEditorProject } from '../editor/draft';
import { patternCollections, patterns } from './catalog';
import { getPatternsForTopic, getPatternTopicBySlug, patternTopics } from './topics';

describe('curated pattern topics', () => {
    it('adds distinct routes and only links existing, non-duplicated library patterns', () => {
        const existingRoutes = new Set([...patterns, ...patternCollections].map(({ slug }) => slug));
        expect(new Set(patternTopics.map(({ slug }) => slug)).size).toBe(patternTopics.length);
        for (const topic of patternTopics) {
            expect(existingRoutes.has(topic.slug)).toBe(false);
            expect(topic.patternIds.length).toBeGreaterThan(0);
            expect(new Set(topic.patternIds).size).toBe(topic.patternIds.length);
            expect(getPatternsForTopic(topic).map(({ id }) => id)).toEqual(topic.patternIds);
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
});
