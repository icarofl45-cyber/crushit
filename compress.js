const sharp = require('sharp');
const fs = require('fs');

const images = [
  'edad-18-29',
  'edad-30-39',
  'edad-40-49',
  'edad-mas-de-50'
];

async function compressImages() {
  for (const name of images) {
    const inputPath = `imagens_webp_crush_it/${name}.webp`;
    const outputPath = `imagens_webp_crush_it/${name}-opt.webp`;
    
    console.log(`Compressing ${name}...`);
    
    await sharp(inputPath)
      .resize(250)
      .webp({ quality: 40, effort: 6 })
      .toFile(outputPath);
      
    console.log(`Finished ${name}`);
  }
}

compressImages().catch(console.error);
