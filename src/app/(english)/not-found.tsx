import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

export default function NotFound() {
    return (
        <>
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="page-shell flex-1 py-20 sm:py-28">
                <p className="eyebrow mb-5">404 · A missing piece</p>
                <h1 className="page-heading">Page not found</h1>
                <p className="mt-6 max-w-xl leading-8 text-muted">This link doesn&apos;t lead to a page. Find a pattern in the library, or start a new design with the generator.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/patterns" className="button-primary">Browse patterns <span aria-hidden="true">↗</span></Link>
                    <Link href="/" className="button-secondary">Back to generator</Link>
                </div>
            </main>
            <SiteFooter />
        </>
    );
}
