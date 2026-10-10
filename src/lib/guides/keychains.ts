import type { GuidePage } from '../../app/(english)/guides/guide-data';
import type { GuideCopy } from './types';

export const keychainGuide: GuidePage = {
    slug: 'how-to-make-perler-bead-keychains',
    updatedAt: '2026-10-10',
    title: 'How to Make Perler Bead Keychains',
    description: 'Learn how to make Perler bead keychains, choose a connection point, preserve bead holes and attach a jump ring. Open a pattern to begin.',
    eyebrow: 'Make a keychain',
    intro: 'To make Perler bead keychains, choose a small pattern and plan its connection point before ironing. Fuse the design following your bead manufacturer’s instructions, keeping the attachment opening clear. Let it cool completely, then use a jump ring to connect the piece to a keyring or chain. Check the hole and hardware fit before using it.',
    sections: [
        {
            heading: 'What you need',
            body: ['Choose the hardware together with the pattern. A jump ring is a small connector with one joint; a split key ring has overlapping coils for holding keys. They serve different purposes. A large keyring is not automatically a suitable connector for a bead hole.'],
            bullets: [
                'A small bead pattern, beads and a pegboard that match the exact bead size and range.',
                'Suitable ironing paper, an iron and the bead manufacturer’s fusing instructions; an adult handles the iron.',
                'A jump ring whose wire can pass through the intended opening without force.',
                'A keyring, or a keyring with a short chain and an accessible end link.',
                'Two suitable jewelry pliers to hold the connector near its joint without crushing the beadwork.',
            ],
        },
        {
            heading: 'Choose a small pattern and plan the attachment',
            body: [
                'Count the occupied motif’s width and height, not the entire empty board around it. At a nominal 5 mm Midi grid pitch, a 10 × 12-cell motif occupies roughly 50 × 60 mm of grid space. A 24 × 24-cell motif occupies roughly 120 × 120 mm. These are planning estimates, not measurements of a fused piece.',
                'Choose a connection near the top so the design can hang as intended. Inspect the beads around it: an isolated bead or a narrow edge may not support the attachment. A digital layout alone does not establish joint strength. Mini beads can reduce the physical size, but require their own matching board; Mini ranges do not all share one size.',
            ],
            links: [
                { href: '/guides/perler-bead-pegboards', label: 'Check the grid size and print scale' },
                { href: '/guides/mini-perler-beads', label: 'Read a pattern with Mini beads' },
            ],
        },
        {
            heading: 'A bead hole is different from an empty cell',
            body: [
                'A bead starts with a hole in its center. If that opening remains after fusing, a suitable connector may pass through it. An empty chart cell means that no bead goes there; it is not the hole inside a bead.',
                'An empty area can become a separate attachment opening only when connected, fused beads form a complete boundary around it. A blank cell at the outer edge has no closed boundary. Inspect the actual cooled piece before choosing either kind of opening.',
            ],
            bullets: [
                '1: the center hole of one bead, kept open during fusing.',
                '2: an empty cell surrounded by a connected bead boundary.',
                '3: empty space at the edge, without a closed attachment opening.',
            ],
            figure: {
                src: '/guides/keychains/bead-hole-and-empty-cell.svg',
                alt: 'Perler bead keychain attachment diagram: 1 is a bead’s center hole, 2 is an enclosed empty cell, and 3 is open space at the edge.',
                caption: '1: bead hole. 2: an empty cell enclosed by beads. 3: edge space without a closed boundary. Original digital illustration, not a physical assembly photo or an actual-size hardware template.',
                width: 960,
                height: 420,
            },
        },
        {
            heading: 'Fuse both sides and let the design cool',
            body: [
                'For Perler projects, follow the standard fusing method: use ironing paper, have an adult fuse the first side, let it cool before removing it from the board, then finish the other side and cool completely. Keep the planned opening clear while joining adjacent beads.',
                'Use the instructions for your own bead brand and range. Ironing time depends on the iron and the piece; there is no single number of seconds that fits every keychain. Try spare beads first and observe the joins rather than ironing until all center holes disappear.',
            ],
            links: [{ href: '/guides/how-to-iron-perler-beads', label: 'Follow the Perler ironing guide' }],
        },
        {
            heading: 'Attach the jump ring to the keyring',
            body: ['Work on a completely cooled piece. This opening technique is for a single-joint jump ring, not the overlapping coils of a split key ring. Check that the connector wire clears the bead opening and that the ring can reach the chain or keyring without pressing on the design.'],
            bullets: [
                'Hold the jump ring on both sides of its joint with the pliers.',
                'Twist one end forward and the other backward to open the joint. Do not pull the ends outward to enlarge the circle.',
                'Pass the connector through the chosen opening in the beadwork, then through the chain’s end link or a suitable part of the keyring.',
                'Reverse the twist until the ends meet and align. Stop if the ring will not close cleanly; do not squeeze the beadwork to force it.',
            ],
            figure: {
                src: '/guides/keychains/jump-ring-and-keyring.svg',
                alt: 'Separate keychain parts: 1 a bead hole, 2 a single-joint jump ring, 3 a chain and split key ring; 4 uses a dot and cross to show the forward-and-backward twist at the jump-ring joint.',
                caption: 'Parts shown separately: 1 is a bead hole, 2 a jump ring, and 3 a chain and split key ring. At 4, ⊙ means toward you and ⊗ means away from you. Original digital illustration, not an assembled keychain or an actual-size hardware template; physical fit has not been tested.',
                width: 960,
                height: 480,
            },
        },
        {
            heading: 'Check the connection before using it',
            body: ['Look at the connection from both sides and move the hardware gently. These checks can reveal an obvious problem before use; they do not prove that a piece will withstand daily wear or a strong pull.'],
            bullets: [
                'The piece is completely cool and adjacent beads around the attachment are joined.',
                'There are no visible cracks or loose beads at the connection.',
                'The ring passes through the opening without forcing or bending the beadwork.',
                'The jump-ring ends meet, with no visible gap or sharp misalignment.',
                'The connector can move gently without catching; do not test it by yanking.',
            ],
        },
        {
            heading: 'If the ring will not fit',
            body: ['Pause the assembly instead of forcing the metal through the piece. Match the solution to the problem you can actually see.'],
            bullets: [
                'A bead hole has fused shut: choose another suitable existing opening, or revise and remake the design with its attachment opening preserved.',
                'The wire is too thick or the connector cannot reach: choose compatible hardware and check the fit again. A larger outer ring diameter does not necessarily mean thinner wire.',
                'The attachment sits on an isolated bead or a weak-looking edge: revise the connection area and remake the piece. This guide does not use a hot needle or drilling as a shortcut.',
            ],
        },
        {
            heading: 'Start with an existing small pattern',
            body: [
                'The Minecraft Emerald below has a 10 × 12-cell motif on a 29 × 29 board: roughly 50 × 60 mm of grid space at 5 mm pitch. Open its detail page for the PDF, color list and editor. Its actual fused size and suitability as a keychain have not been tested.',
                'For a Mini example, the original Ghost reference has a 19 × 21-cell motif in Perler Mini colors. The A4 and US Letter files are counting charts, not actual-size placement templates. Use a board matching your Mini beads. Save your current project before opening this example in the editor; it is a pattern candidate, not a tested keychain.',
            ],
            patternIds: ['minecraft-emerald-1-21-1'],
            links: [
                { href: '/guides/mini-perler-beads/ghost-mini/pattern-a4.pdf', label: 'Ghost — Perler Mini reference PDF (A4)', download: true },
                { href: '/guides/mini-perler-beads/ghost-mini/pattern-letter.pdf', label: 'Ghost — Perler Mini reference PDF (US Letter)', download: true },
                { href: '/editor?pattern=original-friendly-ghost-perler-mini', label: 'Open Ghost — Perler Mini in the editor' },
            ],
        },
        {
            heading: 'Questions about Perler bead keychains',
            body: ['Plan around the actual pattern, bead series and hardware rather than a universal attachment recipe.'],
            bullets: [
                'Do I need an extra bead at the top? Not always. An existing bead hole may work, but both its surrounding joins and the hardware fit need inspection.',
                'Can I use an empty grid cell? Only an area enclosed by a connected bead boundary can form a separate opening; blank space at the edge is not a loop.',
                'Are Mini beads always 2.6 mm? No. Check the exact series and matching board. A Midi PDF does not become a Mini placement template by changing its color palette.',
                'Why twist the connector instead of pulling it apart? Twisting opens the joint without deliberately spreading the ring into a larger circle. The ends still need to meet cleanly when closed.',
            ],
        },
        {
            heading: 'Sources and what has been checked',
            body: [
                'Perler’s Alien Keychain and Carnival Food Keychains projects describe fitting a jump ring after the piece has cooled. Its standard fusing method and FAQ explain the use of ironing paper and keeping bead centers open. The links below are the manufacturer’s English instructions.',
                'Fuse Bead Patterns provides the digital diagrams and pattern links in this guide. They illustrate the connection choices; we have not physically assembled these examples, measured the finished openings or tested their durability.',
            ],
            links: [
                { href: 'https://perler.com/blogs/projects/alien-keychain', label: 'Perler: Alien Keychain instructions' },
                { href: 'https://perler.com/blogs/projects/carnival-food-keychains', label: 'Perler: Carnival Food Keychains instructions' },
                { href: 'https://perler.com/blogs/projects/standard-fusing-method', label: 'Perler: Standard Fusing Method' },
                { href: 'https://perler.com/pages/frequently-asked-questions', label: 'Perler: Frequently Asked Questions' },
            ],
        },
    ],
    relatedLinks: [
        { href: '/patterns/easy', label: 'Browse small bead patterns' },
        { href: '/guides/mini-perler-beads', label: 'Choose a Mini bead pattern' },
        { href: '/guides/how-to-iron-perler-beads', label: 'Check the ironing steps' },
    ],
};

