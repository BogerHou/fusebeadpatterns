import type { GuideSection } from '../../app/(english)/guides/guide-data';
import type { TranslatedGuideSlug } from './routes';

// Asset paths, dimensions, pattern IDs and source URLs stay in the original data.
export type GuideCopy = {
    title: string; description: string; eyebrow: string; intro: string;
    sections: Array<Pick<GuideSection, 'heading' | 'body' | 'bullets' | 'table'> & {
        figure?: { alt: string; caption: string };
        comparison?: Array<{ alt: string; caption: string }>;
    }>;
};
export type GuideTranslations = Record<TranslatedGuideSlug, GuideCopy>;
