const DXT = require("./DXT.js");

function compressDXT1(width, height, rgba8888) {
  return DXT.DXT1.compress(width, height, rgba8888);
}

function decompressDXT1(width, height, rgba8888) {
  return DXT.DXT1.decompress(width, height, rgba8888);
}

module.exports = {
  compressDXT1,
  decompressDXT1
}