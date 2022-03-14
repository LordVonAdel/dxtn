const DXT = require("./DXT.js");

function compressDXT1(width, height, rgba8888) {
  return DXT.DXT1.compress(width, height, rgba8888);
}

function compressDXT3(width, height, rgba8888) {
  return DXT.DXT3.compress(width, height, rgba8888);
}

function compressDXT5(width, height, rgba8888) {
  return DXT.DXT5.compress(width, height, rgba8888);
}

function decompressDXT1(width, height, compressedData) {
  return DXT.DXT1.decompress(width, height, compressedData);
}

function decompressDXT3(width, height, compressedData) {
  return DXT.DXT3.decompress(width, height, compressedData);
}

function decompressDXT5(width, height, compressedData) {
  return DXT.DXT5.decompress(width, height, compressedData);
}

module.exports = {
  compressDXT1,
  decompressDXT1,
  compressDXT3,
  decompressDXT3,
  compressDXT5,
  decompressDXT5
}