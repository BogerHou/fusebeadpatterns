import type { Metadata } from 'next';
import Editor from '@/components/editor/Editor';

export const metadata: Metadata = {
    title: 'Bügelperlen-Editor | Fuse Bead Patterns',
    description: 'Bearbeite deine Bügelperlen-Vorlage: Perlen zeichnen, Farben wechseln, Flächen füllen und das fertige Muster speichern.',
    alternates: { canonical: '/de/editor' },
    robots: { index: false, follow: true },
};
export default function GermanEditor() { return <Editor mode="editor" locale="de" />; }
