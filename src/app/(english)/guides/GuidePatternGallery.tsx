import { PatternGrid, toPatternCard } from '@/components/patterns/PatternCards';
import { getPatternById } from '@/lib/patterns/catalog';
import type { SiteLocale } from '@/lib/i18n/locales';
import { toLocalizedPatternCard } from '@/components/patterns/LocalizedPatternCatalog';
import styles from './GuidePatternGallery.module.css';

export default function GuidePatternGallery({ patternIds, locale = 'en' }: { patternIds: string[]; locale?: SiteLocale }) {
    const cards = patternIds.map((id) => {
        const pattern = getPatternById(id);

        if (!pattern) {
            throw new Error(`Guide pattern not found: ${id}`);
        }

        return locale === 'en' ? toPatternCard(pattern) : toLocalizedPatternCard(pattern, locale);
    });

    return (
        <div className={styles.gallery}>
            <PatternGrid patterns={cards} headingLevel={3} />
        </div>
    );
}
