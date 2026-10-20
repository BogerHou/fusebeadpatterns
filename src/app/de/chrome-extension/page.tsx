import ChromeExtensionPage, { chromeExtensionMetadata } from '@/components/chrome-extension/ChromeExtensionPage';

export const metadata = chromeExtensionMetadata('de');

export default function Page() {
    return <ChromeExtensionPage locale="de" />;
}
