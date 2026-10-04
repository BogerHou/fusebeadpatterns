import { PatternGrid, toPatternCard } from '@/components/patterns/PatternCards';
import { getPatternById } from '@/lib/patterns/catalog';
import styles from './GuidePatternGallery.module.css';

export default function GuidePatternGallery({ patternIds }: { patternIds: string[] }) {
    const cards = patternIds.map((id) => {
        const pattern = getPatternById(id);

        if (!pattern) {
            throw new Error(`Guide pattern not found: ${id}`);
        }

        return toPatternCard(pattern);
    });

    return (
        <div className={styles.gallery}>
            <PatternGrid patterns={cards} headingLevel={3} />
        </div>
    );
}
