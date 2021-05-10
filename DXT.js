/**
 * Useful sources:
 * https://www.khronos.org/opengl/wiki/S3_Texture_Compression
 * https://www.khronos.org/registry/DataFormat/specs/1.1/dataformat.1.1.html#S3TC
 */
const DXT1BlockSize = 8;
const DXT3BlockSize = 16;
const DXT5BlockSize = 16;

const RGBABlockSize = 64;
const BlockWidth = 4;
const BlockHeight = 4;

const AlphaTest = 127;

const Utils = require("./DXTUtils.js");

function compressBlockDXT1(pixels, outArray = null, forceNoAlpha = false) {
  let maxR = 0;
  let maxG = 0;
  let maxB = 0;
  let minR = 255;
  let minG = 255;
  let minB = 255;

  let minA = 255;
  let maxA = 0;

  for (let i = 0; i < pixels.length; i+=4) {
    let r = pixels[i + 0];
    let g = pixels[i + 1];
    let b = pixels[i + 2];
    let a = pixels[i + 3];
    
    if (a < minA) minA = a;
    if (a > maxA) maxA = a;
    if (a == 0) continue; // Full transparency should not impact color

    if (r > maxR) maxR = r;
    if (g > maxG) maxG = g;
    if (b > maxB) maxB = b;
    if (r < minR) minR = r;
    if (g < minG) minG = g;
    if (b < minB) minB = b;
  }

  let c0 = ((maxR & 0b11111000) << 8) + ((maxG & 0b11111100) << 3) + ((maxB & 0b11111000) >> 3);
  let c1 = ((minR & 0b11111000) << 8) + ((minG & 0b11111100) << 3) + ((minB & 0b11111000) >> 3);

  if (minA < AlphaTest && !forceNoAlpha) {
    let temp = c0;
    c0 = c1;
    c1 = temp;

    if (maxA == 0) {
      c1 = 0xFFFF;
    }
  }

  let lookup = Utils.generateDXT1Lookup(c0, c1);

  let out = outArray || new Uint8Array(DXT1BlockSize);
  let indices = [];

  for (let i = 0; i < pixels.length; i+= 4) {
    let index = Utils.findNearestOnLookup([
      pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]
    ], lookup);
    indices.push(index);
  }

  out[0] = c0 & 0x00ff;
  out[1] = (c0 & 0xff00) >> 8;
  out[2] = c1 & 0x00ff;
  out[3] = (c1 & 0xff00) >> 8;

  out[4] = (indices[00] << 6) | (indices[01] << 4) | (indices[02] << 2) | indices[03];
  out[5] = (indices[04] << 6) | (indices[05] << 4) | (indices[06] << 2) | indices[07];
  out[6] = (indices[08] << 6) | (indices[09] << 4) | (indices[10] << 2) | indices[11];
  out[7] = (indices[12] << 6) | (indices[13] << 4) | (indices[14] << 2) | indices[15];

  return out;
}

function compressBlockDXT3(pixels, outArray = null) {
  let out = outArray || new Uint8Array(DXT3BlockSize);
  compressBlockDXT1(pixels, out, true);

  for (let i = 0; i < 4; i++) {
    out[8 + i * 2] = out[i * 2];
    out[9 + i * 2] = out[i * 2 + 1];

    out[i * 2] =     ((pixels[i * 16 + 11] & 0xf0) >> 0) | ((pixels[i * 16 + 15] & 0xf0) >> 4);
    out[i * 2 + 1] = ((pixels[i * 16 + 07] & 0xf0) >> 4) | ((pixels[i * 16 + 03] & 0xf0) >> 0);
  }
  return out;
}

function compressBlockDXT5(pixels, outArray = null) {
  let out = outArray || new Uint8Array(DXT5BlockSize);
  compressBlockDXT1(pixels, out, true);
  let minAlpha = 255;
  let maxAlpha = 0;
  for (let i = 0; i < 16; i++) {
    minAlpha = Math.min(pixels[i * 4 + 3], minAlpha);
    maxAlpha = Math.max(pixels[i * 4 + 3], maxAlpha);
  }

  out[0] = minAlpha;
  out[1] = maxAlpha;
  
  let alphaLookup = [
    minAlpha, 
    maxAlpha
  ];

  alphaValues = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    let srcAlpha = pixels[i * 4 + 3];
    srcAlpha -= minAlpha;    
  }

  return out;
}

