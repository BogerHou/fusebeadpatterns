/** Keep the active global 404 title in sync when Next writes its server metadata. */
export function maintainNotFoundTitle(expectedTitle: string): () => void {
    const boundary = document.querySelector('[data-not-found-recovery]');
    let active = true;
    const synchronize = () => {
        // The boundary can disappear before passive-effect cleanup when a normal
        // page replaces the 404. Never overwrite that page's metadata.
        if (active && boundary?.isConnected && document.querySelector('[data-not-found-recovery]') === boundary && document.title !== expectedTitle) {
            document.title = expectedTitle;
        }
    };
    const observer = new MutationObserver(synchronize);
    // Observe the document root so replacing the entire head cannot detach the
    // title watcher. It remains scoped to the connected 404 boundary above.
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    synchronize();
    return () => {
        active = false;
        observer.disconnect();
    };
}
