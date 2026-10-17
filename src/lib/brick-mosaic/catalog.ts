import type { BrickCatalog } from './core';

// A fixed, manufacturer-checked subset. Colour codes belong to separate systems.
export const brickCatalog = {
    "version": "3024-2026-10-17",
    "part": {
        "designId": "3024",
        "name": "Plate 1 x 1",
        "kind": "plate"
    },
    "colors": [
        {
            "id": "ldraw-0",
            "name": "Black",
            "hex": "#1B2A34",
            "ldrawCode": 0,
            "legoColorId": 26,
            "elementId": "302426"
        },
        {
            "id": "ldraw-15",
            "name": "White",
            "hex": "#F4F4F4",
            "ldrawCode": 15,
            "legoColorId": 1,
            "elementId": "302401"
        },
        {
            "id": "ldraw-71",
            "name": "Medium Stone Grey",
            "hex": "#969696",
            "ldrawCode": 71,
            "legoColorId": 194,
            "elementId": "4211399"
        },
        {
            "id": "ldraw-72",
            "name": "Dark Stone Grey",
            "hex": "#646464",
            "ldrawCode": 72,
            "legoColorId": 199,
            "elementId": "4210719"
        },
        {
            "id": "ldraw-4",
            "name": "Bright Red",
            "hex": "#B40000",
            "ldrawCode": 4,
            "legoColorId": 21,
            "elementId": "302421"
        },
        {
            "id": "ldraw-25",
            "name": "Bright Orange",
            "hex": "#D67923",
            "ldrawCode": 25,
            "legoColorId": 106,
            "elementId": "4524929"
        },
        {
            "id": "ldraw-191",
            "name": "Flame Yellowish Orange",
            "hex": "#FCAC00",
            "ldrawCode": 191,
            "legoColorId": 191,
            "elementId": "6073040"
        },
        {
            "id": "ldraw-14",
            "name": "Bright Yellow",
            "hex": "#FAC80A",
            "ldrawCode": 14,
            "legoColorId": 24,
            "elementId": "302424"
        },
        {
            "id": "ldraw-27",
            "name": "Bright Yellowish Green",
            "hex": "#A5CA18",
            "ldrawCode": 27,
            "legoColorId": 119,
            "elementId": "4621557"
        },
        {
            "id": "ldraw-10",
            "name": "Bright Green",
            "hex": "#58AB41",
            "ldrawCode": 10,
            "legoColorId": 37,
            "elementId": "6401817"
        },
        {
            "id": "ldraw-2",
            "name": "Dark Green",
            "hex": "#00852B",
            "ldrawCode": 2,
            "legoColorId": 28,
            "elementId": "302428"
        },
        {
            "id": "ldraw-1",
            "name": "Bright Blue",
            "hex": "#1E5AA8",
            "ldrawCode": 1,
            "legoColorId": 23,
            "elementId": "302423"
        },
        {
            "id": "ldraw-322",
            "name": "Medium Azur",
            "hex": "#68C3E2",
            "ldrawCode": 322,
            "legoColorId": 322,
            "elementId": "6097493"
        },
        {
            "id": "ldraw-85",
            "name": "Medium Lilac",
            "hex": "#441A91",
            "ldrawCode": 85,
            "legoColorId": 268,
            "elementId": "6231376"
        },
        {
            "id": "ldraw-5",
            "name": "Bright Purple",
            "hex": "#D3359D",
            "ldrawCode": 5,
            "legoColorId": 221,
            "elementId": "6217797"
        },
        {
            "id": "ldraw-30",
            "name": "Medium Lavender",
            "hex": "#A06EB9",
            "ldrawCode": 30,
            "legoColorId": 324,
            "elementId": "4619521"
        },
        {
            "id": "ldraw-19",
            "name": "Brick Yellow",
            "hex": "#D7BA8C",
            "ldrawCode": 19,
            "legoColorId": 5,
            "elementId": "4159553"
        },
        {
            "id": "ldraw-78",
            "name": "Light Nougat",
            "hex": "#FFC995",
            "ldrawCode": 78,
            "legoColorId": 283,
            "elementId": "6357797"
        },
        {
            "id": "ldraw-84",
            "name": "Medium Nougat",
            "hex": "#AA7D55",
            "ldrawCode": 84,
            "legoColorId": 312,
            "elementId": "6215606"
        },
        {
            "id": "ldraw-70",
            "name": "Reddish Brown",
            "hex": "#5F3109",
            "ldrawCode": 70,
            "legoColorId": 192,
            "elementId": "4221744"
        }
    ]
} as const satisfies BrickCatalog;

export const brickCatalogSources = {
    "retrievedAt": "2026-10-17",
    "colour": {
        "author": "LDraw.org",
        "url": "https://ldraw.org/parts/colour.html",
        "license": "CC BY 4.0",
        "licenseURL": "https://creativecommons.org/licenses/by/4.0/",
        "legalURL": "https://www.ldraw.org/docs-main/licenses/legal-info.html"
    },
    "partColour": {
        "author": "The LEGO Group",
        "sourceURLs": [
            "https://www.lego.com/en-gb/pick-and-build/pick-a-brick?appearsIn=40872",
            "https://www.lego.com/de-de/pick-and-build/pick-a-brick?appearsIn=72163",
            "https://www.lego.com/en-gb/pick-and-build/pick-a-brick?appearsIn=40859",
            "https://www.lego.com/da-dk/pick-and-build/pick-a-brick?elementGroup=EG00029&includeOutOfStock=true&perPage=200",
            "https://www.lego.com/en-gb/pick-and-build/pick-a-brick?appearsIn=40354",
            "https://www.lego.com/fr-fr/pick-and-build/pick-a-brick?appearsIn=40861",
            "https://www.lego.com/en-gb/pick-and-build/pick-a-brick?appearsIn=75375&perPage=200",
            "https://www.lego.com/en-us/pick-and-build/pick-a-brick?appearsIn=40413&perPage=200"
        ],
        "licenceNote": "Only a curated subset of part, element and colour facts is recorded. No LEGO photographs, instruction artwork, HTML or complete catalogue is reproduced. The LDraw colour-chart licence does not license LEGO website content or trademarks."
    },
    "note": "These 20 opaque colours were checked for LEGO design 3024 on the retrieval date. LDraw RGB values are digital approximations and may differ from official digital swatches or physical pieces. Listings do not guarantee current stock, price, delivery or availability in any region. LEGO design, element and colour IDs and LDraw colour codes are separate identifier systems. No BrickLink colour ID or shopping-list import compatibility is claimed.",
    "attribution": "Digital colour approximations adapted from the LDraw.org Colour Definition Reference, by LDraw.org, under CC BY 4.0. Part-colour facts checked independently against LEGO public product cards.",
    "modifications": "Selected 20 opaque LDraw colours; mapped their names and independent codes to a finite set of manufacturer-verified 1 x 1 plate combinations; retained the selected LDraw RGB values unchanged. Names use the official product-card colour names. No LDraw part geometry is included."
} as const;
