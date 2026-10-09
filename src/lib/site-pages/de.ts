import type { SitePageSlug } from './routes';
import type { SitePageCopy } from './types';

export const germanSitePages: Record<SitePageSlug, SitePageCopy> = {
    about: {
        title: 'Über Fuse Bead Patterns',
        description: 'Erfahre mehr über Fuse Bead Patterns, den kostenlosen Browser-Generator für druckbare Bügelperlen-Vorlagen aus Fotos und Pixelgrafiken.',
        heading: 'Über uns',
        intro: 'Willkommen bei Fuse Bead Patterns, einem kostenlosen Browser-Tool, das Fotos, Sprites und einfache Grafiken in druckbare Perler-Vorlagen umwandelt. Unser Ziel ist, dass du eine Vorlage vor dem Stecken einfach ansehen, anpassen, nachbearbeiten und exportieren kannst.',
        sections: [
            { heading: 'Warum wir dieses Tool entwickelt haben', highlighted: true, paragraphs: [
                'Fuse Bead Patterns verbindet Bildumwandlung, die Bearbeitung einzelner Perlen und druckbare Exporte in einem Browser-Tool. Du kannst Raster und Farben planen, bevor du Perlen steckst. Deine ausgewählten Bilder bleiben auf deinem Gerät.',
            ] },
            { heading: 'Unsere Grundsätze', bullets: [
                { label: 'Kostenlos und zugänglich:', text: 'Keine versteckten Gebühren, kein Abonnement. Öffne den Generator und beginne mit einer Vorlage.' },
                { label: 'Datenschutz zuerst:', text: 'Die Bildverarbeitung erfolgt lokal in deinem Browser. Wir sehen oder speichern deine Fotos nicht und laden sie nicht auf einen Server hoch.' },
                { label: 'Kontrolle über dein Projekt:', text: 'Passe Plattengröße, Farbauswahl, einzelne Perlen und Exporte an das Projekt an, das du tatsächlich stecken möchtest.' },
            ] },
            { heading: 'Wie die Vorlagen der Sammlung entstehen', paragraphs: [
                'Benannte Spielmotive basieren auf einer dokumentierten Referenz für die dargestellte Figur, den Gegenstand und die jeweilige Version. Wir prüfen das ursprüngliche Pixelraster, erhalten die belegten Zellen und Farbbereiche und ordnen die Farben der digitalen Perler-Midi-Palette zu. Die Vorlagenseiten enthalten Referenzlinks und Versionshinweise. Eigene Entwürfe sind gesondert gekennzeichnet.',
                { before: 'Jede Vorlage enthält eine Vorschau, ein Rasterdiagramm, eine Farbliste und eine bearbeitbare Projektdatei. Die Motivmaße beschreiben die Zeichnung selbst; die Plattenmaße schließen die leeren Zellen darum herum ein. Die Standarddownloads verwenden Perler Midi. Du kannst ', href: '/de/guides/perler-to-hama-artkal', label: 'im Editor zu Hama- oder Artkal-Farben wechseln', after: ' und deine eigene Version exportieren.' },
            ] },
            { heading: 'Was wir geprüft haben', paragraphs: [
                'Unsere Prüfungen umfassen die Identität der Referenz, die Rastermaße, die Farbanzahl und die Übereinstimmung der herunterladbaren Diagramme mit den Projektdateien. Die Vorlagen wurden nicht mit echten Perlen gesteckt oder durch Bügeln getestet. Bildschirmfarben sind Näherungswerte; schmale Verbindungen oder einzelne Teile können zusätzliche Unterstützung benötigen. Lies vor dem Start die Hinweise auf der jeweiligen Vorlagenseite.',
                { before: 'Hast du eine Abweichung oder ein Problem beim Stecken gefunden? Schreibe an ', href: 'mailto:contact@fusebeadpatterns.art', label: 'contact@fusebeadpatterns.art', after: ' und nenne den Link zur Vorlage, die Perlenmarke und die Stelle, die wir prüfen sollen.' },
            ] },
        ],
        cta: { heading: 'Bereit für deine erste Vorlage?', label: 'Jetzt eine Vorlage erstellen' },
    },
    'privacy-policy': {
        title: 'Datenschutzerklärung',
        description: 'Datenschutzerklärung von Fuse Bead Patterns: lokale Bildverarbeitung im Browser, Nutzungsanalyse, Cookies und Kontakt.',
        heading: 'Datenschutzerklärung', updated: '17. April 2026',
        intro: 'Bei Fuse Bead Patterns („wir“, „unser“ oder „uns“) ist der Schutz deiner Privatsphäre ein wesentlicher Bestandteil des Produkts. Unser Generator für Bügelperlen-Vorlagen ist so gestaltet, dass die Bildverarbeitung lokal in deinem Browser erfolgt.',
        sections: [
            { heading: '1. Lokale Bildverarbeitung', paragraphs: ['Wir laden deine Bilder nicht hoch. Wenn du ein Foto für die Umwandlung in eine Bügelperlen-Vorlage auswählst, findet die gesamte Bildverarbeitung mit JavaScript lokal in deinem Webbrowser statt. Deine Bilder werden nie an unsere Server gesendet, und wir haben keinen Zugriff darauf.'] },
            { heading: '2. Datenerhebung', paragraphs: [
                'Für die Kernfunktionen zur Vorlagenerstellung ist kein Konto erforderlich. Wir erheben dafür keine personenbezogenen Angaben wie deinen Namen, deine E-Mail-Adresse oder deinen Standort.',
                'Wir verwenden Google Analytics, um anonyme, zusammengefasste Nutzungsmuster wie Seitenaufrufe, Geräte- und Browsertypen sowie allgemeine Interaktionstrends zu verstehen. Damit verbessern wir den Generator und den Editor. Die Analyse dient nicht dazu, deine ausgewählten Bilder einzusehen. Die Bildverarbeitung erfolgt weiterhin lokal in deinem Browser.',
            ] },
            { heading: '3. Cookies', paragraphs: ['Unsere Website kann übliche funktionale Cookies oder lokalen Speicher verwenden, die erforderlich sind, um Editoreinstellungen wie Zoomstufen, Rastereinstellungen, ausgewählte Farbpaletten oder Entwürfe zu speichern. Google Analytics kann Cookies oder ähnliche Technologien zur Messung verwenden. Wir verwenden keine Tracking-Cookies von Drittanbietern für zielgerichtete Werbung.'] },
            { heading: '4. Links zu Drittanbietern', paragraphs: ['Unsere Website kann Links zu anderen Websites enthalten, etwa zu Bastelmaterialien oder externen Referenzen. Für die Datenschutzpraktiken oder Inhalte dieser Websites sind wir nicht verantwortlich.'] },
            { heading: '5. Kontakt', paragraphs: [{ before: 'Bei Fragen oder Bedenken zu dieser Datenschutzerklärung erreichst du uns unter: ', href: 'mailto:contact@fusebeadpatterns.art', label: 'contact@fusebeadpatterns.art', after: '.' }] },
        ],
    },
    'terms-of-service': {
        title: 'Nutzungsbedingungen',
        description: 'Nutzungsbedingungen für Fuse Bead Patterns und den browserbasierten Generator für Bügelperlen-Vorlagen.',
        heading: 'Nutzungsbedingungen', updated: '17. April 2026',
        intro: 'Willkommen bei Fuse Bead Patterns. Mit dem Zugriff auf oder der Nutzung unserer Website (fusebeadpatterns.art) und unserer Dienste erklärst du dich mit diesen Nutzungsbedingungen einverstanden.',
        sections: [
            { heading: '1. Nutzung des Dienstes', paragraphs: ['Fuse Bead Patterns bietet ein kostenloses Browser-Tool, das Bilder in druckbare Bügelperlen-Vorlagen umwandelt. Du darfst den Dienst für private, pädagogische oder gewerbliche Bastelprojekte nutzen.'] },
            { heading: '2. Geistiges Eigentum und Urheberrecht', paragraphs: [
                'Deine Inhalte: Du behältst sämtliche Rechte und Eigentumsansprüche an den Bildern, die du mit unserem Tool lädst und verarbeitest. Da die Verarbeitung lokal in deinem Browser erfolgt, speichern oder verbreiten wir deine Bilder oder erstellten Vorlagen nicht und beanspruchen kein Eigentum daran.',
                'Urheberrechte beachten: Du verpflichtest dich, unser Tool nicht zur Erstellung von Vorlagen aus urheberrechtlich geschützten Bildern oder anderem geistigen Eigentum zu verwenden, wenn du nicht berechtigt bist, diese Inhalte zu nutzen, zu vervielfältigen oder zu verbreiten. Wir haften nicht für Urheberrechtsverletzungen, die aus deiner Nutzung der erstellten Vorlagen entstehen.',
            ] },
            { heading: '3. Gewährleistungsausschluss', paragraphs: ['Der Dienst wird „wie besehen“ und „wie verfügbar“ ohne jegliche ausdrückliche oder stillschweigende Gewährleistung bereitgestellt. Wir garantieren weder, dass die erstellten Vorlagen deinen Erwartungen vollständig entsprechen, noch einen ununterbrochenen oder fehlerfreien Zugriff auf die Website.'] },
            { heading: '4. Haftungsbeschränkung', paragraphs: ['Fuse Bead Patterns und seine Urheber haften unter keinen Umständen für direkte, indirekte, beiläufig entstandene, besondere oder Folgeschäden, die sich aus deiner Nutzung des Dienstes oder der erstellten Vorlagen ergeben oder in irgendeiner Weise damit zusammenhängen.'] },
            { heading: '5. Änderungen der Bedingungen', paragraphs: ['Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Das Datum der letzten Aktualisierung geben wir oben auf dieser Seite an. Mit der weiteren Nutzung der Website akzeptierst du die aktualisierten Bedingungen.'] },
            { heading: '6. Kontakt', paragraphs: [{ before: 'Bei Fragen zu diesen Bedingungen erreichst du uns unter: ', href: 'mailto:contact@fusebeadpatterns.art', label: 'contact@fusebeadpatterns.art', after: '.' }] },
        ],
    },
};