function decompressBlockDXT1(data, outArray = null) {
  if (data.length != DXT1BlockSize) return false;

  const cVal0 = (data[1] << 8) + data[0];
  const cVal1 = (data[3] << 8) + data[2];
  const lookup = Utils.generateDXT1Lookup(cVal0, cVal1);

  const out = outArray || new Uint8Array(RGBABlockSize);
  for (let i = 0; i < 16; i++) {
    let bitOffset = i * 2;
    let byte = 4 + Math.floor(bitOffset / 8);
    let bits = (data[byte] >> bitOffset % 8) & 3;

    out[i * 4 + 0] = lookup[bits * 4 + 0];
    out[i * 4 + 1] = lookup[bits * 4 + 1];
    out[i * 4 + 2] = lookup[bits * 4 + 2];
    out[i * 4 + 3] = lookup[bits * 4 + 3];
  }

  return out;
}

function decompressBlockDXT3(data, outArray = null) {
  const out = outArray || new Uint8Array(RGBABlockSize);
  decompressBlockDXT1(data.slice(8, 16), out);
  
  for (let i = 0; i < 8; i++) {
    out[i * 8 + 3] = (data[i] & 0x0f) << 4; 
    out[i * 8 + 7] = (data[i] & 0xf0);
  } 

  return out;
}

function decompressBlockDXT5(data, outArray = null) {
  const out = outArray || new Uint8Array(RGBABlockSize);
  decompressBlockDXT1(data.slice(8, 16), out);

  let alpha0 = data[0];
  let alpha1 = data[1];

  let alphaLookup = new Uint8Array(8);
  alphaLookup[0] = alpha0;
  alphaLookup[1] = alpha1;
  if (alpha0 > alpha1) {
    alphaLookup[2] = Math.round((6 * alpha0 + 1 * alpha1) / 7);
    alphaLookup[3] = Math.round((5 * alpha0 + 2 * alpha1) / 7);
    alphaLookup[4] = Math.round((4 * alpha0 + 3 * alpha1) / 7);
    alphaLookup[5] = Math.round((3 * alpha0 + 4 * alpha1) / 7);
    alphaLookup[6] = Math.round((2 * alpha0 + 5 * alpha1) / 7);
    alphaLookup[7] = Math.round((1 * alpha0 + 6 * alpha1) / 7);
  } else {
    alphaLookup[2] = Math.round((4 * alpha0 + 1 * alpha1) / 5);
    alphaLookup[3] = Math.round((3 * alpha0 + 2 * alpha1) / 5);
    alphaLookup[4] = Math.round((2 * alpha0 + 3 * alpha1) / 5);
    alphaLookup[5] = Math.round((1 * alpha0 + 4 * alpha1) / 5);
    alphaLookup[6] = 0;
    alphaLookup[7] = 255;
  }
  
  let alphaBytes = [data[4], data[3], data[2], data[7], data[6], data[5]];

  out[31] = alphaLookup[ (alphaBytes[0] & 0b11100000) >> 5];
  out[27] = alphaLookup[ (alphaBytes[0] & 0b00011100) >> 2];
  out[23] = alphaLookup[((alphaBytes[0] & 0b00000011) << 1) + ((alphaBytes[1] & 0b10000000) >> 7)];
  out[19] = alphaLookup[ (alphaBytes[1] & 0b01110000) >> 4];
  out[15] = alphaLookup[ (alphaBytes[1] & 0b00001110) >> 1];
  out[11] = alphaLookup[((alphaBytes[1] & 0b00000001) << 2) + ((alphaBytes[2] & 0b11000000) >> 6)];
  out[07] = alphaLookup[ (alphaBytes[2] & 0b00111000) >> 3];
  out[03] = alphaLookup[ (alphaBytes[2] & 0b00000111) >> 0];

  out[63] = alphaLookup[ (alphaBytes[3] & 0b11100000) >> 5];
  out[59] = alphaLookup[ (alphaBytes[3] & 0b00011100) >> 2];
  out[55] = alphaLookup[((alphaBytes[3] & 0b00000011) << 1) + ((alphaBytes[4] & 0b10000000) >> 7)];
  out[51] = alphaLookup[ (alphaBytes[4] & 0b01110000) >> 4];
  out[47] = alphaLookup[ (alphaBytes[4] & 0b00001110) >> 1];
  out[43] = alphaLookup[((alphaBytes[4] & 0b00000001) << 2) + ((alphaBytes[5] & 0b11000000) >> 6)];
  out[39] = alphaLookup[ (alphaBytes[5] & 0b00111000) >> 3];
  out[35] = alphaLookup[ (alphaBytes[5] & 0b00000111) >> 0];
  
  return out;
}

