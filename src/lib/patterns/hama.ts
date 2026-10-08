import selection from './hama.json';

// A separate, fixed set of brand variants. Original library IDs and files stay stable.
export const hamaPatterns = selection.patterns.map(({ id, name }) => {
    const directory = `/patterns-hama/${id}`;
    return {
        id,
        name,
        projectId: `${id}-hama`,
        preview: `${directory}/preview.png`,
        pdfA4: `${directory}/pattern-a4.pdf`,
        pdfLetter: `${directory}/pattern-letter.pdf`,
        project: `${directory}/pattern.bead-pattern.json`,
    };
});

export const hamaUpdatedAt = selection.updatedAt;
