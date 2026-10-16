import type { SiteLocale } from '../i18n/locales';

export interface BlockShapeCopy {
    title: string;
    description: string;
    heading: string;
    intro: string;
    home: string;
    shape: string;
    circle: string;
    ellipse: string;
    sphere: string;
    dome: string;
    cylinder: string;
    cone: string;
    mode: string;
    hollow: string;
    solid: string;
    diameter: string;
    width: string;
    depth: string;
    height: string;
    thickness: string;
    applyShape: string;
    pendingChanges: string;
    layer: string;
    layerOf: string;
    previousLayer: string;
    nextLayer: string;
    preview: string;
    previewLabel: string;
    showCenter: string;
    showCoordinates: string;
    showGrid: string;
    showGhost: string;
    showRowCounts: string;
    dimensions: string;
    layerBlocks: string;
    totalBlocks: string;
    materials: string;
    blockName: string;
    blockColor: string;
    stackSize: string;
    stacks: string;
    rowSegments: string;
    row: string;
    columnStart: string;
    columnEnd: string;
    runLength: string;
    completedLayer: string;
    completedSummary: string;
    clearProgress: string;
    paper: string;
    paperA4: string;
    paperLetter: string;
    downloadPng: string;
    downloadPdf: string;
    downloadAllPdf: string;
    downloadCurrentPdf: string;
    exportLayerProject: string;
    currentLayerOnly: string;
    saveProject: string;
    loadProject: string;
    replaceProject: string;
    editorLink: string;
    editorHelp: string;
    pixelProjectHelp: string;
    centerGuideHelp: string;
    coordinatesHelp: string;
    noCavity: string;
    exporting: string;
    exportFailed: string;
    invalidDimensions: string;
    invalidOptions: string;
    invalidProject: string;
    tooLarge: string;
    emptyLayer: string;
    saved: string;
    loaded: string;
    loadingProject: string;
    transferFailed: string;
    restoring: string;
    restoreFailed: string;
    retryRestore: string;
    discardRestore: string;
    discardFailed: string;
    busyCannotLeave: string;
    unsaved: string;
    applied: string;
    recovered: string;
    cancelExport: string;
    pdfPageCount: string;
    pdfTitle: string;
    pdfOverview: string;
    pdfLayer: string;
    pdfTile: string;
    pdfPage: string;
    pdfCount: string;
    pdfTotal: string;
    pdfScale: string;
    pdfRows: string;
    pdfColumns: string;
    pdfCoordinates: string;
    pdfLayerSummary: string;
    pdfManual: string;
    pdfMethod: string;
    howTitle: string;
    steps: string[];
    notesTitle: string;
    notes: string[];
}