function compress(width, height, pixels, compression) {
  if (width % BlockWidth != 0) throw new Error("Width of the texture must be divisible by 4");
  if (height % BlockHeight != 0) throw new Error("Height of the texture must be divisible by 4");
  if (width < BlockWidth || height < BlockHeight) throw new Error("Size of the texture is to small");
  if (width * height * (RGBABlockSize / (BlockHeight * BlockWidth)) != pixels.length) throw new Error("Pixel data of the input does not match dimensions");

  let w = width / BlockWidth;
  let h = height / BlockHeight;
  let blockNumber = w*h;
  let buffer = new Uint8Array(blockNumber * compression.blockSize);
  let rgbaBlock = new Uint8Array(RGBABlockSize);
  let dxtBlock = new Uint8Array(compression.blockSize);

  for (let i = 0; i < blockNumber; i++) {
    let pixelX = (i % w) * 4;
    let pixelY = Math.floor(i / w) * 4;

    let j = 0;
    for (let y = 0; y < 4; y++) {
      for (let x = 3; x >= 0; x--) {
        let px = x + pixelX;
        let py = y + pixelY;
        let baseOffset = px * 4 + py * 4 * width;
        rgbaBlock[j + 0] = pixels[baseOffset + 0];
        rgbaBlock[j + 1] = pixels[baseOffset + 1];
        rgbaBlock[j + 2] = pixels[baseOffset + 2];
        rgbaBlock[j + 3] = pixels[baseOffset + 3];
        j += 4;
      }
    }

    let compressed = compression.blockCompressMethod(rgbaBlock, dxtBlock);
    for (let j = 0; j < compression.blockSize; j++) {
      buffer[i * compression.blockSize + j] = compressed[j];
    }
  }

  return buffer;
}

function decompress(width, height, data, compression) {
  if (width % BlockWidth != 0) throw new Error("Width of the texture must be divisible by 4");
  if (height % BlockHeight != 0) throw new Error("Height of the texture must be divisible by 4");
  if (width < BlockWidth || height < BlockHeight) throw new Error("Size of the texture is to small");

  let w = width / BlockWidth;
  let h = height / BlockHeight;
  let blockNumber = w * h;

  if (blockNumber * compression.blockSize != data.length) throw new Error("Data does not match dimensions");

  let out = new Uint8Array(width * height * 4);
  let blockBuffer = new Uint8Array(RGBABlockSize);

  for (let i = 0; i < blockNumber; i++) {
    let decompressed = compression.blockDecompressMethod(data.slice(i * compression.blockSize, (i+1) * compression.blockSize), blockBuffer);
    let pixelX = (i % w) * 4;
    let pixelY = Math.floor(i / w) * 4;

    let j = 0;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        let px = x + pixelX;
        let py = y + pixelY;
        out[px * 4 + py * 4 * width]     = decompressed[j];
        out[px * 4 + py * 4 * width + 1] = decompressed[j + 1];
        out[px * 4 + py * 4 * width + 2] = decompressed[j + 2];
        out[px * 4 + py * 4 * width + 3] = decompressed[j + 3];
        j += 4;
      }
    }
  }

  return out;
}

module.exports = {
  DXT1: {
    compress(width, height, pixels) {
      return compress(width, height, pixels, {
        blockSize: DXT1BlockSize,
        blockCompressMethod: compressBlockDXT1
      });
    },

    decompress(width, height, data) {
       return decompress(width, height, data, {
        blockSize: DXT1BlockSize,
        blockDecompressMethod: decompressBlockDXT1
      });
    }
  },
  DXT3: {
    compress(width, height, pixels) {
      return compress(width, height, pixels, {
        blockSize: DXT3BlockSize,
        blockCompressMethod: compressBlockDXT3
      });
    },

    decompress(width, height, data) {
       return decompress(width, height, data, {
        blockSize: DXT3BlockSize,
        blockDecompressMethod: decompressBlockDXT3
      });
    }
  },
  DXT5: {
    compress(width, height, pixels) {
      return compress(width, height, pixels, {
        blockSize: DXT5BlockSize,
        blockCompressMethod: compressBlockDXT5
      });
    },

    decompress(width, height, data) {
       return decompress(width, height, data, {
        blockSize: DXT5BlockSize,
        blockDecompressMethod: decompressBlockDXT5
      });
    }
  }
}