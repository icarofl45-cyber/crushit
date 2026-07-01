const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressImage(filename) {
    const inputPath = path.join(__dirname, 'imagens_webp_crush_it', filename);
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const outputPath = path.join(__dirname, 'imagens_webp_crush_it', `${basename}_opt.webp`);

    try {
        await sharp(inputPath)
            .webp({ quality: 80, effort: 6 })
            .toFile(outputPath);
        console.log(`Optimized: ${filename} -> ${basename}_opt.webp`);
    } catch (err) {
        console.error(`Error processing ${filename}:`, err);
    }
}

async function main() {
    await compressImage('logo (1).png');
    await compressImage('oferta-1.png');
    await compressImage('oferta-2.png');
}

main();
