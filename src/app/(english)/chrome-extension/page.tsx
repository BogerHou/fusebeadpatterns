import ChromeExtensionPage, { chromeExtensionMetadata } from '@/components/chrome-extension/ChromeExtensionPage';

export const metadata = chromeExtensionMetadata('en');

export default function Page() {
    return <ChromeExtensionPage locale="en" />;
}
