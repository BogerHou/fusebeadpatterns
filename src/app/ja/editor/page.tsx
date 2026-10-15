import type { Metadata } from 'next';
import Editor from '@/components/editor/Editor';
import AdSenseScript from '@/components/analytics/AdSenseScript';

export const metadata: Metadata = {
    title: 'アイロンビーズ図案エディター | Fuse Bead Patterns',
    description: 'アイロンビーズの図案をマスごとに編集。描画、塗りつぶし、消しゴム、ブランドの配色変更を使って図案を保存できます。',
    alternates: { canonical: '/ja/editor' },
    robots: { index: false, follow: true },
};
export default function JapaneseEditor() { return <><AdSenseScript /><Editor mode="editor" locale="ja" /></>; }
