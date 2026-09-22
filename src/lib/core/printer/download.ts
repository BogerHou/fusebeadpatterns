/** Trigger a browser download and release its temporary resources. */
export function downloadBlob(blob: Blob, filename: string): void {
    const anchor = document.createElement('a');
    const url = URL.createObjectURL(blob);

    try {
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
    } finally {
        anchor.remove();
        // Give the browser time to consume the URL before releasing the file.
        setTimeout(() => URL.revokeObjectURL(url), 1_000);
    }
}
