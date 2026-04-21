import {
    countBeads,
    hasUsageUnderPercent,
    removeColorUnderPercent,
} from '../core/utils/utils';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { Color } from '../core/model/color/color.model';

function clonePaletteEntry(entry: PaletteEntry): PaletteEntry {
    const cloned = new PaletteEntry(
        entry.name,
        new Color(
            entry.color.r,
            entry.color.g,
            entry.color.b,
            entry.color.a
        )
    );
    cloned.ref = entry.ref;
    cloned.symbol = entry.symbol;
    cloned.prefix = entry.prefix;
    cloned.enabled = entry.enabled;
    return cloned;
}

export function clonePalettes(palettes: Palette[]): Palette[] {
    return palettes.map(
        (palette) =>
            new Palette(
                palette.name,
                palette.entries.map((entry) => clonePaletteEntry(entry))
            )
    );
}

export function mergePaletteEnabledState(
    nextPalettes: Palette[],
    previousPalettes: Palette[]
): Palette[] {
    const previousState = new Map<string, boolean>();

    previousPalettes.forEach((palette) => {
        palette.entries.forEach((entry) => {
            previousState.set(`${palette.name}::${entry.ref}`, entry.enabled);
        });
    });

    return clonePalettes(nextPalettes).map((palette) => {
        palette.entries.forEach((entry) => {
            const key = `${palette.name}::${entry.ref}`;
            const enabled = previousState.get(key);
            if (enabled !== undefined) {
                entry.enabled = enabled;
            }
        });

        return palette;
    });
}

export function countEnabledEntries(palettes: Palette[]): number {
    return palettes.reduce(
        (total, palette) =>
            total +
            palette.entries.filter((entry) => entry.enabled).length,
        0
    );
}

export function enablePaletteEntry(
    palettes: Palette[],
    paletteName: string,
    ref: string
): Palette[] {
    const nextPalettes = clonePalettes(palettes);
    const palette = nextPalettes.find((item) => item.name === paletteName);
    const entry = palette?.entries.find((item) => item.ref === ref);

    if (entry) {
        entry.enabled = true;
    }

    return nextPalettes;
}

export function findPaletteEntryByRef(
    palettes: Palette[],
    ref: string
): PaletteEntry | undefined {
    return palettes.flatMap((palette) => palette.entries).find((entry) => {
        return entry.ref === ref;
    });
}

export function getAutomaticEditorColorRef(
    usage: Map<string, number>,
    palettes: Palette[]
): string | null {
    const enabledEntries = palettes
        .flatMap((palette) => palette.entries)
        .filter((entry) => entry.enabled);

    if (enabledEntries.length === 0) {
        return null;
    }

    const enabledRefs = new Set(enabledEntries.map((entry) => entry.ref));
    const matchingUsage = Array.from(usage.entries())
        .sort((left, right) => right[1] - left[1])
        .find(([ref]) => enabledRefs.has(ref));

    return matchingUsage?.[0] ?? enabledEntries[0].ref;
}

export function togglePaletteEntry(
    palettes: Palette[],
    paletteName: string,
    ref: string,
    enabled: boolean
): Palette[] {
    const nextPalettes = clonePalettes(palettes);
    const palette = nextPalettes.find((item) => item.name === paletteName);
    const entry = palette?.entries.find((item) => item.ref === ref);

    if (!palette || !entry) {
        return nextPalettes;
    }

    entry.enabled = enabled;

    if (countEnabledEntries(nextPalettes) === 0) {
        return clonePalettes(palettes);
    }

    return nextPalettes;
}

export function togglePaletteGroup(
    palettes: Palette[],
    paletteName: string,
    enabled: boolean
): Palette[] {
    const nextPalettes = clonePalettes(palettes);
    const palette = nextPalettes.find((item) => item.name === paletteName);

    if (!palette) {
        return nextPalettes;
    }

    palette.entries.forEach((entry) => {
        entry.enabled = enabled;
    });

    if (countEnabledEntries(nextPalettes) === 0) {
        return clonePalettes(palettes);
    }

    return nextPalettes;
}

export function disableUsageColor(
    palettes: Palette[],
    ref: string
): Palette[] {
    const nextPalettes = clonePalettes(palettes);

    nextPalettes.forEach((palette) => {
        palette.entries.forEach((entry) => {
            if (entry.ref === ref) {
                entry.enabled = false;
            }
        });
    });

    if (countEnabledEntries(nextPalettes) === 0) {
        return clonePalettes(palettes);
    }

    return nextPalettes;
}

export function removeLowUsageColors(
    palettes: Palette[],
    usage: Map<string, number>,
    percent: number
): Palette[] {
    if (!hasUsageUnderPercent(percent, usage)) {
        return clonePalettes(palettes);
    }

    const nextPalettes = clonePalettes(palettes);
    removeColorUnderPercent(percent, usage, nextPalettes);

    if (countEnabledEntries(nextPalettes) === 0 || countBeads(usage) === 0) {
        return clonePalettes(palettes);
    }

    return nextPalettes;
}
