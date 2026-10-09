const fs = require('fs');
const path = 'next.config.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /compress: true,/;
const replacement = `compress: true,
  images: {
    localPatterns: [
      {
        pathname: '/api/bottle-image',
        search: '?name=*',
      },
      {
        pathname: '/images/**',
      }
    ],
  },`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
