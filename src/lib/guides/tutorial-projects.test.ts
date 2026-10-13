import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getGuideBySlug } from '../../app/(english)/guides/guide-data';
import { loadLibraryEditorProject } from '../editor/library-project';
import { parseEditorProject, serializeEditorProject } from '../editor/draft';
import { consumeEditorLocaleDraft, saveEditorLocaleDraft } from '../editor/locale-navigation';
import { SITE_LOCALES } from '../i18n/locales';
import { getLocaleDestination } from '../i18n/routes';
import { getLibraryProject } from '../patterns/project-links';
import { getLocalizedGuide } from './localized';
import { getTutorialLibraryProject, localizeTutorialEditorLink, tutorialEditorLink, tutorialProjects } from './tutorial-projects';

// Frozen public files: direct opening must not recreate or requantize them.
const fixtureHashes = [
    '1bf31c9b44eefdc8000884ec2725c9883a94661ca2ff6855d34623706378948c',
    '0b42240b85ca0b16452cfca3231510a9df6700ba219f1ed7c44df65f1255e6da',
    '73a147022b2c0c5b0ea74a439c82596a7a2153724e6503eeef7968871d138938',
    'c8523df7482246e841102cbbbb0f7024fa49fe9dc8eb76f61d3283d7a2a0dfda',
];
const readExample = (url: string) => readFileSync(resolve(process.cwd(), `public${url}`), 'utf8');

describe('fixed tutorial projects', () => {
    it.each(tutorialProjects.map((example, index) => ({ ...example, hash: fixtureHashes[index] })))
    ('opens the original $id through the guarded library loader', async (example) => {
        const raw = readExample(example.projectUrl);
        expect(createHash('sha256').update(raw).digest('hex')).toBe(example.hash);
        const expected = parseEditorProject(raw)!;
        expect(expected).not.toBeNull();
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(raw));
        const signal = new AbortController().signal;
        const restored = await loadLibraryEditorProject(example.id, signal, fetchProject);
        expect(fetchProject).toHaveBeenCalledExactlyOnceWith(example.projectUrl, { signal, credentials: 'omit', redirect: 'error' });
        expect(restored).toEqual(expected);
        expect(parseEditorProject(serializeEditorProject(restored))).toEqual(expected);
    });

    it.each(SITE_LOCALES)('offers native editor actions and retains project downloads in %s', (locale) => {
        for (const slug of ['photo-to-perler-bead-pattern', 'beadifier-alternative']) {
            const guide = locale === 'en' ? getGuideBySlug(slug)! : getLocalizedGuide(slug, locale)!;
            const links = guide.sections.flatMap(section => section.links ?? []);
            const examples = slug === 'beadifier-alternative' ? tutorialProjects.slice(2) : tutorialProjects;
            for (const example of examples) {
                const expected = tutorialEditorLink(example.id, locale);
                const editorLinks = links.filter(link => link.href === expected.href);
                expect(editorLinks.length).toBeGreaterThan(0);
                for (const link of editorLinks) {
                    expect(link.label).toBe(example.openLabels[locale]);
                    expect(link.prefetch).toBe(false);
                    expect(link.download).not.toBe(true);
                }
                expect(links.some(link => link.href === example.projectUrl && link.download === true)).toBe(true);
                expect(getLibraryProject(example.id, locale)).toEqual({ id: example.id, projectUrl: example.projectUrl, title: example.titles[locale], kind: 'tutorial' });
                const location = new URL(expected.href, 'https://fusebeadpatterns.art');
                for (const target of SITE_LOCALES) {
                    expect(getLocaleDestination(location.pathname, target, { search: location.search })).toEqual({ href: tutorialEditorLink(example.id, target).href, isFallback: false });
                }
            }
        }
    });

    it('keeps the edited rocket pixels and accepted example when switching language', () => {
        const example = tutorialProjects[3];
        const draft = parseEditorProject(readExample(example.projectUrl))!;
        for (const locale of SITE_LOCALES) {
            const values = new Map<string, string>();
            const storage = {
                getItem: (key: string) => values.get(key) ?? null,
                setItem: (key: string, value: string) => { values.set(key, value); },
                removeItem: (key: string) => { values.delete(key); },
            };
            const href = tutorialEditorLink(example.id, locale).href;
            expect(saveEditorLocaleDraft(draft, href, storage, 1000, example.id)).toBe(true);
            const recovered = consumeEditorLocaleDraft(href, storage, 1001)!;
            expect(recovered.draft).toEqual(draft);
            expect(recovered.acceptedPatternId).toBe(example.id);
            expect(consumeEditorLocaleDraft(href, storage, 1002)).toBeNull();
        }
    });

    it.each(['tutorial-cat-29-extra', '/guides/photo-to-pattern/cat-perler-29.bead-pattern.json', 'https://example.com/project.json', '__proto__', 'tutorial-cat-29&url=other'])
    ('does not turn unrecognized tutorial input into a fetch: %s', async (id) => {
        expect(getTutorialLibraryProject(id)).toBeUndefined();
        expect(getLibraryProject(id)).toBeUndefined();
        const fetchProject = vi.fn<typeof fetch>();
        await expect(loadLibraryEditorProject(id, new AbortController().signal, fetchProject)).rejects.toThrow('not in the library');
        expect(fetchProject).not.toHaveBeenCalled();
        expect(localizeTutorialEditorLink({ href: `/editor?pattern=${id}`, label: 'Unknown' }, 'ja')).toBeUndefined();
    });
});
