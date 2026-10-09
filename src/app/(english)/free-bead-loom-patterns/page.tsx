import LoomPatternLibrary from '@/components/bead-loom/LoomPatternLibrary';
import { loomPatternLibraryMetadata } from '@/lib/bead-loom/pattern-library-content';

export const metadata = loomPatternLibraryMetadata('en');
export default function FreeBeadLoomPatternsPage() { return <LoomPatternLibrary locale="en" />; }
