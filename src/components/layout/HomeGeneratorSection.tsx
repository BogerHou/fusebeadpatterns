import type { ReactNode } from 'react';
import { localizedHomeCopy } from '@/lib/i18n/home';
import type { SiteLocale } from '@/lib/i18n/locales';

export type HomeGeneratorSectionProps = {
    locale: SiteLocale;
    children: ReactNode;
    notice?: ReactNode;
};

/** The website and extension share the same workspace frame and labels. */
export default function HomeGeneratorSection({ locale, children, notice }: HomeGeneratorSectionProps) {
    const native = locale === 'en' ? undefined : localizedHomeCopy[locale];

    return (
        <section id="generator" aria-label={native?.workspace ?? 'Pattern generator'} className="home-generator">
            <div className="generator-label"><span className="eyebrow">{native?.workspace ?? 'Your workspace'}</span><span>{native?.flow ?? 'Upload → Adjust → Make'}</span></div>
            {notice}
            {children}
        </section>
    );
}
