import LoomPatternLibrary from '@/components/bead-loom/LoomPatternLibrary';
import { loomPatternLibraryMetadata } from '@/lib/bead-loom/pattern-library-content';

export const metadata = loomPatternLibraryMetadata('fr');
export default function FrenchBeadLoomPatternsPage() { return <LoomPatternLibrary locale="fr" />; }
