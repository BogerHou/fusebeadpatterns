import ChromeExtensionPage, { chromeExtensionMetadata } from '@/components/chrome-extension/ChromeExtensionPage';

export const metadata = chromeExtensionMetadata('fr');

export default function Page() {
    return <ChromeExtensionPage locale="fr" />;
}