export const blockShapeCopy: Record<SiteLocale, BlockShapeCopy> = {
    "en": {
        "title": "Minecraft Circle Generator | Fuse Bead Patterns",
        "description": "Plan Minecraft circles, ellipses and 3D shapes layer by layer. Check block counts and row runs, then download PNG, PDF or editable projects.",
        "heading": "Minecraft circle generator",
        "intro": "Plan circles and ellipses on a square grid, or build a sphere, dome, cylinder or cone one layer at a time. Choose dimensions, a solid or hollow shape and a wall thickness, then follow the grid, row runs and block counts for manual building.",
        "home": "Home",
        "shape": "Shape",
        "circle": "Circle",
        "ellipse": "Ellipse",
        "sphere": "Sphere",
        "dome": "Dome",
        "cylinder": "Cylinder",
        "cone": "Cone",
        "mode": "Fill",
        "hollow": "Hollow",
        "solid": "Solid",
        "diameter": "Diameter",
        "width": "Width",
        "depth": "Depth",
        "height": "Height",
        "thickness": "Wall thickness",
        "applyShape": "Apply shape",
        "pendingChanges": "Settings have changed. Apply the shape to update the plan and downloads.",
        "layer": "Layer",
        "layerOf": "Layer {layer} of {count}",
        "previousLayer": "Previous layer",
        "nextLayer": "Next layer",
        "preview": "Layer preview",
        "previewLabel": "Block layout for the selected layer",
        "showCenter": "Show center",
        "showCoordinates": "Show coordinates",
        "showGrid": "Show grid",
        "showGhost": "Show the layer below",
        "showRowCounts": "Show row counts",
        "dimensions": "Dimensions: {width} × {depth} × {height}",
        "layerBlocks": "Blocks in this layer: {count}",
        "totalBlocks": "Total blocks: {count}",
        "materials": "Materials",
        "blockName": "Block label",
        "blockColor": "Preview color",
        "stackSize": "Blocks per stack",
        "stacks": "Stacks: {stacks}, plus {remainder} blocks",
        "rowSegments": "Row runs",
        "row": "Row",
        "columnStart": "Start column",
        "columnEnd": "End column",
        "runLength": "Blocks in run",
        "completedLayer": "Mark this layer complete",
        "completedSummary": "Completed layers: {done} of {count}",
        "clearProgress": "Clear completed layers",
        "paper": "PDF paper size",
        "paperA4": "A4",
        "paperLetter": "US Letter",
        "downloadPng": "Download layer PNG",
        "downloadPdf": "Download PDF",
        "downloadAllPdf": "Download all layers as PDF",
        "downloadCurrentPdf": "Download this layer as PDF",
        "exportLayerProject": "Save layer pixel project",
        "currentLayerOnly": "Current layer only",
        "saveProject": "Save shape project",
        "loadProject": "Load shape project",
        "replaceProject": "Loading this project will replace your unsaved shape, settings and layer checklist. Continue?",
        "editorLink": "Open pixel editor",
        "editorHelp": "Save the layer pixel project first, then open the editor and load that file to edit individual squares. Use this tool to change the shape dimensions.",
        "pixelProjectHelp": "The pixel project contains only the selected layer. It is an editable grid, not a Minecraft world or block-placement file.",
        "centerGuideHelp": "An odd dimension has a center row or column. An even dimension has its center between two rows or columns. The guide marks that geometric center.",
        "coordinatesHelp": "Rows and columns shown here start at 1. Exported relative X and Z coordinates start at 0; Y = 0 is the bottom layer.",
        "noCavity": "At this size and thickness, the hollow shape may have no inner cavity.",
        "exporting": "Preparing download…",
        "exportFailed": "The download could not be created. Try again.",
        "invalidDimensions": "Use whole numbers from 1 to 128 for a circle or ellipse, and from 1 to 96 for a 3D shape.",
        "invalidOptions": "Check the shape, fill, wall thickness, layer and material settings. Wall thickness must be a whole number from 1 to 8.",
        "invalidProject": "This file is not a valid shape project for this tool.",
        "tooLarge": "This shape is too large. Reduce its dimensions.",
        "emptyLayer": "This layer contains no blocks.",
        "saved": "Shape project saved.",
        "loaded": "Shape project loaded.",
        "loadingProject": "Checking shape project…",
        "transferFailed": "Your current shape could not be saved for the language change. It remains open here. Save a shape project before trying again.",
        "restoring": "Checking saved shape settings…",
        "restoreFailed": "The saved shape could not be checked or restored. Retry, or discard it explicitly to start again. Editing and downloads remain locked.",
        "retryRestore": "Retry recovery",
        "discardRestore": "Discard saved shape and start again",
        "discardFailed": "The saved shape could not be confirmed as cleared. The tool remains locked. Retry recovery or discard again.",
        "busyCannotLeave": "A file is being prepared. Wait for it to finish before leaving.",
        "unsaved": "You have unsaved shape settings or layer progress.",
        "applied": "Shape updated.",
        "recovered": "Shape restored.",
        "pdfTitle": "Minecraft block shape plan",
        "pdfOverview": "Shape overview",
        "pdfLayer": "Layer {layer} of {count}",
        "pdfTile": "Tile {tile} of {count}",
        "pdfPage": "Page {page} of {count}",
        "pdfCount": "Blocks: {count}",
        "pdfTotal": "Total blocks: {count}",
        "pdfScale": "Reading chart; not a life-size placement template.",
        "pdfRows": "Rows {start}–{end}",
        "pdfColumns": "Columns {start}–{end}",
        "pdfCoordinates": "This PDF uses relative X and Z starting at 0; Y = 0 is the bottom. Screen rows and columns start at 1.",
        "pdfLayerSummary": "Layer counts",
        "pdfManual": "Follow the plan to place blocks manually. This PDF does not import a world or execute commands.",
        "pdfMethod": "Each filled square represents one block. Follow each row run from its start column through its end column, including both ends.",
        "howTitle": "Plan a shape for manual building",
        "steps": [
            "Choose a circle or ellipse for a flat plan, or a sphere, dome, cylinder or cone for a layered build. Set the dimensions and choose solid or hollow.",
            "Apply the settings. Check the center guide, block counts and row runs. For a 3D shape, move through the layers from the bottom upward and mark completed layers as you work.",
            "Choose a preview color and stack size for the material count. The color is a visual aid; choose the actual block in Minecraft yourself.",
            "Download a PNG or A4/US Letter PDF for reference. Save a shape project to return to the settings and layer checklist; save a layer pixel project if you want to edit that layer in the pixel editor."
        ],
        "notesTitle": "Read the grid before you build",
        "notes": [
            "Circles and ellipses accept dimensions from 1 to 128 blocks; 3D shapes accept 1 to 96. Wall thickness ranges from 1 to 8 blocks. Counts describe the generated grid.",
            "A block grid approximates a curve. Very narrow ellipses, such as 2 × 8, can look rectangular. A hollow shape at a small size or with thick walls may have no inner cavity.",
            "Circle and ellipse profiles retain a full central row and column, or two of each for even dimensions, to reach the requested width and depth. This also applies to cylinder and cone cross-sections. Hollowing may remove the inner center cells.",
            "Hollow spheres have closed ends; hollow domes and cones have an open base; hollow cylinders have an open top and bottom. Thickness counts neighboring cell layers, not a continuous geometric distance.",
            "Some outline blocks meet only at a corner. A digital outline does not guarantee a face-connected wall or continuous edge; inspect the grid for your build.",
            "Odd dimensions have a center row or column; even dimensions have a center between rows or columns. Keep the same alignment when stacking layers.",
            "Screen rows and columns start at 1. Relative X and Z coordinates in exports start at 0, and Y = 0 is the bottom layer. Use the coordinate labels when transferring a plan.",
            "A PNG preserves the selected layer’s pixel grid. PDFs are reading charts with page or tile boundaries, not life-size placement templates. Check row and column ranges on each page.",
            "The shape project stores the whole shape’s settings and layer checklist. A layer pixel project stores only one layer; edits made in the pixel editor do not change the original 3D shape.",
            "This tool provides plans for placing blocks by hand. It does not export a Minecraft world, a structure file or WorldEdit commands, and it does not verify the result inside the game."
        ],
        "cancelExport": "Cancel file generation",
        "pdfPageCount": "PDF pages: {count}"
    },
    "de": {
        "title": "Minecraft-Kreis-Generator | Fuse Bead Patterns",
        "description": "Plane Minecraft-Kreise, Ellipsen und 3D-Formen Schicht für Schicht. Prüfe Blockmengen und Reihen; lade PNG, PDF oder bearbeitbare Projekte herunter.",
        "heading": "Minecraft-Kreis-Generator",
        "intro": "Plane Kreise und Ellipsen im quadratischen Raster oder baue Kugeln, Kuppeln, Zylinder und Kegel Schicht für Schicht. Wähle Maße, eine massive oder hohle Form und die Wandstärke. Raster, Reihenabschnitte und Blockmengen helfen dir beim manuellen Bauen.",
        "home": "Startseite",
        "shape": "Form",
        "circle": "Kreis",
        "ellipse": "Ellipse",
        "sphere": "Kugel",
        "dome": "Kuppel",
        "cylinder": "Zylinder",
        "cone": "Kegel",
        "mode": "Füllung",
        "hollow": "Hohl",
        "solid": "Massiv",
        "diameter": "Durchmesser",
        "width": "Breite",
        "depth": "Tiefe",
        "height": "Höhe",
        "thickness": "Wandstärke",
        "applyShape": "Form übernehmen",
        "pendingChanges": "Die Einstellungen wurden geändert. Übernimm die Form, um Bauplan und Downloads zu aktualisieren.",
        "layer": "Schicht",
        "layerOf": "Schicht {layer} von {count}",
        "previousLayer": "Vorherige Schicht",
        "nextLayer": "Nächste Schicht",
        "preview": "Schichtvorschau",
        "previewLabel": "Blockraster der ausgewählten Schicht",
        "showCenter": "Mittelpunkt anzeigen",
        "showCoordinates": "Koordinaten anzeigen",
        "showGrid": "Raster anzeigen",
        "showGhost": "Darunterliegende Schicht anzeigen",
        "showRowCounts": "Blockmenge je Reihe anzeigen",
        "dimensions": "Maße: {width} × {depth} × {height}",
        "layerBlocks": "Blöcke in dieser Schicht: {count}",
        "totalBlocks": "Blöcke insgesamt: {count}",
        "materials": "Material",
        "blockName": "Blockbezeichnung",
        "blockColor": "Vorschaufarbe",
        "stackSize": "Blöcke pro Stapel",
        "stacks": "Stapel: {stacks}, dazu {remainder} Blöcke",
        "rowSegments": "Reihenabschnitte",
        "row": "Reihe",
        "columnStart": "Erste Spalte",
        "columnEnd": "Letzte Spalte",
        "runLength": "Blöcke im Abschnitt",
        "completedLayer": "Diese Schicht als fertig markieren",
        "completedSummary": "Fertige Schichten: {done} von {count}",
        "clearProgress": "Markierungen fertiger Schichten löschen",
        "paper": "PDF-Papierformat",
        "paperA4": "A4",
        "paperLetter": "US Letter",
        "downloadPng": "Schicht als PNG herunterladen",
        "downloadPdf": "PDF herunterladen",
        "downloadAllPdf": "Alle Schichten als PDF herunterladen",
        "downloadCurrentPdf": "Diese Schicht als PDF herunterladen",
        "exportLayerProject": "Pixelprojekt der Schicht speichern",
        "currentLayerOnly": "Nur die aktuelle Schicht",
        "saveProject": "Formprojekt speichern",
        "loadProject": "Formprojekt laden",
        "replaceProject": "Dieses Projekt ersetzt deine ungespeicherte Form, Einstellungen und Schichtmarkierungen. Fortfahren?",
        "editorLink": "Pixel-Editor öffnen",
        "editorHelp": "Speichere zuerst das Pixelprojekt der Schicht. Öffne dann den Editor und lade die Datei, um einzelne Kästchen zu bearbeiten. Die Formmaße änderst du in diesem Werkzeug.",
        "pixelProjectHelp": "Das Pixelprojekt enthält nur die ausgewählte Schicht. Es ist ein bearbeitbares Raster, keine Minecraft-Welt und keine Datei zum Platzieren von Blöcken.",
        "centerGuideHelp": "Bei einer ungeraden Größe liegt die Mitte in einer Reihe oder Spalte. Bei einer geraden Größe liegt sie zwischen zwei Reihen oder Spalten. Die Hilfslinie markiert diese geometrische Mitte.",
        "coordinatesHelp": "Reihen und Spalten beginnen hier bei 1. Exportierte relative X- und Z-Koordinaten beginnen bei 0; Y = 0 ist die unterste Schicht.",
        "noCavity": "Bei dieser Größe und Wandstärke kann die hohle Form ohne inneren Hohlraum bleiben.",
        "exporting": "Download wird vorbereitet…",
        "exportFailed": "Die Download-Datei konnte nicht erstellt werden. Bitte versuche es erneut.",
        "invalidDimensions": "Verwende ganze Zahlen von 1 bis 128 für Kreise und Ellipsen und von 1 bis 96 für 3D-Formen.",
        "invalidOptions": "Prüfe Form, Füllung, Wandstärke, Schicht und Materialeinstellungen. Die Wandstärke muss eine ganze Zahl von 1 bis 8 sein.",
        "invalidProject": "Diese Datei ist kein gültiges Formprojekt für dieses Werkzeug.",
        "tooLarge": "Die Form ist zu groß. Verringere die Maße.",
        "emptyLayer": "Diese Schicht enthält keine Blöcke.",
        "saved": "Formprojekt gespeichert.",
        "loaded": "Formprojekt geladen.",
        "loadingProject": "Formprojekt wird geprüft…",
        "transferFailed": "Deine aktuelle Form konnte für den Sprachwechsel nicht gespeichert werden. Sie bleibt hier geöffnet. Speichere vor einem erneuten Versuch ein Formprojekt.",
        "restoring": "Gespeicherte Formeinstellungen werden geprüft…",
        "restoreFailed": "Die gespeicherte Form konnte nicht geprüft oder wiederhergestellt werden. Versuche es erneut oder verwirf sie ausdrücklich, um neu zu beginnen. Bearbeitung und Downloads bleiben gesperrt.",
        "retryRestore": "Wiederherstellung erneut versuchen",
        "discardRestore": "Gespeicherte Form verwerfen und neu beginnen",
        "discardFailed": "Das Löschen der gespeicherten Form konnte nicht bestätigt werden. Das Werkzeug bleibt gesperrt. Versuche die Wiederherstellung oder das Verwerfen erneut.",
        "busyCannotLeave": "Eine Datei wird vorbereitet. Warte vor dem Verlassen, bis der Vorgang beendet ist.",
        "unsaved": "Du hast ungespeicherte Formeinstellungen oder Schichtmarkierungen.",
        "applied": "Form aktualisiert.",
        "recovered": "Form wiederhergestellt.",
        "pdfTitle": "Minecraft-Bauplan für Blockformen",
        "pdfOverview": "Formübersicht",
        "pdfLayer": "Schicht {layer} von {count}",
        "pdfTile": "Teil {tile} von {count}",
        "pdfPage": "Seite {page} von {count}",
        "pdfCount": "Blöcke: {count}",
        "pdfTotal": "Blöcke insgesamt: {count}",
        "pdfScale": "Plan zum Ablesen; keine Platzierungsvorlage in Originalgröße.",
        "pdfRows": "Reihen {start}–{end}",
        "pdfColumns": "Spalten {start}–{end}",
        "pdfCoordinates": "Dieses PDF verwendet relative X- und Z-Koordinaten ab 0; Y = 0 ist unten. Reihen und Spalten am Bildschirm beginnen bei 1.",
        "pdfLayerSummary": "Blockmengen je Schicht",
        "pdfManual": "Platziere die Blöcke anhand des Plans von Hand. Dieses PDF importiert keine Welt und führt keine Befehle aus.",
        "pdfMethod": "Jedes gefüllte Kästchen steht für einen Block. Baue jeden Reihenabschnitt von der ersten bis zur letzten angegebenen Spalte, jeweils einschließlich beider Enden.",
        "howTitle": "Eine Form zum manuellen Bauen planen",
        "steps": [
            "Wähle Kreis oder Ellipse für einen ebenen Plan oder Kugel, Kuppel, Zylinder oder Kegel für einen Aufbau aus Schichten. Lege die Maße fest und wähle massiv oder hohl.",
            "Übernimm die Einstellungen. Prüfe Mittellinien, Blockmengen und Reihenabschnitte. Gehe bei 3D-Formen von unten nach oben durch die Schichten und markiere fertige Schichten.",
            "Wähle eine Vorschaufarbe und Stapelgröße für die Materialmenge. Die Farbe dient nur zur Orientierung; den tatsächlichen Block wählst du selbst in Minecraft.",
            "Lade ein PNG oder ein PDF für A4 oder US Letter zum Ablesen herunter. Ein Formprojekt speichert Einstellungen und Schichtmarkierungen; ein Pixelprojekt ermöglicht das Bearbeiten einer einzelnen Schicht im Pixel-Editor."
        ],
        "notesTitle": "Vor dem Bauen das Raster prüfen",
        "notes": [
            "Kreise und Ellipsen erlauben Maße von 1 bis 128 Blöcken, 3D-Formen von 1 bis 96. Die Wandstärke reicht von 1 bis 8 Blöcken. Die Mengen beziehen sich auf das erzeugte Raster.",
            "Ein Blockraster nähert eine Kurve an. Sehr schmale Ellipsen wie 2 × 8 können rechteckig aussehen. Eine kleine hohle Form oder eine Form mit dicken Wänden kann keinen inneren Hohlraum haben.",
            "Kreis- und Ellipsenprofile behalten eine vollständige mittlere Reihe und Spalte, bei geraden Maßen jeweils zwei, um die gewählte Breite und Tiefe zu erreichen. Das gilt auch für Zylinder- und Kegelquerschnitte. Bei hohlen Formen können die inneren Kästchen der Mitte entfallen.",
            "Hohle Kugeln sind an den Enden geschlossen; hohle Kuppeln und Kegel sind unten offen; hohle Zylinder sind oben und unten offen. Die Wandstärke zählt benachbarte Kästchenschichten, keinen kontinuierlichen geometrischen Abstand.",
            "Manche Randblöcke berühren sich nur an einer Ecke. Ein digitaler Umriss garantiert weder eine über Blockflächen verbundene Wand noch eine durchgehende Kante. Prüfe das Raster für dein Bauvorhaben.",
            "Ungerade Maße haben eine mittlere Reihe oder Spalte; bei geraden Maßen liegt die Mitte dazwischen. Behalte beim Stapeln der Schichten dieselbe Ausrichtung bei.",
            "Die Reihen und Spalten am Bildschirm beginnen bei 1. Relative X- und Z-Koordinaten in Exporten beginnen bei 0; Y = 0 ist die unterste Schicht. Beachte beim Übertragen die Koordinatenbeschriftung.",
            "Ein PNG bewahrt das Pixelraster der ausgewählten Schicht. PDFs sind Pläne zum Ablesen mit Seiten- oder Teilgrenzen, keine Platzierungsvorlagen in Originalgröße. Prüfe die Reihen- und Spaltenbereiche jeder Seite.",
            "Das Formprojekt speichert die Einstellungen der gesamten Form und die Schichtmarkierungen. Ein Pixelprojekt enthält nur eine Schicht; Änderungen im Pixel-Editor ändern die ursprüngliche 3D-Form nicht.",
            "Dieses Werkzeug erstellt Pläne zum manuellen Platzieren von Blöcken. Es exportiert keine Minecraft-Welt, Strukturdatei oder WorldEdit-Befehle und prüft das Ergebnis nicht im Spiel."
        ],
        "cancelExport": "Dateierstellung abbrechen",
        "pdfPageCount": "PDF-Seiten: {count}"
    },
    "fr": {
        "title": "Générateur de cercle Minecraft | Fuse Bead Patterns",
        "description": "Préparez des cercles, ellipses et formes 3D Minecraft par couches. Vérifiez les blocs et rangées, puis exportez un PNG, un PDF ou un projet.",
        "heading": "Générateur de cercle Minecraft",
        "intro": "Préparez des cercles et des ellipses sur une grille carrée, ou construisez une sphère, un dôme, un cylindre ou un cône couche par couche. Choisissez les dimensions, une forme pleine ou creuse et une épaisseur, puis suivez la grille, les segments de rangée et les quantités pour construire à la main.",
        "home": "Accueil",
        "shape": "Forme",
        "circle": "Cercle",
        "ellipse": "Ellipse",
        "sphere": "Sphère",
        "dome": "Dôme",
        "cylinder": "Cylindre",
        "cone": "Cône",
        "mode": "Remplissage",
        "hollow": "Creux",
        "solid": "Plein",
        "diameter": "Diamètre",
        "width": "Largeur",
        "depth": "Profondeur",
        "height": "Hauteur",
        "thickness": "Épaisseur de paroi",
        "applyShape": "Appliquer la forme",
        "pendingChanges": "Les réglages ont changé. Appliquez la forme pour actualiser le plan et les téléchargements.",
        "layer": "Couche",
        "layerOf": "Couche {layer} sur {count}",
        "previousLayer": "Couche précédente",
        "nextLayer": "Couche suivante",
        "preview": "Aperçu de la couche",
        "previewLabel": "Disposition des blocs de la couche sélectionnée",
        "showCenter": "Afficher le centre",
        "showCoordinates": "Afficher les coordonnées",
        "showGrid": "Afficher la grille",
        "showGhost": "Afficher la couche inférieure",
        "showRowCounts": "Afficher les quantités par rangée",
        "dimensions": "Dimensions : {width} × {depth} × {height}",
        "layerBlocks": "Blocs de cette couche : {count}",
        "totalBlocks": "Total des blocs : {count}",
        "materials": "Matériaux",
        "blockName": "Nom du bloc",
        "blockColor": "Couleur de l’aperçu",
        "stackSize": "Blocs par pile",
        "stacks": "Piles : {stacks}, plus {remainder} blocs",
        "rowSegments": "Segments de rangée",
        "row": "Rangée",
        "columnStart": "Première colonne",
        "columnEnd": "Dernière colonne",
        "runLength": "Blocs du segment",
        "completedLayer": "Marquer cette couche comme terminée",
        "completedSummary": "Couches terminées : {done} sur {count}",
        "clearProgress": "Effacer les couches cochées",
        "paper": "Format du PDF",
        "paperA4": "A4",
        "paperLetter": "US Letter",
        "downloadPng": "Télécharger la couche en PNG",
        "downloadPdf": "Télécharger le PDF",
        "downloadAllPdf": "Télécharger toutes les couches en PDF",
        "downloadCurrentPdf": "Télécharger cette couche en PDF",
        "exportLayerProject": "Enregistrer le projet pixel de la couche",
        "currentLayerOnly": "Couche actuelle uniquement",
        "saveProject": "Enregistrer le projet de forme",
        "loadProject": "Charger un projet de forme",
        "replaceProject": "Ce projet remplacera votre forme, vos réglages et vos couches cochées non enregistrés. Continuer ?",
        "editorLink": "Ouvrir l’éditeur de pixels",
        "editorHelp": "Enregistrez d’abord le projet pixel de la couche. Ouvrez ensuite l’éditeur et chargez ce fichier pour modifier les cases une à une. Les dimensions de la forme se règlent dans cet outil.",
        "pixelProjectHelp": "Le projet pixel contient uniquement la couche sélectionnée. Il s’agit d’une grille modifiable, pas d’un monde Minecraft ni d’un fichier de placement de blocs.",
        "centerGuideHelp": "Une dimension impaire possède une rangée ou une colonne centrale. Avec une dimension paire, le centre se trouve entre deux rangées ou colonnes. Le repère indique ce centre géométrique.",
        "coordinatesHelp": "Les rangées et colonnes affichées commencent à 1. Les coordonnées relatives X et Z exportées commencent à 0 ; Y = 0 désigne la couche du bas.",
        "noCavity": "À cette taille et avec cette épaisseur, la forme creuse peut ne pas avoir de cavité intérieure.",
        "exporting": "Préparation du téléchargement…",
        "exportFailed": "Le fichier à télécharger n’a pas pu être créé. Réessayez.",
        "invalidDimensions": "Utilisez des nombres entiers de 1 à 128 pour les cercles et ellipses, et de 1 à 96 pour les formes 3D.",
        "invalidOptions": "Vérifiez la forme, le remplissage, l’épaisseur, la couche et les matériaux. L’épaisseur doit être un entier de 1 à 8.",
        "invalidProject": "Ce fichier n’est pas un projet de forme valide pour cet outil.",
        "tooLarge": "La forme est trop grande. Réduisez ses dimensions.",
        "emptyLayer": "Cette couche ne contient aucun bloc.",
        "saved": "Projet de forme enregistré.",
        "loaded": "Projet de forme chargé.",
        "loadingProject": "Vérification du projet de forme…",
        "transferFailed": "Votre forme actuelle n’a pas pu être enregistrée pour le changement de langue. Elle reste ouverte ici. Enregistrez un projet de forme avant de réessayer.",
        "restoring": "Vérification des réglages enregistrés…",
        "restoreFailed": "La forme enregistrée n’a pas pu être vérifiée ou restaurée. Réessayez ou abandonnez-la explicitement pour recommencer. La modification et les téléchargements restent bloqués.",
        "retryRestore": "Réessayer la restauration",
        "discardRestore": "Abandonner la forme enregistrée et recommencer",
        "discardFailed": "L’effacement de la forme enregistrée n’a pas pu être confirmé. L’outil reste bloqué. Réessayez la restauration ou l’abandon.",
        "busyCannotLeave": "Un fichier est en cours de préparation. Attendez la fin avant de quitter la page.",
        "unsaved": "Des réglages de forme ou des couches cochées ne sont pas enregistrés.",
        "applied": "Forme actualisée.",
        "recovered": "Forme restaurée.",
        "pdfTitle": "Plan de forme en blocs Minecraft",
        "pdfOverview": "Vue d’ensemble de la forme",
        "pdfLayer": "Couche {layer} sur {count}",
        "pdfTile": "Partie {tile} sur {count}",
        "pdfPage": "Page {page} sur {count}",
        "pdfCount": "Blocs : {count}",
        "pdfTotal": "Total des blocs : {count}",
        "pdfScale": "Plan à lire ; ce n’est pas un gabarit de placement grandeur nature.",
        "pdfRows": "Rangées {start}–{end}",
        "pdfColumns": "Colonnes {start}–{end}",
        "pdfCoordinates": "Ce PDF utilise des coordonnées relatives X et Z à partir de 0 ; Y = 0 est en bas. Les rangées et colonnes à l’écran commencent à 1.",
        "pdfLayerSummary": "Quantités par couche",
        "pdfManual": "Placez les blocs à la main en suivant le plan. Ce PDF n’importe pas de monde et n’exécute aucune commande.",
        "pdfMethod": "Chaque case remplie représente un bloc. Suivez chaque segment de rangée de sa première à sa dernière colonne, en incluant les deux extrémités.",
        "howTitle": "Préparer une forme à construire à la main",
        "steps": [
            "Choisissez un cercle ou une ellipse pour un plan plat, ou une sphère, un dôme, un cylindre ou un cône pour une construction par couches. Réglez les dimensions et choisissez plein ou creux.",
            "Appliquez les réglages. Vérifiez les repères du centre, les quantités de blocs et les segments de rangée. Pour une forme 3D, parcourez les couches du bas vers le haut et cochez-les à mesure de la construction.",
            "Choisissez une couleur d’aperçu et une taille de pile pour compter les matériaux. La couleur sert de repère ; choisissez vous-même le bloc réel dans Minecraft.",
            "Téléchargez un PNG ou un PDF A4 ou US Letter à consulter. Un projet de forme conserve les réglages et les couches cochées ; un projet pixel permet de modifier une seule couche dans l’éditeur de pixels."
        ],
        "notesTitle": "Lire la grille avant de construire",
        "notes": [
            "Les cercles et ellipses acceptent des dimensions de 1 à 128 blocs ; les formes 3D, de 1 à 96. L’épaisseur varie de 1 à 8 blocs. Les quantités correspondent à la grille produite.",
            "Une grille de blocs approche une courbe. Les ellipses très étroites, comme 2 × 8, peuvent sembler rectangulaires. Une petite forme creuse ou des parois épaisses peuvent ne laisser aucune cavité intérieure.",
            "Les profils de cercle et d’ellipse conservent une rangée et une colonne centrales complètes, ou deux de chaque pour des dimensions paires, afin d’atteindre la largeur et la profondeur demandées. Cela vaut aussi pour les sections des cylindres et cônes. Une forme creuse peut retirer les cases intérieures du centre.",
            "Les sphères creuses sont fermées aux extrémités ; les dômes et cônes creux sont ouverts à la base ; les cylindres creux sont ouverts en haut et en bas. L’épaisseur compte des couches de cases voisines, pas une distance géométrique continue.",
            "Certains blocs du contour ne se touchent que par un coin. Un contour numérique ne garantit ni une paroi reliée face à face ni une bordure continue. Vérifiez la grille pour votre construction.",
            "Les dimensions impaires ont une rangée ou une colonne centrale ; avec les dimensions paires, le centre se situe entre les cases. Gardez le même alignement en superposant les couches.",
            "Les rangées et colonnes à l’écran commencent à 1. Les coordonnées relatives X et Z exportées commencent à 0, et Y = 0 est la couche du bas. Consultez les coordonnées pour reporter le plan.",
            "Un PNG conserve la grille de pixels de la couche sélectionnée. Les PDF sont des plans à consulter, divisés en pages ou parties, pas des gabarits de placement grandeur nature. Vérifiez les plages de rangées et colonnes de chaque page.",
            "Le projet de forme conserve les réglages de toute la forme et les couches cochées. Un projet pixel ne contient qu’une couche ; ses modifications dans l’éditeur de pixels ne changent pas la forme 3D d’origine.",
            "Cet outil fournit des plans pour placer les blocs à la main. Il n’exporte pas de monde Minecraft, de fichier de structure ni de commandes WorldEdit, et ne vérifie pas le résultat dans le jeu."
        ],
        "cancelExport": "Annuler la création du fichier",
        "pdfPageCount": "Pages PDF : {count}"
    },
    "ja": {
        "title": "マイクラの円生成ツール | Fuse Bead Patterns",
        "description": "マイクラの円・楕円や立体を方眼で設計。層ごとのブロック数と行の並べ方を確認し、PNG・PDF・編集用プロジェクトを保存できます。",
        "heading": "マイクラの円生成ツール",
        "intro": "方眼で円や楕円を設計し、球体・ドーム・円柱・円すいを層ごとに確認できます。大きさ、中を埋めるか空洞にするか、壁の厚さを選び、方眼と行ごとの区間、ブロック数を見ながら手作業で建築するためのツールです。",
        "home": "ホーム",
        "shape": "形",
        "circle": "円",
        "ellipse": "楕円",
        "sphere": "球体",
        "dome": "ドーム",
        "cylinder": "円柱",
        "cone": "円すい",
        "mode": "内部",
        "hollow": "空洞",
        "solid": "中を埋める",
        "diameter": "直径",
        "width": "幅",
        "depth": "奥行き",
        "height": "高さ",
        "thickness": "壁の厚さ",
        "applyShape": "形を更新",
        "pendingChanges": "設定が変わっています。「形を更新」を押すと図面とダウンロードに反映されます。",
        "layer": "層",
        "layerOf": "{count} 層中 {layer} 層目",
        "previousLayer": "前の層",
        "nextLayer": "次の層",
        "preview": "層のプレビュー",
        "previewLabel": "選択した層のブロック配置図",
        "showCenter": "中心を表示",
        "showCoordinates": "座標を表示",
        "showGrid": "方眼を表示",
        "showGhost": "1 つ下の層を表示",
        "showRowCounts": "行ごとの個数を表示",
        "dimensions": "大きさ：{width} × {depth} × {height}",
        "layerBlocks": "この層のブロック数：{count}",
        "totalBlocks": "合計ブロック数：{count}",
        "materials": "材料",
        "blockName": "ブロック名",
        "blockColor": "プレビューの色",
        "stackSize": "1 スタックの個数",
        "stacks": "{stacks} スタックと {remainder} 個",
        "rowSegments": "行ごとの連続区間",
        "row": "行",
        "columnStart": "開始列",
        "columnEnd": "終了列",
        "runLength": "区間の個数",
        "completedLayer": "この層を完了にする",
        "completedSummary": "完了した層：{count} 層中 {done} 層",
        "clearProgress": "完了チェックを消去",
        "paper": "PDF の用紙サイズ",
        "paperA4": "A4",
        "paperLetter": "US Letter",
        "downloadPng": "この層を PNG で保存",
        "downloadPdf": "PDF を保存",
        "downloadAllPdf": "全ての層を PDF で保存",
        "downloadCurrentPdf": "この層を PDF で保存",
        "exportLayerProject": "この層のピクセルプロジェクトを保存",
        "currentLayerOnly": "現在の層のみ",
        "saveProject": "形のプロジェクトを保存",
        "loadProject": "形のプロジェクトを開く",
        "replaceProject": "このプロジェクトを開くと、未保存の形・設定・層の完了チェックが置き換わります。続けますか？",
        "editorLink": "ピクセル編集画面を開く",
        "editorHelp": "先にこの層のピクセルプロジェクトを保存してください。編集画面を開いてそのファイルを読み込むと、マスを個別に編集できます。形の大きさはこのツールで変更します。",
        "pixelProjectHelp": "ピクセルプロジェクトに入るのは選択した 1 層だけです。編集用の方眼データであり、マイクラのワールドやブロックを配置するファイルではありません。",
        "centerGuideHelp": "大きさが奇数なら中央の行や列が中心になります。偶数なら 2 行・2 列の間が中心です。ガイドはその幾何学的な中心を示します。",
        "coordinatesHelp": "画面の行・列番号は 1 から始まります。書き出した相対座標 X・Z は 0 から始まり、Y = 0 が最下層です。",
        "noCavity": "この大きさと壁の厚さでは、空洞を選んでも内部に空間が残らない場合があります。",
        "exporting": "ダウンロードを準備しています…",
        "exportFailed": "ダウンロード用ファイルを作成できませんでした。もう一度お試しください。",
        "invalidDimensions": "円・楕円は 1〜128、立体は 1〜96 の整数で指定してください。",
        "invalidOptions": "形、内部、壁の厚さ、層、材料の設定を確認してください。壁の厚さは 1〜8 の整数で指定します。",
        "invalidProject": "このファイルは、このツールで使える形のプロジェクトではありません。",
        "tooLarge": "形が大きすぎます。寸法を小さくしてください。",
        "emptyLayer": "この層にブロックはありません。",
        "saved": "形のプロジェクトを保存しました。",
        "loaded": "形のプロジェクトを開きました。",
        "loadingProject": "形のプロジェクトを確認しています…",
        "transferFailed": "言語切り替え用に現在の形を保存できませんでした。この画面には残っています。先に形のプロジェクトを保存してから、もう一度お試しください。",
        "restoring": "保存された形の設定を確認しています…",
        "restoreFailed": "保存された形を確認・復元できませんでした。再試行するか、明示的に破棄して新しく始めてください。編集とダウンロードは停止しています。",
        "retryRestore": "復元を再試行",
        "discardRestore": "保存された形を破棄して始める",
        "discardFailed": "保存された形を消去できたか確認できません。ツールは停止したままです。復元か破棄をもう一度お試しください。",
        "busyCannotLeave": "ファイルを準備しています。完了してからページを移動してください。",
        "unsaved": "形の設定か層の完了チェックがまだ保存されていません。",
        "applied": "形を更新しました。",
        "recovered": "形を復元しました。",
        "pdfTitle": "マイクラのブロック建築図",
        "pdfOverview": "形の概要",
        "pdfLayer": "{count} 層中 {layer} 層目",
        "pdfTile": "{count} 分割中 {tile} 枚目",
        "pdfPage": "{count} ページ中 {page} ページ目",
        "pdfCount": "ブロック数：{count}",
        "pdfTotal": "合計ブロック数：{count}",
        "pdfScale": "読み取り用の図面です。原寸の配置用テンプレートではありません。",
        "pdfRows": "行 {start}〜{end}",
        "pdfColumns": "列 {start}〜{end}",
        "pdfCoordinates": "この PDF の相対座標 X・Z は 0 始まり、Y = 0 が最下層です。画面の行・列番号は 1 始まりです。",
        "pdfLayerSummary": "層ごとのブロック数",
        "pdfManual": "図面を見ながら手作業でブロックを置いてください。この PDF でワールドの読み込みやコマンドの実行はできません。",
        "pdfMethod": "色の付いた 1 マスがブロック 1 個を表します。各行の区間は、開始列と終了列の両端を含めて並べてください。",
        "howTitle": "手作業で建てる形を設計する",
        "steps": [
            "平面の図なら円か楕円、立体なら球体・ドーム・円柱・円すいを選びます。大きさを決め、中を埋めるか空洞にするかを選択してください。",
            "設定を反映し、中心のガイド、ブロック数、行ごとの連続区間を確認します。立体は下から上へ層を切り替え、建て終わった層に完了チェックを付けます。",
            "材料の個数を確認するため、プレビューの色と 1 スタックの個数を選びます。色は見分けるための目安です。実際に使うブロックはマイクラの中で選んでください。",
            "参照用の PNG や A4・US Letter の PDF を保存できます。形のプロジェクトには設定と層の完了チェックが残り、ピクセルプロジェクトでは 1 層だけを編集画面で変更できます。"
        ],
        "notesTitle": "建てる前に方眼を確認",
        "notes": [
            "円・楕円の大きさは 1〜128 ブロック、立体は 1〜96 ブロック、壁の厚さは 1〜8 ブロックで指定できます。個数は生成された方眼上の数です。",
            "方眼では曲線をブロックで近似します。2 × 8 など細長い楕円は長方形に見えることがあります。小さい形や厚い壁では、空洞を選んでも内部に空間が残らない場合があります。",
            "円・楕円の外形は、指定した幅と奥行きに届くよう中央の行・列を全て残します。偶数なら中央の 2 行・2 列です。円柱や円すいの断面も同じです。空洞の形では、その内側にある中央のマスが取り除かれる場合があります。",
            "空洞の球体は上下が閉じ、ドームと円すいは底が開き、円柱は上と下が開きます。壁の厚さは隣り合うマスの層数で数えるもので、連続的な幾何学上の距離ではありません。",
            "輪郭のブロックが角だけで接する場合があります。デジタルの輪郭が、面でつながる壁や連続した縁になるとは限りません。建築に合うか方眼を確認してください。",
            "大きさが奇数なら中央の行・列が中心、偶数ならマスの間が中心です。層を重ねる際は同じ位置にそろえてください。",
            "画面の行・列番号は 1 始まりです。書き出す相対座標 X・Z は 0 始まり、Y = 0 が最下層です。図面を移すときは座標の表記を確認してください。",
            "PNG は選択した層のピクセル方眼を保って保存します。PDF はページや分割範囲を見ながら読む図面で、原寸の配置用テンプレートではありません。各ページの行・列の範囲を確認してください。",
            "形のプロジェクトには全体の設定と層の完了チェックが保存されます。ピクセルプロジェクトは 1 層だけで、編集画面で変更しても元の立体には反映されません。",
            "このツールは手作業でブロックを置くための図面を作ります。マイクラのワールド、ストラクチャーファイル、WorldEdit コマンドは出力せず、ゲーム内での結果も検証していません。"
        ],
        "cancelExport": "ファイルの作成を中止",
        "pdfPageCount": "PDF のページ数：{count}"
    }
};
