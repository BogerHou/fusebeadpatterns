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
        heading: 'Datenschutzerklärung', updated: '20. Oktober 2026', updatedISO: '2026-10-20',
        intro: 'Bei Fuse Bead Patterns („wir“, „unser“ oder „uns“) ist der Schutz deiner Privatsphäre ein wesentlicher Bestandteil des Produkts. Unser Generator für Bügelperlen-Vorlagen ist so gestaltet, dass die Bildverarbeitung lokal in deinem Browser erfolgt.',
        sections: [
            { heading: '1. Lokale Bildverarbeitung', paragraphs: ['Wir laden deine Bilder nicht hoch. Wenn du ein Foto für die Umwandlung in eine Bügelperlen-Vorlage auswählst, findet die gesamte Bildverarbeitung mit JavaScript lokal in deinem Webbrowser statt. Deine Bilder werden nie an unsere Server gesendet, und wir haben keinen Zugriff darauf.'] },
            { heading: '2. Datenerhebung', paragraphs: [
                'Für die Kernfunktionen zur Vorlagenerstellung ist kein Konto erforderlich. Wir erheben dafür keine personenbezogenen Angaben wie deinen Namen, deine E-Mail-Adresse oder deinen Standort.',
                'Google Analytics ist optional und bleibt aus, bis du es erlaubst. Google kann dann Cookie-Kennungen sowie Geräte- und Netzwerkdaten für Besuche und Interaktionen verarbeiten. Unsere eigenen Download- und Editor-Ereignisse enthalten nur feste Ressourcenkennungen, Perlenmarken, Einstiegsseiten und Dateiformate, keine Bilder, Dateinamen oder Projektinhalte. Die Messung wird nicht als vollständig anonym bezeichnet. Wir verwenden die kanonische Seitenadresse ohne Abfrageparameter oder Fragment, fragen keine genaue Position ab und aktivieren keine Google-Werbesignale.',
            ] },
            { heading: '3. Cookies', paragraphs: ['Die Werkzeuge speichern Einstellungen und Projektentwürfe im Browser. Dort wird auch deine Analysewahl für alle Sprachen gespeichert. Nach deiner Erlaubnis kann Google Analytics Mess-Cookies setzen. Ohne Analyse funktionieren Bildumwandlung, Bearbeitung, Downloads und lokale Projektspeicherung weiterhin.'] },
            { heading: '4. Links zu Drittanbietern', paragraphs: ['Unsere Website kann Links zu anderen Websites enthalten, etwa zu Bastelmaterialien oder externen Referenzen. Für die Datenschutzpraktiken oder Inhalte dieser Websites sind wir nicht verantwortlich.'] },
            { heading: '5. Kontakt', paragraphs: ["Wenn du uns eine E-Mail schickst, erhalten wir deine Adresse und die freiwillig enthaltenen Angaben. Wir verwenden sie zur Antwort oder zur Prüfung des gemeldeten Problems. Sende keine privaten Fotos oder sachfremden personenbezogenen Angaben. Über die Kontaktadresse kannst du auch Fragen zu deiner Korrespondenz stellen oder deren Löschung anfordern.", { before: 'Bei Fragen oder Bedenken zu dieser Datenschutzerklärung erreichst du uns unter: ', href: 'mailto:contact@fusebeadpatterns.art', label: 'contact@fusebeadpatterns.art', after: '.' }] },
            { heading: "6. Deine Analysewahl", paragraphs: ["Über „Analyse-Einstellungen“ im Footer kannst du die Messung erlauben, ausgeschaltet lassen oder widerrufen. Ausschalten stoppt unsere Ereignisse und deaktiviert die Google-Analytics-Messung auf der aktuellen Seite; die Website entfernt außerdem ihre Google-Analytics-Cookies. Deine Entwürfe werden nicht gelöscht. Bei nicht verfügbarem Browserspeicher erklärt der Dialog, wenn die Auswahl nicht gespeichert werden konnte. Bereits an Google übermittelte Daten werden durch den Widerruf nicht gelöscht.", { before: '', href: 'https://policies.google.com/technologies/partner-sites?hl=de', label: "Wie Google Informationen von Websites verwendet, die seine Dienste nutzen" }] },
            { heading: "7. Werbung", paragraphs: ["Auf regulären Seiten laden wir ein Google-AdSense-Skript, um diese Website unserem Publisher-Konto zuzuordnen. Das Skript verbindet sich mit Google und kann Geräte- und Netzwerkdaten verarbeiten, auch wenn die optionale Google-Analytics-Messung ausgeschaltet ist. Derzeit werden keine Anzeigen angezeigt. Die Analyse-Einstellungen steuern nur Google Analytics und sind keine Einwilligungslösung für Werbung. Bevor Anzeigen geschaltet werden, passen wir diese Erklärung und die erforderlichen Einwilligungskontrollen an, einschließlich einer erforderlichen Google-zertifizierten Plattform für Besucher im EWR, Vereinigten Königreich und in der Schweiz."] },
            { heading: '8. Browser-Erweiterung Bead Capture', paragraphs: [
                { before: 'Bead Capture verwendet ausgewählte Bilder und ihre URLs ausschließlich, um die von dir angeforderten Perlenvorlagen zu erstellen, zu exportieren und zu übertragen. Unser Umgang mit Nutzerdaten der Erweiterung entspricht der ', href: 'https://developer.chrome.com/docs/webstore/program-policies/user-data', label: 'Chrome Web Store User Data Policy', after: ', einschließlich ihrer Limited-Use-Anforderungen. Wir verkaufen diese Daten nicht, verwenden sie nicht für Werbung und erlauben Personen keinen Einblick in deine ausgewählten Bilder oder erzeugten Projekte.' },
                'Bead Capture enthält den Generator der Startseite zur lokalen Nutzung, ohne Analyse oder Werbung in der Erweiterung. Beim Rechtsklick auf ein Bild wird dessen ausgewählte URL vorübergehend im Sitzungsspeicher von Chrome gespeichert. Zum Abrufen kannst du den Zugriff auf diesen Bildhost oder optional auf Bilder aller Websites erlauben. Chrome fragt nach deiner Bestätigung und behält die gewählte Berechtigung, bis du sie widerrufst. Die Erweiterung kontaktiert den Host des ausgewählten Bildes direkt, ohne Cookies zu senden. Sie durchsucht weder deinen Browserverlauf noch sammelt sie automatisch Bilder anderer Seiten. Originalbilder werden nicht auf unsere Server hochgeladen.',
                'Mit „Vorlage bearbeiten“ werden nur das erzeugte Perlenraster und seine Einstellungen über Chrome an den offiziellen Website-Editor in deinem Browser übergeben, nicht an unser Backend. Originalbild und Bild-URL sind nicht enthalten. Die einmalige Übertragungskennung und der Bildabruf-Eintrag laufen nach 10 Minuten ab; abgelaufene Einträge werden bei späterer Aktivität der Erweiterung entfernt. Das Schließen des zugehörigen Tabs entfernt ebenfalls dessen temporären Eintrag. Eine angenommene oder verworfene Übertragung wird aus dem Sitzungsspeicher gelöscht.',
                'Deine Arbeit in der Erweiterung bleibt im Arbeitsspeicher der geöffneten Seite. Speichere vor dem Schließen eine Projektdatei. Sobald du die Website öffnest, gelten auf dieser Website-Seite die oben beschriebenen Analyse-Einstellungen und das AdSense-Verhalten.',
            ] },
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
