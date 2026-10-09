import LoomPatternLibrary from '@/components/bead-loom/LoomPatternLibrary';
import { loomPatternLibraryMetadata } from '@/lib/bead-loom/pattern-library-content';

export const metadata = loomPatternLibraryMetadata('ja');
export default function JapaneseBeadLoomPatternsPage() { return <LoomPatternLibrary locale="ja" />; }
