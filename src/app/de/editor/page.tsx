import type { Metadata } from 'next';
import Editor from '@/components/editor/Editor';
import AdSenseScript from '@/components/analytics/AdSenseScript';

export const metadata: Metadata = {
    title: 'Bügelperlen-Editor | Fuse Bead Patterns',
    description: 'Bearbeite deine Bügelperlen-Vorlage: Perlen zeichnen, Farben wechseln, Flächen füllen und das fertige Muster speichern.',
    alternates: { canonical: '/de/editor' },
    robots: { index: false, follow: true },
};
export default function GermanEditor() { return <><AdSenseScript /><Editor mode="editor" locale="de" /></>; }
