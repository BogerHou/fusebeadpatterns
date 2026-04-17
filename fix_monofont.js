const fs = require('fs');
const path = 'src/lib/core/printer/pdf/MonoFont.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
    "jsPDF.API.events.push(['addFonts', callAddFont]);",
    "// @ts-ignore\njsPDF.API.events.push(['addFonts', callAddFont]);"
);
fs.writeFileSync(path, content);
console.log('Finished fixing MonoFont.ts');
