import { describe, expect, it } from 'vitest';
import { SITE_LOCALES } from '../i18n/locales';
import { getProjectOpenCopy } from './project-open-copy';

describe('project open copy', () => {
    it('keeps both existing English error messages unchanged', () => {
        expect(getProjectOpenCopy('en').invalid).toBe('Could not open project file. Choose a bead-pattern project JSON file.');
        expect(getProjectOpenCopy('en').readError).toBe('Could not read project file.');
    });

    it.each(SITE_LOCALES)('%s provides all four messages without an English fallback', locale => {
        const copy = getProjectOpenCopy(locale);
        expect(Object.keys(copy).sort()).toEqual(['replaceConfirm', 'busy', 'invalid', 'readError'].sort());
        for (const [key, value] of Object.entries(copy)) {
            expect(value.trim().length).toBeGreaterThan(10);
            if (locale !== 'en') expect(value).not.toBe(getProjectOpenCopy('en')[key as keyof typeof copy]);
        }
        expect(copy.invalid).not.toBe(copy.readError);
    });

    it.each([
        { locale: 'en' as const, parts: ['current pattern', 'original image', 'settings', 'clears Undo/Redo history', 'Save a project copy first', 'project files do not save that history', 'Cancel keeps'], retry: ['Wait', 'finish', 'try opening'] },
        { locale: 'de' as const, parts: ['aktuelle Vorlage', 'Originalbild', 'Einstellungen', 'Rückgängig und Wiederholen wird gelöscht', 'vorher eine Projektkopie', 'Projektdateien enthalten diesen Verlauf nicht', 'Abbrechen behält'], retry: ['Warte', 'abgeschlossen', 'erneut'] },
        { locale: 'fr' as const, parts: ['modèle actuel', 'image originale', 'réglages', 'efface l’historique d’annulation et de rétablissement', 'd’abord une copie du projet', 'ne conservent pas cet historique', 'Annuler conserve'], retry: ['Attendez', 'fin', 'réessayez'] },
        { locale: 'ja' as const, parts: ['現在の図案', '元の画像', '設定', '「元に戻す・やり直す」の履歴を消去', '先にプロジェクトのコピー', '履歴は含まれません', 'キャンセルすると現在の作業を保持'], retry: ['現在の処理', '完了', 'もう一度'] },
    ])('$locale explains replacement, history loss, saving limits, cancellation and retry', ({ locale, parts, retry }) => {
        const copy = getProjectOpenCopy(locale);
        for (const part of parts) expect(copy.replaceConfirm).toContain(part);
        for (const part of retry) expect(copy.busy).toContain(part);
    });
});
