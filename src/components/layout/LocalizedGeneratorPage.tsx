import HomePage from './HomePage';
import { localizedHomeCopy, type TranslatedLocale } from '@/lib/i18n/home';

export default function LocalizedGeneratorPage({ locale, structuredData }: { locale: TranslatedLocale; structuredData?: Record<string, unknown> }) {
    const copy = localizedHomeCopy[locale];
    const schema = structuredData ?? {
        '@context': 'https://schema.org', '@type': 'WebApplication',
        name: copy.heading, description: copy.description,
        url: `https://fusebeadpatterns.art/${locale}`, inLanguage: locale,
        applicationCategory: 'DesignApplication', operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };
    return <HomePage locale={locale} structuredData={schema} />;
}
