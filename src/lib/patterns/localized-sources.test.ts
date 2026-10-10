import { describe, expect, it } from 'vitest';
import { patterns } from './catalog';
import { localizePatternSourceDescription } from './localized-sources';

const locales = ['de', 'fr', 'ja'] as const;
const sourcedPatterns = patterns.filter(pattern => pattern.source !== null);
const descriptions = [...new Set(sourcedPatterns.map(pattern => pattern.source!.description))];
// Match an official bead/pattern claim itself, not an official identity article
// followed by a separate sentence declaring that the authored chart is 非公式.
const unsupportedSourceClaims = /offizielle Bügelperlen|autorisé gratuitement|modèle officiel|(?<!非)公式(?:の)?(?:アイロン)?(?:ビーズ(?:図案|パターン)?|図案|パターン)|実物.*検証済み|CC0|Creative Commons|iron-tested/i;

function sourceFor(id: string): string {
    const source = patterns.find(pattern => pattern.id === id)?.source;
    if (!source) throw new Error(`Expected a real catalog source for ${id}`);
    return source.description;
}

describe('reviewed native-language pattern source descriptions', () => {
    it('covers every actual catalog source in all three languages without changing the source records', () => {
        const before = JSON.stringify(patterns.map(pattern => pattern.source));
        expect(sourcedPatterns).toHaveLength(99);
        expect(descriptions).toHaveLength(44);
        const earlierSources = sourcedPatterns.filter(pattern => pattern.id !== 'minecraft-creeper-face-v1');
        expect(earlierSources).toHaveLength(98);
        expect(new Set(earlierSources.map(pattern => pattern.source!.description)).size).toBe(43);
        for (const pattern of sourcedPatterns) for (const locale of locales) {
            const description = pattern.source!.description;
            const translated = localizePatternSourceDescription(description, locale);
            expect(translated.trim()).toBe(translated);
            expect(translated.length).toBeGreaterThan(20);
            expect(translated).not.toBe(description);
            expect(translated).not.toMatch(/Based on|identifies this|The isolated native sprite/);
            if (locale === 'ja') expect(translated).toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
        }
        expect(JSON.stringify(patterns.map(pattern => pattern.source))).toBe(before);
    });

    it('retains the real editions, versions, dimensions and source attribution', () => {
        const retainedNames = ['Java Edition', 'Minecraft', 'Super Mario Bros.', 'Super Mario Wiki', 'Kirby’s Adventure', 'WiKirby', 'NES', 'Nestopia', 'The Spriters Resource'];
        for (const description of descriptions) for (const locale of locales) {
            const translated = localizePatternSourceDescription(description, locale);
            for (const name of retainedNames) if (description.includes(name)) expect(translated).toContain(name);
            for (const version of description.match(/\d+\.\d+\.\d+/g) ?? []) expect(translated).toContain(version);
        }
        for (const locale of locales) {
            expect(localizePatternSourceDescription(sourceFor('pokemon-pikachu-gen5'), locale)).toContain('32 × 32');
            expect(localizePatternSourceDescription(sourceFor('pokemon-pikachu-gen5'), locale)).toContain('Gen V');
            expect(localizePatternSourceDescription(sourceFor('sdv-blue-chicken'), locale)).toContain('3×');
            expect(localizePatternSourceDescription(sourceFor('smb-green-koopa-troopa'), locale)).toContain('2-1');
            expect(localizePatternSourceDescription(sourceFor('smb-goomba-smb3'), locale)).toContain('Super Mario Bros. 3');
        }
    });

    it('keeps community archives and screenshots distinct from official or tested bead patterns', () => {
        const concepts = {
            de: { community: /Community/, screenshot: /Screenshot/, transparent: /transparent/i, noInterpolation: /ohne Interpolation/, archive: /archiviert/i },
            fr: { community: /communauté/, screenshot: /capture d’écran/, transparent: /transparent/i, noInterpolation: /sans interpolation/, archive: /archivé/i },
            ja: { community: /コミュニティ/, screenshot: /スクリーンショット/, transparent: /透明/, noInterpolation: /補間せず/, archive: /アーカイブ/ },
        };
        for (const locale of locales) {
            const words = concepts[locale];
            expect(localizePatternSourceDescription(sourceFor('sdv-blue-chicken'), locale)).toMatch(words.community);
            expect(localizePatternSourceDescription(sourceFor('sdv-blue-chicken'), locale)).toMatch(words.noInterpolation);
            expect(localizePatternSourceDescription(sourceFor('pokemon-pikachu-gen5'), locale)).toMatch(words.archive);
            expect(localizePatternSourceDescription(sourceFor('pokemon-pikachu-gen5'), locale)).toMatch(words.transparent);
            for (const id of ['smb-green-koopa-troopa', 'smb-red-cheep-cheep', 'smb-blooper']) {
                expect(localizePatternSourceDescription(sourceFor(id), locale)).toMatch(words.screenshot);
            }
            for (const description of descriptions) {
                const translated = localizePatternSourceDescription(description, locale);
                expect(translated).not.toMatch(unsupportedSourceClaims);
            }
        }
    });

    it('still rejects Japanese official-pattern claims without misreading unofficial fan-art disclosures', () => {
        for (const claim of ['Minecraft公式図案です。', '公式のビーズ図案です。', '公式アイロンビーズ図案です。']) {
            expect(claim).toMatch(unsupportedSourceClaims);
        }
        for (const disclosure of [
            'Minecraft公式記事はキャラクターの確認用です。これは非公式図案です。',
            'Minecraft公式記事を参照した非公式ビーズ図案です。',
            localizePatternSourceDescription(sourceFor('minecraft-creeper-face-v1'), 'ja'),
        ]) expect(disclosure).not.toMatch(unsupportedSourceClaims);
    });

    it('preserves static frames, transparency and the flat block-face limitation', () => {
        const concepts = {
            de: { static: /statisch/, transparentCorners: /transparenten Eckpixel/, flat: /flach/, not3d: /kein dreidimensionales Modell/ },
            fr: { static: /image fixe/, transparentCorners: /pixels transparents.*coins/, flat: /plane/, not3d: /non un modèle en trois dimensions/ },
            ja: { static: /静止画/, transparentCorners: /角の透明なピクセル/, flat: /平面/, not3d: /立体モデルではありません/ },
        };
        for (const locale of locales) {
            for (const id of ['smb-super-star', 'smb-fire-flower', 'smb-question-block']) {
                expect(localizePatternSourceDescription(sourceFor(id), locale)).toMatch(concepts[locale].static);
            }
            expect(localizePatternSourceDescription(sourceFor('smb-question-block'), locale)).toMatch(concepts[locale].transparentCorners);
            const block = localizePatternSourceDescription(sourceFor('minecraft-tnt-side-1-21-1'), locale);
            expect(block).toMatch(concepts[locale].flat);
            expect(block).toMatch(concepts[locale].not3d);
        }
    });

    it('rejects unreviewed descriptions and changed provenance instead of inventing a translation', () => {
        const known = sourceFor('minecraft-emerald-1-21-1');
        const unreviewed = [
            '',
            'A new official bead pattern.',
            known.replace('1.21.1', '1.21.2'),
            known.replace('Java Edition', 'Bedrock Edition'),
            known.replace('Emerald', 'Creeper'),
            `${known} Licensed for unrestricted redistribution.`,
            ` ${known}`,
        ];
        for (const description of unreviewed) for (const locale of locales) {
            expect(() => localizePatternSourceDescription(description, locale)).toThrow(`Untranslated ${locale} pattern source:`);
        }
    });
    it('distinguishes hand-authored Creeper fan art from a licensed official texture in every language', () => {
        const description = 'Hand-authored Creeper face fan art with a simplified green-and-black bead palette. The official Minecraft article is a character identity reference, not a licensed source file. This unofficial pattern is by Fuse Bead Patterns and is not approved by or associated with Mojang or Microsoft. Character rights belong to Mojang/Microsoft; permission for public redistribution is unconfirmed.';
        const concepts = {
            de: { drawn: /Von Hand/, unofficial: /inoffizielle/, permission: /Weiterverbreitung ist nicht bestätigt/, notLicensed: /nicht als lizenzierte Quelldatei/ },
            fr: { drawn: /dessiné à la main/, unofficial: /non officiel/, permission: /redistribution publique n’est pas confirmée/, notLicensed: /pas de fichier source sous licence/ },
            ja: { drawn: /手作業/, unofficial: /非公式/, permission: /再配布の許可は確認されていません/, notLicensed: /使用許諾された画像素材ではありません/ },
        };
        for (const locale of locales) {
            const translated = localizePatternSourceDescription(description, locale);
            for (const word of Object.values(concepts[locale])) expect(translated).toMatch(word);
            for (const name of ['Minecraft', 'Fuse Bead Patterns', 'Mojang', 'Microsoft']) expect(translated).toContain(name);
            expect(() => localizePatternSourceDescription(description.replace('unconfirmed', 'confirmed'), locale)).toThrow('Untranslated');
            expect(() => localizePatternSourceDescription(description.replace('Hand-authored', 'Official'), locale)).toThrow('Untranslated');
        }
    });
});
