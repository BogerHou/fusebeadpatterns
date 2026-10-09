import LoomPatternLibrary from '@/components/bead-loom/LoomPatternLibrary';
import { loomPatternLibraryMetadata } from '@/lib/bead-loom/pattern-library-content';

export const metadata = loomPatternLibraryMetadata('de');
export default function GermanBeadLoomPatternsPage() { return <LoomPatternLibrary locale="de" />; }
