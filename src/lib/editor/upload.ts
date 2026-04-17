export function getFirstImageFile(
    files: ArrayLike<File> | null | undefined
): File | null {
    if (!files) {
        return null;
    }

    for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
            return file;
        }
    }

    return null;
}
