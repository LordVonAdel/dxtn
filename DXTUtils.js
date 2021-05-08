module.exports = {
  generateDXT1Palette(colorValue0, colorValue1) {
    let color0 = this.getComponentsFromRGB565(colorValue0);
    let color1 = this.getComponentsFromRGB565(colorValue1);

    let palette = new Uint8Array(16);

    if (colorValue0 > colorValue1) {
      // Non transparent mode
      palette[0] = Math.floor((color0.R) * 255);
      palette[1] = Math.floor((color0.G) * 255);
      palette[2] = Math.floor((color0.B) * 255);
      palette[3] = Math.floor(255);

      palette[4] = Math.floor((color1.R) * 255);
      palette[5] = Math.floor((color1.G) * 255);
      palette[6] = Math.floor((color1.B) * 255);
      palette[7] = Math.floor(255);

      palette[8] = Math.floor((color0.R * 2/3 + color1.R * 1/3 ) * 255);
      palette[9] = Math.floor((color0.G * 2/3 + color1.G * 1/3 ) * 255);
      palette[10] = Math.floor((color0.B * 2/3 + color1.B * 1/3 ) * 255);
      palette[11] = Math.floor(255);

      palette[12] = Math.floor((color0.R * 1/3 + color1.R * 2/3) * 255);
      palette[13] = Math.floor((color0.G * 1/3 + color1.G * 2/3) * 255);
      palette[14] = Math.floor((color0.B * 1/3 + color1.B * 2/3) * 255);
      palette[15] = Math.floor(255);

    } else {
      // transparent mode
      palette[0] = Math.floor((color0.R) * 255);
      palette[1] = Math.floor((color0.G) * 255);
      palette[2] = Math.floor((color0.B) * 255);
      palette[3] = Math.floor(255);

      palette[4] = Math.floor(0);
      palette[5] = Math.floor(0);
      palette[6] = Math.floor(0);
      palette[7] = Math.floor(0);

      palette[8] = Math.floor((color0.R * 1/2 + color1.R * 1/2 ) * 255);
      palette[9] = Math.floor((color0.G * 1/2 + color1.G * 1/2 ) * 255);
      palette[10] = Math.floor((color0.B * 1/2 + color1.B * 1/2 ) * 255);
      palette[11] = Math.floor(255);

      palette[12] = Math.floor((color1.R) * 255);
      palette[13] = Math.floor((color1.G) * 255);
      palette[14] = Math.floor((color1.B) * 255);
      palette[15] = Math.floor(255);
    }

    return palette;
  },

  getError(pixels, block) {
    let error = 0;
    for (let i in pixels) {
      error += Math.abs(pixels[i] - block[i]);
    }
    return error;
  },

  findNearestOnPalette(color, palette) {
    let minDistance = Infinity;
    let minIndex = 0;

    for (let i = 0; i < palette.length; i += 4) {
      let deltaR = (color[0] - palette[i + 0]);
      let deltaG = (color[1] - palette[i + 1]);
      let deltaB = (color[2] - palette[i + 2]);
      let deltaA = (color[3] - palette[i + 3]);
      let distance = deltaR * deltaR + deltaB * deltaB + deltaG * deltaG + deltaA * deltaA;

      if (distance < minDistance) {
        minDistance = distance;
        minIndex = i / 4;
      }
    }

    return minIndex;
  },

  getComponentsFromRGB565(color) {
    return {
      R: ((color & 0b11111000_00000000) >> 8) / 0xff,
      G: ((color & 0b00000111_11100000) >> 3) / 0xff,
      B: ((color & 0b00000000_00011111) << 3) / 0xff
    }
  },

  makeRGB565(r, g, b) {
    return ((r & 0b11111000) << 8) | ((g & 0b11111100) << 3) | ((b & 0b11111000) >> 3);
  }
}