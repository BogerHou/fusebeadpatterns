import ChromeExtensionPage, { chromeExtensionMetadata } from '@/components/chrome-extension/ChromeExtensionPage';

export const metadata = chromeExtensionMetadata('ja');

export default function Page() {
    return <ChromeExtensionPage locale="ja" />;
}
