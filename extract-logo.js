
const fs = require('fs');
const path = require('path');

const svgPath = path.join(process.cwd(), 'public', 'main-logo.svg');
const pngPath = path.join(process.cwd(), 'public', 'main-logo.png');

try {
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    // Look for the base64 string in xlink:href or href
    const match = svgContent.match(/xlink:href="data:image\/png;base64,([^"]+)"/) || svgContent.match(/href="data:image\/png;base64,([^"]+)"/);

    if (match && match[1]) {
        const buffer = Buffer.from(match[1], 'base64');
        fs.writeFileSync(pngPath, buffer);
        console.log('Successfully extracted PNG to public/main-logo.png');
    } else {
        console.error('Could not find base64 PNG data in SVG');
    }
} catch (error) {
    console.error('Error processing file:', error);
}
