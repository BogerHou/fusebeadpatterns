import { photoGuideCopy } from './photo';
import type { GuideTranslations } from './types';

export const germanGuides: GuideTranslations = {
    'photo-to-perler-bead-pattern': photoGuideCopy.de,
    'perler-bead-pegboards': {
        title: 'Steckplatten und Größen für Bügelperlen-Vorlagen',
        description: 'Plane Rastergröße, Plattenanzahl und Druckmaßstab für Perler, Hama und Artkal. Mit leeren 29 × 29-Rastern und Messlinien für A4 und US Letter.',
        eyebrow: 'Steckplatten',
        intro: 'Die Steckplatte bestimmt die Größe des Rasters und damit, wie viele Details in dein Motiv passen. Die Perlenmarke legt die verfügbaren Farben fest. Beides lässt sich getrennt auswählen.',
        sections: [
            { heading: 'Perlenmarke und Steckplatte getrennt wählen', body: [
                'Perlen und Steckplatte müssen nicht vom selben Hersteller sein, ihre tatsächlichen Maße müssen aber zusammenpassen. Eine Perler-Farbpalette lässt sich mit einem passenden Midi-Raster verwenden, wenn deine Perlen auf die echte Platte passen.',
                'Im Generator bestimmt die Perlenmarke die Farbzuordnung. Die Steckplatte bestimmt die Abmessungen der Vorlage.',
            ] },
            { heading: 'Mehr Platten für größere Motive', body: [
                'Die Anzahl der Platten nebeneinander und übereinander multipliziert die gewählte Plattengröße: Eine Platte mit 29 × 29 Stiften ergibt ein 29 × 29-Raster, zwei nebeneinander ergeben 58 × 29.',
                'Größere Motive können mehr Details zeigen. Dafür brauchst du mehr Perlen, mehr Zeit zum Bügeln und mehr Sorgfalt beim Zusammenfügen.',
            ] },
            { heading: 'Perlenzahl vor dem Export prüfen', body: [
                'Ein großes Raster kann schnell mehrere Tausend Perlen enthalten. Prüfe die Gesamtzahl und die benötigten Farben, bevor du mit dem Legen beginnst.',
            ], bullets: ['Für kleine Symbole reicht meist eine Platte.', 'Bei Figurenporträts kannst du mit zwei oder mehr Platten beginnen.', 'Teste detaillierte Fotos in mehreren Rastergrößen vor dem Export.'] },
            { heading: 'Eine Bibliotheks-PDF im richtigen Maßstab drucken', body: [
                'Die fertigen PDFs in der Vorlagenbibliothek enthalten eine 50-mm-Messlinie. Wähle im Druckdialog 100 % oder „Tatsächliche Größe“. Deaktiviere „An Seite anpassen“ und ähnliche Verkleinerungen und drucke zunächst eine Seite.',
                'Miss die Linie mit einem Lineal: Sie muss 50 mm lang sein. Stimmt das Maß nicht, korrigiere die Druckskalierung und drucke erneut. Vergleiche das Raster zusätzlich mit deiner echten Steckplatte, bevor du es darunterlegst.',
                'Diese Prüfung gilt für Bibliotheks-PDFs mit Messlinie. Ein Editor-Export kann ein anderes Layout haben; verwende ihn als Zählvorlage, solange du seinen Abstand nicht geprüft hast. Eine andere Farbpalette macht aus einem Midi-Raster keine maßstäbliche Mini- oder Maxi-Vorlage.',
            ] },
            { heading: 'Leeres Raster herunterladen und Drucker prüfen', body: [
                'Wähle A4 oder US Letter passend zum Papier. Jedes kostenlose Blatt enthält ein leeres 29 × 29-Raster mit 5 mm Abstand sowie eine waagerechte und eine senkrechte 50-mm-Messlinie. Das Außenmaß des Rasters beträgt 145 mm; zwischen den Mittelpunkten der ersten und letzten Zelle liegen 140 mm.',
                'Drucke mit 100 % beziehungsweise tatsächlicher Größe, ohne Seitenanpassung. Miss beide Linien. Ist eine davon nicht 50 mm lang, ändere die Druckskalierung und wiederhole den Druck. Prüfe die echte Platte separat: Die Dateien wurden digital geprüft, nicht auf einer physischen Steckplatte getestet.',
                'Du kannst das Raster zum Entwerfen oder für eine Gruppenaktivität nutzen. Die bearbeitbaren SVGs haben dieselben Maße, können beim Import in ein Grafikprogramm aber skaliert werden. Miss deshalb nach Änderungen erneut. Diese Blätter ändern den Maßstab eines vorhandenen Editor-Exports nicht.',
            ] },
        ],
    },
    'perler-to-hama-artkal': {
        title: 'Perler-Vorlagen auf Hama- oder Artkal-Farben umstellen',
        description: 'Öffne eine fertige Vorlage im Editor, wechsle zu Hama oder Artkal und exportiere ein neues Raster samt Farbliste. Die Perlenpositionen bleiben erhalten.',
        eyebrow: 'Perlenfarben',
        intro: 'Du kannst eine fertige Vorlage mit einer anderen Farbpalette verwenden. Vorschauen und Standarddownloads der Bibliothek nutzen Perler Midi. Öffne das Motiv im Editor, ändere nur die Perlenmarke und exportiere anschließend die passende Farbliste.',
        sections: [
            { heading: '1. Eine fertige Vorlage öffnen', body: [
                'Wähle auf der Motivseite den Einstieg in den Editor und bestätige dort das Öffnen der Vorlage. Ist bereits ein Projekt geöffnet, speichere es zuerst, bevor du die aktuelle Vorlage ersetzt.',
                'Als Beispiel dient das blaue Huhn aus Stardew Valley: Die ursprüngliche Perler-Vorlage hat 192 Perlen in 8 Farben, ein Motiv mit 16 × 16 Positionen und eine 29 × 29-Platte. Der Editor lädt das Perlenraster direkt; du musst das Vorschaubild weder hochladen noch nachzeichnen.',
            ] },
            { heading: '2. Perlenmarke ändern und anwenden', body: [
                'Öffne „Vorlageneinstellungen“ neben der Arbeitsfläche beziehungsweise die Einstellungen auf dem Smartphone. Wähle unter „Perlenmarke“ Hama Midi oder die Artkal-Serie, die du besitzt. Lass Steckplatte und Plattenanzahl unverändert und klicke auf „Änderungen anwenden“.',
                'Ein reiner Markenwechsel erhält Perlenpositionen, leere Felder und manuelle Änderungen. Farben, die in der bisherigen Palette als Schwarz oder Weiß erkannt werden, behalten diesen Farbnamen, sofern ein entsprechender Farbton in der Zielpalette aktiviert ist. Andere Farben werden dem nächsten aktivierten digitalen Farbton zugeordnet. Eine Änderung der Plattengröße ist ein anderer Vorgang und kann das Raster neu aufbauen.',
                'Speichere vor dem Wechsel eine Projektkopie. Die bearbeiteten Felder bleiben erhalten, aber der Rückgängig-Verlauf beginnt nach dem Palettenwechsel neu. Für exakt die vorherigen Farben kannst du die gespeicherte Kopie wieder öffnen.',
            ], figure: {
                alt: 'Blaues Huhn mit Hama Midi, 192 Perlen und unverändertem 29 × 29-Raster im englischen Editor.',
                caption: 'Aufnahme aus dem Editor nach dem Wechsel zu Hama Midi; die Oberfläche im Bild ist Englisch. Sie zeigt die digitale Zuordnung und bestätigt keine physischen Perlenfarben.',
            } },
            { heading: '3. Neue Farben kontrollieren', body: [
                'Prüfe Umrisse, Gesicht und kleine Details. Ähnliche Perler-Farben können auf denselben Hama- oder Artkal-Farbton fallen. Dadurch sinkt gegebenenfalls die Zahl der Farben, obwohl alle Positionen erhalten bleiben. Korrigiere einzelne Perlen, wenn ein Detail mehr Kontrast braucht.',
                'Die Zuordnung vergleicht digitale Farbwerte, keine Messungen deiner echten Perlen. Gleiche Namen und Farbcodes mit deinem Vorrat ab. Der Palettenwechsel prüft weder Perlengröße noch Plattenpassung oder gemeinsames Schmelzverhalten.',
            ] },
            { heading: '4. Umgefärbte Vorlage exportieren', body: [
                'Öffne den Export über der Arbeitsfläche oder über das Dateimenü auf dem Smartphone. Wähle PDF als Exportformat, einen Dateinamen mit der Marke und den PDF-Export. Aktiviere „Symbole in Druckvorlagen verwenden“, wenn du zusätzlich zu den Farben Symbole möchtest.',
                'Plane deinen Bedarf mit der neu exportierten Vorlage und ihrer Farbliste. Die ursprüngliche PDF und das Raster-PNG in der Bibliothek bleiben die Perler-Version; deine Bearbeitung ersetzt diese Downloads nicht.',
                'Speichere außerdem eine bearbeitbare Projektdatei mit der gewählten Palette. Vergleiche vor dem Legen den Ausdruck mit der Bildschirmansicht und prüfe die benötigten Farben.',
            ] },
        ],
    },
    'perler-vs-hama-vs-artkal': {
        title: 'Perler, Hama und Artkal: Größen, Farben und Mischbarkeit',
        description: 'Vergleiche Perler, Hama und Artkal anhand von Größe, Mini- und Midi-Serien, Farbauswahl und Herstellerhinweisen zur Mischbarkeit.',
        eyebrow: 'Perlen auswählen',
        intro: 'Beginne mit der Perlengröße und der Steckplatte, die du besitzt. Prüfe dann die Farben deiner Vorlage. Neben der Marke zählt die genaue Serie auf dem Beutel. Hier vergleichen wir Herstellerangaben und Empfehlungen; dies ist kein eigener Schmelztest.',
        sections: [
            { heading: 'Perlengrößen im Überblick', body: ['Standard- beziehungsweise Midi-Perlen brauchen andere Stiftabstände als Mini-Perlen. Selbst zwei Mini-Serien können unterschiedliche Maße haben. Prüfe die genaue Serie und die für deine Platte vorgesehenen Perlen vor dem Kauf.'], table: {
                caption: 'Herstellerangaben zu den verglichenen Serien', headers: ['Serie', 'Maße', 'Passende Steckplatte'], rows: [
                    { label: 'Perler Standard', cells: ['5,07 mm hoch × 4,77 mm breit', 'Eine Platte für Standard-Perler-Perlen verwenden.'] },
                    { label: 'Hama Midi', cells: ['5 mm Durchmesser × 5 mm hoch', 'Hama-Midi-Platte wählen oder die genaue Passung prüfen.'] },
                    { label: 'Artkal S', cells: ['5 mm Midi; harte Serie', 'Eine Platte für die 5-mm-Serie wählen. S ist keine Mini-Serie.'] },
                    { label: 'Perler Mini', cells: ['Eigene Mini-Serie', 'Perler sieht Mini-Platten für Mini-Perlen vor, nicht für Standardperlen.'] },
                    { label: 'Hama Mini', cells: ['2,5 mm Durchmesser × 2,5 mm hoch', 'Eine Platte für Hama Mini wählen.'] },
                    { label: 'Artkal C', cells: ['2,6 mm Mini; harte Serie', 'Eine Platte für Artkals 2,6-mm-Mini-Serie wählen.'] },
                ],
            } },
            { heading: 'Welche Serie passt zu deinem Projekt?', body: [
                'Für den Einstieg ist ein Set mit aufeinander abgestimmten Perlen und Platten praktisch. Hast du bereits Material, kannst du mit derselben Serie deine vorhandenen Platten und sortierten Farben weiterverwenden. Prüfe, ob häufig benötigte Farben nachkaufbar sind.',
                'Für kleine, detaillierte Arbeiten kommt eine Mini-Serie mit passender Platte infrage. Ein 29 × 29-Raster hat bei jeder Perlengröße 29 Positionen pro Seite. Kleinere Perlen verkleinern das fertige Motiv; zusätzliche Details erfordern mehr Rasterfelder.',
            ], bullets: ['Bei vorhandenen Perler-Standardperlen zuerst fehlende Farben prüfen, statt den ganzen Vorrat zu ersetzen.', 'Bei Hama vor dem Ergänzen feststellen, ob dein Set Mini, Midi oder Maxi ist.', 'Bei Artkal auf den Buchstaben achten: S steht für harte 5-mm-Midi-Perlen, C für harte 2,6-mm-Mini-Perlen. Die weichen Serien R und A sind andere Produkte.'] },
            { heading: 'Kann man Perler, Hama und Artkal mischen?', body: [
                'Prüfe zuerst Maße und Serie. In einer Erklärung vom 24. März 2017 beschreibt Artkal seine überarbeiteten harten S-Perlen mit 5 mm und C-Perlen mit 2,6 mm als mit Perler und Hama kompatibel. Die weichen Serien R mit 5 mm und A mit 2,6 mm sollen separat verwendet werden, damit sie flexibel bleiben.',
                'Diese Herstellerangabe bezieht sich auf bestimmte überarbeitete Serien und ist keine Garantie für alle Perlen und Platten. Hama Mini wird mit 2,5 mm angegeben, Artkal C mit 2,6 mm. Der Name Mini allein belegt weder gleiche Passung noch gleiches Schmelzverhalten.',
                'Unbekannte Mischungen solltest du getrennt halten. Wenn die gewünschte Kombination nachweislich auf die Platte passt, beachte die jeweiligen Herstellerhinweise und bügle erst eine kleine Probe. Prüfe sie nach dem Abkühlen, bevor du ein großes Motiv bügelst.',
            ] },
            { heading: 'Erst benötigte Farben, dann Kosten vergleichen', body: [
                'Erstelle anhand der Vorlage eine Liste mit Serie, Farbcode und Oberfläche. Das ist besonders für Konturen, Hauttöne und ähnliche Nuancen wichtig. Zwei Farben namens Rot müssen in Wirklichkeit nicht gleich aussehen.',
                'Prüfe Herstellerfarbkarten und benötigte Mengen. Hama hat Karten nach Perlengröße, Artkal nach Serie; bei Perler findest du einzelne Farben und Verfügbarkeit in den Beutelangeboten. Eine Gesamtzahl verfügbarer Farben sagt nichts über den für dein Motiv benötigten Farbton aus.',
                'Vergleiche die Gesamtkosten deiner konkreten Liste einschließlich Versand und gegebenenfalls neuer Platten. In einem großen Mischbehälter kann gerade die meistgebrauchte Farbe fehlen. Ein teurerer Einzelfarbbeutel kann deshalb nützlicher sein. Preise und lokale Bestände ändern sich.',
            ] },
            { heading: 'Eine Perler-Vorlage mit Hama oder Artkal nutzen', body: [
                'Die Standarddownloads der Bibliothek verwenden Perler Midi. Öffne für eine andere Serie die Vorlage im Editor und wähle unter „Perlenmarke“ die passende Palette. Artkal S (5 mm) ist die S-Serie, Artkal C die C-Serie. Lass die Platteneinstellungen unverändert, wenn du nur Farben ersetzen möchtest.',
                '„Änderungen anwenden“ erhält die Positionen und ordnet Farben der aktivierten digitalen Palette zu. Prüfe wichtige Details und exportiere eine neue Farbliste. Diese Zuordnung hilft bei der Planung, bestätigt aber keine tatsächlichen Farben, Plattenpassung oder Schmelzverträglichkeit.',
                'Die Original-PDF bleibt die Perler-Version. Eine Zählvorlage kannst du Feld für Feld mit anderen Perlengrößen umsetzen. Zum Unterlegen unter eine transparente Platte muss hingegen der physische Abstand stimmen; die Farbpalette stellt diesen Abstand nicht ein.',
            ] },
            { heading: 'Material vor dem vollständigen Motiv testen', body: [
                'Verwende die Bügelanleitung deiner genauen Serie. Perler empfiehlt ein trockenes Bügeleisen auf mittlerer Stufe und eine kleine Probe. Hama nennt unterschiedliche Einstellungen für Mini, Midi und Maxi und empfiehlt ebenfalls einen Test, weil Bügeleisen variieren. Eine Zeit- oder Temperatureinstellung gilt nicht automatisch für alle Marken.',
                'Ein Erwachsener sollte bügeln, die Perlen mit empfohlenem Bügelpapier abdecken und das Eisen bewegen. Lass die Probe abkühlen und prüfe die Verbindungen. Beginne mit einem kleinen Motiv, sobald Perlen, Platte und Farben feststehen.',
            ] },
        ],
    },
    'mini-perler-beads': {
        title: 'Mini-Bügelperlen: kleine Motive mit vielen Details',
        description: 'Plane Vorlagen für Mini-Bügelperlen, wähle die passende Palette und Steckplatte und verwende kleine Motive als Zählvorlage.',
        eyebrow: 'Mini-Perlen',
        intro: 'Mini-Perlen bringen viele Rasterfelder auf einer kleineren Fläche unter. Sie ändern die reale Größe deiner Arbeit, nicht den Ablauf der Bildumwandlung.',
        sections: [
            { heading: 'Sechs kleine Vorlagen zum Herunterladen', body: ['Jedes dieser Motive passt in höchstens 16 × 16 Perlenpositionen. Wähle ein Bild, um die kostenlose PDF, die Farbliste und den Editor zu öffnen.', 'Die kleinen Motive verwenden standardmäßig Perler Midi. Mini bezeichnet die Größe der Perlen, nicht die Anzahl der Rasterfelder. Für Mini-Perlen folgst du den nächsten Schritten.'] },
            { heading: 'Ein kleines Raster mit Mini-Perlen umsetzen', body: ['Verwende eine Mini-Steckplatte, die zu deinen Perlen passt. Arbeite Zeile für Zeile: Ein gefülltes Feld entspricht einer Perle, ein leeres bleibt frei. Du musst das Motiv nicht vergrößern, um die Platte auszufüllen.', 'Bibliotheks-PDFs sind für ein Midi-Raster vorbereitet. Nutze sie als Zählvorlage und nicht als maßstäbliche Unterlage für eine Mini-Platte. Ein Palettenwechsel verändert den gedruckten Rasterabstand nicht.'] },
            { heading: 'Die Vorlage auf deine Mini-Farben umstellen', body: [
                'Öffne das Motiv im Editor und bestätige den Import. Speichere ein bereits geöffnetes Projekt, bevor du es ersetzt.',
                'Wähle in den Vorlageneinstellungen unter „Perlenmarke“ deine Serie, etwa Perler Mini, Hama Mini oder Artkal C. Artkal C hat 2,6 mm, Artkal S ist dagegen eine 5-mm-Midi-Serie. Lass Steckplatte und Plattenanzahl unverändert und wähle „Änderungen anwenden“, um die digitalen Positionen zu erhalten. Ob deine echte Platte zu den Perlen passt, wird dadurch nicht geprüft.',
                'Prüfe Farben und kleine Details vor einem neuen PDF-Export. Mehrere ursprüngliche Farben können auf denselben Mini-Farbton fallen. Vergleiche Namen und Codes mit deinen Perlen und zähle Zeilen und Spalten, solange der physische Druckabstand nicht bestätigt ist.',
                'Die Einstellung der Steckplatte ist ein separater Vorgang und kann das Raster neu aufbauen. Beim Erstellen einer neuen Vorlage kannst du eine Mini-Plattenvorgabe nutzen, um deren vollständiges Raster zu verwenden.',
            ] },
            { heading: 'Perlengröße ändert nicht den Bildalgorithmus', body: ['Ein 50 × 50-Raster hat mit Midi- wie mit Mini-Perlen 2.500 Positionen. Unterschiedlich ist die physische Größe der fertigen Arbeit, nicht die Logik der Vorlage.', 'Bei der Umwandlung zählen Palette und Raster. Beim Legen müssen Perlengröße und echte Steckplatte zusammenpassen.'] },
            { heading: 'Mini-Perlen für kleine, detailreiche Arbeiten', body: ['Mini-Perlen eignen sich für Schlüsselanhänger, Ohrringe, Schmuckanhänger und detailreiche Spielfiguren, die mit Midi-Perlen zu groß würden.', 'Sie sind schwieriger mit den Fingern zu legen. Eine Pinzette und ein deutlich lesbares Raster helfen bei kleinen Details.'] },
            { heading: 'Farbpalette sorgfältig auswählen', body: ['Manche Mini-Serien haben weniger Farben als ihre Midi-Gegenstücke. Gehen wichtige Farbabstufungen verloren, teste eine andere Palette oder vereinfache das Ausgangsbild.'] },
        ],
    },
    'perler-bead-kits-and-storage': {
        title: 'Bügelperlen für Anfänger: Zubehör und Aufbewahrung',
        description: 'Plane ein einfaches Bügelperlen-Set mit Steckplatte, Bügelpapier und Pinzette. Sortiere Farben passend zu den Namen und Codes deiner Vorlagen.',
        eyebrow: 'Grundausstattung',
        intro: 'Mit einer einfachen Ausstattung kannst du Motive ausprobieren, ohne ständig Farben suchen zu müssen. Ergänze Aufbewahrungsboxen und spezielle Platten erst, wenn du weißt, welche Arbeiten dir gefallen.',
        sections: [
            { heading: 'Was in ein Einsteiger-Set gehört', body: ['Eine Grundausstattung umfasst gemischte Perlen, mindestens eine quadratische Steckplatte, Bügelpapier und ausreichend häufig benötigte Farben für kleine Motive.', 'Bei sehr einfachen Motiven ist eine Pinzette optional. Für kleine Details und Mini-Perlen wird sie schnell hilfreich.'], bullets: ['Gemischte Perlen oder eine kleine Farbauswahl.', 'Quadratische oder zusammensteckbare Platten.', 'Bügelpapier oder geeignetes Backpapier.', 'Pinzette zum genauen Platzieren.'] },
            { heading: 'Farben übersichtlich aufbewahren', body: ['Nach Farben sortierte Perlen sparen Zeit beim Arbeiten mit einer Druckvorlage. Kleine Schubladen, Dosen mit Deckel oder Sortierkästen sind übersichtlicher als eine einzige gemischte Schachtel.', 'Beschrifte die Fächer mit den Farbnamen oder Codes aus der exportierten Vorlage, besonders bei vielen Farben.'] },
            { heading: 'Vor dem Nachkauf den Bedarf berechnen', body: ['Wandle zunächst einige Motive um und sieh nach, welche Farben häufig vorkommen. So kaufst du größere Mengen nach tatsächlichem Bedarf statt auf Verdacht.'] },
        ],
    },
    'how-to-iron-perler-beads': {
        title: 'Perler-Bügelperlen richtig bügeln',
        description: 'Verbinde Perler-Perlen mit der Standardmethode, prüfe die Verbindungen und behebe lose Ränder, haftendes Papier oder zu große Hitze.',
        eyebrow: 'Motiv fertigstellen',
        intro: 'Ein Erwachsener sollte das Motiv mit Bügelpapier und einem trockenen Bügeleisen auf mittlerer Stufe verbinden. Bewege das Eisen, lass die erste Seite abkühlen und bügle die Rückseite nach dem Abnehmen von der Platte. Die Perlen sollen zusammenhalten und ihre Öffnungen behalten.',
        sections: [
            { heading: 'Vor dem Start', body: ['Diese Schritte folgen Perlers Standardanleitung. Beachte die Hinweise für deine genaue Serie, insbesondere bei Mini, Biggie oder einer anderen Marke.', 'Prüfe anhand deiner Vorlage ein letztes Mal Positionen und fehlende Farben. Eine digitale Vorschau zeigt das Raster, aber nicht, ob echte Perlen miteinander verschmolzen sind.'], bullets: ['Das gelegte Motiv auf einer passenden Steckplatte.', 'Haushaltsbügeleisen, Bügelpapier und eine ebene, hitzefeste Arbeitsfläche.', 'Einige zusätzliche Perlen für eine kleine Probe.'] },
            { heading: '1. Bügeleisen testen und Motiv abdecken', body: ['Schalte den Dampf aus. Beginne bei mittlerer Hitze und teste einige Ersatzperlen. Bügeleisen unterscheiden sich; die Stellung des Reglers garantiert keine genaue Temperatur.', 'Glätte Falten im Bügelpapier und decke das Motiv ab. Das Eisen darf weder unbedeckte Perlen noch die Steckplatte berühren.'] },
            { heading: '2. Erste Seite gleichmäßig verbinden', body: ['Bewege das Eisen ohne zusätzlichen Druck in kleinen Kreisen über das Papier. Erreiche auch die Ränder. Beobachte, ob sich benachbarte Perlenränder verbinden, während die Löcher offen bleiben.', 'Perler nennt ungefähr 10–20 Sekunden pro Seite als Ausgangspunkt. Farben und Motivgröße beeinflussen die Zeit. Prüfe die Verbindungen, statt dich nur nach einer Stoppuhr zu richten.'] },
            { heading: '3. Abkühlen lassen, wenden und Rückseite bügeln', body: ['Lass die erste Seite abkühlen, bevor du das Papier entfernst und das Motiv von der Platte nimmst. Wende es, decke die ungebügelte Seite mit Bügelpapier ab und wiederhole den Vorgang. Lass das Motiv vor dem Anfassen vollständig abkühlen.', 'Vergleiche die fertige Arbeit mit der Vorlage. Wenn du Löcher zum Zusammenbauen brauchst, prüfe auch diese: Durch zu starkes Schmelzen können sie sich schließen.'] },
            { heading: 'Wenn Perlen lose bleiben oder am Papier haften', body: ['Lose Ränder: Prüfe, ob alle Bereiche gleichmäßig erwärmt wurden. Verbinden sie sich nicht, empfiehlt Perler eine kleine Temperaturerhöhung. Gehe schrittweise vor, nicht direkt zur höchsten Stufe.', 'Haftendes Papier: Lass das Motiv länger abkühlen und ziehe das Papier langsam ab. Hebt es Perlen an, setze sie zurück und bügle diese Stellen erneut.', 'Geschlossene Löcher oder eine verzogene Platte können auf zu viel Hitze hindeuten. Reduziere sie und prüfe zunächst die Probe. Stärkerer Druck ist keine Lösung.'] },
            { heading: 'Ist die Klebebandmethode nötig?', body: ['Sie ist eine Alternative für große Arbeiten und kein zusätzlicher Schritt der Standardmethode. Laut Perler kann sie sichtbare Übergänge zwischen Platten und abspringende Perlen beim Bügeln verringern. Sie erfordert eine andere Vorbereitung und vorsichtiges Übertragen vor dem Bügeln.', 'Nutze dafür die vollständige bebilderte Herstelleranleitung. Perler schließt Mini-Perlen ausdrücklich von dieser Klebebandmethode aus.'] },
            { heading: 'Mit einem kleinen Motiv weiterarbeiten', body: ['Unsere einfachen Vorlagen sind zusammenhängende Motive für eine 29 × 29-Platte mit wenigen Farben. Lade ein Raster herunter, vergleiche die Farbliste mit deinem Vorrat und lege das Motiv, bevor du diese Bügelanleitung anwendest.', 'Standardvorlagen verwenden Perler Midi. Ein Wechsel auf Hama- oder Artkal-Farben im Editor bestätigt nicht, dass echte Perlen verschiedener Marken zusammen oder mit derselben Einstellung gebügelt werden können.'] },
        ],
    },
};