export const keychainGuideCopy: Record<'de' | 'fr' | 'ja', GuideCopy> = {
    de: {
        title: 'Schlüsselanhänger aus Bügelperlen machen',
        description: 'Anleitung für Bügelperlen-Schlüsselanhänger: Aufhängung planen, Perlenlöcher offen halten und Biegering sowie Schlüsselring anbringen.',
        eyebrow: 'Einen Schlüsselanhänger machen',
        intro: 'Für einen Schlüsselanhänger aus Bügelperlen wählst du zuerst ein kleines Motiv und planst die Aufhängung vor dem Bügeln. Verbinde die Perlen nach der Anleitung des Herstellers und halte die vorgesehene Öffnung frei. Lass das Motiv vollständig abkühlen, bevor du es mit einem Biegering am Schlüsselring oder an einer Kette befestigst. Prüfe, ob Öffnung und Metallteile zusammenpassen.',
        sections: [
            {
                heading: 'Das brauchst du',
                body: ['Wähle die Metallteile zusammen mit dem Motiv. Ein Biegering ist ein kleiner Verbindungsring mit einer Stoßstelle; ein Schlüsselring hat überlappende Windungen, auf die Schlüssel geschoben werden. Beide haben unterschiedliche Aufgaben. Ein großer Schlüsselring passt nicht automatisch als Verbindung durch ein Perlenloch.'],
                bullets: [
                    'Eine kleine Vorlage, Bügelperlen und eine Steckplatte, die genau zur Perlengröße und Serie passt.',
                    'Geeignetes Bügelpapier, ein Bügeleisen und die Anleitung des Perlenherstellers; das Bügeln übernimmt ein Erwachsener.',
                    'Einen Biegering, dessen Draht ohne Kraft durch die vorgesehene Öffnung passt.',
                    'Einen Schlüsselring oder einen Schlüsselring mit kurzer Kette und zugänglichem Endglied.',
                    'Zwei geeignete Schmuckzangen, mit denen sich der Ring neben der Stoßstelle halten lässt, ohne das Perlenmotiv zu quetschen.',
                ],
            },
            {
                heading: 'Ein kleines Motiv wählen und die Aufhängung planen',
                body: [
                    'Zähle Breite und Höhe des mit Perlen belegten Motivs, nicht die leere Platte darum. Bei einem nominellen Midi-Rasterabstand von 5 mm nimmt ein Motiv mit 10 × 12 Feldern etwa 50 × 60 mm Rasterfläche ein. Ein Motiv mit 24 × 24 Feldern nimmt etwa 120 × 120 mm ein. Das sind Planungsschätzungen, keine Messwerte eines gebügelten Werkstücks.',
                    'Wähle eine Stelle nahe der Oberkante, damit das Motiv wie vorgesehen hängen kann. Prüfe die Perlen darum: Eine einzelne, unverbundene Perle oder ein schmaler Rand trägt die Befestigung möglicherweise nicht. Die digitale Vorlage belegt keine Verbindungsfestigkeit. Mini-Perlen können das Werkstück verkleinern, brauchen aber eine passende Steckplatte; nicht jede Mini-Serie hat dieselben Maße.',
                ],
            },
            {
                heading: 'Ein Perlenloch ist etwas anderes als ein leeres Feld',
                body: [
                    'Eine Perle hat bereits ein Loch in der Mitte. Bleibt es nach dem Bügeln offen, kann ein passender Biegering hindurchgeführt werden. Ein leeres Feld der Vorlage bedeutet dagegen, dass dort keine Perle liegt. Es ist nicht das Loch in einer Perle.',
                    'Eine leere Stelle kann nur dann eine eigene Befestigungsöffnung bilden, wenn miteinander verschmolzene Perlen sie vollständig umschließen. Ein leeres Feld am Außenrand hat keine geschlossene Begrenzung. Prüfe das vollständig abgekühlte Werkstück, bevor du eine der beiden Öffnungen verwendest.',
                ],
                bullets: [
                    '1: das Mittelloch einer einzelnen Perle, das beim Bügeln offen bleibt.',
                    '2: ein leeres Feld, das von miteinander verbundenen Perlen umschlossen ist.',
                    '3: freie Fläche am Rand ohne geschlossene Befestigungsöffnung.',
                ],
                figure: {
                    alt: 'Schema für Bügelperlen-Schlüsselanhänger: 1 zeigt das Perlenloch, 2 ein umschlossenes leeres Feld und 3 freien Platz am Rand.',
                    caption: '1: Perlenloch. 2: von Perlen umschlossenes leeres Feld. 3: freie Randfläche ohne geschlossene Begrenzung. Eigene digitale Zeichnung, kein Foto einer Montage und keine Vorlage für Metallteile in Originalgröße.',
                },
            },
            {
                heading: 'Beide Seiten bügeln und vollständig abkühlen lassen',
                body: [
                    'Befolge bei Perler die Standardanleitung: Bügelpapier verwenden, die erste Seite von einem Erwachsenen bügeln lassen, vor dem Abnehmen von der Steckplatte abkühlen lassen und anschließend die Rückseite bügeln. Danach vollständig abkühlen lassen. Verbinde benachbarte Perlen, ohne die geplante Öffnung zu schließen.',
                    'Verwende die Anleitung deiner eigenen Perlenmarke und Serie. Bügelzeit und Ergebnis hängen vom Bügeleisen und vom Werkstück ab; eine feste Sekundenzahl passt nicht zu jedem Schlüsselanhänger. Probiere zunächst einige übrige Perlen aus und beobachte die Verbindungen, statt alle Mittellöcher zuzuschmelzen.',
                ],
            },
            {
                heading: 'Biegering und Schlüsselring verbinden',
                body: ['Arbeite an einem vollständig abgekühlten Motiv. Diese Öffnungsmethode gilt für einen Biegering mit einer Stoßstelle, nicht für die überlappenden Windungen eines Schlüsselrings. Prüfe, ob der Draht durch die Öffnung passt und der Ring die Kette oder den Schlüsselring erreicht, ohne auf das Motiv zu drücken.'],
                bullets: [
                    'Halte den Biegering mit den Zangen auf beiden Seiten der Stoßstelle.',
                    'Drehe ein Ende nach vorn und das andere nach hinten. Ziehe die Enden nicht nach außen auseinander, um den Kreis zu vergrößern.',
                    'Führe den Biegering durch die gewählte Öffnung im Perlenmotiv und dann durch das Endglied der Kette oder eine geeignete Stelle des Schlüsselrings.',
                    'Drehe die Enden zurück, bis sie sich bündig treffen. Schließt der Ring nicht sauber, unterbrich die Montage; quetsche das Motiv nicht, um ihn hineinzuzwingen.',
                ],
                figure: {
                    alt: 'Einzeln dargestellte Schlüsselanhänger-Teile: 1 ein Perlenloch, 2 ein Biegering mit einer Stoßstelle, 3 Kette und Schlüsselring mit zwei Windungen; 4 zeigt mit Punkt und Kreuz die Drehung der Biegering-Enden nach vorn und hinten.',
                    caption: 'Die Teile sind einzeln dargestellt: 1 ist ein Perlenloch, 2 ein Biegering und 3 eine Kette mit Schlüsselring. Bei 4 bedeutet ⊙ zu dir hin und ⊗ von dir weg. Eigene digitale Zeichnung, kein montierter Schlüsselanhänger und keine Vorlage für Metallteile in Originalgröße; die tatsächliche Passung wurde nicht getestet.',
                },
            },
            {
                heading: 'Die Verbindung vor dem Gebrauch prüfen',
                body: ['Betrachte die Verbindung von beiden Seiten und bewege die Metallteile vorsichtig. So kannst du offensichtliche Probleme vor dem Gebrauch erkennen. Diese Prüfung belegt nicht, dass das Motiv den täglichen Gebrauch oder einen starken Zug aushält.'],
                bullets: [
                    'Das Motiv ist vollständig kalt und benachbarte Perlen an der Aufhängung sind verbunden.',
                    'An der Verbindung sind keine sichtbaren Risse oder losen Perlen vorhanden.',
                    'Der Ring passt durch die Öffnung, ohne dass du das Motiv verbiegst oder Kraft anwendest.',
                    'Die Biegering-Enden treffen bündig aufeinander, ohne sichtbaren Spalt oder scharfen Versatz.',
                    'Die Verbindung lässt sich vorsichtig bewegen, ohne hängen zu bleiben; nicht ruckartig daran ziehen.',
                ],
            },
            {
                heading: 'Wenn der Ring nicht passt',
                body: ['Unterbrich die Montage, statt das Metall durch das Motiv zu zwingen. Wähle die Lösung nach dem Problem, das du tatsächlich erkennen kannst.'],
                bullets: [
                    'Das Perlenloch ist zugeschmolzen: Wähle eine andere geeignete vorhandene Öffnung oder ändere die Vorlage und fertige das Motiv mit offener Befestigungsstelle erneut an.',
                    'Der Draht ist zu dick oder der Ring reicht nicht bis zum Anschluss: Wähle passende Metallteile und prüfe erneut. Ein größerer Außendurchmesser bedeutet nicht zwangsläufig dünneren Draht.',
                    'Die Befestigung liegt an einer unverbundenen Perle oder einem fragilen Rand: Überarbeite diese Stelle und fertige das Motiv erneut an. Diese Anleitung verwendet weder eine heiße Nadel noch Bohren als Abkürzung.',
                ],
            },
            {
                heading: 'Mit einer vorhandenen kleinen Vorlage beginnen',
                body: [
                    'Der Minecraft-Smaragd unten hat ein Motiv mit 10 × 12 Feldern auf einer 29 × 29-Platte: Bei 5 mm Rasterabstand sind das etwa 50 × 60 mm Rasterfläche. Seine Detailseite bietet PDF, Farbliste und Editor. Die tatsächliche Größe nach dem Bügeln und seine Eignung als Schlüsselanhänger wurden nicht getestet.',
                    'Als Mini-Beispiel gibt es unseren eigenen Geist mit einem Motiv von 19 × 21 Feldern in Perler-Mini-Farben. Die A4- und US-Letter-Dateien sind Zählvorlagen, keine Unterlagen in Originalgröße. Verwende eine Steckplatte für deine Mini-Perlen. Speichere dein aktuelles Projekt, bevor du das Beispiel im Editor öffnest. Es ist eine mögliche Vorlage, kein getesteter Schlüsselanhänger.',
                ],
            },
            {
                heading: 'Fragen zu Bügelperlen-Schlüsselanhängern',
                body: ['Plane nach der tatsächlichen Vorlage, der Perlenserie und den Metallteilen statt nach einer universellen Befestigungslösung.'],
                bullets: [
                    'Brauche ich oben eine zusätzliche Perle? Nicht immer. Ein vorhandenes Perlenloch kann geeignet sein, aber die Verbindungen darum und die Passung der Metallteile müssen geprüft werden.',
                    'Kann ich ein leeres Feld benutzen? Nur eine von verbundenen Perlen vollständig umschlossene Stelle kann eine eigene Öffnung bilden; freie Fläche am Rand ist keine Schlaufe.',
                    'Sind Mini-Perlen immer 2,6 mm groß? Nein. Prüfe die genaue Serie und Steckplatte. Ein Midi-PDF wird durch einen Farbpalettenwechsel nicht zu einer Mini-Unterlage in Originalgröße.',
                    'Warum den Biegering drehen statt auseinanderziehen? Beim Drehen öffnet sich die Stoßstelle, ohne den Kreis absichtlich zu vergrößern. Nach dem Schließen müssen die Enden trotzdem sauber aneinanderliegen.',
                ],
            },
            {
                heading: 'Quellen und bisherige Prüfung',
                body: [
                    'Perlers Projekte Alien Keychain und Carnival Food Keychains beschreiben die Montage eines Biegerings nach dem Abkühlen. Die Standardanleitung und die FAQ erklären Bügelpapier und offene Perlenmitten. Die folgenden Links führen zu den englischen Anleitungen des Herstellers.',
                    'Fuse Bead Patterns stellt die digitalen Zeichnungen und Vorlagenlinks dieser Anleitung bereit. Die Zeichnungen erklären die Wahl der Verbindung. Wir haben diese Beispiele nicht als Werkstücke montiert, die fertigen Öffnungen nicht gemessen und ihre Haltbarkeit nicht getestet.',
                ],
            },
        ],
    },
    fr: {
        title: 'Faire un porte-clés en perles à repasser',
        description: 'Fabriquez un porte-clés en perles à repasser : choisissez le point de fixation, gardez les trous ouverts et ajoutez un anneau de liaison.',
        eyebrow: 'Fabriquer un porte-clés',
        intro: 'Pour faire un porte-clés en perles à repasser, choisissez un petit motif et prévoyez sa fixation avant le repassage. Soudez les perles selon les instructions de leur fabricant, en laissant l’ouverture prévue libre. Attendez le refroidissement complet, puis reliez le motif à l’anneau du porte-clés ou à sa chaîne avec un anneau de liaison. Vérifiez que le trou et les pièces métalliques sont compatibles avant utilisation.',
        sections: [
            {
                heading: 'Le matériel nécessaire',
                body: ['Choisissez les pièces métalliques en même temps que le motif. Un anneau de liaison est un petit anneau avec une seule jonction ; l’anneau du porte-clés possède des spires superposées pour retenir les clés. Ils ont des fonctions différentes. Un grand anneau de porte-clés ne convient pas forcément pour traverser le trou d’une perle.'],
                bullets: [
                    'Un petit modèle, des perles et une plaque à picots adaptés à la taille et à la gamme exactes des perles.',
                    'Du papier à repasser adapté, un fer et les instructions du fabricant des perles ; un adulte s’occupe du fer.',
                    'Un anneau de liaison dont le fil passe dans l’ouverture prévue sans forcer.',
                    'Un anneau de porte-clés, seul ou muni d’une courte chaîne avec un maillon terminal accessible.',
                    'Deux pinces à bijoux adaptées pour tenir l’anneau près de sa jonction sans écraser le motif.',
                ],
            },
            {
                heading: 'Choisir un petit motif et prévoir sa fixation',
                body: [
                    'Comptez la largeur et la hauteur du motif occupé par les perles, pas toute la plaque vide qui l’entoure. Avec un pas nominal de 5 mm pour une grille Midi, un motif de 10 × 12 cases occupe environ 50 × 60 mm de grille. Un motif de 24 × 24 cases occupe environ 120 × 120 mm. Ces valeurs servent à préparer le projet ; elles ne mesurent pas une pièce après repassage.',
                    'Choisissez une fixation près du haut pour que le motif puisse pendre comme prévu. Examinez les perles autour : une perle isolée ou un bord étroit peut ne pas supporter la fixation. Un modèle numérique ne prouve pas la solidité des jonctions. Les perles Mini peuvent réduire la taille réelle, mais nécessitent une plaque adaptée ; toutes les gammes Mini n’ont pas les mêmes dimensions.',
                ],
            },
            {
                heading: 'Un trou de perle n’est pas une case vide',
                body: [
                    'Une perle possède dès le départ un trou central. S’il reste ouvert après le repassage, un anneau compatible peut le traverser. Une case vide du modèle indique qu’il ne faut pas y poser de perle. Ce n’est pas le trou à l’intérieur d’une perle.',
                    'Un espace vide peut former une autre ouverture de fixation uniquement si des perles soudées entre elles l’entourent complètement. Une case vide au bord extérieur n’a pas de contour fermé. Examinez la pièce refroidie avant de choisir l’un ou l’autre type d’ouverture.',
                ],
                bullets: [
                    '1 : le trou central d’une perle, conservé pendant le repassage.',
                    '2 : une case vide entourée de perles reliées entre elles.',
                    '3 : un espace vide au bord, sans ouverture de fixation fermée.',
                ],
                figure: {
                    alt: 'Schéma de fixation d’un porte-clés en perles à repasser : 1 désigne le trou d’une perle, 2 une case vide entourée et 3 l’espace ouvert au bord.',
                    caption: '1 : trou de perle. 2 : case vide entourée de perles. 3 : espace au bord sans contour fermé. Illustration numérique originale, pas une photo de montage ni un gabarit de pièces métalliques à taille réelle.',
                },
            },
            {
                heading: 'Repasser les deux faces et laisser refroidir',
                body: [
                    'Pour un projet Perler, suivez la méthode standard : utilisez du papier à repasser, laissez un adulte souder la première face, attendez le refroidissement avant de retirer le motif de la plaque, puis terminez l’autre face et laissez refroidir complètement. Reliez les perles voisines en gardant l’ouverture prévue libre.',
                    'Utilisez les instructions de votre propre marque et gamme de perles. Le temps dépend du fer et de la pièce ; un nombre fixe de secondes ne convient pas à tous les porte-clés. Faites d’abord un essai avec quelques perles restantes et observez les jonctions au lieu de fermer tous les trous centraux.',
                ],
            },
            {
                heading: 'Relier l’anneau de liaison au porte-clés',
                body: ['Travaillez sur une pièce complètement refroidie. Cette méthode d’ouverture concerne l’anneau de liaison à une seule jonction, pas les spires superposées de l’anneau double du porte-clés. Vérifiez que le fil passe dans l’ouverture et que l’anneau atteint la chaîne ou le porte-clés sans appuyer sur le motif.'],
                bullets: [
                    'Tenez l’anneau de liaison avec les pinces de part et d’autre de sa jonction.',
                    'Faites pivoter une extrémité vers l’avant et l’autre vers l’arrière. Ne les écartez pas vers l’extérieur pour agrandir le cercle.',
                    'Passez l’anneau dans l’ouverture choisie du motif, puis dans le dernier maillon de la chaîne ou une partie adaptée de l’anneau du porte-clés.',
                    'Inversez la rotation jusqu’à ce que les extrémités se rejoignent et s’alignent. Si l’anneau ne se ferme pas correctement, arrêtez ; n’écrasez pas le motif pour forcer le passage.',
                ],
                figure: {
                    alt: 'Pièces d’un porte-clés présentées séparément : 1 un trou de perle, 2 un anneau de liaison à une jonction, 3 une chaîne et un anneau double ; 4 indique par un point et une croix la rotation vers l’avant et l’arrière.',
                    caption: 'Pièces présentées séparément : 1 est un trou de perle, 2 un anneau de liaison et 3 une chaîne avec l’anneau double du porte-clés. Au repère 4, ⊙ signifie vers vous et ⊗ dans la direction opposée. Illustration numérique originale, pas un porte-clés assemblé ni un gabarit à taille réelle ; la compatibilité physique n’a pas été testée.',
                },
            },
            {
                heading: 'Vérifier la fixation avant utilisation',
                body: ['Regardez la fixation des deux côtés et bougez doucement les pièces métalliques. Ces vérifications peuvent révéler un problème évident avant utilisation ; elles ne prouvent pas que le motif résistera à l’usure quotidienne ou à une forte traction.'],
                bullets: [
                    'La pièce est complètement froide et les perles voisines autour de la fixation sont soudées.',
                    'La fixation ne présente ni fissure visible ni perle détachée.',
                    'L’anneau traverse l’ouverture sans forcer ni plier le motif.',
                    'Les extrémités de l’anneau de liaison se rejoignent sans espace visible ni décalage saillant.',
                    'La fixation bouge doucement sans accrocher ; ne la testez pas en tirant brusquement.',
                ],
            },
            {
                heading: 'Si l’anneau ne passe pas',
                body: ['Arrêtez le montage plutôt que de forcer le métal à travers le motif. Choisissez une solution correspondant au problème réellement visible.'],
                bullets: [
                    'Le trou d’une perle s’est fermé : choisissez une autre ouverture existante adaptée, ou modifiez le modèle et refaites la pièce en conservant son ouverture de fixation.',
                    'Le fil est trop épais ou l’anneau n’atteint pas la connexion : choisissez des pièces compatibles et vérifiez à nouveau. Un diamètre extérieur plus grand ne signifie pas forcément un fil plus fin.',
                    'La fixation est située sur une perle isolée ou un bord qui semble fragile : revoyez cette zone et refaites la pièce. Ce guide n’utilise ni aiguille chauffée ni perçage comme raccourci.',
                ],
            },
            {
                heading: 'Commencer avec un petit modèle existant',
                body: [
                    'L’émeraude Minecraft ci-dessous a un motif de 10 × 12 cases sur une plaque de 29 × 29 : environ 50 × 60 mm de grille avec un pas de 5 mm. Sa fiche propose le PDF, la liste des couleurs et l’éditeur. Sa taille réelle après repassage et son utilisation comme porte-clés n’ont pas été testées.',
                    'Pour un exemple Mini, notre fantôme original a un motif de 19 × 21 cases dans les couleurs Perler Mini. Les fichiers A4 et US Letter sont des modèles à lire en comptant les cases, pas des gabarits à taille réelle. Utilisez une plaque correspondant à vos perles Mini. Enregistrez votre projet actuel avant d’ouvrir cet exemple dans l’éditeur : c’est un modèle à envisager, pas un porte-clés testé.',
                ],
            },
            {
                heading: 'Questions sur les porte-clés en perles à repasser',
                body: ['Préparez la fixation selon le modèle, la gamme de perles et les pièces métalliques réellement utilisés, plutôt qu’avec une méthode universelle.'],
                bullets: [
                    'Faut-il ajouter une perle en haut ? Pas toujours. Un trou existant peut convenir, mais il faut examiner les jonctions autour et la compatibilité des pièces métalliques.',
                    'Peut-on utiliser une case vide ? Seule une zone complètement entourée de perles reliées peut former une ouverture distincte ; l’espace vide au bord n’est pas une boucle.',
                    'Les perles Mini font-elles toujours 2,6 mm ? Non. Vérifiez la gamme exacte et la plaque adaptée. Changer la palette d’un PDF Midi n’en fait pas un gabarit Mini à taille réelle.',
                    'Pourquoi faire pivoter l’anneau plutôt que l’écarter ? La rotation ouvre la jonction sans agrandir volontairement le cercle. Les extrémités doivent tout de même se rejoindre proprement après fermeture.',
                ],
            },
            {
                heading: 'Sources et vérifications effectuées',
                body: [
                    'Les projets Alien Keychain et Carnival Food Keychains de Perler décrivent la pose d’un anneau de liaison après le refroidissement. La méthode standard et la FAQ expliquent l’usage du papier à repasser et la conservation des trous centraux. Les liens suivants mènent aux instructions du fabricant en anglais.',
                    'Fuse Bead Patterns fournit les schémas numériques et les liens vers les modèles de ce guide. Ils illustrent les choix de fixation ; nous n’avons pas assemblé physiquement ces exemples, mesuré les ouvertures finales ni testé leur résistance à l’usage.',
                ],
            },
        ],
    },
    ja: {
        title: 'アイロンビーズのキーホルダーの作り方',
        description: 'アイロンビーズのキーホルダーの作り方を説明。取り付け位置、ビーズの穴と空白マスの違い、丸カンの開閉、冷却後の確認を図で紹介します。',
        eyebrow: 'キーホルダーを作る',
        intro: 'アイロンビーズでキーホルダーを作るときは、小さな図案を選び、アイロンをかける前に金具の取り付け位置を決めます。使用するビーズのメーカーの手順に沿って接合し、取り付け用の穴を残します。完全に冷めてから丸カンで二重リングやチェーンにつなぎ、穴と金具が合うことを確認してください。',
        sections: [
            {
                heading: '用意するもの',
                body: ['図案を選ぶときに金具も確認しましょう。丸カンは切れ目が1か所ある小さな接続用の輪で、二重リングは重なった輪に鍵を通す金具です。役割が異なるため、大きな二重リングがそのままビーズの穴に合うとは限りません。'],
                bullets: [
                    '小さな図案と、正確なサイズ・シリーズが合ったビーズとプレート。',
                    '適切なアイロンペーパー、アイロン、ビーズのメーカーの接合手順。アイロンは大人が担当します。',
                    '取り付け用の穴に、力をかけずに線材を通せる丸カン。',
                    '二重リング、または短いチェーン付きの二重リング。チェーンの端の輪に丸カンを通せるものを選びます。',
                    '作品をつぶさずに丸カンの切れ目の両側をつかめる、金具用の平ヤットコなどを2本。',
                ],
            },
            {
                heading: '小さな図案を選び、取り付け位置を決める',
                body: [
                    '周囲の空白を含むプレート全体ではなく、ビーズがある絵柄の横・縦のマス数を数えます。Midiのマス間隔を5 mmとして計算すると、10 × 12マスの絵柄は約50 × 60 mm分の格子に収まります。24 × 24マスなら約120 × 120 mmです。これは選ぶときの目安で、アイロン後の実測寸法ではありません。',
                    '意図した向きにぶら下がるよう、絵柄の上側に取り付け位置を選びます。その周りのビーズも確認してください。離れた1粒や細い縁では、取り付けに適さない場合があります。デジタル図案だけでは接合の強さは分かりません。Miniにすると実物を小さくできますが、対応するプレートが必要で、Miniシリーズの寸法はすべて同じではありません。',
                ],
            },
            {
                heading: 'ビーズの穴と空白マスは違う',
                body: [
                    'ビーズには、もともと中央に穴があります。アイロン後もその穴が残っていれば、合う金具を通せる場合があります。一方、図案の空白マスは「ここにはビーズを置かない」という意味で、ビーズ自体の穴ではありません。',
                    '空白部分を別の取り付け穴にするには、接合したビーズがその周囲を途切れずに囲んでいる必要があります。外側の縁にある空白は閉じた穴になりません。どちらの穴を使う場合も、完全に冷めた実物を確認してから選びましょう。',
                ],
                bullets: [
                    '1：アイロンで塞がずに残した、1粒のビーズの中央の穴。',
                    '2：接合したビーズで周囲を囲んだ空白マス。',
                    '3：縁にある空白。周囲が閉じていないため、取り付け用の穴ではありません。',
                ],
                figure: {
                    alt: 'アイロンビーズのキーホルダーの取り付け穴の説明図。1はビーズの中央の穴、2はビーズで囲んだ空白マス、3は縁の開いた空白です。',
                    caption: '1：ビーズの穴。2：ビーズで囲んだ空白マス。3：周囲が閉じていない縁の空白。独自に描いたデジタル説明図です。実物の組み立て写真や、金具の実寸型紙ではありません。',
                },
            },
            {
                heading: '両面を接合し、完全に冷ます',
                body: [
                    'Perlerでは標準手順に従い、アイロンペーパーを使って大人が片面を接合します。プレートから外す前に冷まし、裏面を仕上げた後も完全に冷ましてください。隣り合うビーズをつなげながら、予定した取り付け穴を残します。',
                    '手元のブランドとシリーズの説明に従ってください。必要な加熱時間はアイロンと作品によって違うため、すべてのキーホルダーに共通する秒数はありません。まず余ったビーズで試し、中央の穴をすべて塞ぐまで加熱するのではなく、接合の状態を見ながら進めます。',
                ],
            },
            {
                heading: '丸カンで二重リングにつなぐ',
                body: ['完全に冷めた作品に金具を取り付けます。ここで説明する開き方は、切れ目が1か所ある丸カン用です。輪が重なった二重リングを同じ方法で開かないでください。丸カンの線材が穴を通り、作品を押さずにチェーンや二重リングへ届くことを確認します。'],
                bullets: [
                    '丸カンの切れ目の両側を、2本のヤットコでつかみます。',
                    '片側を手前、もう片側を奥へひねって開きます。左右へ引っ張って輪を大きくしないでください。',
                    '作品の選んだ穴に丸カンを通し、続けてチェーンの端の輪、または二重リングの通せる部分につなぎます。',
                    '逆方向にひねり、両端がそろって接するまで閉じます。きれいに閉じない場合は止め、作品をつぶして無理に通さないでください。',
                ],
                figure: {
                    alt: '部品を別々に示したキーホルダーの説明図。1はビーズの穴、2は切れ目が1か所の丸カン、3はチェーンと二重リング。4の点とバツ印は、丸カンの両端を手前と奥へひねる方向です。',
                    caption: '部品を別々に示しています。1：ビーズの穴。2：丸カン。3：チェーンと二重リング。4の⊙は手前、⊗は奥へ動かす方向です。独自のデジタル説明図で、組み立て済みのキーホルダーや実寸の型紙ではありません。実物での適合は検証していません。',
                },
            },
            {
                heading: '使う前に取り付け部分を確認する',
                body: ['取り付け部分を両面から見て、金具をゆっくり動かします。使用前に目に見える問題を見つけるための確認です。日常の使用や強い引っ張りに耐えることを証明するものではありません。'],
                bullets: [
                    '作品が完全に冷めていて、取り付け位置の周囲のビーズが接合している。',
                    '取り付け部分に、見えるひびや外れたビーズがない。',
                    '作品を曲げたり力をかけたりせずに、丸カンを穴に通せる。',
                    '丸カンの両端が接していて、目に見える隙間や鋭い段差がない。',
                    '接続部分をゆっくり動かしても引っ掛からない。強く引っ張って試さない。',
                ],
            },
            {
                heading: '丸カンが合わないとき',
                body: ['金属を無理に押し込まず、取り付けを止めます。実際に見える問題に合わせて方法を選んでください。'],
                bullets: [
                    'ビーズの穴が塞がった：別の適した穴を選ぶか、図案を見直し、取り付け穴を残して作品を作り直します。',
                    '線材が太すぎる、または接続先へ届かない：適した金具を選び直して確認します。輪の外径が大きくても、線材が細いとは限りません。',
                    '離れた1粒や弱そうな縁に取り付けている：接続部分の図案を見直して作り直します。このガイドでは熱した針や穴あけを近道として使いません。',
                ],
            },
            {
                heading: '既存の小さな図案から選ぶ',
                body: [
                    '下のMinecraftのエメラルドは、29 × 29マスのプレートに10 × 12マスの絵柄を配置しています。5 mm間隔なら約50 × 60 mm分の格子です。詳細ページからPDF、色別の必要数、エディターを開けます。アイロン後の実寸や、キーホルダーとしての適性は検証していません。',
                    'Miniの例には、Perler Mini配色のオリジナルのゴーストがあります。絵柄は19 × 21マスで、A4・US LetterのPDFは行と列を数える図案です。実寸の下敷きではありません。手元のMiniビーズに合うプレートを使い、エディターで開く前に現在のプロジェクトを保存してください。候補となる図案であり、実物のキーホルダーとして検証したものではありません。',
                ],
            },
            {
                heading: 'アイロンビーズのキーホルダーでよくある質問',
                body: ['一律の取り付け方ではなく、実際に使う図案、ビーズのシリーズ、金具に合わせて準備します。'],
                bullets: [
                    '上にビーズを追加する必要はありますか？ 必ずしも必要ではありません。既存のビーズの穴を使える場合もありますが、周囲の接合と金具の適合を確認してください。',
                    '空白マスを使えますか？ 接合したビーズが周囲を完全に囲んでいる部分だけが、別の穴になります。縁の空白は輪ではありません。',
                    'Miniはすべて2.6 mmですか？ いいえ。正確なシリーズと対応プレートを確認してください。MidiのPDFは、色板を変更するだけでMiniの実寸下敷きにはなりません。',
                    '丸カンを引っ張らずにひねるのはなぜですか？ 輪を大きく広げずに切れ目を開けるためです。閉じた後は、両端がきれいに接している必要があります。',
                ],
            },
            {
                heading: '参考資料と検証の範囲',
                body: [
                    'PerlerのAlien KeychainとCarnival Food Keychainsでは、作品が冷めてから丸カンを取り付ける手順を説明しています。標準手順とFAQには、アイロンペーパーの使用とビーズ中央の穴を残す方法が掲載されています。以下はメーカーの英語の説明です。',
                    'Fuse Bead Patternsは、このガイドのデジタル説明図と図案へのリンクを提供しています。取り付け方を理解するための資料であり、掲載例を実物として組み立てたり、完成後の穴を測ったり、耐久性を試験したりはしていません。',
                ],
            },
        ],
    },
};
