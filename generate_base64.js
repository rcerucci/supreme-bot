const fs = require('fs');
const path = require('path');

const images = [
    'examples_jpeg/bandas.jpg',
    'examples_jpeg/bandas_incertas.jpg',
    'examples_jpeg/bandas_sr.jpg',
    'examples_jpeg/candles_bias.jpg',
    'examples_jpeg/compra.jpg',
    'examples_jpeg/compra2.jpg',
    'examples_jpeg/consolidacao.jpg',
    'examples_jpeg/sinais_roc.jpg',
    'examples_jpeg/venda.jpg'
];

console.log('// Auto-generated base64 images');
console.log('module.exports = {');

images.forEach((imgPath, index) => {
    const base64 = fs.readFileSync(imgPath).toString('base64');
    const name = path.basename(imgPath, '.jpg').toUpperCase().replace(/-/g, '_');
    console.log(`  ${name}: '${base64}'${index < images.length - 1 ? ',' : ''}`);
});

console.log('};');
