const sharp = require('sharp');
sharp('public/images/essence_bottle_blank.webp')
  .png()
  .toFile('public/images/essence_bottle_blank.png')
  .then(() => console.log('Converted to PNG'))
  .catch(console.error);
