const fs = require('fs');
const path = 'src/components/NavigationWrapper.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className="flex flex-col min-h-screen">[\s\n]*<OpeningNoticeModal \/>/m;
const replacement = `<div className="flex flex-col min-h-screen relative">
          {/* Parche visual para el arrastre (rubber-banding) en iOS Safari para el TickerBar */}
          <div className="absolute top-0 left-0 w-full h-[50vh] bg-[#4338ca] -translate-y-full z-0"></div>
          <OpeningNoticeModal />`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
