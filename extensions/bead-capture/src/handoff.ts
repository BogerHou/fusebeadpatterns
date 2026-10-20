export {};

const copy = {
    en: { heading: 'Your bead pattern', loading: 'Opening the website editor…', description: 'Your pattern is ready. The editor will receive it as soon as it opens.', error: 'The editor could not be opened. Try again, or return to the extension and save your project.', expired: 'This transfer has expired. Return to the extension and click Edit Pattern again.', retry: 'Try again' },
    de: { heading: 'Deine Bügelperlenvorlage', loading: 'Der Website-Editor wird geöffnet…', description: 'Deine Vorlage ist bereit und wird nach dem Öffnen übernommen.', error: 'Der Editor konnte nicht geöffnet werden. Versuche es erneut oder speichere dein Projekt in der Erweiterung.', expired: 'Diese Übertragung ist abgelaufen. Klicke in der Erweiterung erneut auf Vorlage bearbeiten.', retry: 'Erneut versuchen' },
    fr: { heading: 'Votre modèle de perles', loading: 'Ouverture de l’éditeur du site…', description: 'Votre modèle est prêt. L’éditeur le recevra dès son ouverture.', error: 'Impossible d’ouvrir l’éditeur. Réessayez ou enregistrez votre projet dans l’extension.', expired: 'Ce transfert a expiré. Cliquez de nouveau sur Modifier le modèle dans l’extension.', retry: 'Réessayer' },
    ja: { heading: 'ビーズ図案', loading: 'ウェブサイトのエディターを開いています…', description: '図案の準備ができました。エディターが開くと図案を読み込みます。', error: 'エディターを開けませんでした。再試行するか、拡張機能でプロジェクトを保存してください。', expired: '転送の有効期限が切れました。拡張機能からもう一度「図案を編集」を選んでください。', retry: '再試行' },
};
const query = new URLSearchParams(location.search);
const language = query.get('lang') ?? 'en';
const locale = Object.hasOwn(copy, language) ? language as keyof typeof copy : 'en';
const text = copy[locale];
document.documentElement.lang = locale;
const heading = document.getElementById('handoff-heading')!;
const status = document.getElementById('handoff-status')!;
const description = document.getElementById('handoff-description')!;
const spinner = document.getElementById('handoff-spinner')!;
const stage = document.getElementById('handoff-stage')!;
const retry = document.getElementById('handoff-retry') as HTMLButtonElement;
heading.textContent = text.heading;
description.textContent = text.description;
retry.textContent = text.retry;
let busy = false;
async function launch() {
    if (busy) return;
    busy = true;
    retry.hidden = true;
    spinner.hidden = false;
    stage.setAttribute('aria-busy', 'true');
    status.textContent = text.loading;
    try {
        // The local skeleton gets a real frame before starting navigation.
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const result = await chrome.runtime.sendMessage<{ ok: boolean; error?: string }>({
            type: 'launch-handoff', token: query.get('token'),
        });
        if (!result.ok) {
            status.textContent = result.error === 'handoff_expired' ? text.expired : text.error;
            throw new Error('launch_failed');
        }
    } catch {
        if (status.textContent === text.loading) status.textContent = text.error;
        spinner.hidden = true;
        stage.setAttribute('aria-busy', 'false');
        retry.hidden = false;
        busy = false;
    }
}
retry.addEventListener('click', () => { void launch(); });
void launch();
