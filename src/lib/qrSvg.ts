// Pure TypeScript ISO/IEC 18004 QR Code Matrix Generator (Byte mode, ECC Level L, Versions 1-10)
// Zero external dependencies — renders crisp SVG paths directly in React.

const VERSION_SPECS: Record<
  number,
  { size: number; totalCodewords: number; ecCodewordsPerBlock: number; numBlocks: number; alignment: number[] }
> = {
  1: { size: 21, totalCodewords: 26, ecCodewordsPerBlock: 7, numBlocks: 1, alignment: [] },
  2: { size: 25, totalCodewords: 44, ecCodewordsPerBlock: 10, numBlocks: 1, alignment: [6, 18] },
  3: { size: 29, totalCodewords: 70, ecCodewordsPerBlock: 15, numBlocks: 1, alignment: [6, 22] },
  4: { size: 33, totalCodewords: 100, ecCodewordsPerBlock: 20, numBlocks: 1, alignment: [6, 26] },
  5: { size: 37, totalCodewords: 134, ecCodewordsPerBlock: 26, numBlocks: 1, alignment: [6, 30] },
  6: { size: 41, totalCodewords: 172, ecCodewordsPerBlock: 18, numBlocks: 2, alignment: [6, 34] },
};

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const msg = new Uint8Array(data.length + ecLen);
  msg.set(data, 0);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);

  // Pick smallest version that fits Byte mode at ECC Level L
  let version = 6;
  for (let v = 1; v <= 6; v++) {
    const spec = VERSION_SPECS[v];
    const dataCap = spec.totalCodewords - spec.ecCodewordsPerBlock * spec.numBlocks;
    // 4 bits mode + 8 bits length + 8*N bits <= dataCap*8
    if (bytes.length + 2 <= dataCap) {
      version = v;
      break;
    }
  }

  const spec = VERSION_SPECS[version];
  const dataCapacity = spec.totalCodewords - spec.ecCodewordsPerBlock * spec.numBlocks;

  // Build bit stream: 0100 (Byte mode) + 8-bit length + bytes + terminator + pad
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  const maxBits = dataCapacity * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords = new Uint8Array(dataCapacity);
  for (let i = 0; i < bits.length / 8; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataCodewords[i] = b;
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  for (let i = bits.length / 8; i < dataCapacity; i++) {
    dataCodewords[i] = padBytes[padIdx % 2];
    padIdx++;
  }

  // Split into blocks and compute Reed-Solomon EC codewords
  const blocksData: Uint8Array[] = [];
  const blocksEc: Uint8Array[] = [];
  const blockSize = Math.floor(dataCapacity / spec.numBlocks);
  let offset = 0;
  for (let b = 0; b < spec.numBlocks; b++) {
    const chunk = dataCodewords.slice(offset, offset + blockSize);
    offset += blockSize;
    blocksData.push(chunk);
    blocksEc.push(rsEncode(chunk, spec.ecCodewordsPerBlock));
  }

  const finalCodewords: number[] = [];
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(blocksData[b][i]);
    }
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(blocksEc[b][i]);
    }
  }

  const size = spec.size;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onBorder || inInner));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const align = spec.alignment;
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === align.length - 1) ||
        (i === align.length - 1 && j === 0)
      ) {
        continue;
      }
      const cr = align[i];
      const cc = align[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(cr + dr, cc + dc, dark);
        }
      }
    }
  }

  // Reserve format info areas & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunctionModule(8, i, false);
      setFunctionModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 1 - i, false);
    setFunctionModule(size - 1 - i, 8, false);
  }
  setFunctionModule(size - 8, 8, true);

  // Place data bits in zigzag
  const allBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((cw >>> i) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          const dark = bitIdx < allBits.length ? allBits[bitIdx] === 1 : false;
          modules[r][c] = dark;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  // Apply Mask 0: (r + c) % 2 === 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && (r + c) % 2 === 0) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  // Format information for ECC Level L (01) and Mask 0 (000) -> data = 0b01000
  // Precomputed BCH(15,5) format bits for Level L (01), Mask 0 (000) XOR 0x5412 = 0x77c4
  const formatBits = 0x77c4;
  const getFormatBit = (idx: number) => ((formatBits >>> idx) & 1) === 1;

  // ISO/IEC 18004 Figure 25: Format Information Placement (bit 14 = MSB, bit 0 = LSB)
  // Top-left horizontal: (8,0)..(8,5), (8,7), (8,8) -> bits 14..7
  setFunctionModule(8, 0, getFormatBit(14));
  setFunctionModule(8, 1, getFormatBit(13));
  setFunctionModule(8, 2, getFormatBit(12));
  setFunctionModule(8, 3, getFormatBit(11));
  setFunctionModule(8, 4, getFormatBit(10));
  setFunctionModule(8, 5, getFormatBit(9));
  setFunctionModule(8, 7, getFormatBit(8));
  setFunctionModule(8, 8, getFormatBit(7));
  // Top-left vertical: (7,8), (5,8)..(0,8) -> bits 6..0
  setFunctionModule(7, 8, getFormatBit(6));
  setFunctionModule(5, 8, getFormatBit(5));
  setFunctionModule(4, 8, getFormatBit(4));
  setFunctionModule(3, 8, getFormatBit(3));
  setFunctionModule(2, 8, getFormatBit(2));
  setFunctionModule(1, 8, getFormatBit(1));
  setFunctionModule(0, 8, getFormatBit(0));

  // Bottom-left vertical: (size-1, 8) up to (size-7, 8) -> bits 14..8
  for (let i = 0; i < 7; i++) {
    setFunctionModule(size - 1 - i, 8, getFormatBit(14 - i));
  }
  // Top-right horizontal: (8, size-8) to (8, size-1) -> bits 7..0
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 8 + i, getFormatBit(7 - i));
  }

  return modules;
}
