import type { SiteLocale } from '../i18n/locales';

const notices: Record<SiteLocale, string> = {
    en: 'Unofficial Creeper fan-art pattern by Fuse Bead Patterns. Not approved by or associated with Mojang or Microsoft. Minecraft and Creeper rights belong to Mojang/Microsoft.',
    de: 'Inoffizielle Creeper-Fan-Art-Vorlage von Fuse Bead Patterns. Nicht von Mojang oder Microsoft genehmigt und nicht mit ihnen verbunden. Die Rechte an Minecraft und Creeper liegen bei Mojang/Microsoft.',
    fr: 'Modèle non officiel du Creeper, créé par Fuse Bead Patterns en tant que fan art. Il n’est ni approuvé par Mojang ou Microsoft, ni associé à ces sociétés. Minecraft et le Creeper appartiennent à Mojang/Microsoft.',
    ja: 'Fuse Bead Patternsによる、クリーパーの非公式ファンアート図案です。MojangまたはMicrosoftの承認・提携はありません。Minecraftとクリーパーの権利はMojang/Microsoftに帰属します。',
};

export function getPatternFanArtNotice(pattern: { id: string }, locale: SiteLocale = 'en'): string | null {
    return pattern.id === 'minecraft-creeper-face-v1' ? notices[locale] : null;
}
