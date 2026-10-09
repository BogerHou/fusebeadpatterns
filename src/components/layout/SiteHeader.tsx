import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { siteNavigation, type SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import LanguageSwitcher from './LanguageSwitcher';
import ToolMenu from './ToolMenu';
import styles from './LanguageSwitcher.module.css';

type SiteHeaderSection = 'generator' | 'patterns' | 'editor' | 'guides' | 'about';

type SiteHeaderProps = {
    active?: SiteHeaderSection;
    locale?: SiteLocale;
};

type HeaderLink = {
    id: SiteHeaderSection;
    label: string;
    href: string;
    prefetch?: false;
    hrefLang?: SiteLocale;
};

export default function SiteHeader({ active, locale = 'en' }: SiteHeaderProps) {
    const copy = siteNavigation[locale];
    const routes = localeRoutes[locale];
    const navItems: HeaderLink[] = [
        { id: 'generator', label: copy.generator, href: routes.home },
        { id: 'patterns', label: copy.patterns, href: routes.patterns },
        { id: 'editor', label: copy.editor, href: routes.editor, prefetch: false },
        { id: 'guides', label: copy.guides, href: routes.guides },
        { id: 'about', label: copy.about, href: routes.about },
    ];
    return (
        <header className="site-header">
            <a href="#main-content" className="skip-link">{copy.skip}</a>
            <div className={`site-header-inner ${styles.headerInner}`}>
                <Link href={routes.home} className={`site-brand ${styles.brand}`}>
                    <Image src="/logo.png" alt="Fuse Bead Patterns Logo" width={36} height={36} sizes="36px" preload />
                    <span className="site-brand-name">Fuse Bead Patterns<span className="text-accent" aria-hidden="true">.</span></span>
                </Link>
                <nav className={`site-nav ${styles.navigation}`} aria-label={copy.main}>
                    {navItems.map((item) => (
                        <Fragment key={item.id}>
                            <Link href={item.href} hrefLang={item.hrefLang} prefetch={item.prefetch} aria-label={item.label} aria-current={item.id === active ? 'page' : undefined}>
                                {item.label}
                            </Link>
                            {item.id === 'generator' ? <ToolMenu locale={locale} /> : null}
                        </Fragment>
                    ))}
                </nav>
                <LanguageSwitcher locale={locale} className={styles.headerSwitcher} />
            </div>
        </header>
    );
}
